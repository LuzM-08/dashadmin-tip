import { lunesDe } from './fechas.js';

const dos = (n) => String(n).padStart(2, '0');

// "YYYY-MM-DD" del día local de una fecha.
export function claveDia(fecha) {
  const d = new Date(fecha);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

// Semanas completas (lunes a domingo) que cubren el mes. mes: 0-11.
export function rangoMes(anio, mes) {
  const inicio = lunesDe(new Date(anio, mes, 1));
  const fin = lunesDe(new Date(anio, mes + 1, 0));
  fin.setDate(fin.getDate() + 6);
  return { inicio, fin };
}

export function diasDelRango(inicio, fin) {
  const dias = [];
  for (let d = new Date(inicio); d <= fin; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) dias.push(d);
  return dias;
}

// Map "YYYY-MM-DD" -> eventos de ese día, ordenados por hora.
export function agruparPorDia(eventos) {
  const mapa = new Map();
  for (const e of eventos) {
    const clave = claveDia(e.fecha);
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(e);
  }
  for (const lista of mapa.values()) lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return mapa;
}

// Valores de <input type="date"> y <input type="time"> -> Date local (o null si falta alguno).
export function combinarFechaHora(fecha, hora) {
  if (!fecha || !hora) return null;
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const resultado = new Date(y, m - 1, d, hh, mm);
  return Number.isNaN(resultado.getTime()) ? null : resultado;
}

export const aInputHora = (iso) => {
  const d = new Date(iso);
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
};

// Hora sugerida: 09:00; si el día es hoy y ya pasó, la próxima hora en punto.
export function horaPorDefecto(fecha, ahora = new Date()) {
  if (fecha !== claveDia(ahora) || combinarFechaHora(fecha, '09:00') > ahora) return '09:00';
  const siguiente = ahora.getHours() + 1;
  return siguiente > 23 ? '23:59' : `${dos(siguiente)}:00`;
}

export function nombreMes(anio, mes) {
  const texto = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(new Date(anio, mes, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const formatoHora = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const formatearHora = (iso) => formatoHora.format(new Date(iso));

const formatoDiaLargo = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
export const formatearDiaLargo = (fecha) => {
  const texto = formatoDiaLargo.format(new Date(fecha));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const formatoFechaHora = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export const formatearFechaHora = (iso) => formatoFechaHora.format(new Date(iso));

const formatoDiaCompleto = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' });
export const formatearDiaCompleto = (fecha) => formatoDiaCompleto.format(new Date(fecha));
