class AuthController {
  constructor({ authService }) {
    this.service = authService;
  }

  login = async (req, res) => res.json({ data: await this.service.login(req.validated.body) });

  me = async (req, res) => res.json({ data: await this.service.me(req.user.id_usuario) });

  cambiarClave = async (req, res) =>
    res.json({ data: await this.service.cambiarClave(req.user.id_usuario, req.validated.body) });
}

module.exports = AuthController;
