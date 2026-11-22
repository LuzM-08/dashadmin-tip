import { claveDia, diasDelRango, formatearDiaCompleto, formatearHora, nombreMes, rangoMes } from '../../utils/calendario.js';
import { estiloEvento } from '../../constants/eventos.js';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_CHIPS = 2;

function textoChip(e) {
  if (e.tipo === 'RECORDATORIO') return `${formatearHora(e.fecha)} ${e.titulo}`;
  if (e.tipo === 'TAREA_LIMITE') return `Vence: ${e.titulo}`;
  return e.titulo;
}

export default function CalendarioMes({ anio, mes, eventosPorDia, seleccionado, onSeleccionar, onMesAnterior, onMesSiguiente, onHoy }) {
  const { inicio, fin } = rangoMes(anio, mes);
  const dias = diasDelRango(inicio, fin);
  const hoy = claveDia(new Date());

  return (
    <section aria-label="Calendario" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{nombreMes(anio, mes)}</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onHoy} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Hoy</button>
          <button type="button" onClick={onMesAnterior} aria-label="Mes anterior" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">‹</button>
          <button type="button" onClick={onMesSiguiente} aria-label="Mes siguiente" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="bg-slate-50 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">{d}</div>
        ))}

        {dias.map((dia) => {
          const clave = claveDia(dia);
          const eventos = eventosPorDia.get(clave) ?? [];
          const delMes = dia.getMonth() === mes;
          const esHoy = clave === hoy;
          const elegido = clave === seleccionado;

          return (
            <button
              key={clave}
              type="button"
              onClick={() => onSeleccionar(clave)}
              aria-pressed={elegido}
              aria-label={`${formatearDiaCompleto(dia)}: ${eventos.length} evento(s)`}
              className={`flex min-h-16 flex-col items-stretch p-1.5 text-left align-top transition sm:min-h-24 ${
                elegido ? 'bg-blue-50 ring-2 ring-inset ring-blue-500' : delMes ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/70 hover:bg-slate-100'
              }`}
            >
              <span
                className={`mb-1 flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-medium ${
                  esHoy ? 'bg-blue-700 text-white' : delMes ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                {dia.getDate()}
              </span>

              {/* Pantallas pequeñas: puntos de color. Pantallas grandes: etiquetas. */}
              <span className="flex flex-wrap gap-0.5 sm:hidden">
                {eventos.slice(0, 4).map((e) => <span key={`${e.tipo}-${e.id}`} className={`h-1.5 w-1.5 rounded-full ${estiloEvento(e).punto}`} />)}
              </span>
              <span className="hidden space-y-0.5 sm:block">
                {eventos.slice(0, MAX_CHIPS).map((e) => (
                  <span key={`${e.tipo}-${e.id}`} className={`block truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${estiloEvento(e).chip}`}>
                    {textoChip(e)}
                  </span>
                ))}
                {eventos.length > MAX_CHIPS && <span className="block px-1 text-[11px] text-slate-500">+{eventos.length - MAX_CHIPS} más</span>}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500" aria-label="Leyenda">
        <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Recordatorio</li>
        <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Fecha límite de tarea</li>
        <li className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Inicio de rotación</li>
      </ul>
    </section>
  );
}
