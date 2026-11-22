import { estadoCorreo } from '../../constants/eventos.js';
import { formatearFechaHora } from '../../utils/calendario.js';

export default function ListaRecordatorios({ recordatorios, puedeGestionar, onEditar, onEliminar }) {
  return (
    <section aria-labelledby="titulo-proximos" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="titulo-proximos" className="text-base font-semibold text-slate-800">Próximos recordatorios</h2>

      {recordatorios.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
          No tienes recordatorios programados.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Próximos recordatorios</caption>
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Cuándo</th>
                <th scope="col" className="px-4 py-2">Recordatorio</th>
                <th scope="col" className="px-4 py-2">Tarea</th>
                <th scope="col" className="px-4 py-2">Correo</th>
                {puedeGestionar && <th scope="col" className="px-4 py-2 text-right">Acciones</th>}              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recordatorios.map((r) => {
                const correo = estadoCorreo(r);
                return (
                  <tr key={r.id_recordatorio}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">{formatearFechaHora(r.fecha_evento)}</td>
                    <td className="px-4 py-2">
                      <p className="font-medium text-slate-900">{r.titulo}</p>
                      {r.descripcion && <p className="line-clamp-1 text-xs text-slate-500">{r.descripcion}</p>}
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-2 text-slate-600">{r.tarea?.titulo ?? <span className="text-slate-400">—</span>}</td>
                    <td className={`whitespace-nowrap px-4 py-2 ${correo.clase}`}>{correo.texto}</td>
                       {puedeGestionar && (
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        <button type="button" onClick={() => onEditar(r)} className="font-medium text-blue-700 hover:underline">Editar</button>
                        <button type="button" onClick={() => onEliminar(r)} className="ml-4 font-medium text-red-600 hover:underline">Eliminar</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
