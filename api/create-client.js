import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prenom, nom, email, password, coachId } = req.body;

  if (!prenom || !nom || !email || !password || !coachId) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
  }

  try {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authErr) throw authErr;
    const authUserId = authData.user.id;

    const { data: nouveauProfil, error: profilErr } = await supabaseAdmin
      .from('profils')
      .insert({
        prenom, nom, email,
        auth_user_id: authUserId,
        role: 'client',
        coach_id: coachId,
        age: 25,
        taille: 170,
        poids_depart: 80,
        poids_actuel: 80,
        poids_objectif: 75,
        objectif_principal: 'Remise en forme',
        objectif_secondaire: 'Santé générale',
      })
      .select('*')
      .single();

    if (profilErr) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw profilErr;
    }

    await supabaseAdmin.from('notifications').insert({
      coach_id: coachId,
      client_id: nouveauProfil.id,
      titre: 'Bienvenue 👋',
      message: `Bienvenue ${prenom} ! Ton coach t'a créé un compte pour suivre tes séances, ta nutrition et tes bilans. Bonne première séance !`,
      lu: false,
      type: 'bienvenue',
    });

    return res.status(200).json({ profil: nouveauProfil });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur création client' });
  }
}
