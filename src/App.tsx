import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { Acceso } from "./components/Acceso";
import { Diario } from "./components/Diario";
import { NuevaContrasena } from "./components/NuevaContrasena";
import { storeLocal, storeSupabase } from "./lib/store";
import { fotosSupabase } from "./lib/fotos";
import { recuperacion, supabase } from "./lib/supabase";

export default function App() {
  // undefined = todavía comprobando la sesión
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Vienes del enlace de "restablecer contraseña": primero se cambia.
  const cambiandoContrasena = useSyncExternalStore(recuperacion.escuchar, recuperacion.activa);
  // O la cambias tú desde el menú Cuenta.
  const [cambiarDesdeMenu, setCambiarDesdeMenu] = useState(false);

  const userId = sesion?.user.id;
  const store = useMemo(() => (supabase && userId ? storeSupabase(supabase, userId) : storeLocal), [userId]);
  const fotosApi = useMemo(() => (supabase && userId ? fotosSupabase(supabase, userId) : null), [userId]);

  if (!supabase) return <Diario store={storeLocal} local fotosApi={null} />;
  if (sesion === undefined) return <p className="cargando">Cargando…</p>;
  if (!sesion) return <Acceso sb={supabase} />;
  if (cambiandoContrasena) return <NuevaContrasena sb={supabase} onHecho={recuperacion.terminar} />;
  if (cambiarDesdeMenu)
    return <NuevaContrasena sb={supabase} onHecho={() => setCambiarDesdeMenu(false)} onCancelar={() => setCambiarDesdeMenu(false)} />;
  return (
    <Diario
      key={userId}
      store={store}
      local={false}
      fotosApi={fotosApi}
      onSalir={() => supabase!.auth.signOut()}
      onCambiarContrasena={() => setCambiarDesdeMenu(true)}
    />
  );
}
