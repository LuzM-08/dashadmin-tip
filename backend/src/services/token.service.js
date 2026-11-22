const jwt = require('jsonwebtoken');

/**
 * Contrato del JWT:
 *   { sub: id_usuario, hp: huella de la contraseña, rol, permisos }
 * Quien manda en rol/permisos es la BD (ver auth.middleware): los del token son solo informativos.
 * `hp` permite invalidar todas las sesiones cuando cambia la contraseña.
 */
class TokenService {
  constructor({ config }) {
    this.secret = config.jwtSecret;
    this.expiresIn = config.jwtExpiresIn;
  }

  firmar({ id_usuario, rol, permisos, huella }) {
    return jwt.sign({ rol, permisos, hp: huella }, this.secret, { subject: String(id_usuario), expiresIn: this.expiresIn });
  }

  verificar(token) {
    const p = jwt.verify(token, this.secret); // lanza si es inválido o expiró
    return { id_usuario: Number(p.sub), huella: typeof p.hp === 'string' ? p.hp : null };
  }
}

module.exports = TokenService;
