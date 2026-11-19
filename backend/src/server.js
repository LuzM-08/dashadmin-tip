const createContainer = require('./container');
const createApp = require('./app');

const container = createContainer();
const { config, prisma } = container.cradle;
const app = createApp(container);

const server = app.listen(config.port, () => console.log(`API escuchando en :${config.port}`));

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
