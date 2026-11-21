import { useState } from 'react';
import { api } from '../../api/client.js';
import Modal from '../../components/Modal.jsx';
import { hoyInput, proximoLunesInput, rangoSemana } from '../../utils/fechas.js';
import { formatearRango, formatearSemana } from '../../utils/formato.js';

const entrada =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';
const btnSecundario = 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';
const btnPrimario = 'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60';

const MOTIVOS = {
  YA_TIENE_ASIGNACION: 'ya tenía responsable esa semana',
  SIN_ROTACION_ACTUAL: 'no tiene responsable esta semana (asígnalo a mano una vez)',
};

// Solo quienes pueden gestionar tareas pueden ser responsables.
const candidatos = (usuarios, idActual) =>
  usuarios.filter((u) => u.puede_gestionar_tareas || u.id_usuario === idActual);

function Errores({ error }) {
  return error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null;
}

export function AsignarSemana({ modulo, usuarios, onCancelar, onHecho }) {
  const [semana, setSemana] = useState(proximoLunesInput());
  const [responsable, setResponsable] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const rango = rangoSemana(semana);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await api.post(`/modulos/${modulo.id_modulo}/rotaciones`, { id_responsable: Number(responsable), semana });
      onHecho('Semana asignada.');
    } catch (err) {
      setError(err.message); // p. ej. 409: "El módulo ya tiene un responsable asignado en esa semana"
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo={`Asignar semana · ${modulo.nombre_modulo}`} onCerrar={onCancelar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label htmlFor="semana" className="block text-sm font-medium text-slate-700">Un día de la semana a asignar</label>
          <input id="semana" type="date" required min={hoyInput()} value={semana} onChange={(e) => setSemana(e.target.value)} className={entrada} />
          {rango && <p className="mt-1 text-xs text-slate-500">Semana del {formatearRango(rango.lunes, rango.domingo)} (lunes a domingo)</p>}
        </div>
        <div>
          <label htmlFor="responsable" className="block text-sm font-medium text-slate-700">Responsable</label>
          <select id="responsable" required value={responsable} onChange={(e) => setResponsable(e.target.value)} className={entrada}>
            <option value="" disabled>Selecciona una persona</option>
            {candidatos(usuarios).map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
          </select>
        </div>
        <Errores error={error} />
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onCancelar} className={btnSecundario}>Cancelar</button>
          <button type="submit" disabled={enviando} className={btnPrimario}>{enviando ? 'Asignando…' : 'Asignar'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function CambiarResponsable({ modulo, rotacion, usuarios, onCancelar, onHecho }) {
  const [responsable, setResponsable] = useState(String(rotacion.id_responsable));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    if (Number(responsable) === rotacion.id_responsable) {
      onCancelar();
      return;
    }
    setError('');
    setEnviando(true);
    try {
      await api.patch(`/modulos/${modulo.id_modulo}/rotaciones/${rotacion.id_rotacion}`, { id_responsable: Number(responsable) });
      onHecho('Responsable actualizado. Se le enviará el aviso por correo.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Cambiar responsable" onCerrar={onCancelar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-slate-500">
          {modulo.nombre_modulo} · semana del {formatearRango(rotacion.fecha_inicio, rotacion.fecha_fin)}
        </p>
        <div>
          <label htmlFor="nuevo-responsable" className="block text-sm font-medium text-slate-700">Responsable</label>
          <select id="nuevo-responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} className={entrada}>
            {candidatos(usuarios, rotacion.id_responsable).map((u) => <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>)}
          </select>
        </div>
        <Errores error={error} />
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onCancelar} className={btnSecundario}>Cancelar</button>
          <button type="submit" disabled={enviando} className={btnPrimario}>{enviando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function EliminarRotacion({ modulo, rotacion, onCancelar, onHecho }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const eliminar = async () => {
    setError('');
    setEnviando(true);
    try {
      await api.delete(`/modulos/${modulo.id_modulo}/rotaciones/${rotacion.id_rotacion}`);
      onHecho('Asignación eliminada.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal titulo="Eliminar asignación" onCerrar={() => !enviando && onCancelar()} ancho="max-w-md">
      <p className="text-sm text-slate-600">
        ¿Quitar a <strong>{rotacion.responsable.nombre}</strong> como responsable de {modulo.nombre_modulo} en la semana del{' '}
        {formatearRango(rotacion.fecha_inicio, rotacion.fecha_fin)}? El módulo quedará sin responsable esa semana.
      </p>
      <div className="mt-4"><Errores error={error} /></div>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" disabled={enviando} onClick={onCancelar} className={btnSecundario}>Cancelar</button>
        <button type="button" disabled={enviando} onClick={eliminar} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {enviando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  );
}

export function GenerarProximaSemana({ modulos, onCerrar, onHecho }) {
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const nombreDe = (idModulo) => modulos.find((m) => m.id_modulo === idModulo)?.nombre_modulo ?? `Módulo ${idModulo}`;

  const generar = async () => {
    setError('');
    setEnviando(true);
    try {
      const { data } = await api.post('/modulos/rotaciones/proxima-semana');
      setResultado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => (resultado ? onHecho() : onCerrar());

  return (
    <Modal titulo="Generar rotación de la próxima semana" onCerrar={cerrar} ancho="max-w-lg">
      {!resultado ? (
        <>
          <p className="text-sm text-slate-600">
            Cada módulo pasa al siguiente responsable del grupo de esta semana. Los módulos que ya tengan responsable en
            la próxima semana no se modifican. Si la rotación automática está activa, esto ocurre solo los viernes a las 18:00.
          </p>
          <div className="mt-4"><Errores error={error} /></div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onCerrar} className={btnSecundario}>Cancelar</button>
            <button type="button" disabled={enviando} onClick={generar} className={btnPrimario}>{enviando ? 'Generando…' : 'Generar'}</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-700">
            Semana {formatearSemana(resultado.semana.inicio, resultado.semana.fin)}
          </p>
          {resultado.creadas.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {resultado.creadas.map((r) => (
                <li key={r.id_rotacion}>
                  <span className="font-medium">{r.modulo.nombre_modulo}</span> → {r.responsable.nombre}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No se creó ninguna asignación nueva.</p>
          )}
          {resultado.omitidas.length > 0 && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium">Omitidos</p>
              <ul className="mt-1 space-y-0.5">
                {resultado.omitidas.map((o) => (
                  <li key={o.id_modulo}>{nombreDe(o.id_modulo)}: {MOTIVOS[o.motivo] ?? o.motivo}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={onHecho} className={btnPrimario}>Listo</button>
          </div>
        </>
      )}
    </Modal>
  );
}
