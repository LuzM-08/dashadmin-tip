class AuthController {
  constructor({ authService }) {
    this.service = authService;
  }

  login = async (req, res) => res.json({ data: await this.service.login(req.validated.body) });

  me = async (req, res) => res.json({ data: await this.service.me(req.user.id_usuario) });
}

module.exports = AuthController;
