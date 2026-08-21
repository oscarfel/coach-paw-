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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { clientId, coachId, titre, message } = req.body;

  if (!titre || !message || (!clientId && !coachId)) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  const profilId = clientId || coachId;

  try {
    // Un profil peut avoir ses notifications automatiques coupées par le coach
    // (notifications_actives = false) : dans ce cas on n'envoie rien du tout.
    const { data: profil } = await supabase.from('profils').select('notifications_actives').eq('id', profilId).single();
    if (profil && profil.notifications_actives === false) {
      return res.status(200).json({ sent: 0, message: 'Notifications désactivées pour ce profil' });
    }

    let query = supabase.from('push_subscriptions').select('*');
    query = clientId ? query.eq('profil_id', clientId) : query.eq('profil_id', coachId);
    const { data: subscriptions, error } = await query;

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ sent: 0, message: 'Aucun abonnement push pour ce profil' });
    }

    const payload = JSON.stringify({ title: titre, body: message, url: '/' });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
          },
          payload
        )
      )
    );

    // Nettoyage : supprime les abonnements expirés/invalides (code 410 Gone)
    const expiredIds = [];
    results.forEach((r, i) => {
      if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
        expiredIds.push(subscriptions[i].id);
      }
    });
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return res.status(200).json({ sent, total: subscriptions.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur envoi notification push' });
  }
}
