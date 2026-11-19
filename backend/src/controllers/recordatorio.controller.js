class RecordatorioController {
  constructor({ recordatorioService }) {
    this.service = recordatorioService;
  }

  listar = async (req, res) => res.json({ data: await this.service.listar(req.user, req.validated.query) });

  calendario = async (req, res) => res.json({ data: await this.service.calendario(req.user, req.validated.query) });

  crear = async (req, res) => res.status(201).json({ data: await this.service.crear(req.validated.body, req.user) });

  actualizar = async (req, res) =>
    res.json({ data: await this.service.actualizar(req.validated.params.id, req.validated.body, req.user) });

  eliminar = async (req, res) => {
    await this.service.eliminar(req.validated.params.id, req.user);
    res.status(204).send();
  };
}

module.exports = RecordatorioController;
