class UsuarioController {
  constructor({ usuarioService }) {
    this.service = usuarioService;
  }

  listar = async (req, res) => res.json({ data: await this.service.listarActivos() });
}

module.exports = UsuarioController;
