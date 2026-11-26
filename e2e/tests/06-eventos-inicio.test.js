const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { entrarComo } = require('../support/sesion');
const { visible, existe, escribir, fijarValor, comillas, boton, fechaISO, sumarDias, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');
const Shell = require('../pages/Shell');

async function limpiarRecordatorios(clave) {
  const lista = (await api.pedir(clave, 'GET', '/eventos?limit=200')).json.data;
  for (const r of lista.filter((x) => x.titulo.startsWith(datos.PREFIJO))) {
    await api.pedir(clave, 'DELETE', `/eventos/${r.id_recordatorio}`, { esperado: [204, 404] });
  }
}

describe('EVT · Eventos, recordatorios y página de inicio', function () {
  let d; let shell;
  const titulo = datos.nombreUnico('recordatorio');

  before(async () => { d = await crearDriver(); shell = new Shell(d); });
  after(async () => { await d?.quit(); await limpiarRecordatorios('analista').catch(() => {}); });

  it('EVT-01 @humo el analista programa un recordatorio y aparece en la lista de próximos', async () => {
    await entrarComo(d, 'analista', '/eventos');
    await (await visible(d, boton('Nuevo recordatorio'))).click();
    await visible(d, By.id('r-titulo'));
    await escribir(d, By.id('r-titulo'), titulo);
    await escribir(d, By.id('r-descripcion'), 'Creado por Selenium');
    await fijarValor(d, By.id('r-fecha'), fechaISO(sumarDias(new Date(), 1)));
    await fijarValor(d, By.id('r-hora'), '09:00');
    await (await visible(d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
    await visible(d, By.xpath("//p[@role='status'][contains(.,'Recordatorio')]"));
    await visible(d, By.xpath(`//table//tr[.//*[normalize-space()=${comillas(titulo)}]]`));
  });

  it('EVT-02 @humo el recordatorio también se ve en la página de Inicio', async () => {
    await shell.visitar('/');
    await visible(d, By.xpath("//h2[normalize-space()='Próximos recordatorios']"));
    await visible(d, By.xpath(`//li[.//p[normalize-space()=${comillas(titulo)}]]`));
  });

  it('EVT-03 desde Inicio se puede ir a Eventos con el enlace "Ver todos en Eventos"', async () => {
    await (await visible(d, By.xpath("//a[normalize-space()='Ver todos en Eventos']"))).click();
    await visible(d, By.xpath("//h1[normalize-space()='Eventos']"));
  });

  it('EVT-04 el recordatorio es privado: otro analista no lo ve y la API responde 404', async () => {
    const mio = (await api.pedir('analista', 'GET', '/eventos?limit=200')).json.data.find((x) => x.titulo === titulo);
    assert.ok(mio, 'el analista debe verlo');
    const ajenos = (await api.pedir('analista2', 'GET', '/eventos?limit=200')).json.data;
    assert.ok(!ajenos.some((x) => x.titulo === titulo));
    assert.strictEqual((await api.pedir('analista2', 'DELETE', `/eventos/${mio.id_recordatorio}`, { esperado: [404] })).status, 404);
  });

  it('EVT-05 el analista elimina su recordatorio con confirmación', async () => {
    await entrarComo(d, 'analista', '/eventos');
    const fila = await visible(d, By.xpath(`//table//tr[.//*[normalize-space()=${comillas(titulo)}]]`));
    await (await fila.findElement(By.xpath(".//button[normalize-space()='Eliminar']"))).click();
    await (await visible(d, By.xpath("//div[@role='dialog']//button[normalize-space()='Eliminar']"))).click();
    await visible(d, By.xpath("//p[@role='status'][contains(.,'Recordatorio eliminado.')]"));
    await d.wait(async () => !(await existe(d, By.xpath(`//table//tr[.//*[normalize-space()=${comillas(titulo)}]]`))), 8000);
  });

  it('EVT-06 el visor ve la sección de recordatorios en Inicio y la pantalla Eventos sin controles de edición', async () => {
    await entrarComo(d, 'visor', '/');
    await visible(d, By.xpath("//h2[normalize-space()='Próximos recordatorios']"));
    await shell.irA('Eventos');
    await visible(d, By.xpath("//h1[normalize-space()='Eventos']"));
    assert.strictEqual(await existe(d, boton('Nuevo recordatorio')), false);
    assert.strictEqual(await existe(d, boton('Editar')), false);
    assert.strictEqual(await existe(d, boton('Eliminar')), false);
  });

  it('EVT-07 el Inicio muestra la bienvenida, las tareas por estado y los módulos activos', async () => {
    await entrarComo(d, 'jefatura', '/');
    await visible(d, By.xpath("//h1[contains(.,'Te damos la bienvenida')]"));
    await visible(d, By.xpath("//h2[normalize-space()='Tareas por estado']"));
    await visible(d, By.xpath("//h2[normalize-space()='Módulos activos']"));
  });
});
