const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { crearDriver } = require('../support/driver');
const { entrarComo } = require('../support/sesion');
const { visible, ausente, existe, comillas, boton, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');

// PDF mínimo válido (empieza con la firma %PDF-): el servidor revisa el contenido, no solo la extensión.
const PDF = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n';

describe('DOC · Documentos de un módulo', function () {
  let d; let idMod; let dir; let archivoOk; let nombre;

  const filaDoc = (n) => By.xpath(`//table[caption[normalize-space()='Documentos del módulo']]//tr[td[normalize-space()=${comillas(n)}]]`);
  const botonesFila = async (n) => Promise.all((await (await visible(d, filaDoc(n))).findElements(By.css('button'))).map((b) => b.getText()));

  before(async () => {
    d = await crearDriver();
    idMod = await datos.idModulo('Proveedores');
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-docs-'));
    nombre = `E2E-informe-${datos.sello()}.pdf`;
    archivoOk = path.join(dir, nombre);
    fs.writeFileSync(archivoOk, PDF);
  });
  after(async () => {
    await d?.quit();
    await datos.limpiarDocumentos(idMod).catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  });

  async function abrirModulo(rol) {
    await entrarComo(d, rol, `/modulos/${idMod}`);
    await visible(d, By.id('titulo-docs'));
  }

  it('DOC-01 @humo el analista sube un PDF y aparece en la lista con su nombre como autor', async () => {
    await abrirModulo('analista');
    await (await visible(d, By.id('archivo'))).sendKeys(archivoOk);
    await (await visible(d, boton('Subir'))).click();
    await visible(d, By.xpath("//p[@role='status'][contains(.,'Documento subido.')]"));
    const fila = await visible(d, filaDoc(nombre));
    assert.ok((await fila.getText()).includes((await api.perfil('analista')).nombre));
  });

  it('DOC-02 un archivo con extensión no permitida es rechazado antes de subirse', async () => {
    await abrirModulo('analista');
    const exe = path.join(dir, 'E2E-malicioso.exe');
    fs.writeFileSync(exe, 'MZ-no-es-un-pdf');
    await (await visible(d, By.id('archivo'))).sendKeys(exe);
    const aviso = await visible(d, By.css('[role="alert"]'));
    assert.ok((await aviso.getText()).length > 0);
    assert.strictEqual(await (await visible(d, boton('Subir'))).isEnabled(), false);
  });

  it('DOC-03 un archivo con extensión .pdf pero contenido distinto es rechazado por el servidor (400)', async () => {
    const falso = path.join(dir, 'E2E-falso.pdf');
    fs.writeFileSync(falso, 'esto es texto plano, no un PDF');
    await abrirModulo('analista');
    await (await visible(d, By.id('archivo'))).sendKeys(falso);
    await (await visible(d, boton('Subir'))).click();
    const aviso = await visible(d, By.css('[role="alert"]'));
    assert.ok((await aviso.getText()).length > 0);
    assert.strictEqual(await existe(d, filaDoc('E2E-falso.pdf')), false);
  });

  it('DOC-04 el visor ve y puede descargar el documento, pero no subir ni eliminar', async () => {
    await abrirModulo('visor');
    const botones = await botonesFila(nombre);
    assert.ok(botones.includes('Descargar'));
    assert.ok(!botones.includes('Eliminar'));
    assert.strictEqual(await existe(d, By.id('archivo')), false);
  });

  it('DOC-05 el autor (analista) ve "Eliminar" en su documento; otro analista no', async () => {
    await abrirModulo('analista');
    assert.ok((await botonesFila(nombre)).includes('Eliminar'));
    await abrirModulo('analista2');
    const otros = await botonesFila(nombre);
    assert.ok(otros.includes('Descargar'));
    assert.ok(!otros.includes('Eliminar'), 'otro analista no debe poder eliminar un documento ajeno');
  });

  it('DOC-06 el servidor respeta la regla: otro analista recibe 403; la jefatura puede eliminar cualquiera', async () => {
    const lista = (await api.pedir('jefatura', 'GET', `/documentos?id_modulo=${idMod}&limit=100`)).json.data;
    const doc = lista.find((x) => x.nombre_original === nombre);
    assert.ok(doc, 'el documento subido debe existir');
    assert.strictEqual((await api.pedir('analista2', 'DELETE', `/documentos/${doc.id_documento}`, { esperado: [403] })).status, 403);
    assert.strictEqual((await api.pedir('visor', 'DELETE', `/documentos/${doc.id_documento}`, { esperado: [403] })).status, 403);
  });

  it('DOC-07 la jefatura ve "Eliminar" en documentos ajenos', async () => {
    await abrirModulo('jefatura');
    assert.ok((await botonesFila(nombre)).includes('Eliminar'));
  });

  it('DOC-08 @humo el autor elimina su documento con confirmación y desaparece de la lista', async () => {
    await abrirModulo('analista');
    await (await (await visible(d, filaDoc(nombre))).findElement(By.xpath(".//button[normalize-space()='Eliminar']"))).click();
    await visible(d, By.xpath("//div[@role='dialog']//h2[normalize-space()='Eliminar documento']"));
    await (await visible(d, By.xpath("//div[@role='dialog']//button[normalize-space()='Eliminar']"))).click();
    await visible(d, By.xpath("//p[@role='status'][contains(.,'Documento eliminado.')]"));
    await ausente(d, filaDoc(nombre));
  });
});
