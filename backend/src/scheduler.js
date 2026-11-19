const cron = require('node-cron');

const resumirAlertas = (r) => (Object.values(r).some((x) => x.enviados || x.fallidos) ? JSON.stringify(r) : null);

const resumirRotacion = (r) => {
  const motivos = r.omitidas.map((o) => `${o.codigo_modulo}:${o.motivo}`).join(', ') || '-';
  return `semana ${r.semana.inicio.toISOString().slice(0, 10)}: ${r.creadas.length} creadas, ${r.omitidas.length} omitidas (${motivos})`;
};

/**
 * Orquestación de tareas programadas. No contiene lógica de negocio:
 * solo decide CUÁNDO ejecutar lo que exponen AlertasService y ModuloService.
 */
class Scheduler {
  constructor({ config, alertasService, moduloService }) {
    this.cfg = config.scheduler;
    this.timezone = config.timezone;
    this.alertas = alertasService;
    this.modulos = moduloService;
    this.tareas = [];
    this.timeoutInicial = null;
  }

  iniciar() {
    if (!this.cfg.habilitado) {
      console.log('[scheduler] Deshabilitado (SCHEDULER_ENABLED=false)');
      return;
    }

    const ejecutarAlertas = () => this.alertas.ejecutarTodo();
    this.#programar('alertas', this.cfg.cronAlertas, ejecutarAlertas, resumirAlertas);

    // Crea la rotación de la semana siguiente (idempotente: respeta lo ya asignado manualmente).
    if (this.cfg.autoGenerarRotacion) {
      this.#programar(
        'rotacion-semanal',
        this.cfg.cronRotacion,
        () => this.modulos.generarProximaSemana({ id_usuario: null }),
        resumirRotacion,
      );
    } else {
      console.log('[scheduler] Rotación automática desactivada (ROTACION_AUTO_GENERAR=false)');
    }

    // Una pasada de alertas poco después de arrancar (recupera lo pendiente tras una caída).
    this.timeoutInicial = setTimeout(() => this.#ejecutar('alertas-inicio', ejecutarAlertas, resumirAlertas), 5000);
    this.timeoutInicial.unref();
  }

  detener() {
    clearTimeout(this.timeoutInicial);
    this.tareas.forEach((t) => t.stop());
    this.tareas = [];
  }

  #programar(nombre, expresion, fn, resumir) {
    if (!cron.validate(expresion)) throw new Error(`Expresión cron inválida para "${nombre}": ${expresion}`);

    let enCurso = false; // evita solapar ejecuciones si una tarda más que el intervalo
    const tarea = cron.schedule(
      expresion,
      async () => {
        if (enCurso) return;
        enCurso = true;
        try { await this.#ejecutar(nombre, fn, resumir); } finally { enCurso = false; }
      },
      { timezone: this.timezone },
    );
    this.tareas.push(tarea);
    console.log(`[scheduler] "${nombre}" programado: ${expresion} (${this.timezone})`);
  }

  async #ejecutar(nombre, fn, resumir) {
    try {
      const mensaje = resumir(await fn());
      if (mensaje) console.log(`[scheduler] ${nombre}: ${mensaje}`);
    } catch (e) {
      console.error(`[scheduler] Error en "${nombre}":`, e.message);
    }
  }
}

module.exports = Scheduler;
