const fs = require('fs');
const path = require('path');

// Almacenamiento en disco local (volumen /uploads). Ninguna ruta se acepta si sale del directorio base.
class AlmacenamientoLocal {
  constructor({ config }) {
    this.directorio = path.resolve(config.uploads.dir);
    fs.mkdirSync(this.directorio, { recursive: true });
  }

  rutaAbsoluta(nombreAlmacenado) {
    const ruta = path.resolve(this.directorio, nombreAlmacenado);
    if (!ruta.startsWith(this.directorio + path.sep)) throw new Error('Ruta fuera del directorio de documentos');
    return ruta;
  }

  async existe(nombreAlmacenado) {
    try {
      await fs.promises.access(this.rutaAbsoluta(nombreAlmacenado), fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  // Eliminar un archivo inexistente no es error (operación idempotente).
  async eliminar(nombreAlmacenado) {
    return this.eliminarPorRuta(this.rutaAbsoluta(nombreAlmacenado));
  }

  async eliminarPorRuta(ruta) {
    const absoluta = path.resolve(ruta);
    if (!absoluta.startsWith(this.directorio + path.sep)) throw new Error('Ruta fuera del directorio de documentos');
    try {
      await fs.promises.unlink(absoluta);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
}

module.exports = AlmacenamientoLocal;
