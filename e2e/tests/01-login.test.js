const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { BASE_URL, USUARIOS, PASSWORD_DEMO } = require('../config');
const { entrarComo, salirSinUI, tokenGuardado, TOKEN_KEY } = require('../support/sesion');
const { visible, By } = require('../support/esperas');
const LoginPage = require('../pages/LoginPage');
const Shell = require('../pages/Shell');

describe('LOG · Inicio y cierre de sesión', function () {
  let d; let login; let shell;

  before(async () => { d = await crearDriver(); login = new LoginPage(d); shell = new Shell(d); });
  after(async () => { await d?.quit(); });
  beforeEach(async () => { await salirSinUI(d); await login.abrir(); });

  it('LOG-01 @humo ingresa con credenciales válidas y llega al Inicio', async () => {
    await login.ingresar(USUARIOS.jefatura.email, PASSWORD_DEMO);
    await d.wait(async () => (await d.findElements(By.xpath("//h1[contains(.,'Te damos la bienvenida')]"))).length > 0, 10000);
    assert.strictEqual(await login.rutaActual(), '/');
    assert.ok(await tokenGuardado(d), 'debe guardar el token');
  });

  it('LOG-02 rechaza una contraseña incorrecta y no inicia sesión', async () => {
    await login.ingresar(USUARIOS.jefatura.email, 'contraseña-equivocada-1');
    assert.strictEqual(await login.mensajeDeError(), 'Correo o contraseña incorrectos.');
    assert.strictEqual(await login.rutaActual(), '/login');
    assert.strictEqual(await tokenGuardado(d), null);
  });

  it('LOG-03 un correo inexistente muestra el mismo mensaje (no revela qué cuentas existen)', async () => {
    await login.ingresar('no.existe@empresa.local', 'cualquier-clave-123');
    assert.strictEqual(await login.mensajeDeError(), 'Correo o contraseña incorrectos.');
  });

  it('LOG-04 con campos vacíos el formulario no se envía', async () => {
    await login.enviar();
    assert.strictEqual(await login.campoVacioInvalido('email'), true);
    assert.strictEqual(await login.rutaActual(), '/login');
  });

  it('LOG-05 una ruta protegida sin sesión lleva al login y, al ingresar, vuelve a ella', async () => {
    await d.get(`${BASE_URL}/tareas`);
    await d.wait(async () => (await login.rutaActual()) === '/login', 8000);
    await login.ingresar(USUARIOS.analista.email, PASSWORD_DEMO);
    await d.wait(async () => (await login.rutaActual()) === '/tareas', 10000);
    await visible(d, By.xpath("//h1[normalize-space()='Tareas']"));
  });

  it('LOG-06 @humo cerrar sesión limpia el token y bloquea las pantallas', async () => {
    await entrarComo(d, 'visor');
    await shell.cerrarSesion();
    await d.wait(async () => (await login.rutaActual()) === '/login', 8000);
    assert.strictEqual(await tokenGuardado(d), null);
    await d.get(`${BASE_URL}/eventos`);
    await d.wait(async () => (await login.rutaActual()) === '/login', 8000);
  });

  it('LOG-07 un token inválido guardado en el navegador obliga a iniciar sesión de nuevo', async () => {
    await d.executeScript(`window.localStorage.setItem('${TOKEN_KEY}', 'token.falso.123')`);
    await d.get(`${BASE_URL}/`);
    await d.wait(async () => (await login.rutaActual()) === '/login', 10000);
    await visible(d, By.id('email'));
  });

  it('LOG-08 la pantalla de login muestra el nombre de la empresa', async () => {
    assert.strictEqual(await login.titulo(), 'Empresa Ficticia');
  });
});
