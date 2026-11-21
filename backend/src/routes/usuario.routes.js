const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');

module.exports = ({ usuarioController: c, authMiddleware: auth }) => {
  const r = Router();
  r.get('/', auth.authenticate, auth.requirePermission('tareas:leer'), asyncHandler(c.listar));
  return r;
};
