const { ESTADO_FINAL } = require('../constants/tarea.constants');
const { inicioDelDia, finDelDia } = require('../lib/zonaHoraria');

const LOTE = 200;
const HORA_MS = 3600 * 1000;
const ERRORES_DE_CONEXION = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'EDNS', 'ENOTFOUND', 'ECONNRESET']);

const resumen = () => ({ enviados: 0, fallidos: 0, omitidos: 0 });

/**
 * Lógica de alertas por correo. No sabe de cron ni de HTTP:
 * el scheduler o un endpoint la invocan, y los repositorios/mailer se inyectan.
 * Regla común: solo se marca "enviado" cuando el correo realmente salió (si falla, se reintenta en la siguiente pasada).
 */
class AlertasService {
  constructor({ recordatorioRepository, tareaRepository, rotacionRepository, auditoriaRepository, mailer, plantillasCorreo, config }) {
    this.recordatorios = recordatorioRepository;
    this.tareas = tareaRepository;
    this.rotaciones = rotacionRepository;
    this.auditoria = auditoriaRepository;
    this.mailer = mailer;
    this.plantillas = plantillasCorreo;
    this.cfg = config.scheduler;
    this.timezone = config.timezone;
  }

  async ejecutarTodo() {
    const resultado = {
      recordatorios: await this.#aislar(() => this.procesarRecordatorios()),
      tareas: await this.#aislar(() => this.procesarAlertasTareas()),
      rotaciones: await this.#aislar(() => this.procesarAlertasRotacion()),
    };

    const enviados = Object.values(resultado).reduce((acc, r) => acc + r.enviados, 0);
    if (enviados > 0) {
      await this.auditoria
        .registrar({ accion: 'ALERTAS_ENVIADAS', entidad: 'Alerta', detalles: resultado })
        .catch((e) => console.error('[alertas] No se pudo auditar:', e.message));
    }
    return resultado;
  }

  // Recordatorios programados por los usuarios: se envían cuando llega su fecha_evento.
  async procesarRecordatorios() {
    const pendientes = await this.recordatorios.findPendientesDeEnvio(new Date(), LOTE);
    return this.#despachar(
      pendientes,
      (r) => ({ to: r.usuario.email, ...this.plantillas.recordatorio({ usuario: r.usuario, recordatorio: r, tarea: r.tarea }) }),
      (r) => this.recordatorios.marcarEnviado(r.id_recordatorio),
    );
  }

  // Tareas sin terminar cuya fecha límite es hoy (o ya pasó). Con ALERTA_TAREA_DIAS_ANTES > 0 se avisa también antes.
  // Destinatario: el asignado; si no hay, el responsable vigente del módulo.
  async procesarAlertasTareas() {
    const ahora = new Date();
    const inicioHoy = inicioDelDia(ahora, this.timezone);
    const finHoy = finDelDia(ahora, this.timezone);
    const hasta = finDelDia(new Date(+ahora + this.cfg.alertaTareaDiasAntes * 24 * HORA_MS), this.timezone);

    const [tareas, vigentes] = await Promise.all([
      this.tareas.findParaAlertaLimite({ hasta, estadoFinal: ESTADO_FINAL, limit: LOTE }),
      this.rotaciones.findVigentes(ahora),
    ]);

    const responsablePorModulo = new Map();
    for (const r of vigentes) if (!responsablePorModulo.has(r.id_modulo)) responsablePorModulo.set(r.id_modulo, r.responsable);

    return this.#despachar(
      tareas,
      (t) => {
        const destinatario = [t.asignado, responsablePorModulo.get(t.id_modulo)].find((u) => u && u.activo);
        if (!destinatario) return null; // sin destinatario: no se marca, se reintentará cuando haya uno
        const momento = t.fecha_limite < inicioHoy ? 'vencida' : t.fecha_limite <= finHoy ? 'hoy' : 'proxima';
        return { to: destinatario.email, ...this.plantillas.tareaPorVencer({ usuario: destinatario, tarea: t, momento }) };
      },
      (t) => this.tareas.marcarAlertaEnviada(t.id_tarea, t.fecha_actualizacion),
    );
  }

  // Avisa al responsable de cada rotación que comienza pronto (o que ya comenzó) y aún no fue notificado.
  async procesarAlertasRotacion() {
    const ahora = new Date();
    const hasta = new Date(+ahora + this.cfg.alertaRotacionHoras * HORA_MS);
    const rotaciones = await this.rotaciones.findParaAlerta(hasta, ahora, LOTE);

    return this.#despachar(
      rotaciones,
      async (r) => {
        if (!r.responsable.activo) return null;
        const tareasPendientes = await this.tareas.count({ id_modulo: r.id_modulo, estado: { not: ESTADO_FINAL } });
        return {
          to: r.responsable.email,
          ...this.plantillas.rotacion({ usuario: r.responsable, rotacion: r, tareasPendientes, vigente: r.fecha_inicio <= ahora }),
        };
      },
      (r) => this.rotaciones.update(r.id_rotacion, { alerta_enviada: true }),
    );
  }

  // ---- privados ----
  // preparar(item) -> {to, subject, html, text} | null (omitir); alEnviar(item) -> marca como enviado.
  async #despachar(items, preparar, alEnviar) {
    const r = resumen();
    for (const item of items) {
      const mensaje = await preparar(item);
      if (!mensaje) { r.omitidos++; continue; }

      const estado = await this.#enviar(mensaje);
      if (estado === 'ok') {
        await alEnviar(item);
        r.enviados++;
      } else {
        r.fallidos++;
        if (estado === 'sin_conexion') break; // SMTP caído: no insistir con el resto del lote
      }
    }
    return r;
  }

  async #enviar(mensaje) {
    try {
      await this.mailer.enviar(mensaje);
      return 'ok';
    } catch (e) {
      console.error(`[alertas] Falló el envío a ${mensaje.to}: ${e.message}`);
      return ERRORES_DE_CONEXION.has(e.code) ? 'sin_conexion' : 'error';
    }
  }

  async #aislar(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[alertas] Error en el proceso:', e.message);
      return { ...resumen(), error: e.message };
    }
  }
}

module.exports = AlertasService;
