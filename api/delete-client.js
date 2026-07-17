import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { profilId, authUserId } = req.body;

  if (!profilId) {
    return res.status(400).json({ error: 'profilId manquant' });
  }

  try {
    const { error: profilErr } = await supabaseAdmin.from('profils').delete().eq('id', profilId);
    if (profilErr) throw profilErr;

    if (authUserId) {
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (authErr) console.error('Erreur suppression compte auth (fiche deja supprimee) :', authErr);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur suppression client' });
  }
}
