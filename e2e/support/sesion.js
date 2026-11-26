const { BASE_URL } = require('../config');
const { tokenDe } = require('./api');
const { USUARIOS, PASSWORD_DEMO } = require('../config');
const { visible, By } = require('./esperas');

const TOKEN_KEY = 'ap_token';

// Inicia sesión SIN pasar por el formulario: pide el token a la API y lo deja donde lo guarda la SPA.
// (El formulario de login se prueba aparte, en 01-login.test.js.)
async function entrarComo(driver, clave, ruta = '/') {
  const token = await tokenDe(USUARIOS[clave].email, PASSWORD_DEMO);
  return entrarConToken(driver, token, ruta);
}

async function entrarConToken(driver, token, ruta = '/') {
  await driver.get(`${BASE_URL}/login`); // el almacenamiento es por origen: hay que estar en la SPA
  await driver.executeScript(`window.localStorage.setItem('${TOKEN_KEY}', arguments[0])`, token);
  await driver.get(`${BASE_URL}${ruta}`);
  await visible(driver, By.css('nav[aria-label="Secciones"]'));
}

async function salirSinUI(driver) {
  await driver.get(`${BASE_URL}/login`);
  await driver.executeScript(`window.localStorage.clear()`);
}

const tokenGuardado = (driver) => driver.executeScript(`return window.localStorage.getItem('${TOKEN_KEY}')`);

module.exports = { entrarComo, entrarConToken, salirSinUI, tokenGuardado, TOKEN_KEY };
