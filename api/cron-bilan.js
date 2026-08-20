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

// Rappel bilan hebdo non rempli. Separe de cron-daily.js pour pouvoir etre
// declenche a une heure differente (ex: dimanche 19h au lieu de l'heure du
// cron quotidien principal) via son propre job sur cron-job.org.
// Garde-fou : ne fait quelque chose que si on est bien dimanche, meme si
// le scheduler externe se declenche un autre jour par erreur.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  const jourDeLaSemaine = new Date().getDay(); // 0 = dimanche
  if (jourDeLaSemaine !== 0) {
    return res.status(200).json({ ok: true, skip: 'pas dimanche', rappelsBilan: 0 });
  }

  let rappelsBilan = 0;

  try {
    const { data: clients } = await supabase.from('profils').select('*').eq('role', 'client');
    if (!clients || clients.length === 0) {
      return res.status(200).json({ ok: true, rappelsBilan: 0 });
    }

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
        rappelsBilan++;
      }
    }

    return res.status(200).json({ ok: true, rappelsBilan });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur cron-bilan' });
  }
}
