import { useEffect, useRef, useState } from 'react';
import { ESTADOS, ORDENES, PRIORIDADES, etiquetaPrioridad } from '../../constants/tareas.js';
import { IconoBuscar } from '../../components/Iconos.jsx';

const selector =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

function Etiqueta({ id, texto, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-500">{texto}</label>
      {children}
    </div>
  );
}

export default function FiltrosTareas({ filtros, modulos, usuarios, onCambio, onLimpiar, hayFiltros }) {
  const [texto, setTexto] = useState(filtros.q);
  const cambio = useRef(onCambio);
  cambio.current = onCambio; // el temporizador siempre usa la versión más reciente (evita pisar otros filtros)

  // Si el texto cambia desde afuera (buscador de la barra superior, enlaces), se refleja aquí.
  useEffect(() => {
    setTexto(filtros.q);
  }, [filtros.q]);

  // Búsqueda con retraso: no consulta en cada tecla.
  useEffect(() => {
    if (texto.trim() === filtros.q) return undefined;
    const t = setTimeout(() => cambio.current('q', texto.trim()), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const alCambiar = (clave) => (e) => onCambio(clave, e.target.value);

  return (
    <section aria-label="Filtros" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2">
          <Etiqueta id="f-buscar" texto="Buscar">
            <div className="relative">
              <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="f-buscar"
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Título o descripción"
                className={`${selector} pl-9`}
              />
            </div>
          </Etiqueta>
        </div>

        <Etiqueta id="f-modulo" texto="Módulo">
          <select id="f-modulo" value={filtros.id_modulo} onChange={alCambiar('id_modulo')} className={selector}>
            <option value="">Todos</option>
            {modulos.map((m) => <option key={m.id_modulo} value={m.id_modulo}>{m.nombre_modulo}</option>)}
          </select>
        </Etiqueta>

        <Etiqueta id="f-estado" texto="Estado">
          <select id="f-estado" value={filtros.estado} onChange={alCambiar('estado')} className={selector}>
            <option value="">Todos</option>
            {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.valor}</option>)}
          </select>
        </Etiqueta>

        <Etiqueta id="f-prioridad" texto="Prioridad">
          <select id="f-prioridad" value={filtros.prioridad} onChange={alCambiar('prioridad')} className={selector}>
            <option value="">Todas</option>
            {PRIORIDADES.map((p) => <option key={p.valor} value={p.valor}>{etiquetaPrioridad(p.valor)}</option>)}
          </select>
        </Etiqueta>

        <Etiqueta id="f-asignado" texto="Asignada a">
          <select id="f-asignado" value={filtros.id_asignado} onChange={alCambiar('id_asignado')} className={selector}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
          </select>
        </Etiqueta>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filtros.vencidas}
            onChange={(e) => onCambio('vencidas', e.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Solo vencidas (sin terminar)
        </label>

        <div className="flex items-end gap-3">
          <Etiqueta id="f-orden" texto="Ordenar por">
            <select id="f-orden" value={filtros.orden} onChange={alCambiar('orden')} className={selector}>
              {ORDENES.map((o) => <option key={o.clave} value={o.clave}>{o.texto}</option>)}
            </select>
          </Etiqueta>
          {hayFiltros && (
            <button type="button" onClick={onLimpiar} className="pb-2 text-sm font-medium text-blue-700 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
