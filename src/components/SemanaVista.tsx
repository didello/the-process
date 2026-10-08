// Resumen de la semana con el aspecto de la hoja, comentarios y exportación.

import { useEffect, useRef, useState } from "react";
import { CAMPOS, tonoDe } from "../config/campos";
import { DIAS_CORTOS, diasDeSemana, hoy } from "../lib/fechas";
import type { Semana } from "../lib/store";

interface Props {
  lunes: string;
  semana: Semana;
  onComentarios(texto: string): void;
  onExportar(): void;
  onAbrirDia(fecha: string): void;
  exportando: boolean;
}

export function SemanaVista({ lunes, semana, onComentarios, onExportar, onAbrirDia, exportando }: Props) {
  const fechas = diasDeSemana(lunes);
  const pesos = fechas.map((f) => semana.dias[f]?.peso).filter((p): p is number => p != null);
  const media = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : null;

  return (
    <div className="semana">
      <div className="tabla-scroll tarjeta">
        <table className="tabla">
          <thead>
            <tr>
              <th />
              {fechas.map((f, i) => (
                <th key={f} className={f === hoy() ? "hoy" : ""}>
                  <button className="enlace" onClick={() => onAbrirDia(f)}>
                    {DIAS_CORTOS[i]}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAMPOS.map((c) => (
              <tr key={c.id}>
                <th scope="row" title={c.titulo}>
                  <span aria-hidden>{c.icono}</span> <span className="tabla-etiqueta">{c.titulo}</span>
                </th>
                {fechas.map((f) => {
                  const v = semana.dias[f]?.[c.id] ?? null;
                  const op = c.opciones.find((o) => o.valor === v);
                  return (
                    <td key={f} className={v ? `celda ${tonoDe(c, v) ?? "neutro"}` : "celda vacia"} onClick={() => onAbrirDia(f)}>
                      {v ? (op?.texto ?? v) : "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span aria-hidden>⚖️</span> <span className="tabla-etiqueta">Peso</span>
              </th>
              {fechas.map((f) => {
                const p = semana.dias[f]?.peso;
                return (
                  <td key={f} className={p != null ? "celda neutro" : "celda vacia"} onClick={() => onAbrirDia(f)}>
                    {p != null ? String(p).replace(".", ",") : "·"}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {media != null && (
        <p className="media">
          Peso medio: <strong>{media.toFixed(2).replace(".", ",")} kg</strong> ({pesos.length} {pesos.length === 1 ? "día" : "días"})
        </p>
      )}

      <section className="tarjeta campo">
        <h3>
          <span aria-hidden>📝</span> Comentarios para el entrenador
        </h3>
        <Comentarios key={lunes} inicial={semana.comentarios} onGuardar={onComentarios} />
      </section>

      <button className="boton principal ancho" onClick={onExportar} disabled={exportando}>
        {exportando ? "Generando…" : "⬇ Exportar semana a Excel"}
      </button>
    </div>
  );
}

function Comentarios({ inicial, onGuardar }: { inicial: string; onGuardar(t: string): void }) {
  const [texto, setTexto] = useState(inicial);
  const pendiente = useRef<string | null>(null);
  const guardar = useRef(onGuardar);
  useEffect(() => {
    guardar.current = onGuardar;
  });

  // Guardado automático cuando dejas de escribir un momento.
  useEffect(() => {
    if (pendiente.current === null) return;
    const t = setTimeout(() => {
      guardar.current(texto);
      pendiente.current = null;
    }, 800);
    return () => clearTimeout(t);
  }, [texto]);

  // Si sales de la pantalla antes de que salte, se guarda igualmente.
  useEffect(
    () => () => {
      if (pendiente.current !== null) guardar.current(pendiente.current);
    },
    [],
  );

  return (
    <textarea
      rows={7}
      placeholder="Qué tal el entrenamiento, la dieta, ejercicios que quieras mejorar… Cuanto más detalle, mejor."
      value={texto}
      onChange={(e) => {
        pendiente.current = e.target.value;
        setTexto(e.target.value);
      }}
    />
  );
}
