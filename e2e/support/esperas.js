const { until, By } = require('selenium-webdriver');
const { ESPERA_MS } = require('../config');

// Siempre esperas EXPLÍCITAS (nunca sleep fijo): la prueba avanza apenas la condición se cumple.
const visible = async (driver, locator, ms = ESPERA_MS) => {
  const el = await driver.wait(until.elementLocated(locator), ms, `No apareció ${locator}`);
  await driver.wait(until.elementIsVisible(el), ms, `No es visible ${locator}`);
  return el;
};

const ausente = (driver, locator, ms = ESPERA_MS) =>
  driver.wait(async () => (await driver.findElements(locator)).length === 0, ms, `Sigue presente ${locator}`);

const existe = async (driver, locator) => (await driver.findElements(locator)).length > 0;

// Escribe en un campo React: borra con seguridad y envía las teclas.
async function escribir(driver, locator, texto) {
  const el = await visible(driver, locator);
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'})", el);
  await el.clear();
  if (texto !== '') await el.sendKeys(texto);
  return el;
}

// <input type="date|time">: sendKeys depende del idioma del navegador; se fija el valor como lo haría React.
async function fijarValor(driver, locator, valor) {
  const el = await visible(driver, locator);
  await driver.executeScript(
    `const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
     set.call(arguments[0], arguments[1]);
     arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
     arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
    el,
    valor,
  );
}

async function elegir(driver, locator, textoVisible) {
  const select = await visible(driver, locator);
  const opcion = await select.findElement(By.xpath(`.//option[normalize-space()=${comillas(textoVisible)}]`));
  await opcion.click();
}

// Literal XPath seguro aunque el texto tenga comillas.
const comillas = (t) => (!t.includes("'") ? `'${t}'` : `concat('${t.split("'").join(`', "'", '`)}')`);

const boton = (texto) => By.xpath(`//button[normalize-space()=${comillas(texto)}]`);
const enlace = (texto) => By.xpath(`//a[normalize-space()=${comillas(texto)}]`);

const fechaISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const sumarDias = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

module.exports = { visible, ausente, existe, escribir, fijarValor, elegir, comillas, boton, enlace, fechaISO, sumarDias, until, By };
