const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/tarea.validator');

module.exports = ({ tareaController: c, authMiddleware: auth }) => {
  const r = Router();
  r.use(auth.authenticate);

  // /resumen antes de /:id para que no se interprete como id.
  r.get('/resumen', auth.requirePermission('tareas:leer'), validate(v.resumenTareas, 'query'), asyncHandler(c.resumen));
  r.get('/', auth.requirePermission('tareas:leer'), validate(v.listarTareas, 'query'), asyncHandler(c.listar));
  r.get('/:id', auth.requirePermission('tareas:leer'), validate(v.idParams, 'params'), asyncHandler(c.obtener));
  r.post('/', auth.requirePermission('tareas:crear'), validate(v.crearTarea), asyncHandler(c.crear));
  r.patch('/:id', auth.requirePermission('tareas:editar'), validate(v.idParams, 'params'), validate(v.actualizarTarea), asyncHandler(c.actualizar));
  r.delete('/:id', auth.requirePermission('tareas:eliminar'), validate(v.idParams, 'params'), asyncHandler(c.eliminar));

  return r;
};
