import { useState } from 'react';
import { api } from '../../api/client.js';
import { generarClave, problemaClave } from '../../utils/clave.js';

// La jefatura fija una contraseña nueva para otra persona (olvido, sospecha de filtración).
export default function FormularioClaveUsuario({ usuario, onCancelar, onGuardado }) {
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const problema = clave ? problemaClave(clave, { email: usuario.email }) : null;

  const enviar = async (e) => {
    e.preventDefault();
    const p = problemaClave(clave, { email: usuario.email });
    if (p) return setError(p);
    setError('');
    setEnviando(true);
    try {
      await api.post(`/admin/usuarios/${usuario.id_usuario}/clave`, { clave });
      onGuardado(`Contraseña de ${usuario.nombre} restablecida. Sus sesiones abiertas se cerraron.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <p className="text-sm text-slate-600">
        Nueva contraseña para <strong>{usuario.nombre}</strong> ({usuario.email}). Compártesela por un canal seguro.
      </p>
      <div>
        <label htmlFor="r-clave" className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
        <div className="mt-1 flex gap-2">
          <input
            id="r-clave"
            type={ver ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button type="button" onClick={() => setVer((v) => !v)} className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50">{ver ? 'Ocultar' : 'Ver'}</button>
          <button type="button" onClick={() => { setClave(generarClave()); setVer(true); }} className="shrink-0 rounded-lg border border-blue-300 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50">Generar</button>
        </div>
        <p className={`mt-1 text-xs ${problema ? 'text-red-600' : 'text-slate-400'}`}>{problema ?? 'Al menos 12 caracteres, con letras y números.'}</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancelar} disabled={enviando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={enviando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {enviando ? 'Guardando…' : 'Restablecer contraseña'}
        </button>
      </div>
    </form>
  );
}
