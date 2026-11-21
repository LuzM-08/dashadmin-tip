import { Link } from 'react-router-dom';
import { ESTADOS } from '../constants/tareas.js';
import { formatearRango, iniciales, plural } from '../utils/formato.js';

// Tarjeta de un módulo (la usan el Inicio y la lista de Módulos).
export default function TarjetaModulo({ modulo: m }) {
  return (
    <Link
      to={`/modulos/${m.id_modulo}`}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <h3 className="font-semibold text-blue-950">{m.nombre_modulo}</h3>
      <p className="mt-1 text-sm text-slate-500">{m.descripcion}</p>

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
          {m.responsable_actual ? iniciales(m.responsable_actual.nombre) : '–'}
        </span>
        <div className="min-w-0 text-sm">
          {m.responsable_actual ? (
            <>
              <p className="truncate font-medium text-slate-800">{m.responsable_actual.nombre}</p>
              <p className="text-xs text-slate-500">
                Responsable · {formatearRango(m.responsable_actual.fecha_inicio, m.responsable_actual.fecha_fin)}
              </p>
            </>
          ) : (
            <p className="text-slate-500">Sin responsable esta semana</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ESTADOS.map((e) => (
          <span key={e.valor} className={`rounded-full px-2.5 py-1 text-xs font-medium ${e.chip}`}>
            {m.tareas.por_estado[e.valor]} {e.valor.toLowerCase()}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">{plural(m.documentos, 'documento')}</p>
    </Link>
  );
}
