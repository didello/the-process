// Pantalla principal: selector de semana/día, formulario del día y resumen semanal.

import { useCallback, useEffect, useRef, useState } from "react";
import { CAMPOS, CAMPOS_CLAVE, informados, type CampoId } from "../config/campos";
import { exportarSemana } from "../lib/exportar";
import { DIAS_CORTOS, diasDeSemana, fechaLarga, hoy, lunesDe, parseISO, rangoSemana, sumarDias } from "../lib/fechas";
import type { Dia, Semana, Store } from "../lib/store";
import { DiaEditor } from "./DiaEditor";
import { SemanaVista } from "./SemanaVista";

type Estado = "listo" | "guardando" | "error";

interface Props {
  store: Store;
  local: boolean;
  onSalir?: () => void;
}

/** Verde: los campos clave están informados. Rojo: es un día pasado y falta alguno. */
function estadoAnillo(fecha: string, dia: Dia | undefined) {
  if (informados(dia) === CAMPOS_CLAVE.length) return "cumplido";
  return fecha < hoy() ? "fallado" : "";
}

/** Días seguidos con los campos clave informados, contando hacia atrás desde hoy (o desde ayer si hoy aún está a medias). */
function calcularRacha(dias: Record<string, Dia>) {
  const completo = (f: string) => informados(dias[f]) === CAMPOS_CLAVE.length;
  let f = completo(hoy()) ? hoy() : sumarDias(hoy(), -1);
  let n = 0;
  while (completo(f)) {
    n++;
    f = sumarDias(f, -1);
  }
  return n;
}

const DIAS_RACHA = 730; // hasta dónde miramos hacia atrás para la racha

