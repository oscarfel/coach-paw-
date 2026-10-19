-- CoWave — Listes de courses v2. À exécuter une fois dans Supabase > SQL Editor > Run.
-- Sans risque à relancer.

-- 1) Les articles deviennent des objets {nom, qte, unite, cat} : la colonne items doit
--    être en jsonb (si elle était un tableau de textes, les anciennes listes sont converties).
do $$
declare t text;
begin
  select data_type into t from information_schema.columns
  where table_schema = 'public' and table_name = 'listes_courses' and column_name = 'items';
  if t = 'ARRAY' then
    alter table public.listes_courses alter column items type jsonb using to_jsonb(items);
  elsif t in ('json', 'text') then
    alter table public.listes_courses alter column items type jsonb using items::jsonb;
  end if;
end $$;

-- 2) Nom de la liste + listes « mises de côté » (envoyee = false, jamais visibles par un client)
alter table public.listes_courses
  add column if not exists nom text,
  add column if not exists envoyee boolean not null default true;

-- 3) Cases cochées par chaque client (une ligne par client et par liste)
do $$
declare tp text; tl text;
begin
  select format_type(a.atttypid, a.atttypmod) into tp from pg_attribute a
  where a.attrelid = 'public.profils'::regclass and a.attname = 'id';
  select format_type(a.atttypid, a.atttypmod) into tl from pg_attribute a
  where a.attrelid = 'public.listes_courses'::regclass and a.attname = 'id';

  execute format($f$
    create table if not exists public.listes_courses_coches (
      profil_id %s not null references public.profils(id) on delete cascade,
      liste_id %s not null references public.listes_courses(id) on delete cascade,
      coches jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (profil_id, liste_id)
    )$f$, tp, tl);
end $$;

alter table public.listes_courses_coches enable row level security;

drop policy if exists "chacun gere ses cases cochees" on public.listes_courses_coches;
create policy "chacun gere ses cases cochees" on public.listes_courses_coches
  for all
  using (profil_id in (select id from public.profils where auth_user_id = auth.uid()))
  with check (profil_id in (select id from public.profils where auth_user_id = auth.uid()));

-- Le coach peut voir ce que ses clients ont coché
drop policy if exists "coach voit les cases cochees de ses clients" on public.listes_courses_coches;
create policy "coach voit les cases cochees de ses clients" on public.listes_courses_coches
  for select
  using (profil_id in (
    select c.id from public.profils c
    join public.profils moi on moi.id = c.coach_id
    where moi.auth_user_id = auth.uid()
  ));
