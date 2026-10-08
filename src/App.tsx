import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Acceso } from "./components/Acceso";
import { Diario } from "./components/Diario";
import { storeLocal, storeSupabase } from "./lib/store";
import { supabase } from "./lib/supabase";

export default function App() {
  // undefined = todavía comprobando la sesión
  const [sesion, setSesion] = useState<Session | null | undefined>(supabase ? undefined : null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = sesion?.user.id;
  const store = useMemo(() => (supabase && userId ? storeSupabase(supabase, userId) : storeLocal), [userId]);

  if (!supabase) return <Diario store={storeLocal} local />;
  if (sesion === undefined) return <p className="cargando">Cargando…</p>;
  if (!sesion) return <Acceso sb={supabase} />;
  return <Diario key={userId} store={store} local={false} onSalir={() => supabase!.auth.signOut()} />;
}
