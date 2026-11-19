// Capa HTTP: traduce request/response; cero lógica de negocio.
class TareaController {
  constructor({ tareaService }) {
    this.service = tareaService;
  }

  listar = async (req, res) => res.json(await this.service.listar(req.validated.query));

  resumen = async (req, res) => res.json({ data: await this.service.resumen(req.validated.query) });

  obtener = async (req, res) => res.json({ data: await this.service.obtener(req.validated.params.id) });

  crear = async (req, res) => {
    const data = await this.service.crear(req.validated.body, req.user);
    res.status(201).json({ data });
  };

  actualizar = async (req, res) => {
    const data = await this.service.actualizar(req.validated.params.id, req.validated.body, req.user);
    res.json({ data });
  };

  eliminar = async (req, res) => {
    await this.service.eliminar(req.validated.params.id, req.user);
    res.status(204).send();
  };
}

module.exports = TareaController;
