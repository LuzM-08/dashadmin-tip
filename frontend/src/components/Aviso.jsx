export default function Aviso({ aviso }) {
  if (!aviso) return null;
  const error = aviso.tipo === 'error';
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-lg px-4 py-3 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}
    >
      {aviso.texto}
    </p>
  );
}
