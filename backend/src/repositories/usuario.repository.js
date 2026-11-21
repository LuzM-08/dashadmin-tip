const conPermisos = {
  rol: { include: { permisos_rol: { include: { permiso: true } } } },
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
}

module.exports = UsuarioRepository;
