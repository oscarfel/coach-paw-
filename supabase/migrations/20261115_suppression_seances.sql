-- Permet au coach de supprimer une séance (programme) d'un client
-- sans effacer l'historique déjà enregistré. Sans risque à relancer.

-- 1. Liens vers programmes / programme_exercices :
--    - les exercices d'un programme sont supprimés avec lui (cascade)
--    - tout le reste (séances faites, séries…) garde ses données : le lien passe juste à vide
do $$
declare r record;
begin
  for r in
    select con.conname, cl.relname as tbl, att.attname as col, fcl.relname as ftbl, fatt.attname as fcol
    from pg_constraint con
    join pg_class cl on cl.oid = con.conrelid
    join pg_namespace n on n.oid = cl.relnamespace
    join pg_class fcl on fcl.oid = con.confrelid
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    join pg_attribute fatt on fatt.attrelid = con.confrelid and fatt.attnum = con.confkey[1]
    where con.contype = 'f' and n.nspname = 'public'
      and fcl.relname in ('programmes', 'programme_exercices')
      and array_length(con.conkey, 1) = 1
      and con.confdeltype in ('a', 'r')          -- aujourd'hui : bloque la suppression
  loop
    if r.tbl = 'programme_exercices' and r.ftbl = 'programmes' then
      execute format('alter table public.%I drop constraint %I, add constraint %I foreign key (%I) references public.%I(%I) on delete cascade',
        r.tbl, r.conname, r.conname, r.col, r.ftbl, r.fcol);
    else
      execute format('alter table public.%I alter column %I drop not null', r.tbl, r.col);
      execute format('alter table public.%I drop constraint %I, add constraint %I foreign key (%I) references public.%I(%I) on delete set null',
        r.tbl, r.conname, r.conname, r.col, r.ftbl, r.fcol);
    end if;
    raise notice 'Lien % (%.%) corrigé', r.conname, r.tbl, r.col;
  end loop;
end $$;

-- 2. Droit de suppression : le coach sur les séances de ses clients, le client sur les siennes
drop policy if exists "coach ou client supprime les programmes" on public.programmes;
create policy "coach ou client supprime les programmes" on public.programmes
  for delete
  using (
    profil_id in (select id from public.profils where auth_user_id = auth.uid())
    or profil_id in (
      select c.id from public.profils c
      join public.profils moi on moi.id = c.coach_id
      where moi.auth_user_id = auth.uid()
    )
  );

drop policy if exists "coach supprime les exercices de ses programmes" on public.programme_exercices;
create policy "coach supprime les exercices de ses programmes" on public.programme_exercices
  for delete
  using (
    programme_id in (
      select p.id from public.programmes p
      join public.profils c on c.id = p.profil_id
      left join public.profils moi on moi.id = c.coach_id
      where c.auth_user_id = auth.uid() or moi.auth_user_id = auth.uid()
    )
  );

drop policy if exists "coach supprime ses modeles" on public.programmes_modeles;
create policy "coach supprime ses modeles" on public.programmes_modeles
  for delete
  using (coach_id in (select id from public.profils where auth_user_id = auth.uid()));
