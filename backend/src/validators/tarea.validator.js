const { z } = require('zod');
const { ESTADOS_TAREA, PRIORIDADES_TAREA } = require('../constants/tarea.constants');

const id = z.coerce.number().int().positive();
// z.coerce.date() convertiría null en 1970; por eso null se acepta explícitamente primero.
const fechaNullable = z.union([z.null(), z.coerce.date()]);

const idParams = z.object({ id });

const crearTarea = z.object({
  id_modulo: id,
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  estado: z.enum(ESTADOS_TAREA).default('Sin iniciar'),
  prioridad: z.enum(PRIORIDADES_TAREA).default('Media'),
  fecha_limite: fechaNullable.optional(),
  id_asignado: id.nullable().optional(),
});

const actualizarTarea = z
  .object({
    id_modulo: id,
    titulo: z.string().trim().min(3).max(200),
    descripcion: z.string().trim().max(2000).nullable(),
    estado: z.enum(ESTADOS_TAREA),
    prioridad: z.enum(PRIORIDADES_TAREA),
    fecha_limite: fechaNullable,
    id_asignado: id.nullable(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Debes enviar al menos un campo a actualizar' });

const listarTareas = z.object({
  id_modulo: id.optional(),
  estado: z.enum(ESTADOS_TAREA).optional(),
  prioridad: z.enum(PRIORIDADES_TAREA).optional(),
  id_asignado: id.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  vencidas: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orden: z.enum(['fecha_limite', 'fecha_creacion', 'fecha_actualizacion']).default('fecha_limite'),
  direccion: z.enum(['asc', 'desc']).default('asc'),
});

const resumenTareas = z.object({ id_asignado: id.optional() });

module.exports = { idParams, crearTarea, actualizarTarea, listarTareas, resumenTareas };
