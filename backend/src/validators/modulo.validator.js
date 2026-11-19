const { z } = require('zod');

const id = z.coerce.number().int().positive();

// Acepta "YYYY-MM-DD" (se interpreta como día local, a mediodía, para evitar saltos por zona horaria)
// o una fecha ISO completa.
const fecha = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d, 12);
  }),
  z.coerce.date(),
]);

const idParams = z.object({ id });
const idRotacionParams = z.object({ id, idRotacion: id });

// "semana" = cualquier día de la semana a asignar; el servidor calcula lunes a domingo.
const asignarRotacion = z.object({ id_responsable: id, semana: fecha });

const cambiarResponsable = z.object({ id_responsable: id });

const listarRotaciones = z.object({
  desde: fecha.optional(),
  hasta: fecha.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

module.exports = { idParams, idRotacionParams, asignarRotacion, cambiarResponsable, listarRotaciones };
