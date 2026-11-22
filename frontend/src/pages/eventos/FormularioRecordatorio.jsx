import { useState } from 'react';
import { api } from '../../api/client.js';
import { aInputFecha } from '../../utils/fechas.js';
import { aInputHora, combinarFechaHora, horaPorDefecto } from '../../utils/calendario.js';

const entrada =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

function Campo({ id, etiqueta, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{etiqueta}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function FormularioRecordatorio({ recordatorio, fechaInicial, tareas, onCancelar, onGuardado }) {
  const editando = Boolean(recordatorio);
  const [original] = useState(() =>
    editando
      ? {
          titulo: recordatorio.titulo,
          descripcion: recordatorio.descripcion ?? '',
          fecha: aInputFecha(recordatorio.fecha_evento),
          hora: aInputHora(recordatorio.fecha_evento),
          enviar_correo: recordatorio.enviar_correo,
          id_tarea: recordatorio.id_tarea ? String(recordatorio.id_tarea) : '',
        }
      : {
          titulo: '', descripcion: '', fecha: fechaInicial, hora: horaPorDefecto(fechaInicial),
          enviar_correo: true, id_tarea: '',
        },
  );
  const [v, setV] = useState(original);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState({});

  const poner = (campo) => (e) => setV((prev) => ({ ...prev, [campo]: e.target.value }));

  // Si la tarea vinculada no está entre "mis tareas", se agrega para no perder el vínculo al editar.
  const opcionesTarea = [...tareas];
  if (recordatorio?.tarea && !opcionesTarea.some((t) => t.id_tarea === recordatorio.tarea.id_tarea)) {
    opcionesTarea.unshift(recordatorio.tarea);
  }

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setErrores({});

    const cuando = combinarFechaHora(v.fecha, v.hora);
    const cambioFecha = v.fecha !== original.fecha || v.hora !== original.hora;
    if (!cuando) {
      setError('Indica la fecha y la hora.');
      return;
    }
    if ((!editando || cambioFecha) && cuando.getTime() <= Date.now()) {
      setError('La fecha y la hora deben ser futuras.');
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        const cambios = {};
        if (v.titulo.trim() !== original.titulo) cambios.titulo = v.titulo.trim();
        if (v.descripcion.trim() !== original.descripcion) cambios.descripcion = v.descripcion.trim() || null;
        if (cambioFecha) cambios.fecha_evento = cuando.toISOString();
        if (v.enviar_correo !== original.enviar_correo) cambios.enviar_correo = v.enviar_correo;
        if (v.id_tarea !== original.id_tarea) cambios.id_tarea = v.id_tarea ? Number(v.id_tarea) : null;
        if (Object.keys(cambios).length === 0) {
          onCancelar();
          return;
        }
        await api.patch(`/eventos/${recordatorio.id_recordatorio}`, cambios);
      } else {
        await api.post('/eventos', {
          titulo: v.titulo.trim(),
          descripcion: v.descripcion.trim() || null,
          fecha_evento: cuando.toISOString(),
          enviar_correo: v.enviar_correo,
          id_tarea: v.id_tarea ? Number(v.id_tarea) : null,
        });
      }
      onGuardado(editando ? 'Recordatorio actualizado.' : 'Recordatorio programado.');
    } catch (err) {
      if (Array.isArray(err.detalles)) setErrores(Object.fromEntries(err.detalles.map((d) => [d.campo, d.mensaje])));
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo id="r-titulo" etiqueta="Título" error={errores.titulo}>
        <input id="r-titulo" required minLength={3} maxLength={200} value={v.titulo} onChange={poner('titulo')} className={entrada} />
      </Campo>

      <Campo id="r-descripcion" etiqueta="Detalle (opcional)" error={errores.descripcion}>
        <textarea id="r-descripcion" rows={3} maxLength={1000} value={v.descripcion} onChange={poner('descripcion')} className={entrada} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="r-fecha" etiqueta="Fecha" error={errores.fecha_evento}>
          <input id="r-fecha" type="date" required value={v.fecha} onChange={poner('fecha')} className={entrada} />
        </Campo>
        <Campo id="r-hora" etiqueta="Hora">
          <input id="r-hora" type="time" required value={v.hora} onChange={poner('hora')} className={entrada} />
        </Campo>
      </div>

      <Campo id="r-tarea" etiqueta="Asociar a una de mis tareas (opcional)" error={errores.id_tarea}>
        <select id="r-tarea" value={v.id_tarea} onChange={poner('id_tarea')} className={entrada}>
          <option value="">Sin tarea</option>
          {opcionesTarea.map((t) => <option key={t.id_tarea} value={t.id_tarea}>{t.titulo}</option>)}
        </select>
      </Campo>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={v.enviar_correo}
          onChange={(e) => setV((prev) => ({ ...prev, enviar_correo: e.target.checked }))}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          Enviarme un correo a esa hora
          <span className="block text-xs text-slate-400">Los avisos se revisan cada pocos minutos, por lo que el correo puede llegar con un breve retraso.</span>
        </span>
      </label>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={guardando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Programar'}
        </button>
      </div>
    </form>
  );
}
