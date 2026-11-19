const contentDisposition = require('../lib/contentDisposition');
const { NotFoundError } = require('../lib/errors');

class DocumentoController {
  constructor({ documentoService }) {
    this.service = documentoService;
  }

  listar = async (req, res) => res.json(await this.service.listar(req.validated.query));

  obtener = async (req, res) => res.json({ data: await this.service.obtener(req.validated.params.id) });

  subir = async (req, res) => {
    const data = await this.service.subir({ archivo: req.file, dto: req.validated.body }, req.user);
    res.status(201).json({ data });
  };

  descargar = async (req, res, next) => {
    const info = await this.service.prepararDescarga(req.validated.params.id, { enLinea: req.validated.query.inline });
    res.sendFile(
      info.nombre_almacenado,
      {
        root: info.raiz, // Express rechaza cualquier intento de salir de esta carpeta
        dotfiles: 'allow',
        headers: {
          'Content-Type': info.tipo_mime,
          'Content-Disposition': contentDisposition(info.en_linea ? 'inline' : 'attachment', info.nombre_original),
          'Cache-Control': 'private, no-store',
        },
      },
      (err) => {
        if (err && !res.headersSent) next(new NotFoundError('No se pudo leer el archivo'));
      },
    );
  };

  eliminar = async (req, res) => {
    await this.service.eliminar(req.validated.params.id, req.user);
    res.status(204).send();
  };
}

module.exports = DocumentoController;
