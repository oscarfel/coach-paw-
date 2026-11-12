-- Bibliothèque de séances de course (Programmes > Course)
alter table public.programmes_modeles
  add column if not exists type_seance text default 'muscu',
  add column if not exists course_blocs jsonb,
  add column if not exists course_consigne text;
