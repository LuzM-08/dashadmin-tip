const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/usuario.validator');
const { PERMISO_ADMIN_USUARIOS } = require('../constants/usuario.constants');

// Montado en /api/admin/usuarios. Todo exige usuarios:administrar (solo jefatura).
module.exports = ({ usuarioAdminController: c, authMiddleware: auth }) => {
  const r = Router();
  r.use(auth.authenticate, auth.requirePermission(PERMISO_ADMIN_USUARIOS));

  r.get('/roles', asyncHandler(c.roles)); // antes de /:id
  r.get('/', asyncHandler(c.listar));
  r.post('/', validate(v.crearUsuario), asyncHandler(c.crear));
  r.patch('/:id', validate(v.idParams, 'params'), validate(v.actualizarUsuario), asyncHandler(c.actualizar));
  r.post('/:id/clave', validate(v.idParams, 'params'), validate(v.restablecerClave), asyncHandler(c.restablecerClave));

  return r;
};
