const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../lib/asyncHandler');
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/auth.validator');

module.exports = ({ authController: c, authMiddleware: auth }) => {
  const r = Router();

  // Freno básico a fuerza bruta: 10 intentos por IP cada 15 minutos.
  const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Intenta más tarde.' } },
  });

  r.post('/login', limiteLogin, validate(v.login), asyncHandler(c.login));
  r.get('/me', auth.authenticate, asyncHandler(c.me));

  return r;
};
