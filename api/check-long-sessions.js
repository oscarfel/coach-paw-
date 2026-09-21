import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Nettoyage des seances en cours (table seances_en_cours) qui tournent depuis 3h+.
// Le client lui-meme detecte desormais ce seuil quand l'app est ouverte (onglet en
// premier plan ou arriere-plan) et envoie automatiquement la seance au coach avec ce
// qui a ete logge - plus besoin d'une notification push pour le lui rappeler. Cette
// route ne sert donc plus qu'a nettoyer les lignes fantomes des seances dont l'app a
// ete completement fermee (le JS client n'a alors jamais pu tourner pour auto-envoyer) :
// leurs series restent captives du localStorage de l'appareil et ne peuvent pas etre
// reconstituees ici, donc il n'y a rien de fiable a envoyer au coach depuis le serveur -
// on se contente de librer la table pour ne pas la laisser grossir indefiniment.
// A appeler toutes les 15-30 minutes par un scheduler externe (ex: cron-job.org)
// avec le header Authorization: Bearer <CRON_SECRET>.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  try {
    const seuil3h = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: seancesExpirees, error: selectErr } = await supabase
      .from('seances_en_cours')
      .select('id')
      .lte('demarree_a', seuil3h);
    if (selectErr) throw selectErr;

    let nettoyees = 0;
    if (seancesExpirees && seancesExpirees.length > 0) {
      const ids = seancesExpirees.map((s) => s.id);
      const { error: delErr } = await supabase.from('seances_en_cours').delete().in('id', ids);
      if (delErr) throw delErr;
      nettoyees = ids.length;
    }

    return res.status(200).json({ ok: true, nettoyees });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur check-long-sessions' });
  }
}
