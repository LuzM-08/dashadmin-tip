import { useEffect, useState } from 'react';

// Ejecuta una función asíncrona al montar (y cuando cambian `deps`). Ignora respuestas de efectos ya cancelados.
export function useAsync(fn, deps = []) {
  const [estado, setEstado] = useState({ data: null, error: null, cargando: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let activo = true;
    setEstado((e) => ({ ...e, cargando: true, error: null }));
    fn()
      .then((data) => activo && setEstado({ data, error: null, cargando: false }))
      .catch((error) => activo && setEstado({ data: null, error, cargando: false }));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  return { ...estado, recargar: () => setVersion((v) => v + 1) };
}
