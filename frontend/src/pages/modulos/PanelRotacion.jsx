import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useAviso } from '../../hooks/useAviso.js';
import Aviso from '../../components/Aviso.jsx';
import { MensajeError, Spinner } from '../../components/Estados.jsx';
import { estadoRotacion } from '../../utils/fechas.js';
import { formatearSemana, iniciales } from '../../utils/formato.js';
import { AsignarSemana, CambiarResponsable, EliminarRotacion } from './DialogosRotacion.jsx';

const CHIP = {
  vigente: ['Vigente', 'bg-emerald-100 text-emerald-800 ring-emerald-200'],
  programada: ['Programada', 'bg-blue-100 text-blue-800 ring-blue-200'],
  finalizada: ['Finalizada', 'bg-slate-100 text-slate-600 ring-slate-200'],
};

function Responsable({ etiqueta, rotacion }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
        {rotacion ? iniciales(rotacion.nombre ?? rotacion.responsable?.nombre) : '–'}
      </span>
      <div className="text-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
        {rotacion ? (
          <>
            <p className="font-medium text-slate-900">{rotacion.nombre ?? rotacion.responsable?.nombre}</p>
            <p className="text-xs text-slate-500">{formatearSemana(rotacion.fecha_inicio, rotacion.fecha_fin)}</p>
          </>
        ) : (
          <p className="text-slate-500">Sin asignar</p>
        )}
      </div>
    </div>
  );
}

export default function PanelRotacion({ modulo, onCambio }) {
  const { tienePermiso } = useAuth();
  const puedeRotar = tienePermiso('modulos:rotar');
  const [dialogo, setDialogo] = useState(null); // { tipo: 'asignar' } | { tipo: 'cambiar' | 'eliminar', rotacion }
  const [aviso, setAviso] = useAviso();

  const historial = useAsync(() => api.get(`/modulos/${modulo.id_modulo}/rotaciones`, { consulta: { limit: 12 } }), [modulo.id_modulo]);
  const usuarios = useAsync(() => (puedeRotar ? api.get('/usuarios') : Promise.resolve(null)), [puedeRotar]);

  const alHacer = (texto) => {
    setDialogo(null);
    setAviso({ tipo: 'ok', texto });
    historial.recargar();
    onCambio();
  };

  const actual = modulo.responsable_actual;
  const rotacionActual = actual && { id_rotacion: actual.id_rotacion, id_responsable: actual.id_usuario, fecha_inicio: actual.fecha_inicio, fecha_fin: actual.fecha_fin, responsable: { nombre: actual.nombre } };
  const listaUsuarios = usuarios.data?.data ?? [];

  return (
    <section aria-labelledby="titulo-rotacion" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-rotacion" className="text-lg font-semibold text-slate-800">Responsable y rotación</h2>
        {puedeRotar && (
          <div className="flex gap-2">
            {rotacionActual && (
              <button type="button" onClick={() => setDialogo({ tipo: 'cambiar', rotacion: rotacionActual })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cambiar responsable
              </button>
            )}
            <button type="button" disabled={!usuarios.data} onClick={() => setDialogo({ tipo: 'asignar' })} className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
              Asignar semana
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Responsable etiqueta="Esta semana" rotacion={actual} />
        <Responsable etiqueta="Próxima rotación" rotacion={modulo.proxima_rotacion} />
      </div>

      <div className="mt-4"><Aviso aviso={aviso} /></div>

      <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-700">Historial</h3>
      {historial.error ? (
        <MensajeError error={historial.error} onReintentar={historial.recargar} />
      ) : !historial.data ? (
        <Spinner />
      ) : historial.data.data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Todavía no hay rotaciones registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <caption className="sr-only">Historial de rotaciones</caption>
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2">Semana</th>
                <th scope="col" className="px-4 py-2">Responsable</th>
                <th scope="col" className="px-4 py-2">Estado</th>
                {puedeRotar && <th scope="col" className="px-4 py-2 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historial.data.data.map((r) => {
                const estado = estadoRotacion(r);
                const [texto, clases] = CHIP[estado];
                return (
                  <tr key={r.id_rotacion}>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-700">{formatearSemana(r.fecha_inicio, r.fecha_fin)}</td>
                    <td className="px-4 py-2 text-slate-800">{r.responsable.nombre}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${clases}`}>{texto}</span>
                    </td>
                    {puedeRotar && (
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {estado !== 'finalizada' && (
                          <>
                            <button type="button" onClick={() => setDialogo({ tipo: 'cambiar', rotacion: r })} className="font-medium text-blue-700 hover:underline">Cambiar</button>
                            <button type="button" onClick={() => setDialogo({ tipo: 'eliminar', rotacion: r })} className="ml-4 font-medium text-red-600 hover:underline">Eliminar</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogo?.tipo === 'asignar' && (
        <AsignarSemana modulo={modulo} usuarios={listaUsuarios} onCancelar={() => setDialogo(null)} onHecho={alHacer} />
      )}
      {dialogo?.tipo === 'cambiar' && (
        <CambiarResponsable modulo={modulo} rotacion={dialogo.rotacion} usuarios={listaUsuarios} onCancelar={() => setDialogo(null)} onHecho={alHacer} />
      )}
      {dialogo?.tipo === 'eliminar' && (
        <EliminarRotacion modulo={modulo} rotacion={dialogo.rotacion} onCancelar={() => setDialogo(null)} onHecho={alHacer} />
      )}
    </section>
  );
}
