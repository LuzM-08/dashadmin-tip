// Límites de un día calendario en una zona horaria IANA (ej. America/Santiago),
// independientemente de la zona del servidor y respetando cambios de horario de verano.
function partes(instante, tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instante).map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

// Milisegundos que la hora "de pared" de la zona se adelanta respecto a UTC en ese instante.
function desfase(instante, tz) {
  const p = partes(instante, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(instante.getTime() / 1000) * 1000;
}

function inicioDelDia(fecha, tz) {
  const { y, m, d } = partes(fecha, tz);
  const pared = Date.UTC(y, m - 1, d);
  let t = pared - desfase(new Date(pared), tz);
  t = pared - desfase(new Date(t), tz); // segunda pasada: corrige si el día cruza un cambio de horario
  // Si la medianoche no existe (salto de horario de verano), el día comienza en el primer instante válido.
  for (let i = 0; i < 16 && esDiaAnterior(new Date(t), y, m, d, tz); i++) t += 15 * 60 * 1000;
  return new Date(t);
}

function esDiaAnterior(instante, y, m, d, tz) {
  const p = partes(instante, tz);
  return Date.UTC(p.y, p.m - 1, p.d) < Date.UTC(y, m - 1, d);
}

function finDelDia(fecha, tz) {
  const inicio = inicioDelDia(fecha, tz);
  const siguiente = inicioDelDia(new Date(inicio.getTime() + 36 * 3600 * 1000), tz); // +36h cae siempre en el día siguiente
  return new Date(siguiente.getTime() - 1);
}

module.exports = { inicioDelDia, finDelDia };
