# Despliegue en producción · Dashboard AP

Arquitectura: **nginx** sirve la SPA y reenvía `/api` al **backend**; el backend usa **PostgreSQL** y guarda los documentos en un volumen.
Solo se expone un puerto (`HTTP_PORT`). La base de datos no es accesible desde fuera de Docker.

## 1. Requisitos
- Docker + Docker Compose en el servidor.
- Un servidor SMTP de la empresa (host, puerto, usuario y clave).
- (Recomendado) Un nombre DNS y HTTPS (ver sección 9).

## 2. Configurar
```powershell
copy .env.prod.example .env.prod
```
Completa `.env.prod`. El secreto JWT se genera con:
```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
El backend **se niega a arrancar** en producción si `JWT_SECRET` tiene menos de 32 caracteres o si `CORS_ORIGIN` falta o es `*`.

Atajo para no repetir parámetros (PowerShell):
```powershell
function dc { docker compose -f docker-compose.prod.yml --env-file .env.prod @args }
```

## 3. Levantar
```powershell
dc up -d --build
dc ps                       # los tres servicios deben quedar "healthy"
dc logs app-node --tail 30  # debe decir "API escuchando en :4000"
```
Las migraciones de base de datos se aplican solas al arrancar el backend.

## 4. Datos base y primera jefatura
```powershell
dc exec -e ADMIN_EMAIL=jefa@tuempresa.cl -e "ADMIN_NAME=Nombre Apellido" -e "ADMIN_PASSWORD=una-clave-larga-y-unica" app-node node prisma/seed.prod.js
```
Crea roles, permisos, los 5 módulos y la primera jefatura. **No** crea usuarios ni tareas de demostración.
Es repetible: si ya existe una jefatura, solo sincroniza roles, permisos y módulos (no pide credenciales).
La clave queda en el historial de la terminal: bórralo (`Clear-History`) o restablece la clave después (sección 5).

## 5. Usuarios (por ahora, por línea de comandos)
```powershell
# Crear (ROL: jefatura | analista_ap | visor; clave de 12 caracteres o más)
dc exec -e ACCION=crear -e EMAIL=ana@tuempresa.cl -e "NOMBRE=Ana Pérez" -e ROL=analista_ap -e "PASSWORD=clave-larga-123" app-node node prisma/usuario.js

# Restablecer clave / desactivar / activar
dc exec -e ACCION=clave -e EMAIL=ana@tuempresa.cl -e "PASSWORD=otra-clave-larga-1" app-node node prisma/usuario.js
dc exec -e ACCION=desactivar -e EMAIL=ana@tuempresa.cl app-node node prisma/usuario.js
dc exec -e ACCION=activar -e EMAIL=ana@tuempresa.cl app-node node prisma/usuario.js
```
No se puede desactivar a la única jefatura activa.

## 6. Primer uso
1. Ingresar como jefatura.
2. En cada módulo → **Asignar semana**: elegir el responsable de esta semana (requiere usuarios con rol analista o jefatura).
3. Desde ahí, cada viernes a las 18:00 el sistema genera solo la rotación de la semana siguiente y avisa por correo.

## 7. Verificación posterior al despliegue
- [ ] `http://SERVIDOR/healthz` responde `ok`.
- [ ] El inicio de sesión funciona y **no** aparece el menú "Cambiar vista" ni la insignia "Modo pruebas".
- [ ] Recargar la página en `/tareas` (F5) no da error 404.
- [ ] Subir un PDF, abrirlo con **Ver** y descargarlo (confirma que la política CSP permite la vista previa).
- [ ] Programar un recordatorio para dentro de 2 minutos: debe llegar el correo.
- [ ] 11 intentos fallidos de login desde un equipo bloquean a ese equipo, pero otro equipo puede seguir ingresando (confirma que se ve la IP real).
- [ ] `docker ps` muestra publicado solo el puerto del frontend (no 5432 ni 4000).

## 8. Actualizar a una nueva versión
```powershell
git pull        # o copiar los archivos nuevos
dc up -d --build
```
Los volúmenes (base de datos y documentos) se conservan. Antes de actualizar, haz un respaldo (sección 9).

## 9. Respaldos y restauración
Los datos viven en dos volúmenes: `ap_prod_pgdata` (base de datos) y `ap_prod_uploads` (documentos). **Hay que respaldar ambos.**
```powershell
# Base de datos
dc exec -T postgres sh -c 'pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -Fc -f /tmp/respaldo.dump'
docker cp ap_prod_db:/tmp/respaldo.dump .\respaldo-AAAA-MM-DD.dump

# Documentos
docker run --rm -v ap_prod_uploads:/datos -v ${PWD}:/respaldo alpine tar czf /respaldo/uploads-AAAA-MM-DD.tgz -C /datos .
```
Restaurar:
```powershell
docker cp .\respaldo-AAAA-MM-DD.dump ap_prod_db:/tmp/respaldo.dump
dc exec -T postgres sh -c 'pg_restore -U $POSTGRES_USER -d $POSTGRES_DB --clean --if-exists /tmp/respaldo.dump'
docker run --rm -v ap_prod_uploads:/datos -v ${PWD}:/respaldo alpine sh -c 'cd /datos && tar xzf /respaldo/uploads-AAAA-MM-DD.tgz'
```
Programa los respaldos (tarea programada del sistema) y guarda copias fuera del servidor. Prueba una restauración al menos una vez.

## 10. HTTPS
Las contraseñas y el token viajan por la red: **en producción debe usarse HTTPS**. Dos opciones:
- Poner delante un proxy/balanceador de la empresa que termine TLS y reenvíe a `HTTP_PORT`. Si hay un proxy adicional además de nginx, sube `TRUST_PROXY` a 2 en `docker-compose.prod.yml`.
- Terminar TLS en el propio nginx (certificados en `frontend/nginx/`) y activar la línea `Strict-Transport-Security` de `security-headers.conf`.

## 11. Pendientes conocidos
- No hay pantalla de administración de usuarios ni cambio de contraseña por el propio usuario (hoy: sección 5).
- Eliminar documentos usa la regla "autor o jefatura" (no existe un permiso propio).
- Los mensajes de validación del servidor llegan en inglés.
- No hay renovación automática de sesión: el token dura `JWT_EXPIRES_IN` (8 h).
- La tabla de auditoría crece sin límite; conviene definir una política de retención.
- `seed.prod.js` y `seed.js` repiten los permisos y módulos: si cambias uno, cambia el otro.
