// Pantalla "Pasos desde el iPhone": genera la clave del Atajo y explica cómo montarlo.
// El Atajo lee los pasos de Salud (los mismos que enseña Fitness) y llama a apuntar_pasos.

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { atajo } from "../lib/supabase";

interface Estado {
  creada: string;
  ultimo_uso: string | null;
}

const cuando = (iso: string) =>
  new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Copiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [hecho, setHecho] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setHecho(true);
      setTimeout(() => setHecho(false), 1800);
    } catch {
      /* sin portapapeles: se puede seleccionar el texto a mano */
    }
  }
  return (
    <div className="copiable">
      <span className="copiable-etiqueta">{etiqueta}</span>
      <code>{valor}</code>
      <button type="button" className="boton secundario" onClick={copiar}>
        {hecho ? "✓ Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export function PasosAtajo({ sb, onVolver }: { sb: SupabaseClient; onVolver(): void }) {
  const [estado, setEstado] = useState<Estado | null | undefined>(undefined);
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(
    () =>
      sb
        .from("claves_atajo")
        .select("creada, ultimo_uso")
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error) return setEstado(data);
          setEstado(null);
          setMsg("No se ha podido comprobar tu clave. ¿Está aplicada la última versión de supabase/schema.sql?");
        }),
    [sb],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function generar() {
    if (estado && !confirm("La clave anterior dejará de funcionar y tendrás que poner la nueva en el atajo. ¿Seguimos?")) return;
    setOcupado(true);
    setMsg("");
    const { data, error } = await sb.rpc("nueva_clave_atajo");
    setOcupado(false);
    if (error) return setMsg(error.message);
    setClave(data as string);
    cargar();
  }

  async function anular() {
    if (!confirm("El atajo dejará de apuntar tus pasos hasta que generes otra clave. ¿Anular?")) return;
    setOcupado(true);
    const { error } = await sb.rpc("anular_clave_atajo");
    setOcupado(false);
    if (error) return setMsg(error.message);
    setClave("");
    cargar();
  }

  return (
    <main className="pantalla-atajo">
      <button type="button" className="enlace" onClick={onVolver}>
        ‹ Volver
      </button>
      <h1>👟 Pasos desde el iPhone</h1>
      <p className="atajo-intro">
        Un <b>Atajo</b> del iPhone lee tus pasos (los mismos que ves en Fitness) y los apunta aquí solo. Se monta una vez y luego no tienes
        que hacer nada. Si un día marcas a mano más pasos de los que envía, se queda lo tuyo.
      </p>

      <section className="tarjeta atajo-bloque">
        <h2>1. Tu clave del atajo</h2>
        <p className="aviso">
          Solo sirve para apuntar pasos en tu cuenta: no deja ver ni cambiar nada más. Puedes anularla cuando quieras.
        </p>
        {estado === undefined && <p className="aviso">Comprobando…</p>}
        {estado && !clave && (
          <p className="aviso">
            Tienes una clave creada el {cuando(estado.creada)}.{" "}
            {estado.ultimo_uso ? `El atajo la usó por última vez el ${cuando(estado.ultimo_uso)}.` : "El atajo aún no la ha usado."}
          </p>
        )}
        {clave && <Copiable etiqueta="Clave (cópiala ahora: no se vuelve a mostrar)" valor={clave} />}
        <div className="atajo-botones">
          <button type="button" className="boton principal" onClick={generar} disabled={ocupado || estado === undefined}>
            {estado ? "Generar otra clave" : "Generar clave"}
          </button>
          {estado && (
            <button type="button" className="enlace" onClick={anular} disabled={ocupado}>
              Anular clave
            </button>
          )}
        </div>
        {msg && <p className="aviso">{msg}</p>}
      </section>

      <section className="tarjeta atajo-bloque">
        <h2>2. Crea el atajo</h2>
        <p className="aviso">En el iPhone, abre la app Atajos → pestaña Atajos → «+». Llámalo «Pasos a The Process» y añade:</p>
        <ol className="atajo-pasos">
          <li>
            <b>Buscar muestras de salud</b>: tipo <b>Pasos</b>. Añade el filtro <b>Fecha de inicio · está en los últimos · 2 días</b>.
            Abajo: <b>Agrupar por: Día</b>, <b>Ordenar por: Fecha de inicio</b>, <b>Más reciente primero</b> y <b>Limitar: 2</b>.
          </li>
          <li>
            <b>Repetir con cada</b> (las muestras de salud). Dentro de la repetición:
            <ol>
              <li>
                <b>Formatear fecha</b>: toca la fecha, elige <b>Elemento de repetición</b> y luego <b>Fecha de inicio</b>. Formato:{" "}
                <b>Personalizado</b> con <code>yyyy-MM-dd</code>.
              </li>
              <li>
                <b>Obtener contenido de URL</b> con la dirección de abajo. Toca «Mostrar más»: <b>Método: POST</b>. En <b>Encabezados</b>{" "}
                añade uno con clave <code>apikey</code> y el valor de abajo. En <b>Cuerpo de la solicitud: JSON</b> añade tres campos:
                <ul>
                  <li>
                    <code>clave</code> (Texto): tu clave
                  </li>
                  <li>
                    <code>fecha</code> (Texto): la <b>Fecha formateada</b>
                  </li>
                  <li>
                    <code>pasos</code> (Número): <b>Elemento de repetición</b> → <b>Valor</b>
                  </li>
                </ul>
              </li>
            </ol>
          </li>
        </ol>
        <Copiable etiqueta="Dirección (URL)" valor={atajo.url} />
        <Copiable etiqueta="Encabezado apikey" valor={atajo.apikey} />
        <p className="aviso">
          Pruébalo con ▶︎. La primera vez te pedirá permiso para leer los pasos de Salud: dile que sí. Si todo va bien, la respuesta es la
          opción apuntada (por ejemplo <code>10-12k</code>).
        </p>
      </section>

      <section className="tarjeta atajo-bloque">
        <h2>3. Que se ejecute solo</h2>
        <p className="aviso">
          Con el iPhone bloqueado, Apple no deja leer Salud. Por eso es mejor lanzarlo al abrir una app que uses a diario (el móvil ya está
          desbloqueado). Envía hoy y ayer, así que si una vez falla, la siguiente lo completa.
        </p>
        <ol className="atajo-pasos">
          <li>
            Atajos → pestaña <b>Automatización</b> → «+» → <b>App</b>.
          </li>
          <li>
            Elige <b>Fitness</b> y alguna que abras siempre (WhatsApp, por ejemplo). Marca <b>Se abre</b>.
          </li>
          <li>
            Marca <b>Ejecutar inmediatamente</b> (y desactiva «Notificar al ejecutar» si no quieres el aviso).
          </li>
          <li>Siguiente → elige el atajo «Pasos a The Process».</li>
          <li>
            Opcional: otra automatización de <b>Hora del día</b> (por ejemplo 23:30, a diario) con el mismo atajo.
          </li>
        </ol>
      </section>
    </main>
  );
}
