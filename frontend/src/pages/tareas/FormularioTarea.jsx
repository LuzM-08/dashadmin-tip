import { useState } from 'react';
import { api } from '../../api/client.js';
import { ESTADOS, PRIORIDADES, etiquetaPrioridad } from '../../constants/tareas.js';
import { aInputFecha, desdeInputFecha } from '../../utils/fechas.js';

const entrada =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-50';

const vacio = (moduloInicial) => ({
  titulo: '', descripcion: '', id_modulo: moduloInicial ? String(moduloInicial) : '',
  estado: 'Sin iniciar', prioridad: 'Media', fecha: '', id_asignado: '',
});

const desdeTarea = (t) => ({
  titulo: t.titulo, descripcion: t.descripcion ?? '', id_modulo: String(t.id_modulo), estado: t.estado,
  prioridad: t.prioridad, fecha: aInputFecha(t.fecha_limite), id_asignado: t.id_asignado ? String(t.id_asignado) : '',
});

function Campo({ id, etiqueta, error, children, ayuda }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">{etiqueta}</label>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-slate-400">{ayuda}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function FormularioTarea({ tarea, modulos, usuarios, moduloInicial, onCancelar, onGuardado }) {
  const editando = Boolean(tarea);
  const [original] = useState(() => (editando ? desdeTarea(tarea) : vacio(moduloInicial)));
  const [valores, setValores] = useState(original);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState({});

  const poner = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  // Al editar solo se envía lo que cambió (así no se altera, por ejemplo, la hora de una fecha límite que no se tocó).
  const cuerpoCambios = () => {
    const c = {};
    if (valores.titulo.trim() !== original.titulo) c.titulo = valores.titulo.trim();
    if (valores.descripcion.trim() !== original.descripcion) c.descripcion = valores.descripcion.trim() || null;
    if (valores.id_modulo !== original.id_modulo) c.id_modulo = Number(valores.id_modulo);
    if (valores.estado !== original.estado) c.estado = valores.estado;
    if (valores.prioridad !== original.prioridad) c.prioridad = valores.prioridad;
    if (valores.fecha !== original.fecha) c.fecha_limite = desdeInputFecha(valores.fecha);
    if (valores.id_asignado !== original.id_asignado) c.id_asignado = valores.id_asignado ? Number(valores.id_asignado) : null;
    return c;
  };

  const cuerpoNueva = () => ({
    id_modulo: Number(valores.id_modulo),
    titulo: valores.titulo.trim(),
    descripcion: valores.descripcion.trim() || null,
    estado: valores.estado,
    prioridad: valores.prioridad,
    fecha_limite: desdeInputFecha(valores.fecha),
    id_asignado: valores.id_asignado ? Number(valores.id_asignado) : null,
  });

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setErrores({});
    setGuardando(true);
    try {
      if (editando) {
        const cambios = cuerpoCambios();
        if (Object.keys(cambios).length === 0) {
          onCancelar();
          return;
        }
        await api.patch(`/tareas/${tarea.id_tarea}`, cambios);
      } else {
        await api.post('/tareas', cuerpoNueva());
      }
      onGuardado(editando ? 'Tarea actualizada.' : 'Tarea creada.');
    } catch (err) {
      if (Array.isArray(err.detalles)) {
        setErrores(Object.fromEntries(err.detalles.map((d) => [d.campo, d.mensaje])));
      }
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const asignables = usuarios.filter((u) => u.puede_gestionar_tareas || String(u.id_usuario) === original.id_asignado);

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
        <input id="titulo" required minLength={3} maxLength={200} value={valores.titulo} onChange={poner('titulo')} className={entrada} />
      </Campo>

      <Campo id="descripcion" etiqueta="Descripción (opcional)" error={errores.descripcion}>
        <textarea id="descripcion" rows={3} maxLength={2000} value={valores.descripcion} onChange={poner('descripcion')} className={entrada} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="modulo" etiqueta="Módulo" error={errores.id_modulo}>
          <select id="modulo" required value={valores.id_modulo} onChange={poner('id_modulo')} className={entrada}>
            <option value="" disabled>Selecciona un módulo</option>
            {modulos.map((m) => <option key={m.id_modulo} value={m.id_modulo}>{m.nombre_modulo}</option>)}
          </select>
        </Campo>

        <Campo id="asignado" etiqueta="Asignada a" error={errores.id_asignado}>
          <select id="asignado" value={valores.id_asignado} onChange={poner('id_asignado')} className={entrada}>
            <option value="">Sin asignar</option>
            {asignables.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
          </select>
        </Campo>

        <Campo id="estado" etiqueta="Estado" error={errores.estado}>
          <select id="estado" value={valores.estado} onChange={poner('estado')} className={entrada}>
            {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.valor}</option>)}
          </select>
        </Campo>

        <Campo id="prioridad" etiqueta="Prioridad" error={errores.prioridad}>
          <select id="prioridad" value={valores.prioridad} onChange={poner('prioridad')} className={entrada}>
            {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>{etiquetaPrioridad(p.valor)}</option>)}
          </select>
        </Campo>
      </div>

      <Campo
        id="fecha"
        etiqueta="Fecha límite (opcional)"
        error={errores.fecha_limite}
        ayuda="El aviso por correo se envía el mismo día de la fecha límite."
      >
        <input id="fecha" type="date" value={valores.fecha} onChange={poner('fecha')} className={entrada} />
      </Campo>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancelar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </div>
    </form>
  );
}
