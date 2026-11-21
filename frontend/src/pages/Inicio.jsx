import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import TarjetaModulo from '../components/TarjetaModulo.jsx';

// Las clases se escriben completas para que Tailwind las detecte.
const BARRAS = { 'Sin iniciar': 'bg-slate-400', 'En progreso': 'bg-blue-500', Terminadas: 'bg-emerald-500' };
const ESTADOS = ['Sin iniciar', 'En progreso', 'Terminadas'];

export default function Inicio() {
  const { usuario } = useAuth();
  const { data, error, cargando, recargar } = useAsync(
    () => Promise.all([api.get('/modulos'), api.get('/tareas/resumen')]),
    [],
  );

  const hoy = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(new Date());
  const primerNombre = usuario.nombre.split(' ')[0];

  if (cargando) return <Spinner />;
  if (error) return <MensajeError error={error} onReintentar={recargar} />;

  const [{ data: modulos }, { data: resumen }] = data;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold text-blue-950">Te damos la bienvenida, {primerNombre}</h1>
        <p className="mt-1 text-sm text-slate-500 first-letter:uppercase">{hoy}</p>
      </section>

      <section aria-labelledby="titulo-tareas">
        <h2 id="titulo-tareas" className="text-lg font-semibold text-slate-800">Tareas por estado</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {ESTADOS.map((estado) => {
            const n = resumen.por_estado[estado] ?? 0;
            const porcentaje = resumen.total ? Math.round((n * 100) / resumen.total) : 0;
            return (
              <Link
                key={estado}
                to={`/tareas?estado=${encodeURIComponent(estado)}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">{estado}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{n}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${BARRAS[estado]}`} style={{ width: `${porcentaje}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-400">{porcentaje}% del total ({resumen.total})</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="titulo-modulos">
        <h2 id="titulo-modulos" className="text-lg font-semibold text-slate-800">Módulos activos</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => <TarjetaModulo key={m.id_modulo} modulo={m} />)}
        </div>
      </section>
    </div>
  );
}
