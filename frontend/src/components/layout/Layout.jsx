import { Outlet } from 'react-router-dom';
import BarraSuperior from './BarraSuperior.jsx';
import BarraNavegacion from './BarraNavegacion.jsx';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <BarraSuperior />
      <BarraNavegacion />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
