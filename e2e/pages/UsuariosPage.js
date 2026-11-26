const { visible, ausente, existe, escribir, elegir, comillas, boton, By } = require('../support/esperas');
const { BASE_URL } = require('../config');

class UsuariosPage {
  constructor(driver) { this.d = driver; }

  async abrir() {
    await this.d.get(`${BASE_URL}/usuarios`);
    await visible(this.d, By.xpath("//h1[normalize-space()='Usuarios']"));
    await visible(this.d, By.css('table'));
  }

  fila(email) { return By.xpath(`//table//tr[td[normalize-space()=${comillas(email)}]]`); }
  async existeUsuario(email) { return existe(this.d, this.fila(email)); }
  async esperarUsuario(email) { return visible(this.d, this.fila(email)); }
  async textoFila(email) { return (await this.esperarUsuario(email)).getText(); }

  async abrirNuevo() {
    await (await visible(this.d, boton('Nuevo usuario'))).click();
    await visible(this.d, By.css('[role="dialog"] #u-nombre'));
  }

  async crear({ nombre, email, rol, clave }) {
    await this.abrirNuevo();
    await escribir(this.d, By.id('u-nombre'), nombre);
    await escribir(this.d, By.id('u-email'), email);
    await elegir(this.d, By.id('u-rol'), rol);
    await escribir(this.d, By.id('u-clave'), clave);
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
  }

  async esperarCerrado() { await ausente(this.d, By.css('[role="dialog"]')); }
  async errorDelDialogo() { return (await visible(this.d, By.css('[role="dialog"] [role="alert"]'))).getText(); }
  async cancelarDialogo() {
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[normalize-space()='Cancelar']"))).click();
    await this.esperarCerrado();
  }
  async avisoDePagina() { return (await visible(this.d, By.css('p[role="status"]'))).getText(); }

  async editar(email) {
    const f = await this.esperarUsuario(email);
    await (await f.findElement(By.xpath(".//button[normalize-space()='Editar']"))).click();
    await visible(this.d, By.css('[role="dialog"] #u-nombre'));
  }
  async desactivarDesdeEdicion() {
    const check = await visible(this.d, By.css('[role="dialog"] input[type="checkbox"]'));
    if (await check.isSelected()) await check.click();
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
  }
  async checkboxActivoDeshabilitado() {
    return !(await (await visible(this.d, By.css('[role="dialog"] input[type="checkbox"]'))).isEnabled());
  }
  async selectorRolDeshabilitado() {
    return !(await (await visible(this.d, By.id('u-rol'))).isEnabled());
  }
  async botonesDeFila(email) {
    const f = await this.esperarUsuario(email);
    return Promise.all((await f.findElements(By.css('button'))).map((b) => b.getText()));
  }
  async restablecerClave(email, clave) {
    const f = await this.esperarUsuario(email);
    await (await f.findElement(By.xpath(".//button[normalize-space()='Restablecer contraseña']"))).click();
    await escribir(this.d, By.id('r-clave'), clave);
    await (await visible(this.d, By.xpath("//div[@role='dialog']//button[@type='submit']"))).click();
  }
}

module.exports = UsuariosPage;
