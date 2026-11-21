const diaMes = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' });

export const formatearRango = (inicio, fin) => `${diaMes.format(new Date(inicio))} – ${diaMes.format(new Date(fin))}`;

export const plural = (n, singular, formaPlural = `${singular}s`) => `${n} ${n === 1 ? singular : formaPlural}`;

export const iniciales = (nombre = '') =>
  nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
