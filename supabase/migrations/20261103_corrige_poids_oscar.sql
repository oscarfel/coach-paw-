-- CoWave — Supprime la pesée erronée (≈ 4 kg) de ton propre suivi de poids.
-- À exécuter une fois dans Supabase > SQL Editor > Run.

-- 1) APERÇU : tes pesées anormales (moins de 25 kg) qui vont être supprimées
select ph.date, ph.poids
from public.poids_historique ph
join public.profils p on p.id = ph.profil_id
join auth.users u on u.id = p.auth_user_id
where u.email = 'oscarfel0506@gmail.com'
  and ph.poids < 25
order by ph.date;

-- 2) SUPPRESSION
delete from public.poids_historique ph
using public.profils p, auth.users u
where p.id = ph.profil_id
  and u.id = p.auth_user_id
  and u.email = 'oscarfel0506@gmail.com'
  and ph.poids < 25;
