const Container = require('./lib/container');
const config = require('./config/env');
const createPrisma = require('./lib/prisma');
const PasswordHasher = require('./lib/passwordHasher');
const Mailer = require('./lib/mailer');
const AlmacenamientoLocal = require('./lib/almacenamiento');
const ArchivoValidator = require('./lib/archivoValidator');
const crearSubida = require('./lib/upload');
const Scheduler = require('./scheduler');

const AuthMiddleware = require('./middlewares/auth.middleware');
const TareaRepository = require('./repositories/tarea.repository');
const ModuloRepository = require('./repositories/modulo.repository');
const RotacionRepository = require('./repositories/rotacion.repository');
const RecordatorioRepository = require('./repositories/recordatorio.repository');
const DocumentoRepository = require('./repositories/documento.repository');
const UsuarioRepository = require('./repositories/usuario.repository');
const AuditoriaRepository = require('./repositories/auditoria.repository');
const TokenService = require('./services/token.service');
const AuthService = require('./services/auth.service');
const TareaService = require('./services/tarea.service');
const ModuloService = require('./services/modulo.service');
const RecordatorioService = require('./services/recordatorio.service');
const AlertasService = require('./services/alertas.service');
const UsuarioService = require('./services/usuario.service');
const DocumentoService = require('./services/documento.service');
const PlantillasCorreo = require('./services/plantillas-correo');
const AuthController = require('./controllers/auth.controller');
const TareaController = require('./controllers/tarea.controller');
const ModuloController = require('./controllers/modulo.controller');
const RecordatorioController = require('./controllers/recordatorio.controller');
const AlertaController = require('./controllers/alerta.controller');
const DocumentoController = require('./controllers/documento.controller');
const UsuarioController = require('./controllers/usuario.controller');

// Único lugar donde se conocen las implementaciones concretas (composition root).
module.exports = () =>
  new Container()
    // infraestructura
    .register('config', () => config)
    .register('prisma', createPrisma)
    .register('passwordHasher', () => new PasswordHasher())
    .register('mailer', (c) => new Mailer(c))
    .register('scheduler', (c) => new Scheduler(c))
    .register('almacenamiento', (c) => new AlmacenamientoLocal(c))
    .register('archivoValidator', () => new ArchivoValidator())
    .register('subida', (c) => crearSubida(c))
    // repositories
    .register('tareaRepository', (c) => new TareaRepository(c))
    .register('moduloRepository', (c) => new ModuloRepository(c))
    .register('rotacionRepository', (c) => new RotacionRepository(c))
    .register('recordatorioRepository', (c) => new RecordatorioRepository(c))
    .register('documentoRepository', (c) => new DocumentoRepository(c))
    .register('usuarioRepository', (c) => new UsuarioRepository(c))
    .register('auditoriaRepository', (c) => new AuditoriaRepository(c))
    // services
    .register('plantillasCorreo', (c) => new PlantillasCorreo(c))
    .register('tokenService', (c) => new TokenService(c))
    .register('authService', (c) => new AuthService(c))
    .register('tareaService', (c) => new TareaService(c))
    .register('moduloService', (c) => new ModuloService(c))
    .register('recordatorioService', (c) => new RecordatorioService(c))
    .register('alertasService', (c) => new AlertasService(c))
    .register('usuarioService', (c) => new UsuarioService(c))
    .register('documentoService', (c) => new DocumentoService(c))
    // middlewares y controllers
    .register('authMiddleware', (c) => new AuthMiddleware(c))
    .register('authController', (c) => new AuthController(c))
    .register('tareaController', (c) => new TareaController(c))
    .register('moduloController', (c) => new ModuloController(c))
    .register('recordatorioController', (c) => new RecordatorioController(c))
    .register('alertaController', (c) => new AlertaController(c))
    .register('documentoController', (c) => new DocumentoController(c))
    .register('usuarioController', (c) => new UsuarioController(c));
