const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { entrarComo } = require('../support/sesion');
const { visible, ausente, existe, elegir, fijarValor, boton, fechaISO, sumarDias, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');

// Un miércoles dentro de 10 semanas: lejos de la rotación real (así no se pisa con datos de verdad).
function miercolesLejano() {
  const d = sumarDias(new Date(), 70);
  d.setDate(d.getDate() + ((3 - d.getDay() + 7) % 7));
  return d;
}

const filaProgramada = (nombre) => By.xpath(`//table[caption[normalize-space()='Historial de rotaciones']]//tr[td[normalize-space()='${nombre}']][.//span[normalize-space()='Programada']]`);

describe('MOD · Módulos y rotación semanal', function () {
  let d; let idMod; let semana; let analista; let analista2;

  async function limpiarSemana() {
    const desde = fechaISO(sumarDias(semana, -3));
    const hasta = fechaISO(sumarDias(semana, 3));
    const lista = (await api.pedir('jefatura', 'GET', `/modulos/${idMod}/rotaciones?desde=${desde}&hasta=${hasta}&limit=20`)).json.data;
    for (const r of lista) await api.pedir('jefatura', 'DELETE', `/modulos/${idMod}/rotaciones/${r.id_rotacion}`, { esperado: [204, 404] });
  }

  before(async () => {
    d = await crearDriver();
    idMod = await datos.idModulo('Corporativo');
    semana = miercolesLejano();
    analista = (await api.perfil('analista')).nombre;
    analista2 = (await api.perfil('analista2')).nombre;
    await limpiarSemana();
  });
  after(async () => { await limpiarSemana().catch(() => {}); await d?.quit(); });

  it('MOD-01 @humo la lista de módulos muestra los 5 módulos del sistema', async () => {
    await entrarComo(d, 'visor', '/modulos');
    await visible(d, By.xpath("//h1[normalize-space()='Módulos']"));
    await d.wait(async () => (await d.findElements(By.css('a[href^="/modulos/"]'))).length >= 5, 10000);
    const textos = await Promise.all((await d.findElements(By.css('a[href^="/modulos/"] h3'))).map((e) => e.getText()));
    for (const n of ['Prioridad', 'Proveedores', 'Franquicias', 'Corporativo', 'Facturas Generales']) {
      assert.ok(textos.includes(n), `falta el módulo ${n}`);
    }
  });

  it('MOD-02 al hacer clic en un módulo se abre su detalle con rotación, tareas y documentos', async () => {
    await d.get(`${require('../config').BASE_URL}/modulos`);
    await (await visible(d, By.xpath("//a[starts-with(@href,'/modulos/')][.//h3[normalize-space()='Corporativo']]"))).click();
    await visible(d, By.xpath("//h1[normalize-space()='Corporativo']"));
    await visible(d, By.id('titulo-rotacion'));
    await visible(d, By.id('titulo-tareas-modulo'));
    await visible(d, By.id('titulo-docs'));
  });

  describe('asignación de responsables (jefatura)', () => {
    before(async () => { await entrarComo(d, 'jefatura', `/modulos/${idMod}`); await visible(d, By.id('titulo-rotacion')); });

    async function abrirAsignar() {
      await (await visible(d, boton('Asignar semana'))).click();
      await visible(d, By.css('[role="dialog"] #semana'));
    }

    it('MOD-03 @humo asigna un responsable a una semana futura y aparece en el historial', async () => {
      await abrirAsignar();
      await fijarValor(d, By.id('semana'), fechaISO(semana));
      await elegir(d, By.id('responsable'), analista);
      await (await visible(d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
      await ausente(d, By.css('[role="dialog"]'));
      await visible(d, By.xpath("//p[@role='status'][contains(.,'Semana asignada.')]"));
      await visible(d, By.xpath(`//table[caption[normalize-space()='Historial de rotaciones']]//td[normalize-space()='${analista}']`));
    });

    it('MOD-04 asignar otra vez la misma semana es rechazado con un mensaje claro', async () => {
      await abrirAsignar();
      await fijarValor(d, By.id('semana'), fechaISO(semana));
      await elegir(d, By.id('responsable'), analista2);
      await (await visible(d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
      const error = await visible(d, By.css('[role="dialog"] [role="alert"]'));
      assert.ok((await error.getText()).includes('ya tiene un responsable'));
      await (await visible(d, By.xpath("//div[@role='dialog']//button[normalize-space()='Cancelar']"))).click();
      await ausente(d, By.css('[role="dialog"]'));
    });

    it('MOD-05 cambia el responsable de una semana ya asignada', async () => {
      // El historial va de la semana más nueva a la más antigua y la semana de la prueba es la más lejana:
      // es la PRIMERA fila "Programada" de ese responsable (las filas viejas, ya finalizadas, no tienen botones).
      const filas = await d.findElements(filaProgramada(analista));
      assert.ok(filas.length >= 1, 'no está la fila programada de la prueba');
      await (await filas[0].findElement(By.xpath(".//button[normalize-space()='Cambiar']"))).click();
      await elegir(d, By.id('nuevo-responsable'), analista2);
      await (await visible(d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
      await ausente(d, By.css('[role="dialog"]'));
      await visible(d, By.xpath(`//table[caption[normalize-space()='Historial de rotaciones']]//td[normalize-space()='${analista2}']`));
    });

    it('MOD-06 elimina la asignación de la semana de prueba', async () => {
      const filas = await d.findElements(filaProgramada(analista2));
      assert.ok(filas.length >= 1, 'no está la fila programada de la prueba');
      await (await filas[0].findElement(By.xpath(".//button[normalize-space()='Eliminar']"))).click();
      await (await visible(d, By.xpath("//div[@role='dialog']//button[normalize-space()='Eliminar']"))).click();
      await ausente(d, By.css('[role="dialog"]'));
    });
  });

  it('MOD-07 no se puede asignar una semana que ya terminó (la API lo rechaza con 400)', async () => {
    const idResp = (await api.perfil('analista')).id_usuario;
    const res = await api.pedir('jefatura', 'POST', `/modulos/${idMod}/rotaciones`, {
      cuerpo: { id_responsable: idResp, semana: fechaISO(sumarDias(new Date(), -30)) },
      esperado: [400],
    });
    assert.strictEqual(res.status, 400);
  });

  it('MOD-08 el campo de fecha del diálogo no admite semanas pasadas (atributo min)', async () => {
    await entrarComo(d, 'jefatura', `/modulos/${idMod}`);
    await (await visible(d, boton('Asignar semana'))).click();
    const min = await (await visible(d, By.id('semana'))).getAttribute('min');
    assert.strictEqual(min, fechaISO(new Date()));
    await (await visible(d, By.xpath("//div[@role='dialog']//button[normalize-space()='Cancelar']"))).click();
    assert.strictEqual(await existe(d, By.css('[role="dialog"]')), false);
  });
});
