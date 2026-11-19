const Container = require('./lib/container');
const config = require('./config/env');
const createPrisma = require('./lib/prisma');
const PasswordHasher = require('./lib/passwordHasher');

const AuthMiddleware = require('./middlewares/auth.middleware');
const TareaRepository = require('./repositories/tarea.repository');
const ModuloRepository = require('./repositories/modulo.repository');
const UsuarioRepository = require('./repositories/usuario.repository');
const AuditoriaRepository = require('./repositories/auditoria.repository');
const TokenService = require('./services/token.service');
const AuthService = require('./services/auth.service');
const TareaService = require('./services/tarea.service');
const AuthController = require('./controllers/auth.controller');
const TareaController = require('./controllers/tarea.controller');

// Único lugar donde se conocen las implementaciones concretas (composition root).
module.exports = () =>
  new Container()
    // infraestructura
    .register('config', () => config)
    .register('prisma', createPrisma)
    .register('passwordHasher', () => new PasswordHasher())
    // repositories
    .register('tareaRepository', (c) => new TareaRepository(c))
    .register('moduloRepository', (c) => new ModuloRepository(c))
    .register('usuarioRepository', (c) => new UsuarioRepository(c))
    .register('auditoriaRepository', (c) => new AuditoriaRepository(c))
    // services
    .register('tokenService', (c) => new TokenService(c))
    .register('authService', (c) => new AuthService(c))
    .register('tareaService', (c) => new TareaService(c))
    // middlewares y controllers
    .register('authMiddleware', (c) => new AuthMiddleware(c))
    .register('authController', (c) => new AuthController(c))
    .register('tareaController', (c) => new TareaController(c));
