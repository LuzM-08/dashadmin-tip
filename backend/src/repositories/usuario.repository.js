const conPermisos = {
  rol: { include: { permisos_rol: { include: { permiso: true } } } },
};

const PERMISO_ADMIN = 'usuarios:administrar';

// Campos seguros para la pantalla de administración (nunca el hash).
const seleccionAdmin = {
  id_usuario: true,
  nombre: true,
  email: true,
  activo: true,
  rol: { select: { id_rol: true, nombre_rol: true, descripcion: true } },
};

class UsuarioRepository {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  // Seguro para exponer (sin password).
  findById(id) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: { id_usuario: true, nombre: true, email: true, activo: true },
    });
  }

  // Usuarios activos con su rol y permisos (para selectores). Sin password ni email.
  listarActivos() {
    return this.prisma.usuario.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      select: {
        id_usuario: true,
        nombre: true,
        rol: {
          select: {
            nombre_rol: true,
            permisos_rol: { select: { permiso: { select: { codigo_permiso: true } } } },
          },
        },
      },
    });
  }

  // Perfil con rol y permisos, sin password. Para validar reglas de negocio.
  findPerfilById(id) {
    return this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nombre: true,
        email: true,
        activo: true,
        rol: {
          select: {
            nombre_rol: true,
            permisos_rol: { select: { permiso: { select: { codigo_permiso: true } } } },
          },
        },
      },
    });
  }

  // Incluye el hash: SOLO para uso interno del login.
  findByEmailConPermisos(email) {
    return this.prisma.usuario.findUnique({ where: { email }, include: conPermisos });
  }

  findByIdConPermisos(id) {
    return this.prisma.usuario.findUnique({ where: { id_usuario: id }, include: conPermisos });
  }

  // Incluye el hash (para su huella y para verificar la contraseña actual). Uso interno.
  findSesionById(id) {
    return this.prisma.usuario.findUnique({ where: { id_usuario: id }, include: conPermisos });
  }

  // ---- administración ----
  listarTodos() {
    return this.prisma.usuario.findMany({ orderBy: [{ activo: 'desc' }, { nombre: 'asc' }], select: seleccionAdmin });
  }

  findAdminById(id) {
    return this.prisma.usuario.findUnique({ where: { id_usuario: id }, select: seleccionAdmin });
  }

  findIdPorEmail(email) {
    return this.prisma.usuario.findUnique({ where: { email }, select: { id_usuario: true } });
  }

  listarRoles() {
    return this.prisma.rol.findMany({
      orderBy: { id_rol: 'asc' },
      select: { id_rol: true, nombre_rol: true, descripcion: true },
    });
  }

  findRolPorNombre(nombre) {
    return this.prisma.rol.findUnique({
      where: { nombre_rol: nombre },
      select: { id_rol: true, nombre_rol: true, permisos_rol: { select: { permiso: { select: { codigo_permiso: true } } } } },
    });
  }

  crear({ nombre, email, password, id_rol }) {
    return this.prisma.usuario.create({ data: { nombre, email, password, id_rol, activo: true }, select: seleccionAdmin });
  }

  actualizar(id, data) {
    return this.prisma.usuario.update({ where: { id_usuario: id }, data, select: seleccionAdmin });
  }

  actualizarClave(id, hash) {
    return this.prisma.usuario.update({ where: { id_usuario: id }, data: { password: hash }, select: { id_usuario: true } });
  }

  // Cuentas activas cuyo rol puede administrar usuarios (para no dejar el sistema sin administrador).
  contarAdministradoresActivos() {
    return this.prisma.usuario.count({
      where: { activo: true, rol: { permisos_rol: { some: { permiso: { codigo_permiso: PERMISO_ADMIN } } } } },
    });
  }
}

module.exports = UsuarioRepository;
