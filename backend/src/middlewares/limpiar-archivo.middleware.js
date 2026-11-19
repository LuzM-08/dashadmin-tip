// Middleware de error a nivel de ruta: si algo falla después de guardar el archivo
// (validación, reglas de negocio, BD), se borra para no dejar huérfanos en /uploads.
module.exports = (almacenamiento) => (err, req, res, next) => {
  if (req.file?.path) {
    almacenamiento.eliminarPorRuta(req.file.path).catch((e) => console.error('[documentos] No se pudo limpiar el archivo:', e.message));
  }
  next(err);
};
