// Marco común de la aplicación: barra superior, pestañas y menú de perfil.
const { visible, ausente, existe, boton, enlace, By } = require('../support/esperas');
const { BASE_URL } = require('../config');

class Shell {
  constructor(driver) { this.d = driver; }

  async pestanas() {
    const links = await this.d.findElements(By.css('nav[aria-label="Secciones"] a'));
    return Promise.all(links.map((l) => l.getText()));
  }

  async pestanaActiva() {
    const links = await this.d.findElements(By.css('nav[aria-label="Secciones"] a'));
    for (const l of links) {
      if ((await l.getAttribute('aria-current')) === 'page') return l.getText();
    }
    return null;
  }

  async irA(pestana) {
    await (await visible(this.d, By.xpath(`//nav[@aria-label='Secciones']//a[normalize-space()='${pestana}']`))).click();
  }

  async visitar(ruta) {
    await this.d.get(`${BASE_URL}${ruta}`);
    await visible(this.d, By.css('nav[aria-label="Secciones"]'));
  }

  // Marca de la barra superior (la casa NO debe ser un enlace)
  async textoMarca() { return (await visible(this.d, By.css('header span.font-semibold'))).getText(); }
  async enlacesEnBarraSuperior() { return (await this.d.findElements(By.css('header a'))).length; }

  async abrirMenuPerfil() {
    await (await visible(this.d, By.css('button[aria-label="Menú de perfil"]'))).click();
    await visible(this.d, By.css('[role="menu"]'));
  }

  async cerrarSesion() {
    await this.abrirMenuPerfil();
    await (await visible(this.d, By.xpath("//button[@role='menuitem'][normalize-space()='Cerrar sesión']"))).click();
  }

  async irAMiCuenta() {
    await this.abrirMenuPerfil();
    await (await visible(this.d, By.xpath("//button[@role='menuitem'][contains(normalize-space(),'Mi cuenta')]"))).click();
  }

  async datosDelMenu() {
    await this.abrirMenuPerfil();
    return (await this.d.findElement(By.css('[role="menu"]'))).getText();
  }

  async buscarEnBarra(texto) {
    const campo = await visible(this.d, By.id('busqueda'));
    await campo.clear();
    await campo.sendKeys(texto);
    await campo.submit();
  }

  async hayAvisoDeError() { return existe(this.d, By.css('[role="alert"]')); }
  async textoDelAviso() { return (await visible(this.d, By.css('[role="status"], [role="alert"]'))).getText(); }
  async esperarSinAlertas() { await ausente(this.d, By.css('[role="alert"]')); }
  boton(t) { return boton(t); }
  enlace(t) { return enlace(t); }
}

module.exports = Shell;
