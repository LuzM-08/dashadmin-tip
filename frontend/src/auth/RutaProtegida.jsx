import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { Spinner } from '../components/Estados.jsx';

// Exige sesión iniciada; si no, manda al login recordando a dónde quería ir.
export function RutaProtegida() {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <Spinner texto="Verificando sesión…" pantallaCompleta />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: ubicacion }} />;
  return <Outlet />;
}

// Exige un permiso concreto (el backend lo valida de todos modos; esto solo mejora la experiencia).
export function RequierePermiso({ permiso }) {
  const { tienePermiso } = useAuth();
  if (!tienePermiso(permiso)) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">Sin acceso</h1>
        <p className="mt-2 text-sm text-slate-500">Tu rol actual no tiene permiso para ver esta sección.</p>
      </div>
    );
  }
  return <Outlet />;
}
