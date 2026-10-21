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
        <p className="aviso">
          En el iPhone, abre la app <b>Atajos</b> → pestaña Atajos → «+». Entre paréntesis va cómo sale si tu iPhone está en inglés. Añade
          cada acción desde la barra de búsqueda de abajo, en este orden:
        </p>
        <ol className="atajo-pasos">
          <li>
            <b>Buscar muestras de salud</b> <i>(Find Health Samples)</i>. Si pide permiso, pulsa <b>Permitir acceso</b> y activa Pasos. Debe
            quedar <b>Tipo es Pasos</b> <i>(Type is Steps)</i>. Añade un filtro y déjalo en{" "}
            <b>Fecha de inicio está en los últimos 2 días</b> <i>(Start Date is in the last 2 days)</i>. Debajo: <b>Agrupar por: Día</b>{" "}
            <i>(Group By: Day)</i> y el <b>Límite</b> <i>(Limit)</i> <b>desactivado</b>.
          </li>
          <li>
            <b>Repetir con cada</b> <i>(Repeat with Each)</i>. Ojo: no «Repetir» a secas. Las dos acciones siguientes tienen que quedar{" "}
            <b>dentro</b>, entre «Repetir con cada» y «Fin de la repetición» <i>(End Repeat)</i>: si aparecen debajo, arrástralas.
            <ol>
              <li>
                <b>Formatear fecha</b> <i>(Format Date)</i>: toca la fecha y elige <b>Elemento de repetición</b> <i>(Repeat Item)</i>;
                vuelve a tocarlo y elige <b>Fecha de inicio</b> <i>(Start Date)</i>. En formato de fecha <i>(Date Format)</i> elige{" "}
                <b>Personalizado</b> <i>(Custom)</i> y escribe <code>yyyy-MM-dd</code>.
              </li>
              <li>
                <b>Obtener contenido de URL</b> <i>(Get Contents of URL)</i>. Atajos rellena la dirección sola con la fecha: bórrala y pega
                la <b>Dirección (URL)</b> de abajo. <b>Método: POST</b>. En <b>Encabezados</b> <i>(Headers)</i>, uno solo: clave{" "}
                <code>apikey</code> y el valor de abajo (borra los vacíos con ⊖). En <b>Cuerpo de la solicitud</b> <i>(Request Body)</i>{" "}
                elige <b>JSON</b> y añade tres campos:
                <ul>
                  <li>
                    <code>clave</code>, tipo Texto <i>(Text)</i>: tu clave.
                  </li>
                  <li>
                    <code>fecha</code>, tipo Texto: <b>Fecha formateada</b> <i>(Formatted Date)</i>, solo una vez.
                  </li>
                  <li>
                    <code>pasos</code>, tipo Número <i>(Number)</i>: borra el 0, elige <b>Elemento de repetición</b> encima del teclado y
                    luego <b>Valor</b> <i>(Value)</i>. Si sale en rojo, bórralo y vuelve a ponerlo.
                  </li>
                </ul>
              </li>
            </ol>
          </li>
        </ol>
        <Copiable etiqueta="Dirección (URL)" valor={atajo.url} />
        <Copiable etiqueta="Encabezado apikey" valor={atajo.apikey} />
        <p className="aviso">
          Pruébalo con ▶︎. Si todo va bien, la respuesta es la opción apuntada (por ejemplo <code>10-12k</code>). Si sale un mensaje con
          «invalid input syntax for type date», hay dos fechas en el campo <code>fecha</code>; si sale «connection was lost», revisa que no
          haya encabezados vacíos.
        </p>
      </section>

      <section className="tarjeta atajo-bloque">
        <h2>3. Que se ejecute solo</h2>
        <p className="aviso">
          Con el iPhone bloqueado, Apple no deja leer Salud. Por eso se lanza al abrir una app que uses a diario (el móvil ya está
          desbloqueado). Envía los últimos días, así que si una vez no se ejecuta, la siguiente lo completa.
        </p>
        <ol className="atajo-pasos">
          <li>
            Atajos → pestaña <b>Automatización</b> <i>(Automation)</i> → «+» → <b>App</b>.
          </li>
          <li>
            Elige <b>Fitness</b> y alguna que abras siempre (WhatsApp, por ejemplo). Deja marcado <b>Se abre</b> <i>(Is Opened)</i>.
          </li>
          <li>
            Marca <b>Ejecutar inmediatamente</b> <i>(Run Immediately)</i>. Si no quieres el aviso, desactiva «Notificar al ejecutar»{" "}
            <i>(Notify When Run)</i>.
          </li>
          <li>
            Siguiente <i>(Next)</i> → en <b>Mis atajos</b> <i>(My Shortcuts)</i> toca el atajo que has creado → <b>OK</b> <i>(Done)</i>.
          </li>
        </ol>
      </section>
    </main>
  );
}
