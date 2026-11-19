const { z } = require('zod');

const id = z.coerce.number().int().positive();

// Fecha y hora ISO con zona (ej. 2026-11-25T14:30:00.000Z o con offset -03:00).
const fechaHora = z.string().datetime({ offset: true }).transform((s) => new Date(s));
const fechaFutura = fechaHora.refine((d) => d.getTime() > Date.now(), { message: 'La fecha del evento debe ser futura' });

// En rangos, "YYYY-MM-DD" se interpreta como día local completo.
const dia = (h, m, s, ms) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((str) => {
    const [y, mes, d] = str.split('-').map(Number);
    return new Date(y, mes - 1, d, h, m, s, ms);
  });
const desde = z.union([dia(0, 0, 0, 0), fechaHora]);
const hasta = z.union([dia(23, 59, 59, 999), fechaHora]);

const idParams = z.object({ id });

const crearRecordatorio = z.object({
  titulo: z.string().trim().min(3).max(200),
  descripcion: z.string().trim().max(1000).nullable().optional(),
  fecha_evento: fechaFutura,
  enviar_correo: z.boolean().default(true),
  id_tarea: id.nullable().optional(),
});

const actualizarRecordatorio = z
  .object({
    titulo: z.string().trim().min(3).max(200),
    descripcion: z.string().trim().max(1000).nullable(),
    fecha_evento: fechaFutura,
    enviar_correo: z.boolean(),
    id_tarea: id.nullable(),
  })
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Debes enviar al menos un campo a actualizar' });

const listarRecordatorios = z.object({
  desde: desde.optional(),
  hasta: hasta.optional(),
  pendientes: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const calendario = z.object({ desde: desde.optional(), hasta: hasta.optional() });

module.exports = { idParams, crearRecordatorio, actualizarRecordatorio, listarRecordatorios, calendario };
