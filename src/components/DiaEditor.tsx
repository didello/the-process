// Formulario de un día: un bloque por fila de la hoja, con botones grandes.

import { useState } from "react";
import { CAMPOS_APP, type CampoId } from "../config/campos";
import type { Dia } from "../lib/store";

interface Props {
  dia: Dia;
  onCampo(campo: CampoId, valor: string | null): void;
  onPeso(peso: number | null): void;
  onCopiarAnterior(): void;
}

export function DiaEditor({ dia, onCampo, onPeso, onCopiarAnterior }: Props) {
  return (
    <div className="editor">
      <section className="tarjeta campo">
        <h3>
          <span aria-hidden>⚖️</span> Peso <small>· kg en ayunas</small>
        </h3>
        <CampoPeso valor={dia.peso ?? null} onCambio={onPeso} />
      </section>

      {CAMPOS_APP.map((campo) => {
        const actual = dia[campo.id] ?? null;
        return (
          <section key={campo.id} className="tarjeta campo">
            <h3>
              <span aria-hidden>{campo.icono}</span> {campo.titulo}
              {campo.opcional && <small> · opcional</small>}
            </h3>
            <div className="opciones" role="radiogroup" aria-label={campo.titulo}>
              {campo.opciones.map((op) => {
                const activa = actual === op.valor;
                return (
                  <button
                    key={op.valor}
                    role="radio"
                    aria-checked={activa}
                    className={`chip ${activa ? `activa ${op.tono ?? "neutro"}` : ""}`}
                    // Tocar otra vez la opción elegida la borra.
                    onClick={() => onCampo(campo.id, activa ? null : op.valor)}
                  >
                    {op.texto ?? op.valor}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <button className="boton secundario ancho" onClick={onCopiarAnterior}>
        ↺ Copiar lo del día anterior
      </button>
    </div>
  );
}

function CampoPeso({ valor, onCambio }: { valor: number | null; onCambio(v: number | null): void }) {
  const [texto, setTexto] = useState(valor == null ? "" : String(valor).replace(".", ","));

  function confirmar() {
    const limpio = texto.trim().replace(",", ".");
    const n = limpio === "" ? null : Number(limpio);
    if (n !== null && (!Number.isFinite(n) || n <= 0 || n > 400)) return;
    if (n !== valor) onCambio(n);
  }

  return (
    <input
      className="peso"
      inputMode="decimal"
      placeholder="Ej. 82,5"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}
