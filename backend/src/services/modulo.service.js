const { NotFoundError, BadRequestError, ConflictError } = require('../lib/errors');
const { ESTADOS_TAREA } = require('../constants/tarea.constants');
const { semanaDe, sumarDias } = require('../lib/semana');

// Para ser responsable de un módulo hay que poder gestionar tareas.
const PERMISO_RESPONSABLE = 'tareas:editar';

class ModuloService {
  constructor({ moduloRepository, rotacionRepository, tareaRepository, usuarioRepository, auditoriaRepository }) {
    this.modulos = moduloRepository;
    this.rotaciones = rotacionRepository;
    this.tareas = tareaRepository;
    this.usuarios = usuarioRepository;
    this.auditoria = auditoriaRepository;
  }

  // ---------- Lectura ----------
  async listar() {
    const ahora = new Date();
    const [modulos, vigentes, conteos] = await Promise.all([
      this.modulos.listarActivos(),
      this.rotaciones.findVigentes(ahora),
      this.tareas.contarPorModuloYEstado(),
    ]);
    const actual = this.#primeraPorModulo(vigentes);
    return modulos.map((m) => this.#armar(m, actual.get(m.id_modulo), conteos));
  }

  async obtener(id) {
    const modulo = await this.modulos.findDetalle(id);
    if (!modulo) throw new NotFoundError('Módulo no encontrado');

    const ahora = new Date();
    const [vigentes, proxima, conteos] = await Promise.all([
      this.rotaciones.findVigentes(ahora, id),
      this.rotaciones.findProxima(id, ahora),
      this.tareas.contarPorModuloYEstado({ id_modulo: id }),
    ]);
    return { ...this.#armar(modulo, vigentes[0], conteos), proxima_rotacion: proxima };
  }

  async listarRotaciones(idModulo, { desde, hasta, limit }) {
    await this.#obtenerModulo(idModulo);
    return this.rotaciones.findMany({ idModulo, desde, hasta, limit });
  }

  // ---------- Escritura ----------
  async asignarRotacion(idModulo, { id_responsable, semana }, actor) {
    await this.#obtenerModulo(idModulo, { activo: true });
    await this.#validarResponsable(id_responsable);

    const { inicio, fin } = semanaDe(semana);
    if (fin < new Date()) throw new BadRequestError('No se puede asignar una semana que ya terminó');

    const solapadas = await this.rotaciones.findSolapadas(idModulo, inicio, fin);
    if (solapadas.length) {
      throw new ConflictError('El módulo ya tiene un responsable asignado en esa semana', {
        id_rotacion: solapadas[0].id_rotacion,
        responsable: solapadas[0].responsable.nombre,
      });
    }

    const rotacion = await this.rotaciones.create({
      id_modulo: idModulo, id_responsable, fecha_inicio: inicio, fecha_fin: fin,
    });
    await this.#auditar(actor, 'ROTACION_ASIGNADA', rotacion.id_rotacion, {
      id_modulo: idModulo, id_responsable, semana: inicio,
    });
    return rotacion;
  }

