// Dónde se guardan los datos: en Supabase si está configurado, o en este
// navegador (modo local) si no. El resto de la app no distingue entre los dos.

import type { SupabaseClient } from "@supabase/supabase-js";
import { CAMPOS, type CampoId } from "../config/campos";
import { diasDeSemana, sumarDias } from "./fechas";

export type Dia = Partial<Record<CampoId, string | null>> & { peso?: number | null };

export interface Semana {
  dias: Record<string, Dia>; // por fecha ISO
  comentarios: string;
}

export interface Store {
  cargarSemana(lunes: string): Promise<Semana>;
  cargarDia(fecha: string): Promise<Dia>;
  guardarDia(fecha: string, dia: Dia): Promise<void>;
  guardarComentarios(lunes: string, texto: string): Promise<void>;
}

const IDS = CAMPOS.map((c) => c.id);

function limpiar(fila: Record<string, unknown>): Dia {
  const dia: Dia = {};
  for (const id of IDS) dia[id] = (fila[id] as string | null) ?? null;
  dia.peso = fila.peso == null ? null : Number(fila.peso);
  return dia;
}

// ---------- Supabase ----------

export function storeSupabase(sb: SupabaseClient, userId: string): Store {
  return {
    async cargarSemana(lunes) {
      const domingo = sumarDias(lunes, 6);
      const [dias, semana] = await Promise.all([
        sb.from("dias").select("*").gte("fecha", lunes).lte("fecha", domingo),
        sb.from("semanas").select("comentarios").eq("inicio", lunes).maybeSingle(),
      ]);
      if (dias.error) throw dias.error;
      if (semana.error) throw semana.error;
      const res: Semana = { dias: {}, comentarios: semana.data?.comentarios ?? "" };
      for (const fila of dias.data) res.dias[fila.fecha] = limpiar(fila);
      return res;
    },
    async cargarDia(fecha) {
      const { data, error } = await sb.from("dias").select("*").eq("fecha", fecha).maybeSingle();
      if (error) throw error;
      return data ? limpiar(data) : {};
    },
    async guardarDia(fecha, dia) {
      const { error } = await sb
        .from("dias")
        .upsert({ user_id: userId, fecha, ...dia, updated_at: new Date().toISOString() }, { onConflict: "user_id,fecha" });
      if (error) throw error;
    },
    async guardarComentarios(lunes, texto) {
      const { error } = await sb
        .from("semanas")
        .upsert(
          { user_id: userId, inicio: lunes, comentarios: texto, updated_at: new Date().toISOString() },
          { onConflict: "user_id,inicio" },
        );
      if (error) throw error;
    },
  };
}

// ---------- Local (este navegador) ----------

const CLAVE = "the-process:v1";

interface Local {
  dias: Record<string, Dia>;
  semanas: Record<string, string>;
}

function leer(): Local {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sin almacenamiento: empezamos de cero */
  }
  return { dias: {}, semanas: {} };
}

function escribir(datos: Local) {
  localStorage.setItem(CLAVE, JSON.stringify(datos));
}

export const storeLocal: Store = {
  async cargarSemana(lunes) {
    const datos = leer();
    const dias: Record<string, Dia> = {};
    for (const f of diasDeSemana(lunes)) if (datos.dias[f]) dias[f] = datos.dias[f];
    return { dias, comentarios: datos.semanas[lunes] ?? "" };
  },
  async cargarDia(fecha) {
    return leer().dias[fecha] ?? {};
  },
  async guardarDia(fecha, dia) {
    const datos = leer();
    datos.dias[fecha] = dia;
    escribir(datos);
  },
  async guardarComentarios(lunes, texto) {
    const datos = leer();
    datos.semanas[lunes] = texto;
    escribir(datos);
  },
};
