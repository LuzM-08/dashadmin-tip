-- CreateTable
CREATE TABLE "Rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id_permiso" SERIAL NOT NULL,
    "codigo_permiso" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id_permiso")
);

-- CreateTable
CREATE TABLE "PermisoRol" (
    "id_rol" INTEGER NOT NULL,
    "id_permiso" INTEGER NOT NULL,

    CONSTRAINT "PermisoRol_pkey" PRIMARY KEY ("id_rol","id_permiso")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Modulo" (
    "id_modulo" SERIAL NOT NULL,
    "codigo_modulo" TEXT NOT NULL,
    "nombre_modulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden_visual" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Modulo_pkey" PRIMARY KEY ("id_modulo")
);

-- CreateTable
CREATE TABLE "RotacionSemanal" (
    "id_rotacion" SERIAL NOT NULL,
    "id_modulo" INTEGER NOT NULL,
    "id_responsable" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "alerta_enviada" BOOLEAN NOT NULL DEFAULT false,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RotacionSemanal_pkey" PRIMARY KEY ("id_rotacion")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id_tarea" SERIAL NOT NULL,
    "id_modulo" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Sin iniciar',
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "fecha_limite" TIMESTAMP(3),
    "alerta_enviada" BOOLEAN NOT NULL DEFAULT false,
    "id_creador" INTEGER NOT NULL,
    "id_asignado" INTEGER,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id_tarea")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id_documento" SERIAL NOT NULL,
    "id_modulo" INTEGER NOT NULL,
    "id_tarea" INTEGER,
    "id_subido_por" INTEGER NOT NULL,
    "nombre_original" TEXT NOT NULL,
    "nombre_almacenado" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tipo_mime" TEXT,
    "tamano_bytes" INTEGER,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id_documento")
);

-- CreateTable
CREATE TABLE "RecordatorioEvento" (
    "id_recordatorio" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_tarea" INTEGER,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_evento" TIMESTAMP(3) NOT NULL,
    "enviar_correo" BOOLEAN NOT NULL DEFAULT true,
    "correo_enviado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordatorioEvento_pkey" PRIMARY KEY ("id_recordatorio")
);

-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id_log" SERIAL NOT NULL,
    "id_usuario" INTEGER,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "id_entidad" INTEGER,
    "detalles" TEXT,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_rol_key" ON "Rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_codigo_permiso_key" ON "Permiso"("codigo_permiso");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Modulo_codigo_modulo_key" ON "Modulo"("codigo_modulo");

-- CreateIndex
CREATE INDEX "RotacionSemanal_id_modulo_fecha_inicio_fecha_fin_idx" ON "RotacionSemanal"("id_modulo", "fecha_inicio", "fecha_fin");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_nombre_almacenado_key" ON "Documento"("nombre_almacenado");

-- AddForeignKey
ALTER TABLE "PermisoRol" ADD CONSTRAINT "PermisoRol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermisoRol" ADD CONSTRAINT "PermisoRol_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "Permiso"("id_permiso") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotacionSemanal" ADD CONSTRAINT "RotacionSemanal_id_modulo_fkey" FOREIGN KEY ("id_modulo") REFERENCES "Modulo"("id_modulo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotacionSemanal" ADD CONSTRAINT "RotacionSemanal_id_responsable_fkey" FOREIGN KEY ("id_responsable") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_id_modulo_fkey" FOREIGN KEY ("id_modulo") REFERENCES "Modulo"("id_modulo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_id_creador_fkey" FOREIGN KEY ("id_creador") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_id_asignado_fkey" FOREIGN KEY ("id_asignado") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_id_modulo_fkey" FOREIGN KEY ("id_modulo") REFERENCES "Modulo"("id_modulo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_id_tarea_fkey" FOREIGN KEY ("id_tarea") REFERENCES "Tarea"("id_tarea") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_id_subido_por_fkey" FOREIGN KEY ("id_subido_por") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioEvento" ADD CONSTRAINT "RecordatorioEvento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordatorioEvento" ADD CONSTRAINT "RecordatorioEvento_id_tarea_fkey" FOREIGN KEY ("id_tarea") REFERENCES "Tarea"("id_tarea") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAuditoria" ADD CONSTRAINT "LogAuditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;
