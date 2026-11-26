const { visible, escribir, By } = require('../support/esperas');
const { BASE_URL } = require('../config');

class CuentaPage {
  constructor(driver) { this.d = driver; }

  async abrir() { await this.d.get(`${BASE_URL}/cuenta`); await this.esperarPantalla(); }
  async esperarPantalla() { await visible(this.d, By.xpath("//h1[normalize-space()='Mi cuenta']")); }
  async cambiar({ actual, nueva, repetir = nueva }) {
    await escribir(this.d, By.id('clave-actual'), actual);
    await escribir(this.d, By.id('clave-nueva'), nueva);
    await escribir(this.d, By.id('clave-repetir'), repetir);
  }
  async botonHabilitado() {
    return (await visible(this.d, By.xpath("//button[normalize-space()='Cambiar contraseña']"))).isEnabled();
  }
  async enviar() { await (await visible(this.d, By.xpath("//button[normalize-space()='Cambiar contraseña']"))).click(); }
  async mensajeOk() { return (await visible(this.d, By.css('p[role="status"]'))).getText(); }
  async mensajeError() { return (await visible(this.d, By.css('p[role="alert"]'))).getText(); }
  async ayudaNueva() { return (await visible(this.d, By.id('ayuda-nueva'))).getText(); }
  async datosDeCuenta() { return (await visible(this.d, By.css('section[aria-label="Datos de la cuenta"]'))).getText(); }
}

module.exports = CuentaPage;
