import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SIGNED_URL_EXPIRY = 315360000; // ~10 ans

// Extrait le chemin du fichier depuis une ancienne URL publique Supabase
// ex: https://xxx.supabase.co/storage/v1/object/public/photos-bilan/abc/def.jpg -> abc/def.jpg
function extraireChemin(url, bucket) {
  if (!url) return null;
  const marqueur = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marqueur);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marqueur.length));
}

export default async function handler(req, res) {
  // Protection simple : reutilise CRON_SECRET pour eviter un declenchement accidentel
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorise' });
  }

  const resultat = { photos_bilan: 0, documents_coach: 0, profils: 0, erreurs: [] };

  try {
    // --- photos_bilan ---
    const { data: photos } = await supabaseAdmin.from('photos_bilan').select('id, url');
    for (const p of photos || []) {
      const chemin = extraireChemin(p.url, 'photos-bilan');
      if (!chemin) continue;
      const { data: signed, error } = await supabaseAdmin.storage.from('photos-bilan').createSignedUrl(chemin, SIGNED_URL_EXPIRY);
      if (error) { resultat.erreurs.push(`photos_bilan ${p.id}: ${error.message}`); continue; }
      await supabaseAdmin.from('photos_bilan').update({ url: signed.signedUrl }).eq('id', p.id);
      resultat.photos_bilan++;
    }

    // --- documents_coach ---
    const { data: docs } = await supabaseAdmin.from('documents_coach').select('id, url');
    for (const d of docs || []) {
      const chemin = extraireChemin(d.url, 'documents-coach');
      if (!chemin) continue;
      const { data: signed, error } = await supabaseAdmin.storage.from('documents-coach').createSignedUrl(chemin, SIGNED_URL_EXPIRY);
      if (error) { resultat.erreurs.push(`documents_coach ${d.id}: ${error.message}`); continue; }
      await supabaseAdmin.from('documents_coach').update({ url: signed.signedUrl }).eq('id', d.id);
      resultat.documents_coach++;
    }

    // --- profils.photo_url ---
    const { data: profils } = await supabaseAdmin.from('profils').select('id, photo_url').not('photo_url', 'is', null);
    for (const p of profils || []) {
      const chemin = extraireChemin(p.photo_url, 'photos-bilan');
      if (!chemin) continue;
      const { data: signed, error } = await supabaseAdmin.storage.from('photos-bilan').createSignedUrl(chemin, SIGNED_URL_EXPIRY);
      if (error) { resultat.erreurs.push(`profil ${p.id}: ${error.message}`); continue; }
      await supabaseAdmin.from('profils').update({ photo_url: signed.signedUrl }).eq('id', p.id);
      resultat.profils++;
    }

    return res.status(200).json({ ok: true, resultat });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Erreur migration' });
  }
}
