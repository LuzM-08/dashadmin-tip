import { useEffect, useId, useRef } from 'react';

// Diálogo accesible: Escape y clic en el fondo lo cierran; devuelve el foco al elemento anterior.
export default function Modal({ titulo, onCerrar, children, ancho = 'max-w-xl' }) {
  const panel = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar; // siempre la versión más reciente, sin reiniciar el efecto
  const idTitulo = useId();

  useEffect(() => {
    const anterior = document.activeElement;
    const alTeclado = (e) => e.key === 'Escape' && cerrar.current();
    document.addEventListener('keydown', alTeclado);
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('input, select, textarea, button')?.focus();
    return () => {
      document.removeEventListener('keydown', alTeclado);
      document.body.style.overflow = '';
      anterior?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && cerrar.current()}
    >
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={idTitulo} className={`w-full ${ancho} rounded-2xl bg-white shadow-2xl`}>
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 id={idTitulo} className="text-lg font-semibold text-blue-950">{titulo}</h2>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
