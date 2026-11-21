import { Link } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-800">Página no encontrada</h1>
      <p className="mt-2 text-sm text-slate-500">La dirección no existe o fue movida.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">Volver al inicio</Link>
    </div>
  );
}
