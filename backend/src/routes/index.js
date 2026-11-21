const { Router } = require('express');
const createAuthRoutes = require('./auth.routes');
const createTareaRoutes = require('./tarea.routes');
const createModuloRoutes = require('./modulo.routes');
const createRecordatorioRoutes = require('./recordatorio.routes');
const createAlertaRoutes = require('./alerta.routes');
const createDocumentoRoutes = require('./documento.routes');
const createUsuarioRoutes = require('./usuario.routes');

module.exports = (container) => {
  const router = Router();
  const deps = container.cradle;

  router.use('/auth', createAuthRoutes(deps));
  router.use('/tareas', createTareaRoutes(deps));
  router.use('/modulos', createModuloRoutes(deps));
  router.use('/eventos', createRecordatorioRoutes(deps));
  router.use('/alertas', createAlertaRoutes(deps));
  router.use('/documentos', createDocumentoRoutes(deps));
  router.use('/usuarios', createUsuarioRoutes(deps));

  return router;
};
