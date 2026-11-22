/**
 * Datos base para PRODUCCIÓN (idempotente): roles, permisos, matriz y los 5 módulos (desde datos-base.js).
 * NO crea usuarios de demostración, tareas ni rotaciones.
 * Solo si todavía no existe ninguna jefatura, crea la primera con ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD.
 *
 * Es seguro ejecutarlo en cada despliegue: así los permisos nuevos llegan a la base existente.
 */
const { sembrarBase } = require('./datos-base');
const { validarEmail, validarClave } = require('./credenciales');

async function main(prisma, hasher, env, log = console.log) {
  const { roles } = await sembrarBase(prisma, log);

  const jefaturas = await prisma.usuario.count({ where: { rol: { nombre_rol: 'jefatura' } } });
  if (jefaturas > 0) {
    log('Ya existe al menos una jefatura: no se crea ningún usuario.');
    return;
  }

  const email = validarEmail(env.ADMIN_EMAIL);
  const clave = validarClave(env.ADMIN_PASSWORD, { email });
  const nombre = (env.ADMIN_NAME || '').trim();
  if (!nombre) throw new Error('Falta ADMIN_NAME');

  await prisma.usuario.create({
    data: { nombre, email, password: await hasher.hash(clave, 12), id_rol: roles.jefatura.id_rol, activo: true },
  });
  log(`Primera jefatura creada: ${email}`);
}

module.exports = { main };

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  main(prisma, bcrypt, process.env)
    .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
