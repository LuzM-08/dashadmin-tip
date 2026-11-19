const { AppError } = require('../lib/errors');

const ERRORES_MULTER = {
  LIMIT_FILE_SIZE: [413, 'PAYLOAD_TOO_LARGE', 'El archivo supera el tamaño máximo permitido'],
  LIMIT_UNEXPECTED_FILE: [400, 'BAD_REQUEST', 'Campo de archivo inesperado: envía el archivo en el campo "archivo"'],
  LIMIT_FILE_COUNT: [400, 'BAD_REQUEST', 'Solo se permite un archivo por solicitud'],
};

const notFound = (req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` } });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err?.name === 'MulterError') {
    const [status, code, message] = ERRORES_MULTER[err.code] ?? [400, 'BAD_REQUEST', 'No se pudo procesar el archivo'];
    return res.status(status).json({ error: { code, message } });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'El cuerpo de la solicitud no es un JSON válido' } });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'El cuerpo de la solicitud es demasiado grande' } });
  }
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } });
  }
  console.error(err);
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
};

module.exports = { notFound, errorHandler };
