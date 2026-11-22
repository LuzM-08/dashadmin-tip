const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/recordatorio.validator');

module.exports = ({ recordatorioController: c, authMiddleware: auth }) => {
  const r = Router();
  r.use(auth.authenticate);

  // Ver: solo lectura (incluye visor). Gestionar: crear, editar y eliminar.
  const ver = auth.requirePermission('eventos:ver');
  const gestionar = auth.requirePermission('eventos:gestionar');

  // /calendario antes de /:id
  r.get('/calendario', ver, validate(v.calendario, 'query'), asyncHandler(c.calendario));
  r.get('/', ver, validate(v.listarRecordatorios, 'query'), asyncHandler(c.listar));
  r.post('/', gestionar, validate(v.crearRecordatorio), asyncHandler(c.crear));
  r.patch('/:id', gestionar, validate(v.idParams, 'params'), validate(v.actualizarRecordatorio), asyncHandler(c.actualizar));
  r.delete('/:id', gestionar, validate(v.idParams, 'params'), asyncHandler(c.eliminar));

  return r;
};
