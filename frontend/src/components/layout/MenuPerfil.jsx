import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { IconoAlerta, IconoCheck, IconoFlecha, IconoUsuario } from '../Iconos.jsx';
import { MODO_PRUEBAS, NOMBRE_ROL, PASSWORD_DEMO, USUARIOS_DEMO } from '../../config/pruebas.js';

export default function MenuPerfil() {
  const { usuario, logout, cambiarVista } = useAuth();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [cambiandoA, setCambiandoA] = useState(null);
  const [error, setError] = useState('');
  const contenedor = useRef(null);

  // Cierra al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    const alClic = (e) => {
      if (contenedor.current && !contenedor.current.contains(e.target)) setAbierto(false);
    };
    const alTeclado = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTeclado);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTeclado);
    };
  }, [abierto]);

  const elegirVista = async (email) => {
    if (email === usuario.email) return;
    setError('');
    setCambiandoA(email);
    try {
      await cambiarVista(email);
      setAbierto(false);
      navigate('/');
    } catch (e) {
      setError(e.message);
    } finally {
      setCambiandoA(null);
    }
  };

  const salir = () => {
    setAbierto(false);
    logout();
  };

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de perfil"
        className="flex items-center gap-1 rounded-full bg-white/10 p-1 pr-2 hover:bg-white/20"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-900">
          <IconoUsuario className="h-5 w-5" />
        </span>
        <IconoFlecha className="h-4 w-4" />
      </button>

      {abierto && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-xl">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="font-semibold">{usuario.nombre}</p>
            <p className="text-sm text-slate-500">{usuario.email}</p>
            <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {NOMBRE_ROL[usuario.rol] ?? usuario.rol}
            </span>
          </div>

          {MODO_PRUEBAS && (
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <IconoAlerta className="h-4 w-4 shrink-0" />
                <p>
                  <strong>Solo para pruebas.</strong> Cambia temporalmente de rol para ver el sistema con otros
                  permisos. Esta opción no existirá en producción.
                </p>
              </div>

              <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Cambiar vista</p>
              {!PASSWORD_DEMO && (
                <p className="text-xs text-red-600">Falta definir VITE_DEMO_PASSWORD en el archivo .env.</p>
              )}
              <ul>
                {USUARIOS_DEMO.map((u) => {
                  const actual = u.email === usuario.email;
                  return (
                    <li key={u.email}>
                      <button
                        type="button"
                        role="menuitem"
                        disabled={actual || !PASSWORD_DEMO || cambiandoA !== null}
                        onClick={() => elegirVista(u.email)}
                        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-default disabled:opacity-60"
                      >
                        <span>
                          <span className="block font-medium">{u.rol}</span>
                          <span className="block text-xs text-slate-500">{u.descripcion}</span>
                        </span>
                        {actual && <IconoCheck className="h-4 w-4 text-blue-600" />}
                        {cambiandoA === u.email && <span className="text-xs text-slate-400">Cambiando…</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={salir}
            className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
