import { useRef, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useAviso } from '../../hooks/useAviso.js';
import Aviso from '../../components/Aviso.jsx';
import { MensajeError, Spinner } from '../../components/Estados.jsx';
import Modal from '../../components/Modal.jsx';
import Paginacion from '../../components/Paginacion.jsx';
import { ACCEPT, MAX_MB, admiteVistaPrevia, formatearTamano, guardarBlob, validarArchivo } from '../../utils/archivos.js';
import { formatearFecha } from '../../utils/fechas.js';

const POR_PAGINA = 10;
const entrada = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200';

export default function PanelDocumentos({ modulo, onCambio }) {
  const { usuario, tienePermiso } = useAuth();
  const puedeSubir = tienePermiso('documentos:subir');
  const esJefatura = tienePermiso('modulos:rotar');

  const [pagina, setPagina] = useState(1);
  const [archivo, setArchivo] = useState(null);
  const [idTarea, setIdTarea] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [ocupadoId, setOcupadoId] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useAviso();
  const inputArchivo = useRef(null);

  const docs = useAsync(
    () => api.get('/documentos', { consulta: { id_modulo: modulo.id_modulo, page: pagina, limit: POR_PAGINA } }),
    [modulo.id_modulo, pagina],
  );
  const tareas = useAsync(
    () => (puedeSubir
      ? api.get('/tareas', { consulta: { id_modulo: modulo.id_modulo, limit: 100, orden: 'fecha_creacion', direccion: 'desc' } })
      : Promise.resolve(null)),
    [modulo.id_modulo, puedeSubir],
  );

  const limpiarFormulario = () => {
    setArchivo(null);
    setIdTarea('');
    if (inputArchivo.current) inputArchivo.current.value = '';
  };

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0] ?? null;
    const problema = f ? validarArchivo(f) : null;
    if (problema) {
      setAviso({ tipo: 'error', texto: problema });
      e.target.value = '';
      setArchivo(null);
      return;
    }
    setArchivo(f);
  };

  const subir = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setSubiendo(true);
    try {
      const datos = new FormData();
      datos.append('id_modulo', String(modulo.id_modulo));
      if (idTarea) datos.append('id_tarea', idTarea);
      datos.append('archivo', archivo);
      await api.post('/documentos', datos);
      limpiarFormulario();
      setAviso({ tipo: 'ok', texto: 'Documento subido.' });
      if (pagina === 1) docs.recargar();
      else setPagina(1);
      onCambio();
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setSubiendo(false);
    }
  };

  const descargar = async (doc) => {
    setOcupadoId(doc.id_documento);
    try {
      const { blob, nombre } = await api.blob(`/documentos/${doc.id_documento}/descargar`);
      guardarBlob(blob, nombre || doc.nombre_original);
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setOcupadoId(null);
    }
  };

  // Se abre la pestaña de inmediato (dentro del clic) para que el navegador no la bloquee; luego se le asigna el archivo.
  const verEnLinea = async (doc) => {
    const ventana = window.open('', '_blank');
    setOcupadoId(doc.id_documento);
    try {
      const { blob, nombre } = await api.blob(`/documentos/${doc.id_documento}/descargar`, { consulta: { inline: 'true' } });
      if (ventana) {
        const url = URL.createObjectURL(blob);
        ventana.opener = null;
        ventana.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
      } else {
        guardarBlob(blob, nombre || doc.nombre_original); // ventanas emergentes bloqueadas: se descarga
      }
    } catch (err) {
      ventana?.close();
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setOcupadoId(null);
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.delete(`/documentos/${aEliminar.id_documento}`);
      const eraLaUltima = docs.data?.data.length === 1 && pagina > 1;
      setAEliminar(null);
      setAviso({ tipo: 'ok', texto: 'Documento eliminado.' });
      if (eraLaUltima) setPagina(pagina - 1);
      else docs.recargar();
      onCambio();
    } catch (err) {
      setAEliminar(null);
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setEliminando(false);
    }
  };

  const lista = docs.data?.data ?? [];
  const opcionesTarea = tareas.data?.data ?? [];

  return (
    <section aria-labelledby="titulo-docs" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-docs" className="text-lg font-semibold text-slate-800">Documentos</h2>

      {puedeSubir && (
        <form onSubmit={subir} className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-slate-50 p-4">
          <div className="min-w-0 flex-1 basis-56">
            <label htmlFor="archivo" className="block text-xs font-medium text-slate-500">Archivo (máx. {MAX_MB} MB)</label>
            <input
              id="archivo"
              ref={inputArchivo}
              type="file"
              accept={ACCEPT}
              onChange={elegirArchivo}
              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-800 hover:file:bg-blue-200"
            />
          </div>
          <div className="basis-56">
            <label htmlFor="tarea-doc" className="block text-xs font-medium text-slate-500">Asociar a una tarea (opcional)</label>
            <select id="tarea-doc" value={idTarea} onChange={(e) => setIdTarea(e.target.value)} className={`${entrada} mt-1 w-full`}>
              <option value="">Documento general del módulo</option>
              {opcionesTarea.map((t) => <option key={t.id_tarea} value={t.id_tarea}>{t.titulo}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!archivo || subiendo} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
            {subiendo ? 'Subiendo…' : 'Subir'}
          </button>
        </form>
      )}

      <div className="mt-4"><Aviso aviso={aviso} /></div>

      <div className="mt-4">
        {docs.error && !docs.data ? (
          <MensajeError error={docs.error} onReintentar={docs.recargar} />
        ) : !docs.data ? (
          <Spinner />
        ) : lista.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Este módulo todavía no tiene documentos.
          </p>
        ) : (
          <div className={docs.cargando ? 'opacity-60 transition-opacity' : ''}>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <caption className="sr-only">Documentos del módulo</caption>
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-2">Documento</th>
                    <th scope="col" className="px-4 py-2">Tarea</th>
                    <th scope="col" className="px-4 py-2">Subido por</th>
                    <th scope="col" className="px-4 py-2">Fecha</th>
                    <th scope="col" className="px-4 py-2">Tamaño</th>
                    <th scope="col" className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lista.map((d) => {
                    const ocupado = ocupadoId === d.id_documento;
                    const puedeBorrar = esJefatura || d.subido_por.id_usuario === usuario.id_usuario;
                    return (
                      <tr key={d.id_documento}>
                        <td className="max-w-xs break-words px-4 py-2 font-medium text-slate-900">{d.nombre_original}</td>
                        <td className="max-w-[12rem] px-4 py-2 text-slate-600">{d.tarea?.titulo ?? <span className="text-slate-400">General</span>}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-600">{d.subido_por.nombre}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatearFecha(d.fecha_subida)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-slate-600">{formatearTamano(d.tamano_bytes)}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          {admiteVistaPrevia(d.nombre_original) && (
                            <button type="button" disabled={ocupado} onClick={() => verEnLinea(d)} className="mr-4 font-medium text-blue-700 hover:underline disabled:opacity-50">Ver</button>
                          )}
                          <button type="button" disabled={ocupado} onClick={() => descargar(d)} className="font-medium text-blue-700 hover:underline disabled:opacity-50">
                            {ocupado ? 'Abriendo…' : 'Descargar'}
                          </button>
                          {puedeBorrar && (
                            <button type="button" onClick={() => setAEliminar(d)} className="ml-4 font-medium text-red-600 hover:underline">Eliminar</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4"><Paginacion meta={docs.data.meta} onCambiar={setPagina} /></div>
          </div>
        )}
      </div>

      {aEliminar && (
        <Modal titulo="Eliminar documento" onCerrar={() => !eliminando && setAEliminar(null)} ancho="max-w-md">
          <p className="text-sm text-slate-600">
            ¿Seguro que quieres eliminar <strong>{aEliminar.nombre_original}</strong>? Se borra también el archivo y no se puede recuperar.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" disabled={eliminando} onClick={() => setAEliminar(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="button" disabled={eliminando} onClick={eliminar} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
              {eliminando ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
