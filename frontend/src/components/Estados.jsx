export function Spinner({ texto = 'Cargando…', pantallaCompleta = false }) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 text-slate-500 ${pantallaCompleta ? 'min-h-screen' : 'py-16'}`}
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      {texto}
    </div>
  );
}

export function MensajeError({ error, onReintentar }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-medium text-red-800">No se pudo cargar la información</p>
      <p className="mt-1 text-sm text-red-700">{error?.message}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
