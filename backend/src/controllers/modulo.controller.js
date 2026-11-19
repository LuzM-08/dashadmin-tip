class ModuloController {
  constructor({ moduloService }) {
    this.service = moduloService;
  }

  listar = async (req, res) => res.json({ data: await this.service.listar() });

  obtener = async (req, res) => res.json({ data: await this.service.obtener(req.validated.params.id) });

  listarRotaciones = async (req, res) =>
    res.json({ data: await this.service.listarRotaciones(req.validated.params.id, req.validated.query) });

  asignarRotacion = async (req, res) => {
    const data = await this.service.asignarRotacion(req.validated.params.id, req.validated.body, req.user);
    res.status(201).json({ data });
  };

  cambiarResponsable = async (req, res) => {
    const { id, idRotacion } = req.validated.params;
    res.json({ data: await this.service.cambiarResponsable(id, idRotacion, req.validated.body, req.user) });
  };

  eliminarRotacion = async (req, res) => {
    const { id, idRotacion } = req.validated.params;
    await this.service.eliminarRotacion(id, idRotacion, req.user);
    res.status(204).send();
  };

  generarProximaSemana = async (req, res) =>
    res.status(201).json({ data: await this.service.generarProximaSemana(req.user) });
}

module.exports = ModuloController;
