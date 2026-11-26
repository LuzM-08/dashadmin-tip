const { visible, ausente, existe, escribir, elegir, fijarValor, boton, comillas, By, until } = require('../support/esperas');
const { BASE_URL } = require('../config');

class TareasPage {
  constructor(driver) { this.d = driver; }

  async abrir(consulta = '') {
    await this.d.get(`${BASE_URL}/tareas${consulta}`);
    await visible(this.d, By.xpath("//h1[normalize-space()='Tareas']"));
    await this.esperarCarga();
  }

  // La tabla o el mensaje de vacío indican que terminó de cargar (hay un Spinner con role=status mientras tanto)
  async esperarCarga() {
    await this.d.wait(async () => (await existe(this.d, By.css('table'))) || (await existe(this.d, By.xpath("//p[contains(.,'Todavía no hay tareas') or contains(.,'No hay tareas que coincidan')]"))), 10000);
  }

  fila(titulo) { return By.xpath(`//table//tr[.//p[normalize-space()=${comillas(titulo)}]]`); }
  async existeTarea(titulo) { return existe(this.d, this.fila(titulo)); }
  async esperarTarea(titulo) { return visible(this.d, this.fila(titulo)); }
  async esperarSinTarea(titulo) { await ausente(this.d, this.fila(titulo)); }

  async hayBotonNueva() { return existe(this.d, boton('Nueva tarea')); }
  async botonesDeFila(titulo) {
    const f = await this.esperarTarea(titulo);
    return Promise.all((await f.findElements(By.css('button'))).map((b) => b.getText()));
  }

  async abrirFormularioNueva() {
    await (await visible(this.d, boton('Nueva tarea'))).click();
    await visible(this.d, By.css('[role="dialog"] #titulo'));
  }

  async llenar({ titulo, descripcion, modulo, prioridad, estado, fecha }) {
    if (titulo !== undefined) await escribir(this.d, By.id('titulo'), titulo);
    if (descripcion !== undefined) await escribir(this.d, By.id('descripcion'), descripcion);
    if (modulo) await elegir(this.d, By.id('modulo'), modulo);
    if (estado) await elegir(this.d, By.id('estado'), estado);
    if (prioridad) await elegir(this.d, By.id('prioridad'), prioridad);
    if (fecha) await fijarValor(this.d, By.id('fecha'), fecha);
  }

  async enviarFormulario() { await (await visible(this.d, By.css('[role="dialog"] button[type="submit"]'))).click(); }
  async cerrarFormulario() { await (await visible(this.d, By.css('[role="dialog"]'))).findElement(By.xpath(".//button[normalize-space()='Cancelar']")).then((b) => b.click()); await ausente(this.d, By.css('[role="dialog"]')); }
  async esperarFormularioCerrado() { await ausente(this.d, By.css('[role="dialog"]')); }

  async crear(datos) {
    await this.abrirFormularioNueva();
    await this.llenar(datos);
    await this.enviarFormulario();
    await this.esperarFormularioCerrado();
  }

  async editar(titulo) {
    const f = await this.esperarTarea(titulo);
    await (await f.findElement(By.xpath(".//button[normalize-space()='Editar']"))).click();
    await visible(this.d, By.css('[role="dialog"] #titulo'));
  }

  async cambiarEstadoEnFila(titulo, estado) {
    const select = await visible(this.d, By.css(`select[aria-label=${comillas(`Estado de ${titulo}`)}]`));
    await (await select.findElement(By.xpath(`.//option[normalize-space()='${estado}']`))).click();
  }
  async estadoEnFila(titulo) {
    const select = await visible(this.d, By.css(`select[aria-label=${comillas(`Estado de ${titulo}`)}]`));
    return select.getAttribute('value');
  }

  async pedirEliminar(titulo) {
    const f = await this.esperarTarea(titulo);
    await (await f.findElement(By.xpath(".//button[normalize-space()='Eliminar']"))).click();
    await visible(this.d, By.xpath("//div[@role='dialog']//h2[normalize-space()='Eliminar tarea']"));
  }
  async confirmarEliminar() {
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[normalize-space()='Eliminar']"))).click();
    await this.esperarFormularioCerrado();
  }
  async cancelarEliminar() {
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[normalize-space()='Cancelar']"))).click();
    await this.esperarFormularioCerrado();
  }

  async campoTituloInvalido() {
    return this.d.executeScript("const e=document.getElementById('titulo'); return {falta:e.validity.valueMissing, corto:e.validity.tooShort}");
  }
  async avisoOk() { return (await visible(this.d, By.css('p[role="status"]'))).getText(); }
  async esperarAvisoQueContenga(texto) {
    await this.d.wait(until.elementLocated(By.xpath(`//p[@role='status' and contains(.,${comillas(texto)})]`)), 8000, `Aviso "${texto}"`);
  }
  async filasVisibles() { return (await this.d.findElements(By.css('table tbody tr'))).length; }
}

module.exports = TareasPage;
