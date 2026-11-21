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
