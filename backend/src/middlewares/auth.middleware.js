const { UnauthorizedError, ForbiddenError } = require('../lib/errors');

class AuthMiddleware {
  constructor({ tokenService }) {
    this.tokens = tokenService;
  }

  authenticate = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return next(new UnauthorizedError('Token requerido'));

    try {
      req.user = this.tokens.verificar(token);
      return next();
    } catch {
      return next(new UnauthorizedError('Token inválido o expirado'));
    }
  };

  // Exige TODOS los permisos indicados.
  requirePermission = (...requeridos) => (req, res, next) => {
    const permisos = req.user?.permisos || [];
    const faltantes = requeridos.filter((p) => !permisos.includes(p));
    if (faltantes.length) return next(new ForbiddenError(`Permiso requerido: ${faltantes.join(', ')}`));
    return next();
  };
}

module.exports = AuthMiddleware;
