-- CoWave — Course à pied. À exécuter une fois dans Supabase > SQL Editor > Run.
-- Sans risque à relancer.

-- Séances de course (programmes) et plans du mois
alter table public.programmes
  add column if not exists type_seance text not null default 'muscu',
  add column if not exists course_blocs jsonb,
  add column if not exists course_consigne text,
  add column if not exists plan_id text,
  add column if not exists plan_semaine int,
  add column if not exists plan_debut date,
  add column if not exists plan_objectif text;

-- Résultats saisis par le client à la fin de sa course
alter table public.seances
  add column if not exists type_seance text not null default 'muscu',
  add column if not exists distance_km numeric,
  add column if not exists fc_moyenne int,
  add column if not exists fc_max int,
  add column if not exists rpe_seance numeric,
  add column if not exists commentaire text,
  add column if not exists course_reps jsonb;

create index if not exists programmes_plan_idx on public.programmes (profil_id, plan_semaine);
