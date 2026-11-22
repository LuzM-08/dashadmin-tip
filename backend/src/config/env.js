require('dotenv').config();
const path = require('path');

if (!process.env.JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

const bool = (valor, porDefecto) =>
  valor === undefined || valor === '' ? porDefecto : ['1', 'true', 'yes', 'si'].includes(String(valor).toLowerCase());

const numero = (valor, porDefecto) =>
  valor === undefined || valor === '' || Number.isNaN(Number(valor)) ? porDefecto : Number(valor);

const nodeEnv = process.env.NODE_ENV || 'development';

// En producción el sistema se niega a arrancar con una configuración insegura.
if (nodeEnv === 'production') {
  const secreto = process.env.JWT_SECRET;
  if (secreto.length < 32 || /cambia|changeme/i.test(secreto)) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres aleatorios en producción');
  }
  if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
    throw new Error('Define CORS_ORIGIN con la URL pública del sistema en producción (no se permite "*")');
  }
}

module.exports = {
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  // Cantidad de proxies de confianza delante del backend (nginx = 1). Necesario para que el límite de intentos de login vea la IP real.
  trustProxy: numero(process.env.TRUST_PROXY, 0),
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  timezone: process.env.SCHEDULER_TZ || process.env.TZ || 'America/Santiago',

  uploads: {
    dir: path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads')),
    maxBytes: numero(process.env.MAX_UPLOAD_MB, 15) * 1024 * 1024,
  },

  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: numero(process.env.SMTP_PORT, 1025),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Dashboard AP <no-reply@dashboard-ap.local>',
  },

  scheduler: {
    habilitado: bool(process.env.SCHEDULER_ENABLED, true),
    cronAlertas: process.env.ALERTAS_CRON || '*/5 * * * *',
    // 0 = la alerta de tarea sale el mismo día de la fecha límite ("Hoy vence"); 1 = también desde el día anterior, etc.
    alertaTareaDiasAntes: numero(process.env.ALERTA_TAREA_DIAS_ANTES, 0),
    // Con 72 h, la rotación generada el viernes 18:00 se avisa de inmediato (el lunes 00:00 está a 54 h).
    alertaRotacionHoras: numero(process.env.ALERTA_ROTACION_HORAS, 72),
    autoGenerarRotacion: bool(process.env.ROTACION_AUTO_GENERAR, true),
    cronRotacion: process.env.ROTACION_CRON || '0 18 * * 5', // viernes 18:00
  },
};
