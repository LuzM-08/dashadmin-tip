export default function Paginacion({ meta, onCambiar }) {
  if (!meta || meta.total === 0) return null;
  const desde = (meta.page - 1) * meta.limit + 1;
  const hasta = Math.min(meta.page * meta.limit, meta.total);
  const boton =
    'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between text-sm text-slate-500">
      <p>Mostrando {desde}–{hasta} de {meta.total}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={boton} disabled={meta.page <= 1} onClick={() => onCambiar(meta.page - 1)}>Anterior</button>
        <span>Página {meta.page} de {meta.total_pages}</span>
        <button type="button" className={boton} disabled={meta.page >= meta.total_pages} onClick={() => onCambiar(meta.page + 1)}>Siguiente</button>
      </div>
    </nav>
  );
}
