-- The Process: tablas y seguridad.
-- Ejecutar una vez en Supabase → SQL Editor. Se puede volver a ejecutar sin romper nada.

-- Un registro por persona y día (las filas de la hoja del entrenador + el peso).
create table if not exists public.dias (
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha          date not null,
  entrenamiento  text,
  dieta          text,
  picoteo        text,
  descanso       text,
  comidas_libres text,
  agua           text,
  bano           text,
  menstruacion   text,
  pasos          text,
  peso           numeric(5, 2),
  updated_at     timestamptz not null default now(),
  primary key (user_id, fecha)
);

-- Un registro por persona y semana (lunes): los comentarios para el entrenador.
create table if not exists public.semanas (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  inicio      date not null,
  comentarios text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, inicio)
);

-- Acceso por la Data API solo para usuarios con sesión iniciada (el proyecto no
-- expone las tablas nuevas automáticamente). Los anónimos no tienen acceso.
revoke all on public.dias, public.semanas from anon;
grant select, insert, update, delete on public.dias, public.semanas to authenticated;

-- Cada persona solo ve y toca sus propios datos.
alter table public.dias enable row level security;
alter table public.semanas enable row level security;

drop policy if exists "dias propios" on public.dias;
create policy "dias propios" on public.dias
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "semanas propias" on public.semanas;
create policy "semanas propias" on public.semanas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
