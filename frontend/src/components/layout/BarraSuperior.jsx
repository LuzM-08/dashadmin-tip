import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconoBuscar, IconoCasa } from '../Iconos.jsx';
import MenuPerfil from './MenuPerfil.jsx';
import { MODO_PRUEBAS } from '../../config/pruebas.js';

// Barra 1: logo (casa) que lleva al inicio, buscador y perfil.
export default function BarraSuperior() {
  const [texto, setTexto] = useState('');
  const navigate = useNavigate();

  const buscar = (e) => {
    e.preventDefault();
    const q = texto.trim();
    navigate(q ? `/tareas?q=${encodeURIComponent(q)}` : '/tareas');
  };

  return (
    <header className="bg-blue-900 text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Link to="/" aria-label="Ir al inicio" className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 hover:bg-white/10">
          <IconoCasa className="h-7 w-7" />
          <span className="hidden text-sm font-semibold tracking-wide sm:inline">Cuentas por Pagar</span>
        </Link>

        <form onSubmit={buscar} role="search" className="mx-auto w-full max-w-xl">
          <label htmlFor="busqueda" className="sr-only">Buscar tareas</label>
          <div className="relative">
            <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200" />
            <input
              id="busqueda"
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar tareas…"
              className="w-full rounded-lg border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder-blue-200 outline-none focus:border-white/40 focus:bg-white/15"
            />
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-3">
          {MODO_PRUEBAS && (
            <span className="hidden rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950 md:inline">
              Modo pruebas
            </span>
          )}
          <MenuPerfil />
        </div>
      </div>
    </header>
  );
}
