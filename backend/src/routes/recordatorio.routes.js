const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/recordatorio.validator');

module.exports = ({ recordatorioController: c, authMiddleware: auth }) => {
  const r = Router();
  r.use(auth.authenticate, auth.requirePermission('eventos:gestionar'));

  // /calendario antes de /:id
  r.get('/calendario', validate(v.calendario, 'query'), asyncHandler(c.calendario));
  r.get('/', validate(v.listarRecordatorios, 'query'), asyncHandler(c.listar));
  r.post('/', validate(v.crearRecordatorio), asyncHandler(c.crear));
  r.patch('/:id', validate(v.idParams, 'params'), validate(v.actualizarRecordatorio), asyncHandler(c.actualizar));
  r.delete('/:id', validate(v.idParams, 'params'), asyncHandler(c.eliminar));

  return r;
};
