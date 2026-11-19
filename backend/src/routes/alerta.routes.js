const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');

module.exports = ({ alertaController: c, authMiddleware: auth }) => {
  const r = Router();
  // Operación administrativa: requiere gestionar eventos Y rotar módulos (en la práctica, jefatura).
  r.post('/ejecutar', auth.authenticate, auth.requirePermission('eventos:gestionar', 'modulos:rotar'), asyncHandler(c.ejecutar));
  return r;
};
