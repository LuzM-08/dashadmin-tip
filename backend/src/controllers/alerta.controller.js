class AlertaController {
  constructor({ alertasService }) {
    this.service = alertasService;
  }

  // Disparo manual (pruebas / operación): ejecuta la misma pasada que el scheduler.
  ejecutar = async (req, res) => res.json({ data: await this.service.ejecutarTodo() });
}

module.exports = AlertaController;