export function Diario({ store, local, onSalir }: Props) {
  const [fecha, setFecha] = useState(hoy());
  const lunes = lunesDe(fecha);
  // Semana cargada y de qué lunes es (mientras carga otra, no se muestra).
  const [cargada, setCargada] = useState<{ lunes: string; semana: Semana } | null>(null);
  const semana = cargada?.lunes === lunes ? cargada.semana : null;
  const [vista, setVista] = useState<"dia" | "semana">("dia");
  const [estado, setEstado] = useState<Estado>("listo");
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);
  // Días recientes (para la racha), se mantiene al día con lo que vas rellenando.
  const [recientes, setRecientes] = useState<Record<string, Dia>>({});

  // Copia al día de la semana cargada, para calcular cambios sin esperar a React.
  const semanaRef = useRef<Semana | null>(null);
  const fijarSemana = (l: string, s: Semana) => {
    semanaRef.current = s;
    setCargada({ lunes: l, semana: s });
  };

  // Los guardados van en fila, para que nunca pise uno antiguo a uno nuevo.
  const cola = useRef(Promise.resolve());
  const pendientes = useRef(0);

  const encolar = useCallback((tarea: () => Promise<void>) => {
    pendientes.current++;
    setEstado("guardando");
    cola.current = cola.current
      .then(tarea)
      .then(() => {
        if (--pendientes.current === 0) setEstado("listo");
      })
      .catch((e) => {
        pendientes.current--;
        setEstado("error");
        setError((e as Error).message || "No se ha podido guardar.");
      });
  }, []);

  useEffect(() => {
    let vivo = true;
    semanaRef.current = null;
    store
      .cargarSemana(lunes)
      .then((s) => vivo && fijarSemana(lunes, s))
      .catch((e) => {
        if (!vivo) return;
        setError((e as Error).message || "No se ha podido cargar la semana.");
        fijarSemana(lunes, { dias: {}, comentarios: "" });
      });
    return () => {
      vivo = false;
    };
  }, [store, lunes]);

  useEffect(() => {
    store
      .cargarDias(sumarDias(hoy(), -DIAS_RACHA), hoy())
      .then((d) => setRecientes((previos) => ({ ...d, ...previos })))
      .catch(() => {
        /* sin racha si falla: no es crítico */
      });
  }, [store]);

  function actualizarDia(f: string, cambios: Dia) {
    const s = semanaRef.current;
    if (!s) return;
    const nuevo = { ...s.dias[f], ...cambios };
    fijarSemana(lunes, { ...s, dias: { ...s.dias, [f]: nuevo } });
    setRecientes((r) => ({ ...r, [f]: nuevo }));
    encolar(() => store.guardarDia(f, nuevo));
  }

  const onCampo = (campo: CampoId, valor: string | null) => actualizarDia(fecha, { [campo]: valor });
  const onPeso = (peso: number | null) => actualizarDia(fecha, { peso });

  async function onCopiarAnterior() {
    const ayer = sumarDias(fecha, -1);
    const s = semanaRef.current;
    const previo = s?.dias[ayer] ?? (await store.cargarDia(ayer));
    const actual = s?.dias[fecha] ?? {};
    // Solo rellena lo que está vacío: nunca borra lo que ya has puesto hoy.
    const cambios: Dia = {};
    for (const c of CAMPOS) if (!actual[c.id] && previo[c.id]) cambios[c.id] = previo[c.id];
    if (Object.keys(cambios).length) actualizarDia(fecha, cambios);
  }

  function onComentarios(texto: string) {
    const s = semanaRef.current;
    const l = lunes;
    if (s) fijarSemana(l, { ...s, comentarios: texto });
    encolar(() => store.guardarComentarios(l, texto));
  }

  async function onExportar() {
    if (!semanaRef.current) return;
    setExportando(true);
    try {
      await cola.current; // que lo último escrito ya esté guardado
      await exportarSemana(lunes, semanaRef.current);
    } catch (e) {
      setError((e as Error).message || "No se ha podido exportar.");
    } finally {
      setExportando(false);
    }
  }

  const moverSemana = (n: number) => {
    const nuevoLunes = sumarDias(lunes, 7 * n);
    const h = hoy();
    setFecha(lunesDe(h) === nuevoLunes ? h : nuevoLunes);
  };

  const dias = diasDeSemana(lunes);
  const dia = semana?.dias[fecha] ?? {};
  const hechos = informados(semana?.dias[fecha]);
  const racha = calcularRacha(recientes);

  return (
    <div className="app">
      <div className="fija">
        <header className="cabecera">
          <div className="marca-mini">
            <span className="marca-logo">TP</span>
            <span className="firma">The Process</span>
          </div>
          <span className={`estado ${estado}`} title={error}>
            {estado === "guardando" ? "Guardando…" : estado === "error" ? "⚠ Sin guardar" : local ? "Modo local" : "✓ Guardado"}
          </span>
          {onSalir && (
            <button className="enlace" onClick={onSalir}>
              Salir
            </button>
          )}
        </header>

        {error && (
          <div className="error" role="alert">
            {error}
            <button className="enlace" onClick={() => setError("")}>
              Cerrar
            </button>
          </div>
        )}

        <nav className="semana-nav">
          <button className="flecha" onClick={() => moverSemana(-1)} aria-label="Semana anterior">
            ‹
          </button>
          <strong>{rangoSemana(lunes)}</strong>
          <button className="flecha" onClick={() => moverSemana(1)} aria-label="Semana siguiente">
            ›
          </button>
        </nav>

        <div className="tira-dias">
          {dias.map((f, i) => {
            const pct = informados(semana?.dias[f]) / CAMPOS_CLAVE.length;
            return (
              <button
                key={f}
                className={`dia-btn ${f === fecha && vista === "dia" ? "sel" : ""} ${f === hoy() ? "hoy" : ""}`}
                onClick={() => {
                  setFecha(f);
                  setVista("dia");
                }}
              >
                <span className="dia-letra">{DIAS_CORTOS[i]}</span>
                <span className={`dia-num ${estadoAnillo(f, semana?.dias[f])}`} style={{ ["--pct" as string]: pct }}>
                  {parseISO(f).getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="contenido">
        {!semana ? (
          <p className="cargando">Cargando…</p>
        ) : vista === "dia" ? (
          <>
            <h2 className="titulo-dia">
              {fechaLarga(fecha)}
              <span className="insignias">
                <span className={`racha ${racha ? "" : "apagada"}`} title="Días seguidos apuntando">
                  🔥 {racha} {racha === 1 ? "día" : "días"}
                </span>
                <small>
                  {hechos}/{CAMPOS_CLAVE.length}
                </small>
              </span>
            </h2>
            <DiaEditor key={fecha} dia={dia} onCampo={onCampo} onPeso={onPeso} onCopiarAnterior={onCopiarAnterior} />
          </>
        ) : (
          <SemanaVista
            lunes={lunes}
            semana={semana}
            onComentarios={onComentarios}
            onExportar={onExportar}
            exportando={exportando}
            onAbrirDia={(f) => {
              setFecha(f);
              setVista("dia");
            }}
          />
        )}
      </main>

      <nav className="pestanas">
        <button className={vista === "dia" ? "activa" : ""} onClick={() => setVista("dia")}>
          <span aria-hidden>📅</span> Día
        </button>
        <button className={vista === "semana" ? "activa" : ""} onClick={() => setVista("semana")}>
          <span aria-hidden>📊</span> Semana
        </button>
      </nav>
    </div>
  );
}
