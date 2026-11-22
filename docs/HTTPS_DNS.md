# HTTPS y DNS

Hoy los usuarios entran por `http://IP`. Con esto pasan a `https://dashboard-ap.tuempresa.cl`.
Un **proxy Caddy** es la única puerta de entrada (puertos 80 y 443): redirige HTTP a HTTPS, maneja el certificado y reenvía a la aplicación.

```
Usuario ──HTTPS──▶ Caddy (443) ──▶ nginx (SPA) ──▶ backend ──▶ PostgreSQL
```

## 1. Elegir el modo (`TLS_MODO` en `.env.prod`)

| ¿Dónde está el servidor? | Modo | Qué necesitas |
|---|---|---|
| Accesible desde Internet (nube, IP pública) | `letsencrypt` | Dominio propio, DNS público, puertos 80 y 443 abiertos |
| Solo red interna de la empresa | `archivos` (recomendado) | Certificado emitido por TI (CA corporativa) + nombre en el DNS interno |
| Solo red interna, sin certificado de TI | `interno` | Instalar la CA de Caddy en cada equipo (si no, advertencia en el navegador) |

Let's Encrypt **verifica desde Internet**: si el servidor no es alcanzable desde fuera, `letsencrypt` no funciona.

## 2. DNS: crear el nombre
El DNS es un registro, no algo que se instale. Hay que crear un registro **A** que apunte el nombre a la IP del servidor:

| Dónde se crea | Quién | IP a usar |
|---|---|---|
| DNS público (proveedor del dominio: GoDaddy, Cloudflare, NIC Chile, etc.) | Quien administra el dominio | IP **pública** del servidor |
| DNS interno (Active Directory / servidor DNS de la empresa) | TI / infraestructura | IP **de la red interna** del servidor |

Ejemplo: `dashboard-ap.tuempresa.cl   A   203.0.113.10   TTL 300`.
Si no hay dominio propio, pídele a TI un subdominio de uno existente (`dashboard-ap.tuempresa.cl`).

**Comprobar que resuelve** (desde un equipo de usuario, no solo desde el servidor):
```powershell
nslookup dashboard-ap.tuempresa.cl
```
Debe devolver la IP del servidor. Un cambio de DNS puede tardar minutos (hasta el TTL anterior).

**Para probar antes de que exista el DNS** (solo en tu equipo), agrega una línea al archivo `C:\Windows\System32\drivers\etc\hosts` (como administrador):
```
203.0.113.10   dashboard-ap.tuempresa.cl
```
Esto sirve para probar la aplicación, pero no para `letsencrypt` (que valida desde Internet).

## 2b. Mientras no exista el DNS: entrar por la IP
Sirve para usar el sistema hoy mismo. En `.env.prod`:
```
DOMINIO=192.168.1.50      # la IP del servidor (ipconfig en Windows; hostname -I en Linux)
TLS_MODO=interno
```
y luego `dc up -d`. Entra a `https://192.168.1.50`. El navegador avisará que el certificado no es de confianza
(lo emitió la CA local de Caddy): **Avanzadas → Continuar** es lo esperado. Para quitar la advertencia, instala la CA (sección 6).
Cuando exista el DNS, cambia `DOMINIO` y `TLS_MODO` y vuelve a ejecutar `dc up -d` (los enlaces de los correos pasan a usar el nombre nuevo).

## 3. Red y firewall
El servidor debe aceptar conexiones entrantes **TCP 80 y 443**.
- Firewall del servidor (Windows: Firewall de Windows Defender → reglas de entrada; Linux: `ufw allow 80,443/tcp`).
- Si está detrás de un router/firewall de la empresa o de la nube: abrir/redirigir esos puertos a la IP del servidor (grupo de seguridad en la nube).
- El puerto 80 debe quedar abierto aunque uses HTTPS: lo usa Let's Encrypt para validar y Caddy para redirigir.
- Ningún otro programa puede ocupar el 80 o el 443 (IIS, otro nginx…): `netstat -ano | findstr ":80 :443"`.

## 4. Configurar y levantar
En `.env.prod` define `DOMINIO`, `TLS_MODO` y, si usas Let's Encrypt, `ACME_EMAIL`. Luego:
```powershell
function dc { docker compose -f docker-compose.prod.yml --env-file .env.prod @args }
dc up -d --build
dc logs caddy --tail 50
```
- `letsencrypt`: el log debe mostrar que el certificado se obtuvo (“certificate obtained successfully”).
  **Recomendado la primera vez:** usar el entorno de ensayo agregando `ACME_CA=https://acme-staging-v02.api.letsencrypt.org/directory` en `.env.prod`; el navegador mostrará advertencia (es normal en ensayo). Cuando funcione, quita esa línea, ejecuta `dc down caddy` y `docker volume rm ap_prod_caddy_data`, y vuelve a levantar para obtener el certificado real. Let's Encrypt limita los intentos fallidos por hora.
- `archivos`: copia `cert.pem` (certificado + cadena) y `key.pem` en `./certs/` antes de levantar.

## 5. Verificar
- [ ] `nslookup` devuelve la IP correcta desde un equipo de usuario.
- [ ] `http://dashboard-ap.tuempresa.cl` redirige solo a `https://…`.
- [ ] El navegador muestra el candado, sin advertencias.
- [ ] El inicio de sesión funciona y recargar en `/tareas` no da error.
- [ ] Los enlaces de los correos abren `https://…`.
- [ ] Tras unos días de uso sin problemas: subir `HSTS_SEGUNDOS` a `31536000` y ejecutar `dc up -d`.
      (HSTS obliga al navegador a usar siempre HTTPS: no subirlo hasta estar seguro de que HTTPS funciona.)

## 6. Modo `interno`: instalar la CA en los equipos
Caddy genera su propia autoridad. Extrae su certificado raíz:
```powershell
docker cp ap_prod_edge:/data/caddy/pki/authorities/local/root.crt .\caddy-root.crt
```
e instálalo en los equipos como **Entidad de certificación raíz de confianza** (en Windows: doble clic → Instalar certificado → Equipo local → “Entidades de certificación raíz de confianza”; en una empresa, TI lo distribuye por directiva de grupo). Guarda ese archivo: si el volumen `ap_prod_caddy_data` se borra, se genera otra CA distinta y hay que reinstalarla en todos los equipos.

## 7. Si no puedo acceder
Probar en este orden, parando en el primer fallo:
1. **El servicio está arriba:** `dc ps` → los cuatro servicios en `healthy`/`running`. Si no: `dc logs <servicio> --tail 50`.
2. **Desde el propio servidor:** `curl.exe -k https://localhost/healthz` (debe responder `ok`).
3. **El DNS resuelve:** `nslookup dominio` desde otro equipo. Si falla: es el registro DNS.
4. **El puerto llega:** desde otro equipo `Test-NetConnection IP-DEL-SERVIDOR -Port 443`. Si falla: firewall del servidor, de la red o de la nube.
5. **El certificado:** `dc logs caddy --tail 100`. Errores típicos: “no such host”/“connection refused” en la validación (DNS o puerto 80 cerrado), o límite de Let's Encrypt (esperar o usar ensayo).
