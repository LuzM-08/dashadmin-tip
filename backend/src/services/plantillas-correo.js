const esc = (valor) =>
  String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MOMENTOS = {
  hoy: { asunto: 'Hoy vence', intro: 'Esta tarea vence hoy y todavía no está terminada.', etiqueta: 'Vence' },
  vencida: { asunto: 'Tarea vencida', intro: 'Esta tarea ya superó su fecha límite y sigue sin terminar.', etiqueta: 'Venció' },
  proxima: { asunto: 'Tarea por vencer', intro: 'Esta tarea se acerca a su fecha límite.', etiqueta: 'Vence' },
};

// Genera asunto, HTML y texto plano. Sin lógica de negocio ni acceso a datos.
class PlantillasCorreo {
  constructor({ config }) {
    this.appUrl = config.appUrl;
    this.fechaHora = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full', timeStyle: 'short', hourCycle: 'h23', timeZone: config.timezone });
    this.fecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'full', timeZone: config.timezone });
    this.hora = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: config.timezone });
  }

  recordatorio({ usuario, recordatorio, tarea }) {
    const filas = [['Cuándo', this.fechaHora.format(recordatorio.fecha_evento)]];
    if (recordatorio.descripcion) filas.push(['Detalle', recordatorio.descripcion]);
    if (tarea) filas.push(['Tarea asociada', tarea.titulo]);
    return this.#armar({
      asunto: `Recordatorio: ${recordatorio.titulo}`,
      titulo: recordatorio.titulo,
      nombre: usuario.nombre,
      intro: 'Este es el recordatorio que programaste en el Dashboard de Cuentas por Pagar.',
      filas,
      ruta: '/eventos',
    });
  }

  // momento: 'hoy' (vence hoy), 'vencida' (días anteriores) o 'proxima' (aviso anticipado).
  tareaPorVencer({ usuario, tarea, momento = 'proxima' }) {
    const m = MOMENTOS[momento] ?? MOMENTOS.proxima;
    const filas = [
      ['Módulo', tarea.modulo.nombre_modulo],
      ['Prioridad', tarea.prioridad],
      ['Estado', tarea.estado],
      [m.etiqueta, this.#fechaLimite(tarea.fecha_limite)],
    ];
    if (tarea.descripcion) filas.push(['Descripción', tarea.descripcion]);
    return this.#armar({
      asunto: `${m.asunto}: ${tarea.titulo}`,
      titulo: tarea.titulo,
      nombre: usuario.nombre,
      intro: m.intro,
      filas,
      ruta: '/tareas',
    });
  }

  rotacion({ usuario, rotacion, tareasPendientes, vigente }) {
    const modulo = rotacion.modulo.nombre_modulo;
    return this.#armar({
      asunto: `Responsable del módulo ${modulo}: ${this.fecha.format(rotacion.fecha_inicio)}`,
      titulo: `Responsable del módulo ${modulo}`,
      nombre: usuario.nombre,
      intro: vigente
        ? `Esta semana estás a cargo del módulo ${modulo}.`
        : `Se te asignó la responsabilidad del módulo ${modulo} para la próxima rotación.`,
      filas: [
        ['Desde', this.fecha.format(rotacion.fecha_inicio)],
        ['Hasta', this.fecha.format(rotacion.fecha_fin)],
        ['Tareas pendientes en el módulo', String(tareasPendientes)],
      ],
      ruta: '/modulos',
    });
  }

  // Si la fecha límite está a medianoche exacta (solo día, sin hora), se muestra solo la fecha.
  #fechaLimite(fecha) {
    return this.hora.format(fecha) === '00:00' ? this.fecha.format(fecha) : this.fechaHora.format(fecha);
  }

  #armar({ asunto, titulo, nombre, intro, filas, ruta }) {
    const url = `${this.appUrl}${ruta}`;
    const tabla = filas
      .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`)
      .join('');

    const html = `<div style="font-family:Segoe UI,Arial,sans-serif;background:#f1f5f9;padding:24px">
<div style="max-width:560px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<div style="background:#1e3a8a;color:#ffffff;padding:16px 24px;font-size:16px;font-weight:600">Dashboard AP · Cuentas por Pagar</div>
<div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
<h2 style="margin:0 0 12px;font-size:18px;color:#1e3a8a">${esc(titulo)}</h2>
<p style="margin:0 0 8px">Hola ${esc(nombre)},</p>
<p style="margin:0 0 16px">${esc(intro)}</p>
<table style="border-collapse:collapse;font-size:14px">${tabla}</table>
<p style="margin:24px 0 0"><a href="${esc(url)}" style="background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Abrir en el dashboard</a></p>
</div>
<div style="padding:12px 24px;background:#f8fafc;color:#64748b;font-size:12px">Mensaje automático. No respondas a este correo.</div>
</div></div>`;

    const text = [`Hola ${nombre},`, '', intro, '', ...filas.map(([k, v]) => `${k}: ${v}`), '', `Abrir: ${url}`].join('\n');
    return { subject: asunto, html, text };
  }
}

module.exports = PlantillasCorreo;
