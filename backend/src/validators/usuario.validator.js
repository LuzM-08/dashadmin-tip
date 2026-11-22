const { z } = require('zod');
const { ROLES_VALIDOS } = require('../constants/usuario.constants');

const id = z.coerce.number().int().positive();
const idParams = z.object({ id });

const nombre = z.string().trim().min(2, 'Mínimo 2 caracteres').max(100);
const rol = z.enum(ROLES_VALIDOS);
// La política de contraseñas se aplica en el servicio (mismo texto de error para API y pantalla).
const clave = z.string().min(1, 'Indica la contraseña').max(200);

const crearUsuario = z.object({
  nombre,
  email: z.string().trim().toLowerCase().email('Correo inválido').max(254),
  rol,
  clave,
});

const actualizarUsuario = z
  .object({ nombre, rol, activo: z.boolean() })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Debes enviar al menos un campo a actualizar' });

const restablecerClave = z.object({ clave });

module.exports = { idParams, crearUsuario, actualizarUsuario, restablecerClave };
