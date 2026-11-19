const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { BadRequestError } = require('./errors');

// Configura Multer: guarda en el volumen con nombre aleatorio (nunca el del cliente) y filtra extensiones.
module.exports = ({ config, almacenamiento, archivoValidator }) =>
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, almacenamiento.directorio),
      filename: (req, file, cb) => {
        const extension = path.extname(archivoValidator.nombreSeguro(file.originalname)).toLowerCase();
        cb(null, `${crypto.randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: config.uploads.maxBytes, files: 1, fields: 5, fieldSize: 1024 },
    fileFilter: (req, file, cb) => {
      const extension = path.extname(archivoValidator.nombreSeguro(file.originalname));
      if (!archivoValidator.extensionPermitida(extension)) {
        return cb(new BadRequestError(`Tipo de archivo no permitido. Permitidos: ${archivoValidator.extensionesPermitidas().join(', ')}`));
      }
      return cb(null, true);
    },
  });
