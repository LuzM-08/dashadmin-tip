const { UnauthorizedError } = require('../lib/errors');

class AuthService {
  constructor({ usuarioRepository, auditoriaRepository, tokenService, passwordHasher }) {
    this.usuarios = usuarioRepository;
    this.auditoria = auditoriaRepository;
    this.tokens = tokenService;
    this.hasher = passwordHasher;
  }

  async login({ email, password }) {
    const usuario = await this.usuarios.findByEmailConPermisos(email);

    // Siempre se compara (con hash señuelo si no existe) y el error es genérico.
    const coincide = await this.hasher.compare(password, usuario?.password ?? this.hasher.dummyHash);
    if (!usuario || !coincide || !usuario.activo) {
      await this.auditoria.registrar({ accion: 'LOGIN_FALLIDO', entidad: 'Usuario', detalles: { email } });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const perfil = this.#perfil(usuario);
    const token = this.tokens.firmar(perfil);
    await this.auditoria.registrar({
      id_usuario: usuario.id_usuario, accion: 'LOGIN', entidad: 'Usuario', id_entidad: usuario.id_usuario,
    });

    return { token, usuario: perfil };
  }

  // Perfil con permisos vigentes en BD (el token puede traerlos desactualizados).
  async me(idUsuario) {
    const usuario = await this.usuarios.findByIdConPermisos(idUsuario);
    if (!usuario || !usuario.activo) throw new UnauthorizedError('Sesión inválida');
    return this.#perfil(usuario);
  }

  #perfil(usuario) {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre_rol,
      permisos: usuario.rol.permisos_rol.map((pr) => pr.permiso.codigo_permiso),
    };
  }
}

module.exports = AuthService;
