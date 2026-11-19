const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/modulo.validator');

module.exports = ({ moduloController: c, authMiddleware: auth }) => {
  const r = Router();
  r.use(auth.authenticate);

  const ver = auth.requirePermission('modulos:ver');
  const rotar = auth.requirePermission('modulos:rotar');

  r.get('/', ver, asyncHandler(c.listar));
  // Ruta fija antes de las que llevan :id
  r.post('/rotaciones/proxima-semana', rotar, asyncHandler(c.generarProximaSemana));

  r.get('/:id', ver, validate(v.idParams, 'params'), asyncHandler(c.obtener));
  r.get('/:id/rotaciones', ver, validate(v.idParams, 'params'), validate(v.listarRotaciones, 'query'), asyncHandler(c.listarRotaciones));
  r.post('/:id/rotaciones', rotar, validate(v.idParams, 'params'), validate(v.asignarRotacion), asyncHandler(c.asignarRotacion));
  r.patch('/:id/rotaciones/:idRotacion', rotar, validate(v.idRotacionParams, 'params'), validate(v.cambiarResponsable), asyncHandler(c.cambiarResponsable));
  r.delete('/:id/rotaciones/:idRotacion', rotar, validate(v.idRotacionParams, 'params'), asyncHandler(c.eliminarRotacion));

  return r;
};
