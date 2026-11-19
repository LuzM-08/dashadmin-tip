const fs = require('fs');
const path = require('path');
const { BadRequestError } = require('./errors');

const ZIP = [0x50, 0x4b, 0x03, 0x04]; // docx / xlsx / pptx son contenedores ZIP
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // doc / xls / ppt clásicos
const MUESTRA = 4096;

// Lista blanca: extensión -> tipo MIME canónico (el que se guarda; nunca el que declara el cliente) + verificación de contenido.
const TIPOS = {
  '.pdf': { mime: 'application/pdf', firma: [0x25, 0x50, 0x44, 0x46], enLinea: true },
  '.png': { mime: 'image/png', firma: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], enLinea: true },
  '.jpg': { mime: 'image/jpeg', firma: [0xff, 0xd8, 0xff], enLinea: true },
  '.jpeg': { mime: 'image/jpeg', firma: [0xff, 0xd8, 0xff], enLinea: true },
  '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', firma: ZIP },
  '.xlsx': { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', firma: ZIP },
  '.pptx': { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', firma: ZIP },
  '.doc': { mime: 'application/msword', firma: OLE },
  '.xls': { mime: 'application/vnd.ms-excel', firma: OLE },
  '.ppt': { mime: 'application/vnd.ms-powerpoint', firma: OLE },
  '.txt': { mime: 'text/plain', texto: true },
  '.csv': { mime: 'text/csv', texto: true },
  '.xml': { mime: 'application/xml', texto: true, empiezaCon: '<' }, // p. ej. DTE electrónicos
};

class ArchivoValidator {
  extensionesPermitidas() {
    return Object.keys(TIPOS);
  }

  extensionPermitida(extension) {
    return Object.prototype.hasOwnProperty.call(TIPOS, String(extension).toLowerCase());
  }

  // Solo PDF e imágenes se pueden mostrar en el navegador; el resto siempre se descarga.
  admiteVistaPrevia(extension) {
    return Boolean(TIPOS[String(extension).toLowerCase()]?.enLinea);
  }

  /**
   * Normaliza el nombre original: corrige acentos mal decodificados por multipart (latin1 -> utf8),
   * quita rutas y caracteres de control, y limita el largo.
   */
  nombreSeguro(nombre) {
    let n = String(nombre ?? '');
    if (![...n].some((c) => c.charCodeAt(0) > 255)) {
      const decodificado = Buffer.from(n, 'latin1').toString('utf8');
      if (!decodificado.includes('\uFFFD')) n = decodificado;
    }
    n = path.basename(n.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim();
    if (n.length > 200) {
      const ext = path.extname(n);
      n = n.slice(0, 200 - ext.length) + ext;
    }
    return n || 'documento';
  }

  // Verifica que el contenido real coincida con la extensión. Devuelve el MIME canónico.
  async inspeccionar(ruta, extension) {
    const tipo = TIPOS[String(extension).toLowerCase()];
    if (!tipo) throw new BadRequestError('Tipo de archivo no permitido');

    const fh = await fs.promises.open(ruta, 'r');
    let muestra;
    try {
      const { bytesRead, buffer } = await fh.read(Buffer.alloc(MUESTRA), 0, MUESTRA, 0);
      muestra = buffer.subarray(0, bytesRead);
    } finally {
      await fh.close();
    }

    if (muestra.length === 0) throw new BadRequestError('El archivo está vacío');

    const invalido = () => new BadRequestError(`El contenido del archivo no corresponde a su extensión (${extension})`);
    if (tipo.firma && !tipo.firma.every((byte, i) => muestra[i] === byte)) throw invalido();
    if (tipo.texto) {
      if (muestra.includes(0x00)) throw invalido();
      if (tipo.empiezaCon) {
        const inicio = muestra[0] === 0xef && muestra[1] === 0xbb && muestra[2] === 0xbf ? 3 : 0; // BOM UTF-8
        const texto = muestra.subarray(inicio).toString('utf8').trimStart();
        if (!texto.startsWith(tipo.empiezaCon)) throw invalido();
      }
    }
    return { tipo_mime: tipo.mime };
  }
}

module.exports = ArchivoValidator;
