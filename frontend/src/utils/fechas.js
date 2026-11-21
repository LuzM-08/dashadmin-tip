const formato = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

const dosDigitos = (n) => String(n).padStart(2, '0');

export const formatearFecha = (iso) => (iso ? formato.format(new Date(iso)) : '—');

// ISO del servidor -> valor para <input type="date"> (día local).
export function aInputFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

// Valor de <input type="date"> -> ISO a medianoche LOCAL de ese día (el backend lo trata como "vence ese día").
export function desdeInputFecha(valor) {
  if (!valor) return null;
  const [y, m, d] = valor.split('-').map(Number);
  return new Date(y, m - 1, d).toISOString();
}

// 'vencida' = día anterior a hoy o antes; 'hoy' = vence hoy; las terminadas nunca alertan.
export function estadoPlazo(iso, estado) {
  if (!iso || estado === 'Terminadas') return 'normal';
  const limite = new Date(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  if (limite < hoy) return 'vencida';
  if (limite < manana) return 'hoy';
  return 'normal';
}

// ---- Semanas y rotación (lunes a domingo, hora local) ----
export function lunesDe(fecha) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay()));
  d.setHours(0, 0, 0, 0);
  return d;
}

// Valor de <input type="date"> -> { lunes, domingo } de esa semana.
export function rangoSemana(valorInput) {
  if (!valorInput) return null;
  const [y, m, d] = valorInput.split('-').map(Number);
  const lunes = lunesDe(new Date(y, m - 1, d));
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { lunes, domingo };
}

// Valor "YYYY-MM-DD" del próximo lunes (si hoy es lunes, el de la semana siguiente).
export function proximoLunesInput(ahora = new Date()) {
  const lunes = lunesDe(ahora);
  lunes.setDate(lunes.getDate() + 7);
  return `${lunes.getFullYear()}-${dosDigitos(lunes.getMonth() + 1)}-${dosDigitos(lunes.getDate())}`;
}

export function hoyInput(ahora = new Date()) {
  return `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`;
}

// 'vigente' | 'programada' | 'finalizada'
export function estadoRotacion(rotacion, ahora = new Date()) {
  const inicio = new Date(rotacion.fecha_inicio);
  const fin = new Date(rotacion.fecha_fin);
  if (inicio <= ahora && ahora <= fin) return 'vigente';
  return inicio > ahora ? 'programada' : 'finalizada';
}
