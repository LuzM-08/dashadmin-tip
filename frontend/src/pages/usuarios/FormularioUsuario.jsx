import { useState } from 'react';
import { api } from '../../api/client.js';
import { NOMBRE_ROL } from '../../config/pruebas.js';
import { generarClave, problemaClave } from '../../utils/clave.js';

const entrada = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

// Crear (usuario = null) o editar (nombre, rol y estado; el correo no cambia).
export default function FormularioUsuario({ usuario, roles, esYo, onCancelar, onGuardado }) {
  const editando = Boolean(usuario);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState(usuario?.rol.nombre_rol ?? 'analista_ap');
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const problema = !editando && clave ? problemaClave(clave, { email }) : null;

  const generar = () => {
    setClave(generarClave());
    setVerClave(true); // la jefatura necesita verla para comunicársela a la persona
  };

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!editando) {
      const p = problemaClave(clave, { email });
      if (p) return setError(p);
    }
    setEnviando(true);
    try {
      if (editando) {
        const cambios = {};
        if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim();
        if (rol !== usuario.rol.nombre_rol) cambios.rol = rol;
        if (activo !== usuario.activo) cambios.activo = activo;
        if (Object.keys(cambios).length) await api.patch(`/admin/usuarios/${usuario.id_usuario}`, cambios);
        onGuardado('Usuario actualizado.');
      } else {
        await api.post('/admin/usuarios', { nombre: nombre.trim(), email: email.trim(), rol, clave });
        onGuardado('Usuario creado. Comparte la contraseña inicial por un canal seguro y pídele que la cambie.');
      }
    } catch (err) {
      setError(err.detalles?.[0]?.mensaje && err.status === 400 ? `${err.message}: ${err.detalles[0].mensaje}` : err.message);
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="u-nombre" className="block text-sm font-medium text-slate-700">Nombre</label>
        <input id="u-nombre" required minLength={2} maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} className={entrada} />
      </div>

      {!editando ? (
        <div>
          <label htmlFor="u-email" className="block text-sm font-medium text-slate-700">Correo</label>
          <input id="u-email" type="email" required maxLength={254} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className={entrada} />
        </div>
      ) : (
        <p className="text-sm text-slate-500">Correo: <strong className="text-slate-800">{usuario.email}</strong></p>
      )}

      <div>
        <label htmlFor="u-rol" className="block text-sm font-medium text-slate-700">Rol</label>
        <select id="u-rol" value={rol} onChange={(e) => setRol(e.target.value)} disabled={editando && esYo} className={`${entrada} disabled:bg-slate-100`}>
          {roles.map((r) => <option key={r.id_rol} value={r.nombre_rol}>{NOMBRE_ROL[r.nombre_rol] ?? r.nombre_rol}</option>)}
        </select>
        {editando && esYo && <p className="mt-1 text-xs text-slate-400">No puedes cambiar tu propio rol.</p>}
      </div>

      {editando && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={activo} disabled={esYo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Cuenta activa (si se desactiva, no podrá ingresar y su sesión se cierra de inmediato)
        </label>
      )}

      {!editando && (
        <div>
          <label htmlFor="u-clave" className="block text-sm font-medium text-slate-700">Contraseña inicial</label>
          <div className="mt-1 flex gap-2">
            <input
              id="u-clave"
              type={verClave ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <button type="button" onClick={() => setVerClave((v) => !v)} className="shrink-0 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50">{verClave ? 'Ocultar' : 'Ver'}</button>
            <button type="button" onClick={generar} className="shrink-0 rounded-lg border border-blue-300 px-3 text-sm font-medium text-blue-700 hover:bg-blue-50">Generar</button>
          </div>
          <p className={`mt-1 text-xs ${problema ? 'text-red-600' : 'text-slate-400'}`}>{problema ?? 'Al menos 12 caracteres, con letras y números. La persona puede cambiarla en "Mi cuenta".'}</p>
        </div>
      )}

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancelar} disabled={enviando} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
        <button type="submit" disabled={enviando} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
          {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  );
}
