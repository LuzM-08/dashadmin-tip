// Quien puede trabajar tareas = quien puede editarlas (mismo criterio que para ser responsable de un módulo).
const PERMISO_TRABAJO = 'tareas:editar';

class UsuarioService {
  constructor({ usuarioRepository }) {
    this.usuarios = usuarioRepository;
  }

  // Datos mínimos para selectores (asignar tareas, filtrar). Nunca email ni hash.
  async listarActivos() {
    const usuarios = await this.usuarios.listarActivos();
    return usuarios.map((u) => ({
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      rol: u.rol.nombre_rol,
      puede_gestionar_tareas: u.rol.permisos_rol.some((pr) => pr.permiso.codigo_permiso === PERMISO_TRABAJO),
    }));
  }
}

module.exports = UsuarioService;
