-- CoWave — Supprime les séances en double créées par l'enregistrement en direct
-- (une nouvelle ligne à chaque série au lieu d'une seule par séance).
-- À exécuter UNE fois dans Supabase > SQL Editor > Run.
--
-- Règle : pour un même client, un même jour et un même programme, on garde UNE séance :
-- la validée par le client en priorité, sinon celle qui a le plus de séries, sinon la
-- plus longue. Les autres (et leurs séries) sont supprimées.

-- 1) APERÇU (facultatif) : nombre de doublons qui vont être supprimés
--    Sélectionne uniquement ce bloc et clique Run pour vérifier avant de nettoyer.
-- select count(*) - count(distinct (profil_id, date, coalesce(programme_id::text, nom_programme))) as doublons
-- from public.seances;

-- 2) NETTOYAGE
do $$
declare
  a_col_auto boolean;
  tri text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'seances' and column_name = 'enregistree_auto'
  ) into a_col_auto;

  tri := case when a_col_auto then 'coalesce(s.enregistree_auto, false) asc, ' else '' end;

  execute format($q$
    create temporary table seances_a_supprimer on commit drop as
    select id from (
      select s.id,
             row_number() over (
               partition by s.profil_id, s.date, coalesce(s.programme_id::text, s.nom_programme)
               order by %s coalesce(n.nb, 0) desc, coalesce(s.duree_secondes, 0) desc, s.ctid desc
             ) as rang
      from public.seances s
      left join (select seance_id, count(*) as nb from public.series group by seance_id) n
        on n.seance_id = s.id
    ) t
    where rang > 1
  $q$, tri);

  delete from public.series where seance_id in (select id from seances_a_supprimer);
  delete from public.seances where id in (select id from seances_a_supprimer);
  raise notice 'Séances en double supprimées : %', (select count(*) from seances_a_supprimer);
end $$;
