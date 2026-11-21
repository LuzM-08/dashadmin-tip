import { useEffect, useState } from 'react';

// Mensaje temporal ({ tipo: 'ok' | 'error', texto }) que se borra solo.
export function useAviso(milisegundos = 5000) {
  const [aviso, setAviso] = useState(null);
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(null), milisegundos);
    return () => clearTimeout(t);
  }, [aviso, milisegundos]);
  return [aviso, setAviso];
}
