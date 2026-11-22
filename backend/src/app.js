const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const createRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

module.exports = (container) => {
  const { config } = container.cradle;
  const app = express();
  app.set('trust proxy', config.trustProxy);

  app.use(helmet());
  // Content-Disposition se expone para que el frontend pueda leer el nombre del archivo al descargar.
  app.use(cors({ origin: config.corsOrigin, exposedHeaders: ['Content-Disposition'] }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', createRoutes(container));

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
