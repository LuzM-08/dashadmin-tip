import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { MensajeError, Spinner } from '../../components/Estados.jsx';
import TarjetaModulo from '../../components/TarjetaModulo.jsx';
import { GenerarProximaSemana } from './DialogosRotacion.jsx';

export default function ListaModulos() {
  const { tienePermiso } = useAuth();
  const { data, error, cargando, recargar } = useAsync(() => api.get('/modulos'), []);
  const [generando, setGenerando] = useState(false);

  if (error && !data) return <MensajeError error={error} onReintentar={recargar} />;
  if (!data) return <Spinner />;

  const modulos = data.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-950">Módulos</h1>
          <p className="mt-1 text-sm text-slate-500">Responsables de la semana, tareas y documentos de cada módulo.</p>
        </div>
        {tienePermiso('modulos:rotar') && (
          <button
            type="button"
            onClick={() => setGenerando(true)}
            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Generar rotación de la próxima semana
          </button>
        )}
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${cargando ? 'opacity-60' : ''}`}>
        {modulos.map((m) => <TarjetaModulo key={m.id_modulo} modulo={m} />)}
      </div>

      {generando && (
        <GenerarProximaSemana
          modulos={modulos}
          onCerrar={() => setGenerando(false)}
          onHecho={() => {
            setGenerando(false);
            recargar();
          }}
        />
      )}
    </div>
  );
}
