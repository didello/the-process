// Genera el Excel de la semana con el mismo aspecto que la hoja del entrenador:
// tabla de objetivos (C7:J16), comentarios debajo y una pestaña con los pesos.

import type { Borders, Cell, Worksheet } from "exceljs";
import { CAMPOS } from "../config/campos";
import { DIAS, diasDeSemana, parseISO, sumarDias } from "./fechas";
import type { Semana } from "./store";

const NEGRO = "FF000000";
const BLANCO = "FFFFFFFF";
const AMARILLO = "FFFFFF00";
const VERDE = "FFD9EAD3";
const VERDE_TEXTO = "FF0B6B2B";
const ROJO = "FFB10202";

const borde: Partial<Borders> = {
  top: { style: "thin", color: { argb: NEGRO } },
  left: { style: "thin", color: { argb: NEGRO } },
  bottom: { style: "thin", color: { argb: NEGRO } },
  right: { style: "thin", color: { argb: NEGRO } },
};

function pintar(c: Cell, fondo: string, texto = NEGRO, negrita = false, size = 11) {
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fondo } };
  c.font = { name: "Arial", size, bold: negrita, color: { argb: texto } };
  c.border = borde;
  c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
}

const fechaTitulo = (iso: string) => parseISO(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

function hojaRevision(ws: Worksheet, lunes: string, semana: Semana) {
  const fechas = diasDeSemana(lunes);
  ws.columns = [{ width: 3 }, { width: 3 }, { width: 26 }, ...fechas.map(() => ({ width: 16 }))];

  const titulo = ws.getCell("C5");
  titulo.value = `Semana del ${fechaTitulo(lunes)} al ${fechaTitulo(sumarDias(lunes, 6))}`;
  titulo.font = { name: "Arial", size: 12, bold: true };

  // Cabecera
  const cab = ws.getRow(7);
  cab.height = 22;
  pintar(cab.getCell(3), NEGRO, BLANCO, false, 12);
  cab.getCell(3).value = "OBJETIVOS";
  DIAS.forEach((d, i) => {
    const c = cab.getCell(4 + i);
    c.value = d;
    pintar(c, NEGRO, BLANCO, false, 12);
  });

  // Filas de objetivos
  CAMPOS.forEach((campo, r) => {
    const fila = ws.getRow(8 + r);
    fila.height = 26;
    const et = fila.getCell(3);
    et.value = campo.etiqueta;
    pintar(et, NEGRO, BLANCO, true, 10);
    fechas.forEach((f, i) => {
      const valor = semana.dias[f]?.[campo.id] ?? null;
      const c = fila.getCell(4 + i);
      c.value = valor;
      if (campo.colorEnHoja && valor === "SI") pintar(c, VERDE, VERDE_TEXTO);
      else if (campo.colorEnHoja && valor === "NO") pintar(c, ROJO, BLANCO);
      else pintar(c, AMARILLO);
      c.alignment = { vertical: "bottom", horizontal: "left", wrapText: true };
    });
  });

  // Comentarios
  const filaCom = 8 + CAMPOS.length;
  ws.mergeCells(filaCom, 3, filaCom, 10);
  const cabCom = ws.getCell(filaCom, 3);
  cabCom.value = "COMENTARIOS ADICIONALES";
  pintar(cabCom, NEGRO, BLANCO, true, 12);
  ws.getRow(filaCom).height = 24;

  ws.mergeCells(filaCom + 1, 3, filaCom + 1, 10);
  const com = ws.getCell(filaCom + 1, 3);
  com.value = semana.comentarios || "";
  com.font = { name: "Arial", size: 11 };
  com.border = borde;
  com.alignment = { vertical: "top", horizontal: "left", wrapText: true };
  ws.getRow(filaCom + 1).height = Math.max(120, Math.ceil((semana.comentarios?.length ?? 0) / 110) * 15 + 20);
}

function hojaPesos(ws: Worksheet, lunes: string, semana: Semana) {
  ws.columns = [{ width: 3 }, { width: 3 }, { width: 22 }, { width: 14 }];
  const cab = ws.getRow(2);
  cab.getCell(3).value = "PESOS SEMANALES";
  cab.getCell(4).value = "KG";
  pintar(cab.getCell(3), NEGRO, BLANCO, true);
  pintar(cab.getCell(4), NEGRO, BLANCO, true);

  const pesos: number[] = [];
  diasDeSemana(lunes).forEach((f, i) => {
    const fila = ws.getRow(3 + i);
    fila.getCell(3).value = DIAS[i];
    pintar(fila.getCell(3), NEGRO, BLANCO, true, 10);
    const p = semana.dias[f]?.peso ?? null;
    if (p != null) pesos.push(p);
    const c = fila.getCell(4);
    c.value = p;
    c.numFmt = "0.0#";
    pintar(c, AMARILLO);
  });

  const media = ws.getRow(10);
  media.getCell(3).value = "PROMEDIO SEMANAL";
  pintar(media.getCell(3), NEGRO, BLANCO, true, 10);
  const c = media.getCell(4);
  c.value = pesos.length ? Math.round((pesos.reduce((a, b) => a + b, 0) / pesos.length) * 100) / 100 : null;
  c.numFmt = "0.0#";
  pintar(c, AMARILLO, NEGRO, true);
}

export function nombreArchivo(lunes: string) {
  const [y, m, d] = lunes.split("-");
  return `The Process - Semana ${d}-${m}-${y}.xlsx`;
}

export async function exportarSemana(lunes: string, semana: Semana) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "The Process";
  hojaRevision(wb.addWorksheet("REVISION", { views: [{ showGridLines: false }] }), lunes, semana);
  hojaPesos(wb.addWorksheet("PESOS", { views: [{ showGridLines: false }] }), lunes, semana);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const archivo = nombreArchivo(lunes);

  // En el móvil, si se puede, abrimos el menú de compartir (WhatsApp, correo…).
  const file = new File([blob], archivo, { type: blob.type });
  const movil = matchMedia("(pointer: coarse)").matches;
  if (movil && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: archivo });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = archivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
