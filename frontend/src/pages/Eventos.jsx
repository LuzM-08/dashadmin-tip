import { useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAviso } from '../hooks/useAviso.js';
import Aviso from '../components/Aviso.jsx';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import Modal from '../components/Modal.jsx';
import { agruparPorDia, claveDia, rangoMes } from '../utils/calendario.js';
import CalendarioMes from './eventos/CalendarioMes.jsx';
import PanelDia from './eventos/PanelDia.jsx';
import ListaRecordatorios from './eventos/ListaRecordatorios.jsx';
import FormularioRecordatorio from './eventos/FormularioRecordatorio.jsx';

export default function Eventos() {
  const { usuario, tienePermiso } = useAuth();
  const puedeGestionar = tienePermiso('eventos:gestionar');
  const hoy = new Date();
  const [{ anio, mes }, setMesActual] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  const [seleccionado, setSeleccionado] = useState(claveDia(hoy));
  const [formulario, setFormulario] = useState(null); // { recordatorio: obj | null, fecha: 'YYYY-MM-DD' }
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useAviso();

  const calendario = useAsync(() => {
    const { inicio, fin } = rangoMes(anio, mes);
    return api.get('/eventos/calendario', { consulta: { desde: claveDia(inicio), hasta: claveDia(fin) } });
  }, [anio, mes]);

  const proximos = useAsync(
    () => api.get('/eventos', { consulta: { desde: new Date().toISOString(), limit: 10 } }),
    [],
  );

  // Las tareas solo sirven para el formulario de recordatorios: quien no gestiona no las necesita.
  const misTareas = useAsync(
    () => (puedeGestionar
      ? api.get('/tareas', { consulta: { id_asignado: usuario.id_usuario, limit: 100, orden: 'fecha_limite', direccion: 'asc' } })
      : Promise.resolve(null)),
    [usuario.id_usuario, puedeGestionar],
  );

  const eventosPorDia = useMemo(() => agruparPorDia(calendario.data?.data.eventos ?? []), [calendario.data]);

  const irAMes = (nuevoAnio, nuevoMes) => {
    const fecha = new Date(nuevoAnio, nuevoMes, 1);
    setMesActual({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
    const hoyClave = claveDia(new Date());
    const esMesActual = fecha.getFullYear() === new Date().getFullYear() && fecha.getMonth() === new Date().getMonth();
    setSeleccionado(esMesActual ? hoyClave : claveDia(fecha));
  };

  const recargarTodo = () => {
    calendario.recargar();
    proximos.recargar();
  };

  const alGuardar = (texto) => {
    setFormulario(null);
    setAviso({ tipo: 'ok', texto });
    recargarTodo();
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/eventos/${aEliminar.id_recordatorio}`);
      setAEliminar(null);
      setAviso({ tipo: 'ok', texto: 'Recordatorio eliminado.' });
      recargarTodo();
    } catch (err) {
      setAEliminar(null);
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEliminando(false);
    }
  };

  if (calendario.error && !calendario.data) return <MensajeError error={calendario.error} onReintentar={calendario.recargar} />;
  if (!calendario.data) return <Spinner />;

  const tareas = misTareas.data?.data ?? [];
  const nuevo = (fecha) => setFormulario({ recordatorio: null, fecha });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-950">Eventos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tus recordatorios, fechas límite de tareas y rotaciones{puedeGestionar ? '.' : ' (solo lectura).'}
          </p>
        </div>
        {puedeGestionar && (
          <button type="button" onClick={() => nuevo(seleccionado)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Nuevo recordatorio
          </button>
        )}
      </div>

      <Aviso aviso={aviso} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`lg:col-span-2 ${calendario.cargando ? 'opacity-60 transition-opacity' : ''}`}>
          <CalendarioMes
            anio={anio}
            mes={mes}
            eventosPorDia={eventosPorDia}
            seleccionado={seleccionado}
            onSeleccionar={setSeleccionado}
            onMesAnterior={() => irAMes(anio, mes - 1)}
            onMesSiguiente={() => irAMes(anio, mes + 1)}
            onHoy={() => irAMes(new Date().getFullYear(), new Date().getMonth())}
          />
        </div>

        <PanelDia
          clave={seleccionado}
          eventos={eventosPorDia.get(seleccionado) ?? []}
          puedeGestionar={puedeGestionar}
          onNuevo={() => nuevo(seleccionado)}
          onEditar={(r) => setFormulario({ recordatorio: r, fecha: seleccionado })}
          onEliminar={setAEliminar}
        />
      </div>

      {proximos.error && !proximos.data ? (
        <MensajeError error={proximos.error} onReintentar={proximos.recargar} />
      ) : (
        <ListaRecordatorios
          recordatorios={proximos.data?.data ?? []}
          puedeGestionar={puedeGestionar}
          onEditar={(r) => setFormulario({ recordatorio: r, fecha: seleccionado })}
          onEliminar={setAEliminar}
        />
      )}

      {puedeGestionar && formulario && (
        <Modal titulo={formulario.recordatorio ? 'Editar recordatorio' : 'Nuevo recordatorio'} onCerrar={() => setFormulario(null)}>
          <FormularioRecordatorio
            recordatorio={formulario.recordatorio}
            fechaInicial={formulario.fecha}
            tareas={tareas}
            onCancelar={() => setFormulario(null)}
            onGuardado={alGuardar}
          />
        </Modal>
      )}

      {puedeGestionar && aEliminar && (
        <Modal titulo="Eliminar recordatorio" onCerrar={() => !eliminando && setAEliminar(null)} ancho="max-w-md">
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres eliminar <strong>{aEliminar.titulo}</strong>? Si el correo aún no salió, ya no se enviará.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" disabled={eliminando} onClick={() => setAEliminar(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" disabled={eliminando} onClick={eliminar} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
