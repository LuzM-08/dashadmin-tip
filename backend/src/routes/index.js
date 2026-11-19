const { Router } = require('express');
const createAuthRoutes = require('./auth.routes');
const createTareaRoutes = require('./tarea.routes');

module.exports = (container) => {
  const router = Router();
  const deps = container.cradle;

  router.use('/auth', createAuthRoutes(deps));
  router.use('/tareas', createTareaRoutes(deps));

  return router;
};
