const bcrypt = require('bcryptjs');

// Envoltorio de bcrypt: el servicio de auth depende de esta abstracción, no de la librería.
class PasswordHasher {
  constructor() {
    // Hash señuelo: permite comparar aunque el usuario no exista y así
    // igualar tiempos de respuesta (evita enumerar correos válidos).
    this.dummyHash = bcrypt.hashSync('contrasena-senuelo', 10);
  }

  hash(plain) { return bcrypt.hash(plain, 10); }

  compare(plain, hash) { return bcrypt.compare(plain, hash); }
}

module.exports = PasswordHasher;
