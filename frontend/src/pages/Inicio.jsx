import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import { formatearRango, iniciales, plural } from '../utils/formato.js';

// Las clases se escriben completas para que Tailwind las detecte.
const ESTADOS = [
  { clave: 'Sin iniciar', chip: 'bg-slate-100 text-slate-700', barra: 'bg-slate-400' },
  { clave: 'En progreso', chip: 'bg-blue-100 text-blue-800', barra: 'bg-blue-500' },
  { clave: 'Terminadas', chip: 'bg-emerald-100 text-emerald-800', barra: 'bg-emerald-500' },
];

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
          {ESTADOS.map((e) => {
            const n = resumen.por_estado[e.clave] ?? 0;
            const porcentaje = resumen.total ? Math.round((n * 100) / resumen.total) : 0;
            return (
              <Link
                key={e.clave}
                to={`/tareas?estado=${encodeURIComponent(e.clave)}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">{e.clave}</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{n}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${e.barra}`} style={{ width: `${porcentaje}%` }} />
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
          {modulos.map((m) => (
            <Link
              key={m.id_modulo}
              to={`/modulos/${m.id_modulo}`}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-blue-950">{m.nombre_modulo}</h3>
              <p className="mt-1 text-sm text-slate-500">{m.descripcion}</p>

              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                  {m.responsable_actual ? iniciales(m.responsable_actual.nombre) : '–'}
                </span>
                <div className="min-w-0 text-sm">
                  {m.responsable_actual ? (
                    <>
                      <p className="truncate font-medium text-slate-800">{m.responsable_actual.nombre}</p>
                      <p className="text-xs text-slate-500">
                        Responsable · {formatearRango(m.responsable_actual.fecha_inicio, m.responsable_actual.fecha_fin)}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500">Sin responsable esta semana</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {ESTADOS.map((e) => (
                  <span key={e.clave} className={`rounded-full px-2.5 py-1 text-xs font-medium ${e.chip}`}>
                    {m.tareas.por_estado[e.clave]} {e.clave.toLowerCase()}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">{plural(m.documentos, 'documento')}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
