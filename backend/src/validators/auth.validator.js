const { z } = require('zod');

const login = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

// La política de la nueva contraseña se aplica en el servicio (necesita el correo y la clave actual).
const cambiarClave = z.object({
  clave_actual: z.string().min(1, 'Indica tu contraseña actual').max(200),
  clave_nueva: z.string().min(1, 'Indica la nueva contraseña').max(200),
});

module.exports = { login, cambiarClave };
