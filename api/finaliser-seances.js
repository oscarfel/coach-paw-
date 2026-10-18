import { createClient } from '@supabase/supabase-js';
import { finaliserSeancesInactives } from './_lib/seances-auto.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Appelé par l'app à l'ouverture, avec le jeton de session de l'utilisateur :
// - un coach rattrape les séances oubliées de SES clients,
// - un client rattrape la sienne.
// Ne dépend donc pas du scheduler externe pour que le coach voie les séances.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  const jeton = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!jeton) return res.status(401).json({ error: 'Non autorise' });

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser(jeton);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Session invalide' });

    const { data: profil, error: profErr } = await supabase
      .from('profils')
      .select('id, role')
      .eq('auth_user_id', userData.user.id)
      .maybeSingle();
    if (profErr || !profil) return res.status(404).json({ error: 'Profil introuvable' });

    const filtre = profil.role === 'coach' ? { coachId: profil.id } : { profilId: profil.id };
    const resultat = await finaliserSeancesInactives(supabase, filtre);
    return res.status(200).json({ ok: true, ...resultat });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur finalisation séances' });
  }
}
