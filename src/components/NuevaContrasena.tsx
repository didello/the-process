// Pantalla a la que lleva el enlace del correo "restablecer contraseña".

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/** También sirve para cambiarla estando dentro (con onCancelar para volver a la app). */
export function NuevaContrasena({ sb, onHecho, onCancelar }: { sb: SupabaseClient; onHecho(): void; onCancelar?: () => void }) {
  const [pass, setPass] = useState("");
  const [repetir, setRepetir] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (pass !== repetir) return setMsg("Las dos contraseñas no coinciden.");
    setOcupado(true);
    setMsg("Un momento…");
    const { error } = await sb.auth.updateUser({ password: pass });
    setOcupado(false);
    if (error) {
      setMsg(/different from the old/i.test(error.message) ? "La nueva contraseña tiene que ser distinta de la anterior." : error.message);
      return;
    }
    // Quitamos del enlace los restos del correo para que recargar no vuelva aquí.
    history.replaceState(null, "", location.pathname);
    onHecho();
  }

  return (
    <main className="acceso">
      <div className="marca">
        <span className="marca-logo">TP</span>
        <h1 className="firma">The Process</h1>
      </div>
      <form className="tarjeta acceso-form" onSubmit={enviar}>
        <h2>Nueva contraseña</h2>
        <input
          type="password"
          placeholder="Nueva contraseña"
          autoComplete="new-password"
          required
          minLength={8}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <input
          type="password"
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          required
          minLength={8}
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
        />
        <button className="boton principal" disabled={ocupado}>
          Guardar contraseña
        </button>
        {msg && <p className="aviso">{msg}</p>}
        {onCancelar && (
          <div className="acceso-enlaces">
            <button type="button" className="enlace" onClick={onCancelar} disabled={ocupado}>
              Cancelar
            </button>
          </div>
        )}
      </form>
    </main>
  );
}
