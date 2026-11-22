-- Recettes du coach : ingrédients structurés (aliment + grammes + macros) et repas conseillé.
-- Permet aussi aux clients de lire les recettes qui leur sont envoyées. Sans risque à relancer.
alter table public.recettes
  add column if not exists items jsonb,
  add column if not exists type_repas text;

-- Lecture par le client : les recettes envoyées à lui, ou « à tous » par son coach
-- (ne change rien si la sécurité RLS n'est pas activée sur cette table)
drop policy if exists "clients lisent les recettes envoyees" on public.recettes;
create policy "clients lisent les recettes envoyees" on public.recettes
  for select
  using (
    envoyee is distinct from false and (
      client_id in (select id from public.profils where auth_user_id = auth.uid())
      or (client_id is null and coach_id in (select coach_id from public.profils where auth_user_id = auth.uid()))
    )
  );

drop policy if exists "coach gere ses recettes" on public.recettes;
create policy "coach gere ses recettes" on public.recettes
  for all
  using (coach_id in (select id from public.profils where auth_user_id = auth.uid()))
  with check (coach_id in (select id from public.profils where auth_user_id = auth.uid()));
