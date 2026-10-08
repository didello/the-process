import { createClient } from "@supabase/supabase-js";

// La URL y la clave "publishable" están pensadas para ir en la web: la seguridad
// la ponen las políticas RLS de supabase/schema.sql. Sin ellas, la app funciona
// en modo local (los datos se quedan en este navegador).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
