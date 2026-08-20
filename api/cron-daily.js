import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:contact@coach-paw.app',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function sendPush(profilId, title, body) {
  const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('profil_id', profilId);
  if (!subs || subs.length === 0) return;
  const payload = JSON.stringify({ title, body, url: '/' });
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } },
        payload
      )
    )
  );
}

async function dejaEnvoye(profilId, type, joursColddown) {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - joursColddown);
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('client_id', profilId)
    .eq('type', type)
    .gte('created_at', seuil.toISOString())
    .limit(1);
  return data && data.length > 0;
}

async function dejaEnvoyeCoach(coachId, type, joursColddown) {
  const seuil = new Date();
  seuil.setDate(seuil.getDate() - joursColddown);
  const { data } = await supabase
    .from('notifications')
    .select('id')
    .eq('coach_id', coachId)
    .is('client_id', null)
    .eq('type', type)
    .gte('created_at', seuil.toISOString())
    .limit(1);
  return data && data.length > 0;
}

export default async function handler(req, res) {
  // Protection : seul Vercel Cron (avec le bon secret) peut declencher cette route
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  const resume = {
    notifsProgrammeesEnvoyees: 0, relances: 0, rapports: 0, rappelsBilan: 0,
    stagnations: 0,
  };

  try {
    // --- 1) Notifications programmees par le coach (fonctionnalite existante) ---
    const { data: notifsDues } = await supabase
      .from('notifications')
      .select('*')
      .eq('envoyee', false)
      .lte('date_prevue', new Date().toISOString());

    if (notifsDues && notifsDues.length > 0) {
      for (const n of notifsDues) {
        await sendPush(n.client_id, n.titre, n.message);
        await supabase.from('notifications').update({ envoyee: true }).eq('id', n.id);
      }
      resume.notifsProgrammeesEnvoyees = notifsDues.length;
    }

    const { data: clients } = await supabase.from('profils').select('*').eq('role', 'client');
    const jourDeLaSemaine = new Date().getDay(); // 0 = dimanche, 1 = lundi ... 6 = samedi

    if (clients && clients.length > 0) {
      // --- 2) Relance automatique des clients inactifs (7+ jours sans seance) ---
      for (const client of clients) {
        const { data: dernieresSeances } = await supabase
          .from('seances')
          .select('date')
          .eq('profil_id', client.id)
          .order('date', { ascending: false })
          .limit(1);

        if (dernieresSeances && dernieresSeances.length > 0) {
          const joursSince = Math.floor((new Date(todayIso()) - new Date(dernieresSeances[0].date)) / 86400000);
          if (joursSince >= 7 && !(await dejaEnvoye(client.id, 'relance_inactif', 6))) {
            await supabase.from('notifications').insert({
              coach_id: client.coach_id, client_id: client.id,
              titre: "On ne t'a pas vu recemment 👋",
              message: `Ca fait ${joursSince} jours sans seance. Pret(e) a t'y remettre ?`,
              lu: false, type: 'relance_inactif', envoyee: true,
            });
            await sendPush(client.id, "On ne t'a pas vu recemment 👋", `Ca fait ${joursSince} jours sans seance. Pret(e) a t'y remettre ?`);
            resume.relances++;
          }
        }
      }

      // --- 3) Rapport hebdo automatique (le lundi uniquement) ---
      if (jourDeLaSemaine === 1) {
        const seuil7j = new Date();
        seuil7j.setDate(seuil7j.getDate() - 7);
        const seuil7jIso = seuil7j.toISOString().slice(0, 10);

        for (const client of clients) {
          const [{ count: nbSeances }, { data: poidsHisto }] = await Promise.all([
            supabase.from('seances').select('id', { count: 'exact', head: true }).eq('profil_id', client.id).gte('date', seuil7jIso),
            supabase.from('poids_historique').select('poids, date').eq('profil_id', client.id).order('date', { ascending: true }),
          ]);

          let deltaPoids = null;
          if (poidsHisto && poidsHisto.length >= 2) {
            deltaPoids = (Number(poidsHisto[poidsHisto.length - 1].poids) - Number(poidsHisto[0].poids)).toFixed(1);
          }

          await supabase.from('notifications').insert({
            coach_id: client.coach_id, client_id: client.id,
            titre: 'Rapport hebdo : ' + client.prenom,
            message: `${nbSeances || 0} seance(s) cette semaine.${deltaPoids !== null ? ` Poids : ${deltaPoids > 0 ? '+' : ''}${deltaPoids} kg.` : ''}`,
            lu: false, type: 'rapport_hebdo', envoyee: true,
          });
          resume.rapports++;
        }
      }

      // --- 4) Rappel bilan hebdo non rempli (le dimanche soir) ---
      if (jourDeLaSemaine === 0) {
        const seuil7jBilan = new Date();
        seuil7jBilan.setDate(seuil7jBilan.getDate() - 7);
        const seuil7jBilanIso = seuil7jBilan.toISOString().slice(0, 10);

        for (const client of clients) {
          const { count: nbBilans } = await supabase
            .from('bilans_semaine')
            .select('id', { count: 'exact', head: true })
            .eq('profil_id', client.id)
            .gte('date', seuil7jBilanIso);

          if ((nbBilans || 0) === 0 && !(await dejaEnvoye(client.id, 'rappel_bilan', 6))) {
            await supabase.from('notifications').insert({
              coach_id: client.coach_id, client_id: client.id,
              titre: 'Ton bilan de la semaine 📋',
              message: "Tu n'as pas encore rempli ton bilan hebdo. Prends 2 minutes pour le faire avant la fin du dimanche !",
              lu: false, type: 'rappel_bilan', envoyee: true,
            });
            await sendPush(client.id, 'Ton bilan de la semaine 📋', "Tu n'as pas encore rempli ton bilan hebdo. Prends 2 minutes pour le faire avant la fin du dimanche !");
            resume.rappelsBilan++;
          }
        }
      }

      // --- 5) Alerte stagnation (le lundi, compare les 2 dernieres semaines aux 2 precedentes) ---
      if (jourDeLaSemaine === 1) {
        const il_y_a_28j = new Date(); il_y_a_28j.setDate(il_y_a_28j.getDate() - 28);
        const il_y_a_14j = new Date(); il_y_a_14j.setDate(il_y_a_14j.getDate() - 14);
        const il_y_a_28j_iso = il_y_a_28j.toISOString().slice(0, 10);
        const il_y_a_14j_iso = il_y_a_14j.toISOString().slice(0, 10);

        for (const client of clients) {
          if (await dejaEnvoyeCoach(client.coach_id, 'stagnation_' + client.id, 20)) continue;

          const { data: seancesRecentes } = await supabase
            .from('seances').select('id, date').eq('profil_id', client.id).gte('date', il_y_a_28j_iso);
          if (!seancesRecentes || seancesRecentes.length === 0) continue;

          const idsAnciennes = seancesRecentes.filter((s) => s.date < il_y_a_14j_iso).map((s) => s.id);
          const idsRecentes = seancesRecentes.filter((s) => s.date >= il_y_a_14j_iso).map((s) => s.id);
          if (idsAnciennes.length === 0 || idsRecentes.length === 0) continue;

          const [{ data: seriesAnciennes }, { data: seriesRecentes }] = await Promise.all([
            supabase.from('series').select('exercice_nom, poids').in('seance_id', idsAnciennes),
            supabase.from('series').select('exercice_nom, poids').in('seance_id', idsRecentes),
          ]);

          const maxParExo = (rows) => {
            const map = {};
            for (const r of rows || []) {
              const p = Number(r.poids) || 0;
              if (!map[r.exercice_nom] || p > map[r.exercice_nom]) map[r.exercice_nom] = p;
            }
            return map;
          };
          const maxAnciens = maxParExo(seriesAnciennes);
          const maxRecents = maxParExo(seriesRecentes);

          const exosCommuns = Object.keys(maxRecents).filter((nom) => nom in maxAnciens);
          if (exosCommuns.length === 0) continue;

          const aProgresse = exosCommuns.some((nom) => maxRecents[nom] > maxAnciens[nom]);
          if (!aProgresse) {
            await supabase.from('notifications').insert({
              coach_id: client.coach_id, client_id: null,
              titre: `Stagnation possible : ${client.prenom}`,
              message: `${client.prenom} n'a pas augmente ses charges sur ses exercices communs depuis 2 semaines. Un ajustement du programme pourrait aider.`,
              lu: false, type: 'stagnation_' + client.id, envoyee: true,
            });
            resume.stagnations++;
          }
        }
      }
    }

    return res.status(200).json({ ok: true, resume });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur cron' });
  }
}
