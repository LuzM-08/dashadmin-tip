// Semana laboral = lunes 00:00:00.000 a domingo 23:59:59.999 (hora local del servidor, igual que el seed).
function lunesDeSemana(fecha) {
  const d = new Date(fecha);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function semanaDe(fecha) {
  const inicio = lunesDeSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

function sumarDias(fecha, dias) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

module.exports = { lunesDeSemana, semanaDe, sumarDias };
