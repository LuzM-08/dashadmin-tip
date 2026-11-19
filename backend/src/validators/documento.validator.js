const { z } = require('zod');

const id = z.coerce.number().int().positive();
// En multipart todo llega como texto: un campo vacío o "null" equivale a "no enviado".
const idOpcional = z.preprocess((v) => (v === '' || v === 'null' || v === undefined ? undefined : v), id.optional());

const idParams = z.object({ id });

const subirDocumento = z.object({ id_modulo: id, id_tarea: idOpcional });

const listarDocumentos = z.object({
  id_modulo: id.optional(),
  id_tarea: id.optional(),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const descargarDocumento = z.object({
  inline: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

module.exports = { idParams, subirDocumento, listarDocumentos, descargarDocumento };
