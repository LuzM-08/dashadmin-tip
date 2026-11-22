/**
 * Administración básica de usuarios por línea de comandos (mientras no exista una pantalla para ello).
 *
 *   ACCION=crear      EMAIL=... NOMBRE="..." ROL=analista_ap|visor|jefatura PASSWORD=...
 *   ACCION=clave      EMAIL=... PASSWORD=...        (restablece la contraseña)
 *   ACCION=desactivar EMAIL=...                     (impide el ingreso; conserva el historial)
 *   ACCION=activar    EMAIL=...
 */
const { validarEmail, validarClave } = require('./credenciales');

const ROLES = ['jefatura', 'analista_ap', 'visor'];

async function ejecutar(prisma, hasher, env) {
  const accion = env.ACCION;
  const email = validarEmail(env.EMAIL);
  const usuario = await prisma.usuario.findUnique({ where: { email }, include: { rol: true } });

  if (accion === 'crear') {
    if (usuario) throw new Error(`Ya existe un usuario con el correo ${email}`);
    const nombre = (env.NOMBRE || '').trim();
    if (!nombre) throw new Error('Falta NOMBRE');
    if (!ROLES.includes(env.ROL)) throw new Error(`ROL debe ser uno de: ${ROLES.join(', ')}`);
    const clave = validarClave(env.PASSWORD, { email });
    const rol = await prisma.rol.findUnique({ where: { nombre_rol: env.ROL } });
    if (!rol) throw new Error('El rol no existe en la base de datos: ejecuta primero prisma/seed.prod.js');
    await prisma.usuario.create({ data: { nombre, email, password: await hasher.hash(clave, 12), id_rol: rol.id_rol, activo: true } });
    return `Usuario creado: ${nombre} <${email}> (${env.ROL})`;
  }

  if (!usuario) throw new Error(`No existe un usuario con el correo ${email}`);

  if (accion === 'clave') {
    const clave = validarClave(env.PASSWORD, { email });
    await prisma.usuario.update({ where: { id_usuario: usuario.id_usuario }, data: { password: await hasher.hash(clave, 12) } });
    return `Contraseña restablecida para ${email}`;
  }

  if (accion === 'activar') {
    await prisma.usuario.update({ where: { id_usuario: usuario.id_usuario }, data: { activo: true } });
    return `Usuario activado: ${email}`;
  }

  if (accion === 'desactivar') {
    if (usuario.rol.nombre_rol === 'jefatura' && usuario.activo) {
      const activas = await prisma.usuario.count({ where: { activo: true, rol: { nombre_rol: 'jefatura' } } });
      if (activas <= 1) throw new Error('No se puede desactivar a la única jefatura activa');
    }
    await prisma.usuario.update({ where: { id_usuario: usuario.id_usuario }, data: { activo: false } });
    return `Usuario desactivado: ${email}`;
  }

  throw new Error('ACCION debe ser crear, clave, activar o desactivar');
}

module.exports = { ejecutar };

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  ejecutar(prisma, bcrypt, process.env)
    .then((mensaje) => console.log(mensaje))
    .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
