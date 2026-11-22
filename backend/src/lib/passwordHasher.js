const bcrypt = require('bcryptjs');

const COSTO = 12;

// Envoltorio de bcrypt: el servicio de auth depende de esta abstracción, no de la librería.
class PasswordHasher {
  constructor() {
    // Hash señuelo (mismo costo que los reales): permite comparar aunque el usuario no exista y así
    // igualar tiempos de respuesta (evita enumerar correos válidos).
    this.dummyHash = bcrypt.hashSync('contrasena-senuelo', COSTO);
  }

  hash(plain) { return bcrypt.hash(plain, COSTO); }

  compare(plain, hash) { return bcrypt.compare(plain, hash); }
}

module.exports = PasswordHasher;
