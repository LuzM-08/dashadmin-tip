const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
  console.log('Iniciando seed para Cuentas por Pagar (Dashboard Admin V2)...');

  // 1. Roles
  const rolesData = [
    { nombre_rol: 'jefatura', descripcion: 'Jefatura de Cuentas por Pagar con control total y rotación de módulos' },
    { nombre_rol: 'analista_ap', descripcion: 'Analista de Cuentas por Pagar encargado de tareas, avances y documentos' },
    { nombre_rol: 'visor', descripcion: 'Consulta y trazabilidad de módulos y tareas' },
  ];

  const rolesMap = {};
  for (const r of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { nombre_rol: r.nombre_rol },
      update: { descripcion: r.descripcion },
      create: r,
    });
    rolesMap[r.nombre_rol] = rol;
  }

  // 2. Permisos y matriz PermisoRol
  const permisosData = [
    { codigo_permiso: 'modulos:ver', descripcion: 'Visualizar módulos de Cuentas por Pagar' },
    { codigo_permiso: 'modulos:rotar', descripcion: 'Asignar o rotar responsables semanales de módulos' },
    { codigo_permiso: 'tareas:leer', descripcion: 'Consultar tareas y estados' },
    { codigo_permiso: 'tareas:crear', descripcion: 'Crear tareas con prioridad y fecha límite' },
    { codigo_permiso: 'tareas:editar', descripcion: 'Editar tareas, prioridades, fechas o estados' },
    { codigo_permiso: 'tareas:eliminar', descripcion: 'Eliminar tareas' },
    { codigo_permiso: 'documentos:subir', descripcion: 'Adjuntar documentos a módulos o tareas' },
    { codigo_permiso: 'eventos:gestionar', descripcion: 'Ver y programar recordatorios o alertas' },
    { codigo_permiso: 'eventos:ver', descripcion: 'Consultar eventos y recordatorios agendados (solo lectura)' },
  ];

  const permisosMap = {};
  for (const p of permisosData) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo_permiso: p.codigo_permiso },
      update: { descripcion: p.descripcion },
      create: p,
    });
    permisosMap[p.codigo_permiso] = permiso;
  }

  const asignacionesPermisos = {
    jefatura: Object.keys(permisosMap),
    analista_ap: [
      'modulos:ver',
      'tareas:leer',
      'tareas:crear',
      'tareas:editar',
      'documentos:subir',
      'eventos:gestionar',
    ],
        analista_ap: [
      'modulos:ver',
      'tareas:leer',
      'tareas:crear',
      'tareas:editar',
      'documentos:subir',
      'eventos:ver',
      'eventos:gestionar',
    ],
    visor: ['modulos:ver', 'tareas:leer', 'eventos:ver'],
  };

  for (const [nombreRol, codigos] of Object.entries(asignacionesPermisos)) {
    const idRol = rolesMap[nombreRol].id_rol;
    for (const codigo of codigos) {
      const idPermiso = permisosMap[codigo].id_permiso;
      await prisma.permisoRol.upsert({
        where: { id_rol_id_permiso: { id_rol: idRol, id_permiso: idPermiso } },
        update: {},
        create: { id_rol: idRol, id_permiso: idPermiso },
      });
    }
  }

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

  // 4. Los 5 Módulos de Cuentas por Pagar
  const modulosData = [
    {
      codigo_modulo: 'PRIORIDAD',
      nombre_modulo: 'Prioridad',
      descripcion: 'Pagos urgentes, retenciones críticas y vencimientos inmediatos',
      orden_visual: 1,
    },
    {
      codigo_modulo: 'PROVEEDORES',
      nombre_modulo: 'Proveedores',
      descripcion: 'Conciliación de facturas, órdenes de compra y pagos a proveedores',
      orden_visual: 2,
    },
    {
      codigo_modulo: 'FRANQUICIAS',
      nombre_modulo: 'Franquicias',
      descripcion: 'Movimientos, cargos y liquidaciones asociadas a franquicias',
      orden_visual: 3,
    },
    {
      codigo_modulo: 'CORPORATIVO',
      nombre_modulo: 'Corporativo',
      descripcion: 'Gastos corporativos, servicios centrales y contratos matriz',
      orden_visual: 4,
    },
    {
      codigo_modulo: 'FACTURAS_GENERALES',
      nombre_modulo: 'Facturas Generales',
      descripcion: 'Facturas operativas recurrentes y registros generales de AP',
      orden_visual: 5,
    },
  ];

  const modulosMap = {};
  for (const m of modulosData) {
    const modulo = await prisma.modulo.upsert({
      where: { codigo_modulo: m.codigo_modulo },
      update: {
        nombre_modulo: m.nombre_modulo,
        descripcion: m.descripcion,
        orden_visual: m.orden_visual,
        activo: true,
      },
      create: m,
    });
    modulosMap[m.codigo_modulo] = modulo;
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