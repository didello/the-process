// Pantalla de acceso con correo y contraseña de Supabase.

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const MENSAJES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Tienes que confirmar tu correo: revisa tu bandeja de entrada (y el spam).",
  "User already registered": "Ya hay una cuenta con ese correo. Entra con tu contraseña.",
};

const traducir = (e: unknown) => {
  const m = (e as Error)?.message ?? "";
  return (
    MENSAJES[m] ?? (/password/i.test(m) ? "La contraseña debe tener al menos 8 caracteres." : m || "Algo ha fallado. Inténtalo otra vez.")
  );
};

type Modo = "entrar" | "crear" | "recuperar";

export function Acceso({ sb }: { sb: SupabaseClient }) {
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const volver = location.origin + location.pathname;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setMsg("Un momento…");
    try {
      if (modo === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        setMsg("");
      } else if (modo === "crear") {
        const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: volver } });
        if (error) throw error;
        setMsg(data.session ? "" : "Te he enviado un correo para confirmar la cuenta. Ábrelo y vuelve aquí para entrar.");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: volver });
        if (error) throw error;
        setMsg("Si el correo existe, te llegará un enlace para cambiar la contraseña.");
      }
    } catch (err) {
      setMsg(traducir(err));
    } finally {
      setOcupado(false);
    }
  }

  const cambiar = (m: Modo) => {
    setModo(m);
    setMsg("");
  };

  return (
    <main className="acceso">
      <div className="marca">
        <span className="marca-logo">TP</span>
        <h1 className="firma">The Process</h1>
        <p>Recuerda por qué empezaste.</p>
      </div>
      <form className="tarjeta acceso-form" onSubmit={enviar}>
        <h2>{modo === "crear" ? "Crear cuenta" : modo === "recuperar" ? "Recuperar contraseña" : "Entrar"}</h2>
        <input type="email" placeholder="Correo" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {modo !== "recuperar" && (
          <input
            type="password"
            placeholder="Contraseña"
            autoComplete={modo === "crear" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        )}
        <button className="boton principal" disabled={ocupado}>
          {modo === "crear" ? "Crear cuenta" : modo === "recuperar" ? "Enviar enlace" : "Entrar"}
        </button>
        {msg && <p className="aviso">{msg}</p>}
        <div className="acceso-enlaces">
          {modo === "entrar" ? (
            <>
              <button type="button" className="enlace" onClick={() => cambiar("crear")}>
                Crear cuenta
              </button>
              <button type="button" className="enlace" onClick={() => cambiar("recuperar")}>
                He olvidado la contraseña
              </button>
            </>
          ) : (
            <button type="button" className="enlace" onClick={() => cambiar("entrar")}>
              Volver a entrar
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
