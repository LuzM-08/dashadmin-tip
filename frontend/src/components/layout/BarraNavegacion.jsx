import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';

const PESTANAS = [
  { a: '/modulos', texto: 'Módulos', permiso: 'modulos:ver' },
  { a: '/tareas', texto: 'Tareas', permiso: 'tareas:leer' },
  { a: '/eventos', texto: 'Eventos', permiso: 'eventos:gestionar' },
];

// Barra 2: solo muestra las secciones a las que el rol tiene acceso.
export default function BarraNavegacion() {
  const { tienePermiso } = useAuth();

  return (
    <nav aria-label="Secciones" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 px-6">
        {PESTANAS.filter((p) => tienePermiso(p.permiso)).map((p) => (
          <NavLink
            key={p.a}
            to={p.a}
            className={({ isActive }) =>
              `border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`
            }
          >
            {p.texto}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
