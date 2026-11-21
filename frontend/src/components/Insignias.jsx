import { ESTADOS, PRIORIDADES, etiquetaPrioridad } from '../constants/tareas.js';

const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

export function InsigniaEstado({ valor }) {
  const e = ESTADOS.find((x) => x.valor === valor);
  return <span className={`${base} ${e?.chip ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>{valor}</span>;
}

export function InsigniaPrioridad({ valor }) {
  const p = PRIORIDADES.find((x) => x.valor === valor);
  return <span className={`${base} ${p?.chip ?? 'bg-slate-100 text-slate-700 ring-slate-200'}`}>{etiquetaPrioridad(valor)}</span>;
}
