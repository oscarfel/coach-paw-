-- CoWave — à exécuter une fois dans Supabase > SQL Editor > New query > Run.
-- Sans risque à relancer (if not exists / drop policy if exists).

-- 1) Enregistrement de la séance au fil de l'eau ---------------------------------
-- progression : séries déjà remplies, recopiées par l'app à chaque série validée
-- derniere_maj : heure de la dernière série remplie (sert à détecter l'oubli de validation)
-- seance_auto_id / finalisee_a : séance créée automatiquement par le serveur
alter table public.seances_en_cours
  add column if not exists progression jsonb,
  add column if not exists derniere_maj timestamptz,
  add column if not exists seance_auto_id text,
  add column if not exists finalisee_a timestamptz;

-- Marque les séances enregistrées automatiquement (client qui n'a pas validé)
alter table public.seances
  add column if not exists enregistree_auto boolean not null default false;

-- 2) Mes aliments (base d'aliments du coach) ---------------------------------------
-- coach_id prend automatiquement le même type que profils.id (uuid ou bigint).
do $$
declare t text;
begin
  select format_type(a.atttypid, a.atttypmod) into t
  from pg_attribute a
  where a.attrelid = 'public.profils'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.aliments_coach (
      id uuid primary key default gen_random_uuid(),
      coach_id %s not null references public.profils(id) on delete cascade,
      nom text not null,
      kcal numeric not null default 0,
      prot numeric not null default 0,
      gluc numeric not null default 0,
      lip numeric not null default 0,
      fibres numeric not null default 0,
      sucres numeric not null default 0,
      portion_g numeric,
      created_at timestamptz not null default now()
    )$f$, t);
end $$;

create index if not exists aliments_coach_coach_idx on public.aliments_coach (coach_id);

alter table public.aliments_coach enable row level security;

-- Le coach crée / modifie / supprime ses propres aliments
drop policy if exists "coach gere ses aliments" on public.aliments_coach;
create policy "coach gere ses aliments" on public.aliments_coach
  for all
  using (coach_id in (select id from public.profils where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.profils where auth_user_id = auth.uid()));

-- Les clients voient (lecture seule) les aliments de leur coach
drop policy if exists "clients lisent les aliments de leur coach" on public.aliments_coach;
create policy "clients lisent les aliments de leur coach" on public.aliments_coach
  for select
  using (coach_id in (select coach_id from public.profils where auth_user_id = auth.uid()));
