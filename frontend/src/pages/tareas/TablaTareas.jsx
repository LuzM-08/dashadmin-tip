import { InsigniaEstado, InsigniaPrioridad } from '../../components/Insignias.jsx';
import { ESTADOS } from '../../constants/tareas.js';
import { estadoPlazo, formatearFecha } from '../../utils/fechas.js';

const claseFecha = { vencida: 'font-medium text-red-600', hoy: 'font-medium text-amber-600', normal: 'text-slate-600' };

export default function TablaTareas({ tareas, puedeEditar, puedeEliminar, guardandoId, onEditar, onEliminar, onCambiarEstado }) {
  const hayAcciones = puedeEditar || puedeEliminar;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Listado de tareas</caption>
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">Tarea</th>
            <th scope="col" className="px-4 py-3">Módulo</th>
            <th scope="col" className="px-4 py-3">Prioridad</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3">Fecha límite</th>
            <th scope="col" className="px-4 py-3">Asignada a</th>
            {hayAcciones && <th scope="col" className="px-4 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tareas.map((t) => {
            const plazo = estadoPlazo(t.fecha_limite, t.estado);
            return (
              <tr key={t.id_tarea} className="align-top hover:bg-slate-50/60">
                <td className="max-w-xs px-4 py-3">
                  <p className="font-medium text-slate-900">{t.titulo}</p>
                  {t.descripcion && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{t.descripcion}</p>}
                  {t._count?.documentos > 0 && (
                    <p className="mt-1 text-xs text-slate-400">{t._count.documentos} documento(s) adjunto(s)</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{t.modulo.nombre_modulo}</td>
                <td className="px-4 py-3"><InsigniaPrioridad valor={t.prioridad} /></td>
                <td className="px-4 py-3">
                  {puedeEditar ? (
                    <select
                      aria-label={`Estado de ${t.titulo}`}
                      value={t.estado}
                      disabled={guardandoId === t.id_tarea}
                      onChange={(e) => onCambiarEstado(t, e.target.value)}
                      className="rounded-lg border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.valor}</option>)}
                    </select>
                  ) : (
                    <InsigniaEstado valor={t.estado} />
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className={claseFecha[plazo]}>{formatearFecha(t.fecha_limite)}</span>
                  {plazo === 'vencida' && <span className="ml-1.5 text-xs text-red-500">Vencida</span>}
                  {plazo === 'hoy' && <span className="ml-1.5 text-xs text-amber-600">Vence hoy</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {t.asignado?.nombre ?? <span className="text-slate-400">Sin asignar</span>}
                </td>
                {hayAcciones && (
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {puedeEditar && (
                      <button type="button" onClick={() => onEditar(t)} className="font-medium text-blue-700 hover:underline">
                        Editar
                      </button>
                    )}
                    {puedeEliminar && (
                      <button type="button" onClick={() => onEliminar(t)} className="ml-4 font-medium text-red-600 hover:underline">
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
