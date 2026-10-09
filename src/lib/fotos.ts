// Fotos de progreso: se guardan en el almacén privado "fotos" de Supabase,
// reducidas en el móvil antes de subir, con su fecha y su pose.

import type { SupabaseClient } from "@supabase/supabase-js";
import { hoy, parseISO, sumarDias } from "./fechas";

export type Pose = "frente" | "perfil_izq" | "perfil_der" | "espalda";

export const POSES: { id: Pose; titulo: string }[] = [
  { id: "frente", titulo: "Frente" },
  { id: "perfil_izq", titulo: "Perfil izquierdo" },
  { id: "perfil_der", titulo: "Perfil derecho" },
  { id: "espalda", titulo: "Espalda" },
];

/** Cada cuántos días toca sacar fotos. */
export const DIAS_ENTRE_FOTOS = 14;

export interface Foto {
  id: string;
  fecha: string;
  pose: Pose;
  ruta: string;
  url: string; // enlace temporal firmado (caduca)
}

export interface FotosApi {
  listar(): Promise<Foto[]>;
  subir(fecha: string, pose: Pose, archivo: File): Promise<Foto>;
  borrar(foto: Foto): Promise<void>;
}

const ALMACEN = "fotos";
const VALIDEZ_ENLACE = 60 * 60 * 6; // 6 h
const LADO_MAX = 1600;

/** Reduce la foto (unos 4-5 MB del móvil → unos 300 KB) respetando la orientación. */
async function comprimir(archivo: File): Promise<Blob> {
  const img = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * escala);
  canvas.height = Math.round(img.height * escala);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.82));
  if (!blob) throw new Error("No se ha podido procesar la foto.");
  return blob;
}

export function fotosSupabase(sb: SupabaseClient, userId: string): FotosApi {
  const almacen = sb.storage.from(ALMACEN);

  async function firmar(rutas: string[]) {
    if (!rutas.length) return new Map<string, string>();
    const { data, error } = await almacen.createSignedUrls(rutas, VALIDEZ_ENLACE);
    if (error) throw error;
    return new Map(data.map((d) => [d.path ?? "", d.signedUrl]));
  }

  return {
    async listar() {
      const { data, error } = await sb.from("fotos").select("id, fecha, pose, ruta").order("fecha", { ascending: false });
      if (error) throw error;
      const urls = await firmar(data.map((f) => f.ruta));
      return data.map((f) => ({ ...f, url: urls.get(f.ruta) ?? "" }) as Foto);
    },

    async subir(fecha, pose, archivo) {
      const blob = await comprimir(archivo);
      const ruta = `${userId}/${fecha}_${pose}_${crypto.randomUUID()}.jpg`;
      const subida = await almacen.upload(ruta, blob, { contentType: "image/jpeg" });
      if (subida.error) throw subida.error;

      // Si ya había foto de esa pose ese día, se sustituye.
      const previa = await sb.from("fotos").select("id, ruta").eq("fecha", fecha).eq("pose", pose).maybeSingle();
      if (previa.data) {
        await sb.from("fotos").delete().eq("id", previa.data.id);
        await almacen.remove([previa.data.ruta]);
      }

      const { data, error } = await sb.from("fotos").insert({ user_id: userId, fecha, pose, ruta }).select("id, fecha, pose, ruta").single();
      if (error) {
        await almacen.remove([ruta]);
        throw error;
      }
      const urls = await firmar([ruta]);
      return { ...data, url: urls.get(ruta) ?? "" } as Foto;
    },

    async borrar(foto) {
      const { error } = await sb.from("fotos").delete().eq("id", foto.id);
      if (error) throw error;
      await almacen.remove([foto.ruta]);
    },
  };
}

/** Recordatorio: cuándo fueron las últimas fotos y cuándo tocan las siguientes. */
export function recordatorioFotos(fotos: Foto[]) {
  if (!fotos.length) return null;
  const ultima = fotos.reduce((max, f) => (f.fecha > max ? f.fecha : max), fotos[0].fecha);
  const proxima = sumarDias(ultima, DIAS_ENTRE_FOTOS);
  const dias = Math.round((parseISO(hoy()).getTime() - parseISO(ultima).getTime()) / 86_400_000);
  return { ultima, proxima, dias, toca: hoy() >= proxima };
}
