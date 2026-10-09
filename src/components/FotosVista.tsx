// Pestaña Fotos: subir la sesión de fotos (4 poses), verlas agrupadas por pose,
// compararlas lado a lado y ocultarlas (pixeladas) con el botón del ojo.

import { useEffect, useRef, useState } from "react";
import { fechaCorta, hoy } from "../lib/fechas";
import { POSES, recordatorioFotos, type Foto, type FotosApi, type Pose } from "../lib/fotos";

interface Props {
  api: FotosApi | null;
  fotos: Foto[] | null; // null = cargando
  onCambio(fotos: Foto[]): void;
  onError(msg: string): void;
  ocultas: boolean;
  onOcultas(v: boolean): void;
}

export function FotosVista({ api, fotos, onCambio, onError, ocultas, onOcultas }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [visor, setVisor] = useState<Foto | null>(null);

  if (!api) {
    return <p className="vacio">Las fotos se guardan en tu cuenta: inicia sesión para usarlas.</p>;
  }
  if (!fotos) return <p className="cargando">Cargando fotos…</p>;

  const aviso = recordatorioFotos(fotos);

  return (
    <div className="fotos">
      <div className="fotos-barra">
        <button className={`ojo ${ocultas ? "" : "abierto"}`} onClick={() => onOcultas(!ocultas)} aria-pressed={!ocultas}>
          {ocultas ? <OjoCerrado /> : <OjoAbierto />}
          <span>{ocultas ? "Ocultas" : "Visibles"}</span>
        </button>
        <button className="boton principal" onClick={() => setSubiendo(true)}>
          ＋ Subir fotos
        </button>
      </div>

      {aviso && (
        <p className={`fotos-aviso ${aviso.toca ? "toca" : ""}`}>
          {aviso.toca
            ? `📸 Toca sacar fotos: han pasado ${aviso.dias} días desde las últimas (${fechaCorta(aviso.ultima)}).`
            : `Últimas fotos: ${fechaCorta(aviso.ultima)} · próximas: ${fechaCorta(aviso.proxima)}`}
        </p>
      )}

      {!fotos.length && <p className="vacio">Aún no hay fotos. Sube tu primera sesión: frente, los dos perfiles y espalda.</p>}

      {POSES.map((pose) => {
        const deEsta = fotos.filter((f) => f.pose === pose.id);
        if (!deEsta.length) return null;
        return (
          <section key={pose.id} className="pose">
            <h3>
              {pose.titulo} <small>· {deEsta.length}</small>
            </h3>
            <div className="carrusel">
              {deEsta.map((f) => (
                <button key={f.id} className="miniatura" onClick={() => setVisor(f)}>
                  <Imagen url={f.url} pixelada={ocultas} />
                  <span className="fecha-foto">{fechaCorta(f.fecha)}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {subiendo && (
        <SubirFotos
          api={api}
          onCerrar={() => setSubiendo(false)}
          onSubida={(nuevas) => {
            // Las nuevas sustituyen a las que hubiera de esa pose ese día.
            const clave = (f: Foto) => `${f.fecha}|${f.pose}`;
            const claves = new Set(nuevas.map(clave));
            onCambio([...nuevas, ...fotos.filter((f) => !claves.has(clave(f)))].sort((a, b) => b.fecha.localeCompare(a.fecha)));
          }}
          onError={onError}
        />
      )}

      {visor && (
        <Visor
          foto={visor}
          otras={fotos.filter((f) => f.pose === visor.pose && f.id !== visor.id)}
          pixelada={ocultas}
          onCerrar={() => setVisor(null)}
          onBorrar={async () => {
            if (!confirm(`¿Borrar la foto de ${POSES.find((p) => p.id === visor.pose)!.titulo.toLowerCase()} del ${fechaCorta(visor.fecha)}?`)) return;
            try {
              await api.borrar(visor);
              onCambio(fotos.filter((f) => f.id !== visor.id));
              setVisor(null);
            } catch (e) {
              onError((e as Error).message || "No se ha podido borrar la foto.");
            }
          }}
        />
      )}
    </div>
  );
}

/** Foto normal o pixelada (dibujada en muy pocos píxeles y ampliada). */
function Imagen({ url, pixelada, bloques = 14 }: { url: string; pixelada: boolean; bloques?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pixelada) return;
    const img = new Image();
    img.onload = () => {
      const c = canvas.current;
      if (!c) return;
      // Recorte tipo "cover" a 3:4, como las miniaturas.
      c.width = bloques;
      c.height = Math.round((bloques * 4) / 3);
      const escala = Math.max(c.width / img.width, c.height / img.height);
      const w = img.width * escala,
        h = img.height * escala;
      c.getContext("2d")!.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
    };
    img.src = url;
  }, [url, pixelada, bloques]);

  return pixelada ? <canvas ref={canvas} className="imagen pixelada" /> : <img className="imagen" src={url} alt="" loading="lazy" />;
}

function Visor({
  foto,
  otras,
  pixelada,
  onCerrar,
  onBorrar,
}: {
  foto: Foto;
  otras: Foto[];
  pixelada: boolean;
  onCerrar(): void;
  onBorrar(): void;
}) {
  const [comparar, setComparar] = useState<Foto | null>(null);
  const titulo = POSES.find((p) => p.id === foto.pose)!.titulo;
  // Siempre la más antigua a la izquierda (antes → después).
  const par = comparar ? [foto, comparar].sort((a, b) => a.fecha.localeCompare(b.fecha)) : [foto];

  return (
    <div className="capa" role="dialog" aria-label={titulo}>
      <header className="capa-cabecera">
        <strong>{titulo}</strong>
        <button className="enlace" onClick={onCerrar}>
          Cerrar
        </button>
      </header>

      <div className={`visor-fotos ${comparar ? "doble" : ""}`}>
        {par.map((f) => (
          <figure key={f.id} className="visor-foto">
            <Imagen url={f.url} pixelada={pixelada} bloques={24} />
            <span className="fecha-foto">{fechaCorta(f.fecha)}</span>
          </figure>
        ))}
      </div>

      {otras.length > 0 && (
        <div className="comparar">
          <p>{comparar ? "Comparando. Toca otra fecha o la misma para quitarla:" : "Comparar con:"}</p>
          <div className="carrusel">
            {otras.map((f) => (
              <button key={f.id} className={`miniatura peque ${comparar?.id === f.id ? "sel" : ""}`} onClick={() => setComparar(comparar?.id === f.id ? null : f)}>
                <Imagen url={f.url} pixelada={pixelada} bloques={8} />
                <span className="fecha-foto">{fechaCorta(f.fecha)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!comparar && (
        <button className="boton secundario borrar" onClick={onBorrar}>
          Borrar esta foto
        </button>
      )}
    </div>
  );
}

function SubirFotos({
  api,
  onCerrar,
  onSubida,
  onError,
}: {
  api: FotosApi;
  onCerrar(): void;
  onSubida(fotos: Foto[]): void;
  onError(msg: string): void;
}) {
  const [fecha, setFecha] = useState(hoy());
  // Cada foto elegida con su vista previa local.
  const [archivos, setArchivos] = useState<Partial<Record<Pose, { archivo: File; vista: string }>>>({});
  const [progreso, setProgreso] = useState<string | null>(null);

  // Al cerrar, se liberan las vistas previas.
  const vistas = useRef<string[]>([]);
  useEffect(() => () => vistas.current.forEach((u) => URL.revokeObjectURL(u)), []);

  function elegir(pose: Pose, archivo: File | undefined) {
    if (!archivo) return;
    const vista = URL.createObjectURL(archivo);
    vistas.current.push(vista);
    setArchivos((a) => ({ ...a, [pose]: { archivo, vista } }));
  }

  const elegidas = POSES.filter((p) => archivos[p.id]);

  async function guardar() {
    const subidas: Foto[] = [];
    try {
      for (const [i, p] of elegidas.entries()) {
        setProgreso(`Subiendo ${i + 1} de ${elegidas.length}…`);
        subidas.push(await api.subir(fecha, p.id, archivos[p.id]!.archivo));
      }
      onSubida(subidas);
      onCerrar();
    } catch (e) {
      if (subidas.length) onSubida(subidas);
      onError((e as Error).message || "No se han podido subir las fotos.");
      setProgreso(null);
    }
  }

  return (
    <div className="capa" role="dialog" aria-label="Subir fotos">
      <header className="capa-cabecera">
        <strong>Subir fotos</strong>
        <button className="enlace" onClick={onCerrar} disabled={!!progreso}>
          Cancelar
        </button>
      </header>

      <label className="campo-fecha">
        Fecha de las fotos
        <input type="date" value={fecha} max={hoy()} onChange={(e) => e.target.value && setFecha(e.target.value)} />
      </label>

      <div className="huecos">
        {POSES.map((p) => {
          const src = archivos[p.id]?.vista;
          return (
            <label key={p.id} className={`hueco ${src ? "lleno" : ""}`}>
              {src ? <img src={src} alt="" /> : <span className="hueco-mas">＋</span>}
              <span className="hueco-titulo">{p.titulo}</span>
              <input type="file" accept="image/*" hidden onChange={(e) => elegir(p.id, e.target.files?.[0])} />
            </label>
          );
        })}
      </div>

      <button className="boton principal ancho" disabled={!elegidas.length || !!progreso} onClick={guardar}>
        {progreso ?? (elegidas.length ? `Guardar ${elegidas.length} ${elegidas.length === 1 ? "foto" : "fotos"}` : "Elige al menos una foto")}
      </button>
    </div>
  );
}

const OjoAbierto = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const OjoCerrado = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M2 12s3.6-7 10-7c2 0 3.8.7 5.2 1.6M22 12s-3.6 7-10 7c-2 0-3.8-.7-5.2-1.6" />
    <path d="M3 3l18 18" />
  </svg>
);
