import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import Aviso from '../components/Aviso.jsx';
import { NOMBRE_ROL } from '../config/pruebas.js';
import { MIN_CLAVE, problemaClave } from '../utils/clave.js';

const entrada = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

// Disponible para TODOS los usuarios (cualquier rol): datos de la cuenta y cambio de contraseña.
export default function Cuenta() {
  const { usuario, actualizarSesion } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const problemaNueva = nueva ? problemaClave(nueva, { email: usuario.email, claveActual: actual || undefined }) : null;
  const noCoincide = repetir && repetir !== nueva;
  const puedeEnviar = actual && nueva && repetir && !problemaNueva && !noCoincide && !enviando;

  const enviar = async (e) => {
    e.preventDefault();
    setAviso(null);
    setEnviando(true);
    try {
      const { data } = await api.post('/auth/clave', { clave_actual: actual, clave_nueva: nueva });
      actualizarSesion(data.token, data.usuario); // el token anterior ya no sirve
      setActual('');
      setNueva('');
      setRepetir('');
      setAviso({ tipo: 'ok', texto: 'Contraseña actualizada. Las demás sesiones abiertas con tu cuenta se cerraron.' });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-blue-950">Mi cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">Tus datos y la seguridad de tu acceso.</p>
      </div>

      <section aria-label="Datos de la cuenta" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Nombre</dt><dd className="mt-1 font-medium text-slate-900">{usuario.nombre}</dd></div>
          <div className="sm:col-span-1"><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Correo</dt><dd className="mt-1 break-all font-medium text-slate-900">{usuario.email}</dd></div>
          <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Rol</dt><dd className="mt-1 font-medium text-slate-900">{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</dd></div>
        </dl>
      </section>

      <section aria-labelledby="titulo-clave" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 id="titulo-clave" className="text-lg font-semibold text-slate-800">Cambiar contraseña</h2>
        <p className="mt-1 text-sm text-slate-500">
          Mínimo {MIN_CLAVE} caracteres, con letras y números. Al cambiarla se cierran tus sesiones en otros equipos.
        </p>

        <form onSubmit={enviar} className="mt-4 space-y-4">
          {/* Campo de usuario oculto: ayuda a los gestores de contraseñas a asociar la nueva clave a esta cuenta. */}
          <input type="text" autoComplete="username" value={usuario.email} readOnly hidden />
          <div>
            <label htmlFor="clave-actual" className="block text-sm font-medium text-slate-700">Contraseña actual</label>
            <input id="clave-actual" type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)} className={entrada} />
          </div>
          <div>
            <label htmlFor="clave-nueva" className="block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input id="clave-nueva" type="password" autoComplete="new-password" required value={nueva} onChange={(e) => setNueva(e.target.value)} aria-describedby="ayuda-nueva" className={entrada} />
            <p id="ayuda-nueva" className={`mt-1 text-xs ${problemaNueva ? 'text-red-600' : 'text-slate-400'}`}>
              {problemaNueva ?? (nueva ? 'Cumple los requisitos.' : `Al menos ${MIN_CLAVE} caracteres, con letras y números.`)}
            </p>
          </div>
          <div>
            <label htmlFor="clave-repetir" className="block text-sm font-medium text-slate-700">Repite la nueva contraseña</label>
            <input id="clave-repetir" type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} className={entrada} />
            {noCoincide && <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden.</p>}
          </div>

          <Aviso aviso={aviso} />

          <button type="submit" disabled={!puedeEnviar} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            {enviando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}
