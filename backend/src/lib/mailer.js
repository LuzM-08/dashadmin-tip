const nodemailer = require('nodemailer');

// Único punto que conoce Nodemailer. El resto del sistema depende de `enviar()`.
class Mailer {
  constructor({ config }) {
    const { host, port, secure, user, pass, from } = config.smtp;
    this.from = from;
    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user && { auth: { user, pass } }),
      // Timeouts cortos: un SMTP caído no debe bloquear el scheduler.
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
  }

  enviar({ to, subject, html, text }) {
    return this.transport.sendMail({ from: this.from, to, subject, html, text });
  }
}

module.exports = Mailer;
