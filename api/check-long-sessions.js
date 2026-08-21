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
  const { data: profil } = await supabase.from('profils').select('notifications_actives').eq('id', profilId).single();
  if (profil && profil.notifications_actives === false) return;
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

// Verifie les seances en cours (table seances_en_cours) qui tournent depuis 3h+
// et pas encore signalees, envoie une notif push et marque la ligne comme alertee.
// A appeler toutes les 15-30 minutes par un scheduler externe (ex: cron-job.org)
// avec le header Authorization: Bearer <CRON_SECRET>.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  try {
    const seuil3h = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: seancesLongues, error } = await supabase
      .from('seances_en_cours')
      .select('*')
      .eq('alerte_envoyee', false)
      .lte('demarree_a', seuil3h);

    if (error) throw error;

    let alertesEnvoyees = 0;
    if (seancesLongues && seancesLongues.length > 0) {
      for (const s of seancesLongues) {
        await sendPush(
          s.profil_id,
          'Ta seance est toujours en cours ⏱️',
          "Ca fait 3h ! Pense a la terminer et l'envoyer a ton coach pour qu'il puisse l'analyser."
        );
        await supabase.from('seances_en_cours').update({ alerte_envoyee: true }).eq('id', s.id);
        alertesEnvoyees++;
      }
    }

    return res.status(200).json({ ok: true, alertesEnvoyees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur check-long-sessions' });
  }
}
