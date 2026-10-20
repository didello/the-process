import { createClient, type Session } from "@supabase/supabase-js";

// La URL y la clave "publishable" están pensadas para ir en la web: la seguridad
// la ponen las políticas RLS de supabase/schema.sql. Sin ellas, la app funciona
// en modo local (los datos se quedan en este navegador).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

export const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

// ---------- Recuperación de contraseña e invitaciones ----------
// Al abrir el enlace del correo "restablecer contraseña", Supabase inicia sesión
// y avisa con PASSWORD_RECOVERY. Nos suscribimos aquí, nada más crear el cliente,
// para no perder ese aviso aunque llegue antes de que se pinte la app.
//
// Con el de invitación también se entra sin contraseña. No basta con mirar el enlace:
// si el navegador tenía guardada una versión anterior de la app, esa versión lo usa y
// luego se recarga sola. Por eso miramos la cuenta: si fue invitada (Supabase guarda
// invited_at) y la persona aún no ha elegido contraseña (lo marcamos en sus datos con
// clave_elegida), la app se la pide cada vez que se abre.

/** Marca que se guarda en los datos de la persona al elegir contraseña. */
export const CLAVE_ELEGIDA = "clave_elegida";

const faltaClaveDeInvitacion = (s: Session) => !!s.user.invited_at && !s.user.user_metadata?.[CLAVE_ELEGIDA];

let enRecuperacion = false;
let esInvitacion = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

supabase?.auth.onAuthStateChange((evento, sesion) => {
  if (evento === "PASSWORD_RECOVERY") {
    enRecuperacion = true;
    avisar();
  } else if (sesion && !enRecuperacion && faltaClaveDeInvitacion(sesion)) {
    enRecuperacion = esInvitacion = true;
    avisar();
  }
});

export const recuperacion = {
  activa: () => enRecuperacion,
  invitacion: () => esInvitacion,
  escuchar(f: () => void) {
    oyentes.add(f);
    return () => {
      oyentes.delete(f);
    };
  },
  terminar() {
    enRecuperacion = esInvitacion = false;
    avisar();
  },
};
