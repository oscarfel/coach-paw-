import { createClient } from '@supabase/supabase-js';
import { finaliserSeancesInactives } from './_lib/seances-auto.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enregistre automatiquement les séances que les clients ont oublié de valider (aucune
// série remplie depuis 1h) avec tout ce qui avait été rempli, prévient le coach, et
// nettoie les vieilles lignes de seances_en_cours. Voir api/_lib/seances-auto.js.
// A appeler toutes les 15 minutes par un scheduler externe (ex: cron-job.org)
// avec le header Authorization: Bearer <CRON_SECRET>.
// L'app appelle aussi /api/finaliser-seances à l'ouverture (coach et client) : les séances
// sont donc rattrapées même si le scheduler externe ne tourne pas.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }
  try {
    const resultat = await finaliserSeancesInactives(supabase, {});
    return res.status(200).json({ ok: true, ...resultat });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur check-long-sessions' });
  }
}
