import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import TarjetaModulo from '../components/TarjetaModulo.jsx';
import { estadoCorreo } from '../constants/eventos.js';
import { formatearFechaHora } from '../utils/calendario.js';

// Las clases se escriben completas para que Tailwind las detecte.
const BARRAS = { 'Sin iniciar': 'bg-slate-400', 'En progreso': 'bg-blue-500', Terminadas: 'bg-emerald-500' };
const ESTADOS = ['Sin iniciar', 'En progreso', 'Terminadas'];

export default function Inicio() {
  const { usuario, tienePermiso } = useAuth();
  const verRecordatorios = tienePermiso('eventos:ver');
  const { data, error, cargando, recargar } = useAsync(
    () => Promise.all([api.get('/modulos'), api.get('/tareas/resumen')]),
    [],
  );

  // Recordatorios desde el inicio de hoy (los de hoy ya pasados también se ven). Si falla, el resto de Inicio sigue funcionando.
  const recordatorios = useAsync(() => {
    if (!verRecordatorios) return Promise.resolve(null);
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    return api.get('/eventos', { consulta: { desde: desde.toISOString(), limit: 6 } });
  }, [verRecordatorios]);

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

      {verRecordatorios && (
        <section aria-labelledby="titulo-recordatorios">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="titulo-recordatorios" className="text-lg font-semibold text-slate-800">Próximos recordatorios</h2>
            <Link to="/eventos" className="text-sm font-medium text-blue-700 hover:underline">Ver todos en Eventos</Link>
          </div>

          <div className="mt-3">
            {recordatorios.cargando && !recordatorios.data ? (
              <Spinner texto="Cargando recordatorios…" />
            ) : recordatorios.error ? (
              <MensajeError error={recordatorios.error} onReintentar={recordatorios.recargar} />
            ) : (recordatorios.data?.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No tienes recordatorios programados.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
                {recordatorios.data.data.map((r) => {
                  const correo = estadoCorreo(r);
                  return (
                    <li key={r.id_recordatorio} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{r.titulo}</p>
                        {r.descripcion && <p className="line-clamp-1 text-xs text-slate-500">{r.descripcion}</p>}
                        {r.tarea && <p className="text-xs text-slate-500">Tarea: {r.tarea.titulo}</p>}
                      </div>
                      <div className="text-right text-sm">
                        <p className="whitespace-nowrap font-medium text-slate-700">{formatearFechaHora(r.fecha_evento)}</p>
                        <p className={`text-xs ${correo.clase}`}>{correo.texto}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-modulos">
        <h2 id="titulo-modulos" className="text-lg font-semibold text-slate-800">Módulos activos</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => <TarjetaModulo key={m.id_modulo} modulo={m} />)}
        </div>
      </section>
    </div>
  );
}
