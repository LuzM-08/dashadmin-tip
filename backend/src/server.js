const createContainer = require('./container');
const createApp = require('./app');

const container = createContainer();
const { config, prisma, scheduler } = container.cradle;
const app = createApp(container);

const server = app.listen(config.port, () => {
  console.log(`API escuchando en :${config.port}`);
  scheduler.iniciar();
});

const shutdown = async () => {
  scheduler.detener();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