  async cambiarResponsable(idModulo, idRotacion, { id_responsable }, actor) {
    const rotacion = await this.#obtenerRotacionVigenteOFutura(idModulo, idRotacion);
    if (rotacion.id_responsable === id_responsable) return rotacion;

    await this.#validarResponsable(id_responsable);

    // Con nuevo responsable, la alerta de asignación debe poder enviarse de nuevo.
    const actualizada = await this.rotaciones.update(idRotacion, { id_responsable, alerta_enviada: false });
    await this.#auditar(actor, 'ROTACION_CAMBIADA', idRotacion, {
      id_modulo: idModulo, de: rotacion.id_responsable, a: id_responsable,
    });
    return actualizada;
  }

  async eliminarRotacion(idModulo, idRotacion, actor) {
    const rotacion = await this.#obtenerRotacionVigenteOFutura(idModulo, idRotacion);
    await this.rotaciones.delete(idRotacion);
    await this.#auditar(actor, 'ROTACION_ELIMINADA', idRotacion, {
      id_modulo: idModulo, id_responsable: rotacion.id_responsable,
    });
  }

  /**
   * Genera la rotación de la próxima semana desplazando a cada módulo al siguiente
   * responsable del "pool" (quienes tienen módulo esta semana, ordenados por id).
   * Idempotente: omite módulos que ya tienen asignación esa semana.
   */
  async generarProximaSemana(actor) {
    const ahora = new Date();
    const { inicio, fin } = semanaDe(sumarDias(ahora, 7));

    const [modulos, vigentes, existentes] = await Promise.all([
      this.modulos.listarActivos(),
      this.rotaciones.findVigentes(ahora),
      this.rotaciones.findSolapadas(null, inicio, fin),
    ]);

    const actualPorModulo = this.#primeraPorModulo(vigentes);
    const yaAsignados = new Set(existentes.map((r) => r.id_modulo));
    const pool = [...new Set(vigentes.filter((r) => r.responsable.activo).map((r) => r.id_responsable))].sort((a, b) => a - b);

    const nuevas = [];
    const omitidas = [];

    for (const m of modulos) {
      if (yaAsignados.has(m.id_modulo)) {
        omitidas.push({ id_modulo: m.id_modulo, codigo_modulo: m.codigo_modulo, motivo: 'YA_TIENE_ASIGNACION' });
        continue;
      }
      const actual = actualPorModulo.get(m.id_modulo);
      if (!actual || pool.length === 0) {
        omitidas.push({ id_modulo: m.id_modulo, codigo_modulo: m.codigo_modulo, motivo: 'SIN_ROTACION_ACTUAL' });
        continue;
      }
      const idx = pool.indexOf(actual.id_responsable);
      const siguiente = idx === -1 ? pool[0] : pool[(idx + 1) % pool.length];
      nuevas.push({ id_modulo: m.id_modulo, id_responsable: siguiente, fecha_inicio: inicio, fecha_fin: fin });
    }

    const creadas = nuevas.length ? await this.rotaciones.crearVarias(nuevas) : [];
    if (creadas.length) {
      await this.#auditar(actor, 'ROTACION_GENERADA', null, { semana: inicio, creadas: creadas.length });
    }
    return { semana: { inicio, fin }, creadas, omitidas };
  }

  // ---------- privados ----------
  async #obtenerModulo(id, { activo } = {}) {
    const modulo = await this.modulos.findById(id);
    if (!modulo) throw new NotFoundError('Módulo no encontrado');
    if (activo && !modulo.activo) throw new BadRequestError('El módulo está inactivo');
    return modulo;
  }

  async #obtenerRotacionVigenteOFutura(idModulo, idRotacion) {
    const rotacion = await this.rotaciones.findById(idRotacion);
    if (!rotacion || rotacion.id_modulo !== idModulo) throw new NotFoundError('Rotación no encontrada en este módulo');
    if (rotacion.fecha_fin < new Date()) {
      throw new BadRequestError('La rotación ya terminó y forma parte del historial; no se puede modificar');
    }
    return rotacion;
  }

  async #validarResponsable(id) {
    const usuario = await this.usuarios.findPerfilById(id);
    if (!usuario) throw new BadRequestError('El responsable indicado no existe');
    if (!usuario.activo) throw new BadRequestError('El responsable indicado está inactivo');
    const permisos = usuario.rol.permisos_rol.map((pr) => pr.permiso.codigo_permiso);
    if (!permisos.includes(PERMISO_RESPONSABLE)) {
      throw new BadRequestError('El usuario no puede gestionar tareas, por lo que no puede ser responsable de un módulo');
    }
  }

  // Las rotaciones llegan ordenadas de más reciente a más antigua: se queda la primera de cada módulo.
  #primeraPorModulo(rotaciones) {
    const mapa = new Map();
    for (const r of rotaciones) if (!mapa.has(r.id_modulo)) mapa.set(r.id_modulo, r);
    return mapa;
  }

  #armar(modulo, rotacion, conteos) {
    const porEstado = Object.fromEntries(ESTADOS_TAREA.map((e) => [e, 0]));
    for (const c of conteos) {
      if (c.id_modulo === modulo.id_modulo && c.estado in porEstado) porEstado[c.estado] += c._count._all;
    }
    return {
      id_modulo: modulo.id_modulo,
      codigo_modulo: modulo.codigo_modulo,
      nombre_modulo: modulo.nombre_modulo,
      descripcion: modulo.descripcion,
      orden_visual: modulo.orden_visual,
      responsable_actual: rotacion
        ? {
            id_rotacion: rotacion.id_rotacion,
            id_usuario: rotacion.responsable.id_usuario,
            nombre: rotacion.responsable.nombre,
            email: rotacion.responsable.email,
            fecha_inicio: rotacion.fecha_inicio,
            fecha_fin: rotacion.fecha_fin,
          }
        : null,
      tareas: { total: Object.values(porEstado).reduce((a, b) => a + b, 0), por_estado: porEstado },
      documentos: modulo._count.documentos,
    };
  }

  #auditar(actor, accion, idEntidad, detalles) {
    return this.auditoria.registrar({
      id_usuario: actor.id_usuario, accion, entidad: 'RotacionSemanal', id_entidad: idEntidad, detalles,
    });
  }
}

module.exports = ModuloService;
