const { BadRequestError } = require('../lib/errors');

// Valida body | query | params con Zod y deja el resultado en req.validated[origen].
// (No muta req.query, así funciona igual en Express 4 y 5.)
module.exports = (schema, origen = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[origen]);
  if (!result.success) {
    const detalles = result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    return next(new BadRequestError('Datos inválidos', detalles));
  }
  req.validated = { ...(req.validated || {}), [origen]: result.data };
  return next();
};
