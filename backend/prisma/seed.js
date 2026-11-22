const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { sembrarBase } = require('./datos-base');

const prisma = new PrismaClient();

function obtenerRangoSemanaActual() {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const fechaInicio = new Date(ahora);
  fechaInicio.setDate(ahora.getDate() + diffLunes);
  fechaInicio.setHours(0, 0, 0, 0);

  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaInicio.getDate() + 6);
  fechaFin.setHours(23, 59, 59, 999);

  return { fechaInicio, fechaFin };
}

async function main() {
  // Los datos de demostración (usuarios con clave pública conocida) jamás deben llegar a producción.
  if (process.env.NODE_ENV === 'production' && process.env.PERMITIR_SEED_DEMO !== 'true') {
    throw new Error('seed.js es solo para desarrollo/demo. En producción usa prisma/seed.prod.js');
  }

  console.log('Iniciando seed para Cuentas por Pagar (Dashboard Admin V2)...');

  // 1-2 y 4. Roles, permisos, matriz y módulos: compartidos con producción (datos-base.js).
  const { roles: rolesMap, modulos: modulosMap } = await sembrarBase(prisma);

  // 3. Usuarios de prueba (Password común para pruebas locales: "ApDemo2026!")
  const passwordHash = await bcrypt.hash('ApDemo2026!', 10);

  const usuariosData = [
    {
      nombre: 'Camila Rojas',
      email: 'jefatura.ap@empresa.local',
      password: passwordHash,
      id_rol: rolesMap['jefatura'].id_rol,
    },
    {
      nombre: 'Diego Fuentes',
      email: 'diego.fuentes@empresa.local',
      password: passwordHash,
      id_rol: rolesMap['analista_ap'].id_rol,
    },
    {
      nombre: 'Valentina Soto',
      email: 'valentina.soto@empresa.local',
      password: passwordHash,
      id_rol: rolesMap['analista_ap'].id_rol,
    },
    {
      nombre: 'Rodrigo Paredes',
      email: 'rodrigo.paredes@empresa.local',
      password: passwordHash,
      id_rol: rolesMap['visor'].id_rol,
    },
  ];

  const usuariosMap = {};
  for (const u of usuariosData) {
    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, id_rol: u.id_rol, activo: true },
      create: u,
    });
    usuariosMap[u.email] = usuario;
  }

  // 5. Rotación Semanal inicial (idempotente por módulo y fecha_inicio)
  const { fechaInicio, fechaFin } = obtenerRangoSemanaActual();
  const diego = usuariosMap['diego.fuentes@empresa.local'];
  const valentina = usuariosMap['valentina.soto@empresa.local'];
  const camila = usuariosMap['jefatura.ap@empresa.local'];

  const rotacionesSemana = [
    { codigo: 'PRIORIDAD', responsableId: camila.id_usuario },
    { codigo: 'PROVEEDORES', responsableId: diego.id_usuario },
    { codigo: 'FRANQUICIAS', responsableId: valentina.id_usuario },
    { codigo: 'CORPORATIVO', responsableId: diego.id_usuario },
    { codigo: 'FACTURAS_GENERALES', responsableId: valentina.id_usuario },
  ];

  for (const item of rotacionesSemana) {
    const idModulo = modulosMap[item.codigo].id_modulo;
    const existente = await prisma.rotacionSemanal.findFirst({
      where: { id_modulo: idModulo, fecha_inicio: fechaInicio },
    });

    if (!existente) {
      await prisma.rotacionSemanal.create({
        data: {
          id_modulo: idModulo,
          id_responsable: item.responsableId,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          alerta_enviada: false,
        },
      });
    }
  }

  // 6. Tareas iniciales de ejemplo (solo si aún no existen tareas sembradas)
  const totalTareas = await prisma.tarea.count();
  if (totalTareas === 0) {
    const enDosDias = new Date();
    enDosDias.setDate(enDosDias.getDate() + 2);

    const enCincoDias = new Date();
    enCincoDias.setDate(enCincoDias.getDate() + 5);

    const tareaPrioridad = await prisma.tarea.create({
      data: {
        id_modulo: modulosMap['PRIORIDAD'].id_modulo,
        titulo: 'Validar nómina urgente de proveedores críticos',
        descripcion: 'Revisar montos, retenciones y respaldo antes del cierre de ciclo.',
        estado: 'En progreso',
        prioridad: 'Critica',
        fecha_limite: enDosDias,
        id_creador: camila.id_usuario,
        id_asignado: diego.id_usuario,
      },
    });

    await prisma.tarea.createMany({
      data: [
        {
          id_modulo: modulosMap['PROVEEDORES'].id_modulo,
          titulo: 'Conciliar facturas recibidas del mes',
          descripcion: 'Cruzar documentos tributarios con recepción conforme.',
          estado: 'Sin iniciar',
          prioridad: 'Alta',
          fecha_limite: enCincoDias,
          id_creador: camila.id_usuario,
          id_asignado: diego.id_usuario,
        },
        {
          id_modulo: modulosMap['FRANQUICIAS'].id_modulo,
          titulo: 'Verificar liquidaciones semanales de franquicias',
          descripcion: 'Confirmar ajustes y comprobantes del periodo.',
          estado: 'Terminadas',
          prioridad: 'Media',
          fecha_limite: enCincoDias,
          id_creador: camila.id_usuario,
          id_asignado: valentina.id_usuario,
        },
      ],
    });

    await prisma.recordatorioEvento.create({
      data: {
        id_usuario: camila.id_usuario,
        id_tarea: tareaPrioridad.id_tarea,
        titulo: 'Revisión de cierre de facturas prioritarias',
        descripcion: 'Recordatorio automático previo a la fecha límite de la tarea.',
        fecha_evento: enDosDias,
        enviar_correo: true,
      },
    });
  }

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });