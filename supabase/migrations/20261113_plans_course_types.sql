-- Bibliothèque course du coach : séances types + plans du mois types
-- (sans risque à relancer)

-- 1. Séances de course dans les modèles
alter table public.programmes_modeles
  add column if not exists type_seance text default 'muscu',
  add column if not exists course_blocs jsonb,
  add column if not exists course_consigne text;

-- 2. Plans du mois types (débutant, intermédiaire… à assigner aux clients)
create table if not exists public.plans_course_modeles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profils(id) on delete cascade,
  nom text not null,
  objectif text,
  niveau text,
  seances_par_semaine int,
  jours jsonb,
  mois int default 1,
  allure text,
  seances jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists plans_course_modeles_coach_idx on public.plans_course_modeles(coach_id);

alter table public.plans_course_modeles enable row level security;
drop policy if exists "coach gere ses plans course" on public.plans_course_modeles;
create policy "coach gere ses plans course" on public.plans_course_modeles
  for all
  using (coach_id in (select id from public.profils where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.profils where auth_user_id = auth.uid()));
