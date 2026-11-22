class UsuarioAdminController {
  constructor({ usuarioAdminService }) {
    this.service = usuarioAdminService;
  }

  listar = async (req, res) => res.json({ data: await this.service.listar() });

  roles = async (req, res) => res.json({ data: await this.service.listarRoles() });

  crear = async (req, res) => res.status(201).json({ data: await this.service.crear(req.validated.body, req.user) });

  actualizar = async (req, res) =>
    res.json({ data: await this.service.actualizar(req.validated.params.id, req.validated.body, req.user) });

  restablecerClave = async (req, res) => {
    await this.service.restablecerClave(req.validated.params.id, req.validated.body, req.user);
    res.status(204).end();
  };
}

module.exports = UsuarioAdminController;
