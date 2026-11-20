<div align="center">

# Dashboard Administrativo - Cuentas por Pagar

**Documentación, acceso y rastreabilidad**

[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=0A192F)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Infrastructure-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

## Introducción

**Dashboard administrativo** diseñado para responder a las necesidades de documentación, acceso y rastreabilidad que se presentan en el equipo de Cuentas por Pagar del departamento de Finanzas.

El proyecto permite centralizar tareas, documentos, recordatorios y permisos dentro de una experiencia administrativa clara y organizada.

## Tecnologías

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Node.js, Docker, PostgreSQL, Prisma ORM, Mailpit y Multer |
| **Frontend** | React y Tailwind CSS |

## Arquitectura

El proyecto implementa una arquitectura **Single Page Application (SPA)**. La aplicación carga inicialmente `index.html` y, a partir de ese punto, los elementos de la interfaz se actualizan dinámicamente sin necesidad de reiniciar ni recargar la página principal.

## Esquema de datos

El esquema se encuentra organizado en dos grandes grupos: seguridad y acceso, y operaciones de Cuentas por Pagar.

```text
db_cuentas_por_pagar (PostgreSQL 15)
|
|-- ACCESO Y SEGURIDAD (RBAC)
|   |-- Rol (id_rol, nombre_rol)
|       |-- PermisoRol (id_rol, id_permiso)
|       |   |-- Permiso (id_permiso, codigo_permiso)
|       |
|       |-- Usuario (id_usuario, nombre, email, password, activo, id_rol)
|           |
|           |-- Relaciones de Usuario
|               |-- RotacionSemanal (id_rotacion, id_usuario, id_modulo, fecha_inicio, fecha_fin)
|               |-- Tarea [Creador] (id_tarea, id_creador)
|               |-- Tarea [Asignado] (id_tarea, id_asignado)
|               |-- Documento [Subido por] (id_documento, id_usuario)
|               |-- RecordatorioEvento [Creador] (id_evento, id_creador)
|               |-- LogAuditoria (id_log, id_usuario, accion, entidad, fecha)
|
|-- OPERACIONES Y MODULOS DE AP
    |-- Modulo (id_modulo, nombre_modulo, descripcion, orden_visual)
    |   |-- Prioridad
    |   |-- Proveedores
    |   |-- Franquicias
    |   |-- Corporativo
    |   `-- Facturas Generales
    |
    |-- RotacionSemanal (id_modulo, id_usuario, semana_anio, anio)
    |-- Documento (id_documento, id_modulo, id_tarea, nombre_original, ruta_archivo)
    `-- Tarea (id_tarea, id_modulo, titulo, estado, prioridad, fecha_limite)
        |
        |-- Documento (id_tarea, ...)
        `-- RecordatorioEvento (id_evento, id_tarea, titulo, fecha_evento, alerta_enviada)
