export default function PaginaPendiente({ titulo, descripcion }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-blue-950">{titulo}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-blue-200 bg-white p-10 text-center">
        <p className="font-medium text-slate-700">Esta sección se construye en el siguiente paso.</p>
        <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
      </div>
    </div>
  );
}
