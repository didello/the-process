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

-- ============================================================
-- Fotos de progreso (v0.2): almacén privado + tabla con fecha y pose.
-- ============================================================

create table if not exists public.fotos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha      date not null,
  pose       text not null check (pose in ('frente', 'perfil_izq', 'perfil_der', 'espalda')),
  ruta       text not null, -- dentro del almacén "fotos": <user_id>/<archivo>.jpg
  created_at timestamptz not null default now(),
  unique (user_id, fecha, pose)
);

revoke all on public.fotos from anon;
grant select, insert, update, delete on public.fotos to authenticated;
alter table public.fotos enable row level security;

drop policy if exists "fotos propias" on public.fotos;
create policy "fotos propias" on public.fotos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Almacén privado: sin sesión no se puede ver ninguna foto, ni con el enlace.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg'];

-- Cada persona solo puede tocar su carpeta (<user_id>/...).
drop policy if exists "fotos: ver las mias" on storage.objects;
create policy "fotos: ver las mias" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "fotos: subir a mi carpeta" on storage.objects;
create policy "fotos: subir a mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "fotos: borrar las mias" on storage.objects;
create policy "fotos: borrar las mias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
