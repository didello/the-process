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

-- ============================================================
-- Pasos desde el iPhone (v1.2): un Atajo lee los pasos de Salud y los apunta.
-- El Atajo no usa la contraseña: cada persona genera en la app una "clave del atajo"
-- que solo sirve para apuntar pasos. Aquí se guarda su huella (sha256), nunca la clave.
-- ============================================================

create table if not exists public.claves_atajo (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  hash       text not null unique,
  creada     timestamptz not null default now(),
  ultimo_uso timestamptz
);

revoke all on public.claves_atajo from anon, authenticated;
grant select (user_id, creada, ultimo_uso) on public.claves_atajo to authenticated;
alter table public.claves_atajo enable row level security;

drop policy if exists "clave del atajo propia" on public.claves_atajo;
create policy "clave del atajo propia" on public.claves_atajo
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Genera una clave nueva (anula la anterior) y la devuelve. Solo se ve esta vez.
create or replace function public.nueva_clave_atajo()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid   uuid := auth.uid();
  clave text;
begin
  if uid is null then
    raise exception 'Hace falta iniciar sesión.';
  end if;
  clave := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.claves_atajo (user_id, hash)
  values (uid, encode(sha256(convert_to(clave, 'UTF8')), 'hex'))
  on conflict (user_id) do update set hash = excluded.hash, creada = now(), ultimo_uso = null;
  return clave;
end;
$$;

create or replace function public.anular_clave_atajo()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.claves_atajo where user_id = auth.uid();
$$;

revoke all on function public.nueva_clave_atajo() from public, anon;
revoke all on function public.anular_clave_atajo() from public, anon;
grant execute on function public.nueva_clave_atajo() to authenticated;
grant execute on function public.anular_clave_atajo() to authenticated;

-- Lo que llama el Atajo: POST /rest/v1/rpc/apuntar_pasos con {"clave", "fecha", "pasos"}.
-- Convierte los pasos en la opción de la hoja del entrenador y la apunta en ese día.
-- Nunca baja lo que ya hay: si marcaste a mano más pasos, o el Atajo ya envió más ese día,
-- se queda lo de más. Devuelve la opción que queda guardada.
create or replace function public.apuntar_pasos(clave text, fecha date, pasos numeric)
returns text
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  -- Mismo orden y textos que src/config/campos.ts
  opciones constant text[] := array['0-3k', '3-5k', '5-8k', '8-10k', '10-12k', '12-15k', '> de 15k'];
  uid    uuid;
  nueva  text;
  actual text;
begin
  select c.user_id into uid
  from public.claves_atajo c
  where c.hash = encode(sha256(convert_to(coalesce(apuntar_pasos.clave, ''), 'UTF8')), 'hex');
  if uid is null then
    raise exception 'La clave del atajo no es válida. Genera una nueva en The Process (Cuenta).';
  end if;
  if apuntar_pasos.fecha is null or apuntar_pasos.fecha > current_date + 1 or apuntar_pasos.fecha < current_date - 7 then
    raise exception 'Solo se pueden apuntar pasos de los últimos 7 días.';
  end if;
  if apuntar_pasos.pasos is null or apuntar_pasos.pasos < 0 or apuntar_pasos.pasos > 200000 then
    raise exception 'Número de pasos no válido.';
  end if;

  nueva := case
    when apuntar_pasos.pasos < 3000 then opciones[1]
    when apuntar_pasos.pasos < 5000 then opciones[2]
    when apuntar_pasos.pasos < 8000 then opciones[3]
    when apuntar_pasos.pasos < 10000 then opciones[4]
    when apuntar_pasos.pasos < 12000 then opciones[5]
    when apuntar_pasos.pasos < 15000 then opciones[6]
    else opciones[7]
  end;

  select d.pasos into actual from public.dias d where d.user_id = uid and d.fecha = apuntar_pasos.fecha;
  if actual is null or coalesce(array_position(opciones, actual), 0) < array_position(opciones, nueva) then
    insert into public.dias (user_id, fecha, pasos)
    values (uid, apuntar_pasos.fecha, nueva)
    on conflict (user_id, fecha) do update set pasos = excluded.pasos, updated_at = now();
    actual := nueva;
  end if;

  update public.claves_atajo set ultimo_uso = now() where user_id = uid;
  return actual;
end;
$$;

revoke all on function public.apuntar_pasos(text, date, numeric) from public;
grant execute on function public.apuntar_pasos(text, date, numeric) to anon, authenticated;
