import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAsync } from '../../hooks/useAsync.js';
import { MensajeError, Spinner } from '../../components/Estados.jsx';
import { ESTADOS } from '../../constants/tareas.js';
import PanelRotacion from './PanelRotacion.jsx';
import PanelDocumentos from './PanelDocumentos.jsx';

export default function DetalleModulo({ id }) {
  const { data, error, recargar } = useAsync(() => api.get(`/modulos/${id}`), [id]);

  if (error && !data) {
    return (
      <div className="space-y-4">
        <MensajeError error={error} onReintentar={recargar} />
        <p className="text-center"><Link to="/modulos" className="text-sm font-medium text-blue-700 hover:underline">Volver a Módulos</Link></p>
      </div>
    );
  }
  if (!data) return <Spinner />;

  const modulo = data.data;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/modulos" className="text-sm font-medium text-blue-700 hover:underline">← Módulos</Link>
        <h1 className="mt-2 text-2xl font-semibold text-blue-950">{modulo.nombre_modulo}</h1>
        <p className="mt-1 text-sm text-slate-500">{modulo.descripcion}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PanelRotacion modulo={modulo} onCambio={recargar} />
        </div>

        <section aria-labelledby="titulo-tareas-modulo" className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 id="titulo-tareas-modulo" className="text-lg font-semibold text-slate-800">Tareas</h2>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{modulo.tareas.total}</p>
          <ul className="mt-3 space-y-2">
            {ESTADOS.map((e) => (
              <li key={e.valor}>
                <Link
                  to={`/tareas?id_modulo=${modulo.id_modulo}&estado=${encodeURIComponent(e.valor)}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                >
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${e.chip}`}>{e.valor}</span>
                  <span className="font-semibold text-slate-800">{modulo.tareas.por_estado[e.valor]}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to={`/tareas?id_modulo=${modulo.id_modulo}`} className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">
            Ver todas las tareas del módulo
          </Link>
        </section>
      </div>

      <PanelDocumentos modulo={modulo} onCambio={recargar} />
    </div>
  );
}
