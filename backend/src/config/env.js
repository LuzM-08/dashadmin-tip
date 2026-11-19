require('dotenv').config();

if (!process.env.JWT_SECRET) {
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

const bool = (valor, porDefecto) =>
  valor === undefined || valor === '' ? porDefecto : ['1', 'true', 'yes', 'si'].includes(String(valor).toLowerCase());

const numero = (valor, porDefecto) =>
  valor === undefined || valor === '' || Number.isNaN(Number(valor)) ? porDefecto : Number(valor);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  timezone: process.env.SCHEDULER_TZ || process.env.TZ || 'America/Santiago',

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
