import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import Modal from '../components/Modal.jsx';
import { ORDENES } from '../constants/tareas.js';
import FiltrosTareas from './tareas/FiltrosTareas.jsx';
import TablaTareas from './tareas/TablaTareas.jsx';
import FormularioTarea from './tareas/FormularioTarea.jsx';
import Paginacion from './tareas/Paginacion.jsx';

const POR_PAGINA = 20;

// Los filtros viven en la URL: se pueden compartir, recargar y usar desde otros enlaces (Inicio, buscador).
function leerFiltros(params) {
  const orden = params.get('orden');
  return {
    q: params.get('q') ?? '',
    id_modulo: params.get('id_modulo') ?? '',
    estado: params.get('estado') ?? '',
    prioridad: params.get('prioridad') ?? '',
    id_asignado: params.get('id_asignado') ?? '',
    vencidas: params.get('vencidas') === 'true',
    page: Math.max(1, Number(params.get('page')) || 1),
    orden: ORDENES.some((o) => o.clave === orden) ? orden : ORDENES[0].clave,
  };
}

function consultaApi(f) {
  const o = ORDENES.find((x) => x.clave === f.orden);
  return {
    q: f.q, id_modulo: f.id_modulo, estado: f.estado, prioridad: f.prioridad, id_asignado: f.id_asignado,
    vencidas: f.vencidas ? 'true' : '', page: f.page, limit: POR_PAGINA, orden: o.orden, direccion: o.direccion,
  };
}

const hayFiltros = (f) => Boolean(f.q || f.id_modulo || f.estado || f.prioridad || f.id_asignado || f.vencidas);

export default function Tareas() {
  const { tienePermiso } = useAuth();
  const [params, setParams] = useSearchParams();
  const filtros = leerFiltros(params);

  const [formulario, setFormulario] = useState(null); // { tarea } (tarea = null => nueva)
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [guardandoId, setGuardandoId] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }

  const catalogos = useAsync(() => Promise.all([api.get('/modulos'), api.get('/usuarios')]), []);
  const lista = useAsync(() => api.get('/tareas', { consulta: consultaApi(filtros) }), [params.toString()]);

  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  if (catalogos.cargando) return <Spinner />;
  if (catalogos.error) return <MensajeError error={catalogos.error} onReintentar={catalogos.recargar} />;

  const [{ data: modulos }, { data: usuarios }] = catalogos.data;
  const puedeCrear = tienePermiso('tareas:crear');
  const puedeEditar = tienePermiso('tareas:editar');
  const puedeEliminar = tienePermiso('tareas:eliminar');

  const cambiarFiltro = (clave, valor) =>
    setParams(
      (previos) => {
        const nuevos = new URLSearchParams(previos);
        if (valor === '' || valor === null || valor === undefined) nuevos.delete(clave);
        else nuevos.set(clave, valor);
        if (clave !== 'page') nuevos.delete('page'); // al cambiar un filtro se vuelve a la primera página
        return nuevos;
      },
      { replace: true },
    );

  const alGuardar = (texto) => {
    setFormulario(null);
    setAviso({ tipo: 'ok', texto });
    lista.recargar();
  };

  const cambiarEstado = async (tarea, estado) => {
    setGuardandoId(tarea.id_tarea);
    try {
      await api.patch(`/tareas/${tarea.id_tarea}`, { estado });
      lista.recargar();
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setGuardandoId(null);
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/tareas/${aEliminar.id_tarea}`);
      const eraLaUltima = lista.data?.data.length === 1 && filtros.page > 1;
      setAEliminar(null);
      setAviso({ tipo: 'ok', texto: 'Tarea eliminada.' });
      if (eraLaUltima) cambiarFiltro('page', String(filtros.page - 1));
      else lista.recargar();
    } catch (e) {
      setAEliminar(null);
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setEliminando(false);
    }
  };

  const tareas = lista.data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-blue-950">Tareas</h1>
        {puedeCrear && (
          <button
            type="button"
            onClick={() => setFormulario({ tarea: null })}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Nueva tarea
          </button>
        )}
      </div>

      {aviso && (
        <p
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-4 py-3 text-sm ${aviso.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}
        >
          {aviso.texto}
        </p>
      )}

      <FiltrosTareas
        filtros={filtros}
        modulos={modulos}
        usuarios={usuarios}
        hayFiltros={hayFiltros(filtros)}
        onCambio={cambiarFiltro}
        onLimpiar={() => setParams({}, { replace: true })}
      />

      {lista.error && !lista.data ? (
        <MensajeError error={lista.error} onReintentar={lista.recargar} />
      ) : lista.cargando && !lista.data ? (
        <Spinner />
      ) : tareas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">
            {hayFiltros(filtros) ? 'No hay tareas que coincidan con los filtros.' : 'Todavía no hay tareas.'}
          </p>
          {hayFiltros(filtros) ? (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="mt-2 text-sm font-medium text-blue-700 hover:underline">
              Limpiar filtros
            </button>
          ) : (
            puedeCrear && (
              <button type="button" onClick={() => setFormulario({ tarea: null })} className="mt-2 text-sm font-medium text-blue-700 hover:underline">
                Crear la primera tarea
              </button>
            )
          )}
        </div>
      ) : (
        <div className={lista.cargando ? 'opacity-60 transition-opacity' : ''}>
          <TablaTareas
            tareas={tareas}
            puedeEditar={puedeEditar}
            puedeEliminar={puedeEliminar}
            guardandoId={guardandoId}
            onEditar={(tarea) => setFormulario({ tarea })}
            onEliminar={setAEliminar}
            onCambiarEstado={cambiarEstado}
          />
          <div className="mt-4">
            <Paginacion meta={lista.data.meta} onCambiar={(p) => cambiarFiltro('page', String(p))} />
          </div>
        </div>
      )}

      {formulario && (
        <Modal titulo={formulario.tarea ? 'Editar tarea' : 'Nueva tarea'} onCerrar={() => setFormulario(null)}>
          <FormularioTarea
            tarea={formulario.tarea}
            modulos={modulos}
            usuarios={usuarios}
            moduloInicial={filtros.id_modulo}
            onCancelar={() => setFormulario(null)}
            onGuardado={alGuardar}
          />
        </Modal>
      )}

      {aEliminar && (
        <Modal titulo="Eliminar tarea" onCerrar={() => !eliminando && setAEliminar(null)} ancho="max-w-md">
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres eliminar <strong>{aEliminar.titulo}</strong>? Esta acción no se puede deshacer.
          </p>
          {aEliminar._count?.documentos > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Sus {aEliminar._count.documentos} documento(s) no se borran: quedan en el módulo, sin tarea asociada.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" disabled={eliminando} onClick={() => setAEliminar(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="button" disabled={eliminando} onClick={eliminar} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
