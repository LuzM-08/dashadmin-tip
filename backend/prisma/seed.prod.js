/**
 * Datos base para PRODUCCIÓN (idempotente): roles, permisos, matriz de permisos y los 5 módulos.
 * NO crea usuarios de demostración, tareas ni rotaciones.
 * Solo si todavía no existe ninguna jefatura, crea la primera con ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD.
 *
 * Mantener sincronizado con prisma/seed.js (los permisos y módulos deben ser los mismos).
 */
const { validarEmail, validarClave } = require('./credenciales');

const ROLES = [
  { nombre_rol: 'jefatura', descripcion: 'Jefatura de Cuentas por Pagar con control total y rotación de módulos' },
  { nombre_rol: 'analista_ap', descripcion: 'Analista de Cuentas por Pagar encargado de tareas, avances y documentos' },
  { nombre_rol: 'visor', descripcion: 'Consulta y trazabilidad de módulos y tareas' },
];

const PERMISOS = [
  { codigo_permiso: 'modulos:ver', descripcion: 'Visualizar módulos de Cuentas por Pagar' },
  { codigo_permiso: 'modulos:rotar', descripcion: 'Asignar o rotar responsables semanales de módulos' },
  { codigo_permiso: 'tareas:leer', descripcion: 'Consultar tareas y estados' },
  { codigo_permiso: 'tareas:crear', descripcion: 'Crear tareas con prioridad y fecha límite' },
  { codigo_permiso: 'tareas:editar', descripcion: 'Editar tareas, prioridades, fechas o estados' },
  { codigo_permiso: 'tareas:eliminar', descripcion: 'Eliminar tareas' },
  { codigo_permiso: 'documentos:subir', descripcion: 'Adjuntar documentos a módulos o tareas' },
  { codigo_permiso: 'eventos:ver', descripcion: 'Consultar eventos y recordatorios agendados (solo lectura)' },
  { codigo_permiso: 'eventos:gestionar', descripcion: 'Ver y programar recordatorios o alertas' },
];

const MATRIZ = {
  jefatura: PERMISOS.map((p) => p.codigo_permiso),
  analista_ap: ['modulos:ver', 'tareas:leer', 'tareas:crear', 'tareas:editar', 'documentos:subir', 'eventos:ver', 'eventos:gestionar'],
  visor: ['modulos:ver', 'tareas:leer', 'eventos:ver'],
};

const MODULOS = [
  { codigo_modulo: 'PRIORIDAD', nombre_modulo: 'Prioridad', descripcion: 'Pagos urgentes, retenciones críticas y vencimientos inmediatos', orden_visual: 1 },
  { codigo_modulo: 'PROVEEDORES', nombre_modulo: 'Proveedores', descripcion: 'Conciliación de facturas, órdenes de compra y pagos a proveedores', orden_visual: 2 },
  { codigo_modulo: 'FRANQUICIAS', nombre_modulo: 'Franquicias', descripcion: 'Movimientos, cargos y liquidaciones asociadas a franquicias', orden_visual: 3 },
  { codigo_modulo: 'CORPORATIVO', nombre_modulo: 'Corporativo', descripcion: 'Gastos corporativos, servicios centrales y contratos matriz', orden_visual: 4 },
  { codigo_modulo: 'FACTURAS_GENERALES', nombre_modulo: 'Facturas Generales', descripcion: 'Facturas operativas recurrentes y registros generales de AP', orden_visual: 5 },
];

async function main(prisma, hasher, env, log = console.log) {
  const roles = {};
  for (const r of ROLES) {
    roles[r.nombre_rol] = await prisma.rol.upsert({ where: { nombre_rol: r.nombre_rol }, update: { descripcion: r.descripcion }, create: r });
  }

  const permisos = {};
  for (const p of PERMISOS) {
    permisos[p.codigo_permiso] = await prisma.permiso.upsert({ where: { codigo_permiso: p.codigo_permiso }, update: { descripcion: p.descripcion }, create: p });
  }

  for (const [rol, codigos] of Object.entries(MATRIZ)) {
    for (const codigo of codigos) {
      const clave = { id_rol: roles[rol].id_rol, id_permiso: permisos[codigo].id_permiso };
      await prisma.permisoRol.upsert({ where: { id_rol_id_permiso: clave }, update: {}, create: clave });
    }
  }

  for (const m of MODULOS) {
    await prisma.modulo.upsert({ where: { codigo_modulo: m.codigo_modulo }, update: { nombre_modulo: m.nombre_modulo, descripcion: m.descripcion, orden_visual: m.orden_visual, activo: true }, create: m });
  }
  log('Datos base listos: roles, permisos y módulos.');

  const jefaturas = await prisma.usuario.count({ where: { rol: { nombre_rol: 'jefatura' } } });
  if (jefaturas > 0) {
    log('Ya existe al menos una jefatura: no se crea ningún usuario.');
    return;
  }

  const email = validarEmail(env.ADMIN_EMAIL);
  const clave = validarClave(env.ADMIN_PASSWORD);
  const nombre = (env.ADMIN_NAME || '').trim();
  if (!nombre) throw new Error('Falta ADMIN_NAME');

  await prisma.usuario.create({
    data: { nombre, email, password: await hasher.hash(clave, 12), id_rol: roles.jefatura.id_rol, activo: true },
  });
  log(`Primera jefatura creada: ${email}`);
}

module.exports = { main, MATRIZ, PERMISOS, MODULOS };

if (require.main === module) {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();
  main(prisma, bcrypt, process.env)
    .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
