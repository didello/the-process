import { createClient } from "@supabase/supabase-js";

// La URL y la clave "publishable" están pensadas para ir en la web: la seguridad
// la ponen las políticas RLS de supabase/schema.sql. Sin ellas, la app funciona
// en modo local (los datos se quedan en este navegador).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

// ---------- Recuperación de contraseña ----------
// Al abrir el enlace del correo "restablecer contraseña", Supabase inicia sesión
// y avisa con PASSWORD_RECOVERY. Nos suscribimos aquí, nada más crear el cliente,
// para no perder ese aviso aunque llegue antes de que se pinte la app.

let enRecuperacion = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

supabase?.auth.onAuthStateChange((evento) => {
  if (evento === "PASSWORD_RECOVERY") {
    enRecuperacion = true;
    avisar();
  }
});

export const recuperacion = {
  activa: () => enRecuperacion,
  escuchar(f: () => void) {
    oyentes.add(f);
    return () => {
      oyentes.delete(f);
    };
  },
  terminar() {
    enRecuperacion = false;
    avisar();
  },
};
