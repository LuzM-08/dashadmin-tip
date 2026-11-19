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

  // Incluye el hash: SOLO para uso interno del login.
  findByEmailConPermisos(email) {
    return this.prisma.usuario.findUnique({ where: { email }, include: conPermisos });
  }

  findByIdConPermisos(id) {
    return this.prisma.usuario.findUnique({ where: { id_usuario: id }, include: conPermisos });
  }
}

module.exports = UsuarioRepository;
