const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { PESTANAS, BASE_URL } = require('../config');
const { entrarComo } = require('../support/sesion');
const { visible, existe, boton, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');
const Shell = require('../pages/Shell');
const TareasPage = require('../pages/TareasPage');

const sinAcceso = (d) => visible(d, By.xpath("//h1[normalize-space()='Sin acceso']"));

describe('PER · Permisos y navegación por rol', function () {
  let d; let shell;

  before(async () => { d = await crearDriver(); shell = new Shell(d); });
  after(async () => { await d?.quit(); await datos.limpiarTareas(); });

  describe('pestañas visibles', () => {
    for (const rol of ['jefatura', 'analista', 'visor']) {
      it(`PER-0${['jefatura', 'analista', 'visor'].indexOf(rol) + 1} @humo ${rol}: ve solo sus pestañas`, async () => {
        await entrarComo(d, rol);
        assert.deepStrictEqual(await shell.pestanas(), PESTANAS[rol]);
      });
    }
  });

  describe('barra superior y navegación', () => {
    before(async () => { await entrarComo(d, 'jefatura'); });

    it('PER-04 la pestaña Inicio existe y está activa en la ruta raíz', async () => {
      await shell.visitar('/');
      assert.strictEqual(await shell.pestanaActiva(), 'Inicio');
      await shell.irA('Tareas');
      await d.wait(async () => (await shell.pestanaActiva()) === 'Tareas', 5000);
      await shell.irA('Inicio');
      await d.wait(async () => (await shell.pestanaActiva()) === 'Inicio', 5000);
    });

    it('PER-05 la barra superior dice "Empresa Ficticia" y el ícono de la casa no es un enlace', async () => {
      assert.strictEqual(await shell.textoMarca(), 'Empresa Ficticia');
      assert.strictEqual(await shell.enlacesEnBarraSuperior(), 0);
    });

    it('PER-06 hacer clic en la casa o en el nombre no cambia de pantalla', async () => {
      await shell.visitar('/tareas');
      await (await visible(d, By.css('header .select-none'))).click();
      assert.strictEqual(new URL(await d.getCurrentUrl()).pathname, '/tareas');
    });
  });

  describe('restricciones de la interfaz', () => {
    it('PER-07 el visor no ve botones para crear, editar ni eliminar tareas', async () => {
      await entrarComo(d, 'visor', '/tareas');
      const tareas = new TareasPage(d);
      await tareas.esperarCarga();
      assert.strictEqual(await tareas.hayBotonNueva(), false);
      assert.strictEqual(await existe(d, boton('Editar')), false);
      assert.strictEqual(await existe(d, boton('Eliminar')), false);
    });

    it('PER-08 el visor ve Eventos en solo lectura (sin "Nuevo recordatorio")', async () => {
      await entrarComo(d, 'visor', '/eventos');
      await visible(d, By.xpath("//h1[normalize-space()='Eventos']"));
      assert.strictEqual(await existe(d, boton('Nuevo recordatorio')), false);
      assert.ok((await d.findElement(By.css('main, body')).getText()).includes('solo lectura'));
    });

    it('PER-09 el analista gestiona Eventos (ve "Nuevo recordatorio")', async () => {
      await entrarComo(d, 'analista', '/eventos');
      await visible(d, boton('Nuevo recordatorio'));
    });

    it('PER-10 solo la jefatura ve "Asignar semana" en el detalle de un módulo', async () => {
      const id = await datos.idModulo();
      for (const [rol, esperado] of [['jefatura', true], ['analista', false], ['visor', false]]) {
        await entrarComo(d, rol, `/modulos/${id}`);
        await visible(d, By.xpath("//h2[normalize-space()='Responsable y rotación']"));
        assert.strictEqual(await existe(d, boton('Asignar semana')), esperado, `rol ${rol}`);
      }
    });

    it('PER-11 el visor no ve el formulario para subir documentos', async () => {
      const id = await datos.idModulo();
      await entrarComo(d, 'visor', `/modulos/${id}`);
      await visible(d, By.id('titulo-docs'));
      assert.strictEqual(await existe(d, By.id('archivo')), false);
    });
  });

  describe('acceso directo por URL a pantallas restringidas', () => {
    for (const rol of ['visor', 'analista']) {
      it(`PER-${['visor', 'analista'].indexOf(rol) + 12} ${rol} escribe /usuarios en la barra y ve "Sin acceso"`, async () => {
        await entrarComo(d, rol, '/usuarios');
        await sinAcceso(d);
      });
    }

    it('PER-14 una ruta inexistente muestra "Página no encontrada"', async () => {
      await entrarComo(d, 'jefatura', '/esto-no-existe');
      await visible(d, By.xpath("//h1[normalize-space()='Página no encontrada']"));
    });
  });

  describe('Mi cuenta', () => {
    for (const rol of ['jefatura', 'analista', 'visor']) {
      it(`PER-${['jefatura', 'analista', 'visor'].indexOf(rol) + 15} ${rol} puede abrir "Mi cuenta" desde el menú del perfil`, async () => {
        await entrarComo(d, rol);
        await shell.irAMiCuenta();
        await visible(d, By.xpath("//h1[normalize-space()='Mi cuenta']"));
        await visible(d, By.id('clave-actual'));
      });
    }
  });

  describe('el servidor también impone los permisos (no basta con ocultar botones)', () => {
    it('PER-18 la API rechaza con 403 que el visor cree una tarea', async () => {
      const res = await api.pedir('visor', 'POST', '/tareas', {
        cuerpo: { id_modulo: await datos.idModulo(), titulo: datos.nombreUnico('visor'), estado: 'Sin iniciar', prioridad: 'Media' },
        esperado: [403],
      });
      assert.strictEqual(res.status, 403);
    });

    it('PER-19 la API rechaza con 403 que un analista elimine una tarea', async () => {
      const t = await datos.crearTarea('jefatura');
      const res = await api.pedir('analista', 'DELETE', `/tareas/${t.id_tarea}`, { esperado: [403] });
      assert.strictEqual(res.status, 403);
    });

    it('PER-20 la API de administración de usuarios responde 403 a analista y visor, y 401 sin token', async () => {
      for (const rol of ['analista', 'visor']) {
        assert.strictEqual((await api.pedir(rol, 'GET', '/admin/usuarios', { esperado: [403] })).status, 403);
      }
      assert.strictEqual((await api.llamar('GET', '/admin/usuarios', { esperado: [401] })).status, 401);
    });

    it('PER-21 el visor puede leer eventos pero la API le impide crearlos', async () => {
      assert.strictEqual((await api.pedir('visor', 'GET', '/eventos')).status, 200);
      const res = await api.pedir('visor', 'POST', '/eventos', {
        cuerpo: { titulo: 'E2E no debería crearse', fecha_evento: new Date(Date.now() + 86400000).toISOString() },
        esperado: [403],
      });
      assert.strictEqual(res.status, 403);
    });
  });
});
