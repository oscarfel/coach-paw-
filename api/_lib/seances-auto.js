import webpush from 'web-push';

// Enregistrement automatique des séances non validées.
//
// Pendant la séance, l'app du client recopie à chaque série validée sa progression
// (séries déjà remplies) dans seances_en_cours.progression. Si le client oublie de
// valider, cette fonction transforme la progression en vraie séance (tables seances +
// series), exactement comme si le client avait appuyé sur « Terminer », et prévient le
// coach. Si le client revient ensuite valider lui-même, sa séance remplace celle-ci
// (voir saveSession côté app : suppression des séances enregistree_auto récentes).

export const INACTIVITE_MINUTES = 60; // plus aucune série remplie depuis 1h => séance considérée abandonnée
const NETTOYAGE_HEURES = 36; // ligne seances_en_cours supprimée au-delà (séance terminée depuis longtemps)
const RETENTION_SEANCES_PAR_PROGRAMME = 2; // identique à saveSession côté app

let vapidOk = false;
function initVapid() {
  if (vapidOk) return true;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails('mailto:contact@coach-paw.app', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  vapidOk = true;
  return true;
}

async function envoyerPush(supabase, profilId, titre, message) {
  try {
    if (!profilId || !initVapid()) return;
    const { data: profil } = await supabase.from('profils').select('notifications_actives').eq('id', profilId).maybeSingle();
    if (profil && profil.notifications_actives === false) return;
    const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('profil_id', profilId);
    if (!subs || subs.length === 0) return;
    const payload = JSON.stringify({ title: titre, body: message, url: '/' });
    const results = await Promise.allSettled(
      subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } }, payload))
    );
    const expires = subs.filter((_, i) => results[i].status === 'rejected' && [404, 410].includes(results[i].reason?.statusCode)).map((s) => s.id);
    if (expires.length) await supabase.from('push_subscriptions').delete().in('id', expires);
  } catch (err) {
    console.error('Push coach (séance auto) :', err);
  }
}

function nombreSur(v, defaut = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : defaut;
}

async function creerSeanceDepuisProgression(supabase, ligne) {
  const prog = ligne.progression || {};
  const series = Array.isArray(prog.series) ? prog.series : [];
  if (series.length === 0) return null;

  // Même convention de date que l'app (todayIso = date UTC) : jour où la séance a commencé.
  const date = new Date(ligne.demarree_a || Date.now()).toISOString().slice(0, 10);
  const nomProgramme = prog.nom_programme || ligne.programme_nom || 'Séance';
  const programmeId = prog.programme_id || null;

  // Une séance auto déjà créée pour cette même séance en cours (le client a continué puis
  // ré-abandonné) : on la remplace par la version la plus complète.
  if (ligne.seance_auto_id) {
    await supabase.from('series').delete().eq('seance_id', ligne.seance_auto_id);
    await supabase.from('seances').delete().eq('id', ligne.seance_auto_id);
  }

  const base = {
    profil_id: ligne.profil_id,
    nom_programme: nomProgramme,
    programme_id: programmeId,
    duree_secondes: Math.round(nombreSur(prog.duree_secondes, 0)),
    date,
    envoyee_au_coach: true,
  };
  let { data: seance, error } = await supabase.from('seances').insert({ ...base, enregistree_auto: true }).select('id').single();
  if (error && /enregistree_auto/.test(error.message || '')) {
    // colonne pas encore créée en base : on enregistre quand même la séance
    ({ data: seance, error } = await supabase.from('seances').insert(base).select('id').single());
  }
  if (error) throw error;

  const rows = series.map((s, i) => ({
    seance_id: seance.id,
    exercice_nom: s.exercice_nom || 'Exercice',
    poids: nombreSur(s.poids),
    reps: Math.round(nombreSur(s.reps)),
    rpe: s.rpe === '' || s.rpe == null || Number.isNaN(Number(s.rpe)) ? null : String(s.rpe),
    tempo: s.tempo || '',
    video_url: s.video_url || null,
    numero_serie: nombreSur(s.numero_serie, i + 1),
  }));
  const { error: errSeries } = await supabase.from('series').insert(rows);
  if (errSeries) {
    await supabase.from('seances').delete().eq('id', seance.id);
    throw errSeries;
  }

  // Historique borné, comme dans l'app.
  try {
    let q = supabase.from('seances').select('id').eq('profil_id', ligne.profil_id).order('date', { ascending: false });
    q = programmeId ? q.eq('programme_id', programmeId) : q.eq('nom_programme', nomProgramme);
    const { data: hist } = await q;
    if (hist && hist.length > RETENTION_SEANCES_PAR_PROGRAMME) {
      const ids = hist.slice(RETENTION_SEANCES_PAR_PROGRAMME).map((s) => s.id);
      await supabase.from('series').delete().in('seance_id', ids);
      await supabase.from('seances').delete().in('id', ids);
    }
  } catch (e) {
    console.error('Purge historique (séance auto) :', e);
  }

  return { seanceId: seance.id, nomProgramme, nbSeries: rows.length };
}

// filtre : { coachId } pour les clients d'un coach, { profilId } pour un seul client, {} pour tout.
export async function finaliserSeancesInactives(supabase, filtre = {}) {
  const maintenant = Date.now();
  let q = supabase.from('seances_en_cours').select('*');
  if (filtre.coachId) q = q.or(`coach_id.eq.${filtre.coachId},profil_id.eq.${filtre.coachId}`); // ses clients + sa propre séance
  if (filtre.profilId) q = q.eq('profil_id', filtre.profilId);
  const { data: lignes, error } = await q;
  if (error) throw error;

  let enregistrees = 0;
  let nettoyees = 0;
  for (const ligne of lignes || []) {
    try {
      const debut = new Date(ligne.demarree_a || 0).getTime();
      const derniere = new Date(ligne.derniere_maj || ligne.demarree_a || 0).getTime();
      const inactiveDepuisMin = (maintenant - derniere) / 60000;
      const nbSeries = Array.isArray(ligne.progression?.series) ? ligne.progression.series.length : 0;
      const dejaFinalisee = ligne.finalisee_a && new Date(ligne.finalisee_a).getTime() >= derniere;

      if (inactiveDepuisMin >= INACTIVITE_MINUTES && nbSeries > 0 && !dejaFinalisee) {
        const res = await creerSeanceDepuisProgression(supabase, ligne);
        if (res) {
          enregistrees++;
          await supabase
            .from('seances_en_cours')
            .update({ seance_auto_id: res.seanceId, finalisee_a: new Date().toISOString() })
            .eq('id', ligne.id);
          if (ligne.coach_id) {
            const { data: client } = await supabase.from('profils').select('prenom').eq('id', ligne.profil_id).maybeSingle();
            await envoyerPush(
              supabase,
              ligne.coach_id,
              'Séance enregistrée automatiquement',
              `${client?.prenom || 'Un client'} n'a pas validé « ${res.nomProgramme} » : ses ${res.nbSeries} séries remplies ont été enregistrées.`
            );
          }
          continue;
        }
      }

      // Nettoyage : séance vide abandonnée depuis 3h, ou n'importe quelle ligne très ancienne.
      const ageHeures = (maintenant - debut) / 3600000;
      if ((nbSeries === 0 && inactiveDepuisMin >= 180) || ageHeures >= NETTOYAGE_HEURES) {
        await supabase.from('seances_en_cours').delete().eq('id', ligne.id);
        nettoyees++;
      }
    } catch (err) {
      console.error('Finalisation séance en cours', ligne.id, err);
    }
  }
  return { enregistrees, nettoyees };
}
