// Filas de la hoja "REVISION SEMANAL" del entrenador, en el mismo orden y con
// los mismos valores que sus desplegables, para que la exportación encaje.

export type CampoId = "entrenamiento" | "dieta" | "picoteo" | "descanso" | "comidas_libres" | "agua" | "bano" | "menstruacion" | "pasos";

/** Cómo pinta la app una opción: bien (verde), mal (rojo) o neutra. */
export type Tono = "bien" | "mal" | "neutro";

export interface Opcion {
  valor: string; // texto exacto del desplegable de la hoja
  texto?: string; // texto corto para el botón, si el original es largo
  tono?: Tono;
}

export interface Campo {
  id: CampoId;
  etiqueta: string; // nombre de la fila en la hoja
  titulo: string; // nombre amable en la app
  icono: string;
  opcional?: boolean;
  /** En la hoja, SI/NO de esta fila llevan color verde/rojo. */
  colorEnHoja?: boolean;
  opciones: Opcion[];
}

const siNo = (si: Tono, no: Tono, mayus = true): Opcion[] => [
  { valor: mayus ? "SI" : "Si", texto: "Sí", tono: si },
  { valor: mayus ? "NO" : "No", texto: "No", tono: no },
];

export const CAMPOS: Campo[] = [
  {
    id: "entrenamiento",
    etiqueta: "ENTRENAMIENTO",
    titulo: "Entrenamiento",
    icono: "🏋️",
    colorEnHoja: true,
    opciones: siNo("bien", "mal"),
  },
  { id: "dieta", etiqueta: "DIETA", titulo: "Dieta", icono: "🥗", colorEnHoja: true, opciones: siNo("bien", "mal") },
  { id: "picoteo", etiqueta: "PICOTEO", titulo: "Picoteo", icono: "🍪", opciones: siNo("mal", "bien") },
  {
    id: "descanso",
    etiqueta: "DESCANSO",
    titulo: "Descanso",
    icono: "😴",
    opciones: [
      { valor: "menos de 6h", texto: "< 6h", tono: "mal" },
      { valor: "6:00-6:30h", texto: "6-6:30h", tono: "neutro" },
      { valor: "7:00-7:30h", texto: "7-7:30h", tono: "bien" },
      { valor: "8h o mas", texto: "8h o más", tono: "bien" },
    ],
  },
  { id: "comidas_libres", etiqueta: "COMIDAS LIBRES", titulo: "Comida libre", icono: "🍕", opciones: siNo("neutro", "neutro") },
  {
    id: "agua",
    etiqueta: "LITROS DE AGUA 2-3L",
    titulo: "Agua",
    icono: "💧",
    opciones: [
      { valor: "1-1,5L", tono: "mal" },
      { valor: "2-2.5L", tono: "bien" },
      { valor: "3-3.5L", tono: "bien" },
      { valor: "4-4.5L" },
      { valor: "5-5.5L" },
      { valor: "6-6.5L" },
      { valor: "7-7.5L" },
      { valor: "8-8.5L" },
      { valor: "9-10L" },
    ],
  },
  {
    id: "bano",
    etiqueta: "¿FUISTE AL BAÑO?",
    titulo: "¿Fuiste al baño?",
    icono: "🚽",
    opciones: [
      { valor: "Si, 1 vez", texto: "Sí, 1 vez", tono: "bien" },
      { valor: "Si, más de 1 vez", texto: "Sí, +1 vez", tono: "bien" },
      { valor: "No", tono: "neutro" },
      { valor: "Más de 2 días sin ir al baño", texto: "+2 días sin ir", tono: "mal" },
    ],
  },
  {
    id: "menstruacion",
    etiqueta: "MENSTRUACION",
    titulo: "Menstruación",
    icono: "🩸",
    opcional: true,
    opciones: siNo("neutro", "neutro", false),
  },
  {
    id: "pasos",
    etiqueta: "NEAT/PASOS 10-12K",
    titulo: "Pasos",
    icono: "👟",
    opciones: [
      { valor: "0-3k", tono: "mal" },
      { valor: "3-5k", tono: "mal" },
      { valor: "5-8k", tono: "neutro" },
      { valor: "8-10k", tono: "neutro" },
      { valor: "10-12k", tono: "bien" },
      { valor: "12-15k", tono: "bien" },
      { valor: "> de 15k", texto: "+15k", tono: "bien" },
    ],
  },
];

/** Orden en pantalla (el peso va antes que todos). La exportación mantiene el de la hoja. */
const ORDEN_APP: CampoId[] = ["descanso", "entrenamiento", "dieta", "picoteo", "comidas_libres", "agua", "bano", "menstruacion", "pasos"];
export const CAMPOS_APP = ORDEN_APP.map((id) => CAMPOS.find((c) => c.id === id)!);

/** Campos que cuentan para "día completo" (los opcionales no). */
export const CAMPOS_OBLIGATORIOS = CAMPOS.filter((c) => !c.opcional);

export function tonoDe(campo: Campo, valor: string | null | undefined): Tono | undefined {
  return campo.opciones.find((o) => o.valor === valor)?.tono;
}
