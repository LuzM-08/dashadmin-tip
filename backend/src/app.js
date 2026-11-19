const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const createRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

module.exports = (container) => {
  const { config } = container.cradle;
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', createRoutes(container));

  app.use(notFound);
  app.use(errorHandler);
  return app;
};
