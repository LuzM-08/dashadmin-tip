const { UnauthorizedError, ForbiddenError } = require('../lib/errors');
const { huellaDeClave } = require('../lib/huella');

class AuthMiddleware {
  constructor({ tokenService, usuarioRepository, sesionCache }) {
    this.tokens = tokenService;
    this.usuarios = usuarioRepository;
    this.cache = sesionCache;
  }

  // Firma válida NO basta: la cuenta debe seguir activa, la contraseña no haber cambiado y los
  // permisos se toman de la BD (caché de pocos segundos), no del token.
  authenticate = async (req, res, next) => {
    try {
      const [scheme, token] = (req.headers.authorization || '').split(' ');
      if (scheme !== 'Bearer' || !token) throw new UnauthorizedError('Token requerido');

      let claims;
      try {
        claims = this.tokens.verificar(token);
      } catch {
        throw new UnauthorizedError('Token inválido o expirado');
      }

      const sesion = await this.#cargarSesion(claims.id_usuario);
      if (!sesion || !sesion.activo) throw new UnauthorizedError('Sesión inválida');
      if (!claims.huella || claims.huella !== sesion.huella) {
        throw new UnauthorizedError('Tu sesión ya no es válida. Inicia sesión nuevamente.');
      }

      req.user = {
        id_usuario: sesion.id_usuario, nombre: sesion.nombre, email: sesion.email, rol: sesion.rol, permisos: sesion.permisos,
      };
      return next();
    } catch (e) {
      return next(e);
    }
  };

  // Exige TODOS los permisos indicados.
  requirePermission = (...requeridos) => (req, res, next) => {
    const permisos = req.user?.permisos || [];
    const faltantes = requeridos.filter((p) => !permisos.includes(p));
    if (faltantes.length) return next(new ForbiddenError(`Permiso requerido: ${faltantes.join(', ')}`));
    return next();
  };

  async #cargarSesion(id) {
    const enCache = this.cache.get(id);
    if (enCache) return enCache;

    const u = await this.usuarios.findSesionById(id);
    if (!u) return null;
    const sesion = {
      id_usuario: u.id_usuario,
      nombre: u.nombre,
      email: u.email,
      activo: u.activo,
      huella: huellaDeClave(u.password),
      rol: u.rol.nombre_rol,
      permisos: u.rol.permisos_rol.map((pr) => pr.permiso.codigo_permiso),
    };
    this.cache.set(id, sesion);
    return sesion;
  }
}

module.exports = AuthMiddleware;
