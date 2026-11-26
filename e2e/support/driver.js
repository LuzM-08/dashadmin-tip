const fs = require('fs');
const path = require('path');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { HEADLESS, ACEPTAR_CERT_INVALIDO, CAPTURAS } = require('../config');

let ultimo = null; // el hook global de capturas necesita saber qué navegador está en uso
const driverActual = () => ultimo;

// Selenium Manager (incluido en selenium-webdriver ≥ 4.6) descarga el chromedriver que corresponde al Chrome instalado.
async function crearDriver() {
  const opciones = new chrome.Options();
  if (HEADLESS) opciones.addArguments('--headless=new');
  opciones.addArguments('--window-size=1440,1000', '--disable-gpu', '--lang=es-CL');
  if (process.env.CI) opciones.addArguments('--no-sandbox', '--disable-dev-shm-usage');
  if (ACEPTAR_CERT_INVALIDO) opciones.addArguments('--ignore-certificate-errors');
  opciones.setUserPreferences({ 'intl.accept_languages': 'es-CL,es' });

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(opciones).build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 30000, script: 15000 }); // sin esperas implícitas: solo explícitas
  ultimo = driver;
  return driver;
}

async function capturar(driver, nombre) {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const archivo = path.join(CAPTURAS, `${nombre.replace(/[^\w.-]+/g, '_').slice(0, 120)}.png`);
  fs.writeFileSync(archivo, await driver.takeScreenshot(), 'base64');
  return archivo;
}

module.exports = { crearDriver, capturar, driverActual };
