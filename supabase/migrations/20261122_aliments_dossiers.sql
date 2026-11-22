-- Mes aliments (coach) : dossiers Protéines / Glucides / Lipides / Légumes + minéraux optionnels
-- Valeurs stockées en grammes pour 100 g (comme le reste de l'appli). Sans risque à relancer.
alter table public.aliments_coach
  add column if not exists categorie text,
  add column if not exists sodium numeric not null default 0,
  add column if not exists potassium numeric not null default 0,
  add column if not exists calcium numeric not null default 0,
  add column if not exists fer numeric not null default 0,
  add column if not exists magnesium numeric not null default 0,
  add column if not exists vitamine_d numeric not null default 0;

-- Range automatiquement les aliments déjà créés selon leur macro dominante
update public.aliments_coach
set categorie = case
  when kcal > 0 and kcal <= 50 and prot < 4 and lip < 1.5 then 'legumes'
  when prot * 4 >= gluc * 4 and prot * 4 >= lip * 9 then 'proteines'
  when gluc * 4 >= lip * 9 then 'glucides'
  else 'lipides'
end
where categorie is null;
