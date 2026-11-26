const { visible, escribir, existe, By } = require('../support/esperas');
const { BASE_URL } = require('../config');

class LoginPage {
  constructor(driver) { this.d = driver; }

  async abrir() {
    await this.d.get(`${BASE_URL}/login`);
    await visible(this.d, By.id('email'));
  }

  async completar(email, password) {
    await escribir(this.d, By.id('email'), email);
    await escribir(this.d, By.id('password'), password);
  }

  async enviar() { await (await visible(this.d, By.css('button[type="submit"]'))).click(); }

  async ingresar(email, password) {
    await this.completar(email, password);
    await this.enviar();
  }

  async mensajeDeError() { return (await visible(this.d, By.css('[role="alert"]'))).getText(); }
  async titulo() { return (await visible(this.d, By.css('h1'))).getText(); }
  async rutaActual() { return new URL(await this.d.getCurrentUrl()).pathname; }
  async campoVacioInvalido(id) {
    return this.d.executeScript('return document.getElementById(arguments[0]).validity.valueMissing', id);
  }
  async hayBotonesDemo() { return existe(this.d, By.xpath("//p[contains(.,'usuarios de demostración')]")); }
}

module.exports = LoginPage;
