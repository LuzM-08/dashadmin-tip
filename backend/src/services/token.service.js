const jwt = require('jsonwebtoken');

/**
 * Contrato del JWT:
 *   { sub: id_usuario, rol: 'analista_ap', permisos: ['tareas:leer', ...] }
 */
class TokenService {
  constructor({ config }) {
    this.secret = config.jwtSecret;
    this.expiresIn = config.jwtExpiresIn;
  }

  firmar({ id_usuario, rol, permisos }) {
    return jwt.sign({ rol, permisos }, this.secret, { subject: String(id_usuario), expiresIn: this.expiresIn });
  }

  verificar(token) {
    const p = jwt.verify(token, this.secret); // lanza si es inválido o expiró
    return { id_usuario: Number(p.sub), rol: p.rol, permisos: Array.isArray(p.permisos) ? p.permisos : [] };
  }
}

module.exports = TokenService;
