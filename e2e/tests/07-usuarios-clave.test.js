const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { USUARIOS, PASSWORD_DEMO, PESTANAS } = require('../config');
const { entrarComo, entrarConToken, salirSinUI, tokenGuardado } = require('../support/sesion');
const { visible, existe, elegir, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');
const LoginPage = require('../pages/LoginPage');
const Shell = require('../pages/Shell');
const UsuariosPage = require('../pages/UsuariosPage');
const CuentaPage = require('../pages/CuentaPage');

// Todo el ciclo de vida de UNA cuenta creada para la prueba (nunca se tocan las cuentas demo).
describe('USR · Administración de usuarios y cambio de contraseña', function () {
  const marca = datos.sello();
  const email = `e2e.${marca}@empresa.local`;
  const nombre = `E2E Usuario ${marca}`;
  const claveInicial = `Inicial${marca}A1`;
  const claveNueva = `Nueva${marca}B2c`;
  const claveReset = `Reset${marca}C3d`;
  let claveVigente = claveInicial; // la contraseña que la cuenta tiene en cada momento (no depende de qué casos se ejecuten)
  let d; let login; let shell; let usuarios; let cuenta; let tokenInicial; let tokenCambio;

  before(async () => {
    d = await crearDriver();
    login = new LoginPage(d); shell = new Shell(d); usuarios = new UsuariosPage(d); cuenta = new CuentaPage(d);
  });
  after(async () => { await d?.quit(); await datos.desactivarUsuariosE2E().catch(() => {}); });

  describe('administración (jefatura)', () => {
    before(async () => { await entrarComo(d, 'jefatura', '/usuarios'); await usuarios.abrir(); });

    it('USR-01 @humo crea un usuario y aparece en la lista como activo', async () => {
      await usuarios.crear({ nombre, email, rol: 'Analista AP', clave: claveInicial });
      await usuarios.esperarCerrado();
      assert.ok((await usuarios.avisoDePagina()).includes('Usuario creado'));
      const fila = await usuarios.textoFila(email);
      assert.ok(fila.includes(nombre) && fila.includes('Analista AP') && fila.includes('Activo'));
    });

    it('USR-02 no permite crear otro usuario con el mismo correo', async () => {
      await usuarios.crear({ nombre: `${nombre} copia`, email, rol: 'Visor', clave: claveInicial });
      assert.ok((await usuarios.errorDelDialogo()).includes('Ya existe un usuario con ese correo'));
      await usuarios.cancelarDialogo();
    });

    it('USR-03 rechaza una contraseña inicial débil con el motivo', async () => {
      await usuarios.crear({ nombre: 'E2E débil', email: `e2e.debil.${marca}@empresa.local`, rol: 'Visor', clave: 'corta1' });
      assert.ok((await usuarios.errorDelDialogo()).includes('al menos 12 caracteres'));
      await usuarios.cancelarDialogo();
      assert.strictEqual(await usuarios.existeUsuario(`e2e.debil.${marca}@empresa.local`), false);
    });

    it('USR-04 rechaza la contraseña de demostración', async () => {
      await usuarios.crear({ nombre: 'E2E demo', email: `e2e.demo.${marca}@empresa.local`, rol: 'Visor', clave: PASSWORD_DEMO });
      assert.ok((await usuarios.errorDelDialogo()).includes('demostración'));
      await usuarios.cancelarDialogo();
    });

    it('USR-05 en su propia fila la jefatura no puede restablecer clave, ni cambiarse el rol ni desactivarse', async () => {
      const propio = USUARIOS.jefatura.email;
      assert.deepStrictEqual(await usuarios.botonesDeFila(propio), ['Editar']);
      await usuarios.editar(propio);
      assert.strictEqual(await usuarios.selectorRolDeshabilitado(), true);
      assert.strictEqual(await usuarios.checkboxActivoDeshabilitado(), true);
      await usuarios.cancelarDialogo();
    });
  });

  describe('el usuario nuevo entra y cambia su propia contraseña', () => {
    it('USR-06 @humo el usuario nuevo inicia sesión con la contraseña inicial y ve las pestañas de analista', async () => {
      await salirSinUI(d);
      await login.abrir();
      await login.ingresar(email, claveInicial);
      await visible(d, By.css('nav[aria-label="Secciones"]'));
      assert.deepStrictEqual(await shell.pestanas(), PESTANAS.analista);
      tokenInicial = await tokenGuardado(d);
      assert.ok(tokenInicial);
    });

    it('USR-07 "Mi cuenta" muestra los datos de la persona', async () => {
      await shell.irAMiCuenta();
      await cuenta.esperarPantalla();
      const texto = await cuenta.datosDeCuenta();
      assert.ok(texto.includes(nombre) && texto.includes(email) && texto.includes('Analista AP'));
    });

    it('USR-08 con la contraseña actual equivocada muestra el error y NO cierra la sesión', async () => {
      await cuenta.cambiar({ actual: 'clave-equivocada-123', nueva: claveNueva });
      await cuenta.enviar();
      assert.ok((await cuenta.mensajeError()).includes('contraseña actual no es correcta'));
      await visible(d, By.css('nav[aria-label="Secciones"]')); // sigue dentro
      assert.ok(await tokenGuardado(d), 'el token no debe borrarse por un error de validación');
    });

    it('USR-09 si la confirmación no coincide, el botón queda deshabilitado', async () => {
      await cuenta.cambiar({ actual: claveInicial, nueva: claveNueva, repetir: `${claveNueva}x` });
      assert.strictEqual(await cuenta.botonHabilitado(), false);
      assert.ok((await d.findElement(By.css('body')).getText()).includes('no coinciden'));
    });

    it('USR-10 una contraseña nueva débil o igual a la actual se avisa antes de enviar', async () => {
      await cuenta.cambiar({ actual: claveInicial, nueva: 'corta1' });
      assert.ok((await cuenta.ayudaNueva()).includes('al menos 12 caracteres'));
      assert.strictEqual(await cuenta.botonHabilitado(), false);
      await cuenta.cambiar({ actual: claveInicial, nueva: claveInicial });
      assert.ok((await cuenta.ayudaNueva()).includes('distinta de la actual'));
      await cuenta.cambiar({ actual: claveInicial, nueva: 'soloLetrasLargasAqui' });
      assert.ok((await cuenta.ayudaNueva()).includes('letras y números'));
    });

    it('USR-11 @humo cambia la contraseña: mensaje de éxito, la sesión sigue activa y la clave vieja deja de servir', async () => {
      await cuenta.abrir();
      await cuenta.cambiar({ actual: claveInicial, nueva: claveNueva });
      await cuenta.enviar();
      assert.ok((await cuenta.mensajeOk()).includes('Contraseña actualizada'));
      claveVigente = claveNueva;
      await visible(d, By.css('nav[aria-label="Secciones"]'));
      tokenCambio = await tokenGuardado(d);
      assert.notStrictEqual(tokenCambio, tokenInicial, 'se emite un token nuevo');

      assert.strictEqual((await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveInicial }, esperado: [401] })).status, 401);
      assert.strictEqual((await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveNueva } })).status, 200);
    });

    it('USR-12 el token anterior al cambio de contraseña queda invalidado (cierra otras sesiones)', async () => {
      assert.strictEqual((await api.pedirConToken(tokenInicial, 'GET', '/auth/me', { esperado: [401] })).status, 401);
      assert.strictEqual((await api.pedirConToken(tokenCambio, 'GET', '/auth/me')).status, 200);
    });
  });

  describe('acciones de la jefatura sobre ese usuario', () => {
    before(async () => { await entrarComo(d, 'jefatura', '/usuarios'); await usuarios.abrir(); });

    it('USR-13 restablece la contraseña y las sesiones abiertas de esa persona dejan de servir', async () => {
      await usuarios.restablecerClave(email, claveReset);
      await usuarios.esperarCerrado();
      assert.ok((await usuarios.avisoDePagina()).includes('restablecida'));
      assert.strictEqual((await api.pedirConToken(tokenCambio, 'GET', '/auth/me', { esperado: [401] })).status, 401);
      assert.strictEqual((await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveReset } })).status, 200);
      claveVigente = claveReset;
    });

    it('USR-14 cambia el rol a Visor y los permisos cambian de inmediato, sin volver a iniciar sesión', async () => {
      const token = (await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveVigente } })).json.data.token;
      const cuerpo = { id_modulo: await datos.idModulo(), titulo: datos.nombreUnico('rol'), estado: 'Sin iniciar', prioridad: 'Media' };
      const creada = await api.pedirConToken(token, 'POST', '/tareas', { cuerpo }); // como analista puede
      await api.pedir('jefatura', 'DELETE', `/tareas/${creada.json.data.id_tarea}`);

      await usuarios.editar(email);
      await elegir(d, By.id('u-rol'), 'Visor');
      await (await visible(d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
      await usuarios.esperarCerrado();
      assert.ok((await usuarios.textoFila(email)).includes('Visor'));

      const res = await api.pedirConToken(token, 'POST', '/tareas', { cuerpo: { ...cuerpo, titulo: datos.nombreUnico('rol2') }, esperado: [403] });
      assert.strictEqual(res.status, 403);
    });

    it('USR-15 @humo desactiva la cuenta: figura como Inactivo, no puede entrar y su sesión abierta se cierra', async () => {
      const token = (await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveVigente } })).json.data.token;
      await usuarios.editar(email);
      await usuarios.desactivarDesdeEdicion();
      await usuarios.esperarCerrado();
      assert.ok((await usuarios.textoFila(email)).includes('Inactivo'));

      assert.strictEqual((await api.pedirConToken(token, 'GET', '/auth/me', { esperado: [401] })).status, 401);
      assert.strictEqual((await api.llamar('POST', '/auth/login', { cuerpo: { email, password: claveVigente }, esperado: [401] })).status, 401);
    });

    it('USR-16 el servidor impide dejar el sistema sin jefatura activa (la única jefatura no se puede desactivar)', async function () {
      const lista = (await api.pedir('jefatura', 'GET', '/admin/usuarios')).json.data;
      const jefaturas = lista.filter((u) => u.rol.nombre_rol === 'jefatura' && u.activo);
      if (jefaturas.length !== 1) return this.skip(); // la regla solo es verificable con una sola jefatura activa
      const res = await api.pedir('jefatura', 'PATCH', `/admin/usuarios/${jefaturas[0].id_usuario}`, { cuerpo: { activo: false }, esperado: [400, 409] });
      assert.ok([400, 409].includes(res.status));
    });
  });

  describe('Mi cuenta para el rol visor', () => {
    it('USR-17 el visor accede a "Mi cuenta" y, con la clave actual equivocada, recibe un error controlado', async () => {
      await entrarComo(d, 'visor', '/cuenta');
      await cuenta.esperarPantalla();
      await cuenta.cambiar({ actual: 'no-es-la-actual-1', nueva: `Valida${marca}9z` });
      await cuenta.enviar();
      assert.ok((await cuenta.mensajeError()).includes('contraseña actual no es correcta'));
      assert.strictEqual(await existe(d, By.id('clave-actual')), true);
    });
  });
});
