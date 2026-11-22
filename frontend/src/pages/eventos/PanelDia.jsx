import { Link } from 'react-router-dom';
import { estadoCorreo, estiloEvento, recordatorioDesdeEvento } from '../../constants/eventos.js';
import { etiquetaPrioridad } from '../../constants/tareas.js';
import { formatearDiaLargo, formatearHora } from '../../utils/calendario.js';
import { formatearSemana } from '../../utils/formato.js';

function Evento({ evento: e, puedeGestionar, onEditar, onEliminar }) {
  const estilo = estiloEvento(e);

  return (
    <li className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilo.chip}`}>{estilo.etiqueta}</span>
        {e.tipo === 'RECORDATORIO' && <span className="text-xs font-medium text-slate-500">{formatearHora(e.fecha)}</span>}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-900">{e.titulo}</p>

      {e.tipo === 'RECORDATORIO' && (
        <>
          {e.detalle && <p className="mt-0.5 text-xs text-slate-500">{e.detalle}</p>}
          {e.tarea && <p className="mt-0.5 text-xs text-slate-500">Tarea: {e.tarea.titulo}</p>}
          <p className={`mt-1 text-xs ${estadoCorreo(e).clase}`}>{estadoCorreo(e).texto}</p>
          {puedeGestionar && (
            <div className="mt-2 flex gap-4 text-sm">
              <button type="button" onClick={() => onEditar(recordatorioDesdeEvento(e))} className="font-medium text-blue-700 hover:underline">Editar</button>
              <button type="button" onClick={() => onEliminar(recordatorioDesdeEvento(e))} className="font-medium text-red-600 hover:underline">Eliminar</button>
            </div>
          )}
        </>
      )}

      {e.tipo === 'TAREA_LIMITE' && (
        <>
          <p className="mt-0.5 text-xs text-slate-500">{e.detalle} · {e.estado} · Prioridad {etiquetaPrioridad(e.prioridad)}</p>
          <Link to={`/tareas?q=${encodeURIComponent(e.titulo)}`} className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">Ver en Tareas</Link>
        </>
      )}

      {e.tipo === 'ROTACION' && (
        <>
          <p className="mt-0.5 text-xs text-slate-500">Semana {formatearSemana(e.fecha, e.fecha_fin)}</p>
          <Link to={`/modulos/${e.id_modulo}`} className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline">Ver módulo</Link>
        </>
      )}
    </li>
  );
}

export default function PanelDia({ clave, eventos, puedeGestionar, onNuevo, onEditar, onEliminar }) {
  const [y, m, d] = clave.split('-').map(Number);

  return (
    <section aria-label="Eventos del día" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">{formatearDiaLargo(new Date(y, m - 1, d))}</h2>
        {puedeGestionar && (
          <button type="button" onClick={onNuevo} className="shrink-0 text-sm font-medium text-blue-700 hover:underline">+ Recordatorio</button>
        )}
      </div>

      {eventos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No hay eventos este día.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {eventos.map((e) => <Evento key={`${e.tipo}-${e.id}`} evento={e} puedeGestionar={puedeGestionar} onEditar={onEditar} onEliminar={onEliminar} />)}
        </ul>
      )}
    </section>
  );
}
