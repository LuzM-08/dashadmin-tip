const crypto = require('crypto');

// Huella corta del hash de contraseña. Va dentro del JWT: si la contraseña cambia, la huella cambia
// y todos los tokens emitidos antes dejan de servir (cierra las sesiones abiertas en otros equipos).
// No es reversible a la contraseña ni al hash.
const huellaDeClave = (hash) => crypto.createHash('sha256').update(String(hash)).digest('hex').slice(0, 16);

module.exports = { huellaDeClave };
