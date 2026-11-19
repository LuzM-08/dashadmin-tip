const { Router } = require('express');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const crearLimpieza = require('../middlewares/limpiar-archivo.middleware');
const v = require('../validators/documento.validator');

module.exports = ({ documentoController: c, authMiddleware: auth, subida, almacenamiento }) => {
  const r = Router();
  r.use(auth.authenticate);

  const ver = auth.requirePermission('modulos:ver');

  r.get('/', ver, validate(v.listarDocumentos, 'query'), asyncHandler(c.listar));

  // El permiso se comprueba ANTES de aceptar el archivo; la limpieza de huérfanos va al final de la cadena.
  r.post(
    '/',
    auth.requirePermission('documentos:subir'),
    subida.single('archivo'),
    validate(v.subirDocumento),
    asyncHandler(c.subir),
    crearLimpieza(almacenamiento),
  );

  r.get('/:id', ver, validate(v.idParams, 'params'), asyncHandler(c.obtener));
  r.get('/:id/descargar', ver, validate(v.idParams, 'params'), validate(v.descargarDocumento, 'query'), asyncHandler(c.descargar));
  r.delete('/:id', ver, validate(v.idParams, 'params'), asyncHandler(c.eliminar)); // autoría/jefatura se valida en el servicio

  return r;
};
