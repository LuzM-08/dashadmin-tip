import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAviso } from '../hooks/useAviso.js';
import Aviso from '../components/Aviso.jsx';
import { MensajeError, Spinner } from '../components/Estados.jsx';
import Modal from '../components/Modal.jsx';
import { NOMBRE_ROL } from '../config/pruebas.js';
import FormularioUsuario from './usuarios/FormularioUsuario.jsx';
import FormularioClaveUsuario from './usuarios/FormularioClaveUsuario.jsx';

// Administración de usuarios: solo con el permiso usuarios:administrar (jefatura). El servidor lo exige igualmente.
export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const [dialogo, setDialogo] = useState(null); // { tipo: 'crear' | 'editar' | 'clave', usuario? }
  const [aviso, setAviso] = useAviso(8000);

  const lista = useAsync(() => Promise.all([api.get('/admin/usuarios'), api.get('/admin/usuarios/roles')]), []);

  const guardado = (texto) => {
    setDialogo(null);
    setAviso({ tipo: 'ok', texto });
    lista.recargar();
  };

  if (lista.error && !lista.data) return <MensajeError error={lista.error} onReintentar={lista.recargar} />;
  if (!lista.data) return <Spinner />;

  const [{ data: usuarios }, { data: roles }] = lista.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-blue-950">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Crea cuentas, cambia roles, desactiva accesos y restablece contraseñas.</p>
        </div>
        <button type="button" onClick={() => setDialogo({ tipo: 'crear' })} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Nuevo usuario
        </button>
      </div>

      <Aviso aviso={aviso} />

      <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${lista.cargando ? 'opacity-60 transition-opacity' : ''}`}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <caption className="sr-only">Usuarios del sistema</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Nombre</th>
              <th scope="col" className="px-4 py-3">Correo</th>
              <th scope="col" className="px-4 py-3">Rol</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => {
              const esYo = u.id_usuario === yo.id_usuario;
              return (
                <tr key={u.id_usuario} className={u.activo ? '' : 'bg-slate-50 text-slate-400'}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {u.nombre}{esYo && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Tú</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{NOMBRE_ROL[u.rol.nombre_rol] ?? u.rol.nombre_rol}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button type="button" onClick={() => setDialogo({ tipo: 'editar', usuario: u })} className="font-medium text-blue-700 hover:underline">Editar</button>
                    {!esYo && (
                      <button type="button" onClick={() => setDialogo({ tipo: 'clave', usuario: u })} className="ml-4 font-medium text-blue-700 hover:underline">Restablecer contraseña</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dialogo?.tipo === 'crear' && (
        <Modal titulo="Nuevo usuario" onCerrar={() => setDialogo(null)}>
          <FormularioUsuario roles={roles} onCancelar={() => setDialogo(null)} onGuardado={guardado} />
        </Modal>
      )}
      {dialogo?.tipo === 'editar' && (
        <Modal titulo="Editar usuario" onCerrar={() => setDialogo(null)}>
          <FormularioUsuario usuario={dialogo.usuario} roles={roles} esYo={dialogo.usuario.id_usuario === yo.id_usuario} onCancelar={() => setDialogo(null)} onGuardado={guardado} />
        </Modal>
      )}
      {dialogo?.tipo === 'clave' && (
        <Modal titulo="Restablecer contraseña" onCerrar={() => setDialogo(null)} ancho="max-w-md">
          <FormularioClaveUsuario usuario={dialogo.usuario} onCancelar={() => setDialogo(null)} onGuardado={guardado} />
        </Modal>
      )}
    </div>
  );
}
