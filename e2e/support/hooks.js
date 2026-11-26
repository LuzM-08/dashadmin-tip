// Hooks globales de Mocha: capturas de pantalla ante cada fallo.
const { capturar, driverActual } = require('./driver');

exports.mochaHooks = {
  async afterEach() {
    const prueba = this.currentTest;
    const driver = driverActual();
    if (prueba?.state === 'failed' && driver) {
      try {
        const ruta = await capturar(driver, `${prueba.fullTitle()}`);
        console.log(`      captura: ${ruta}`);
      } catch { /* si el navegador ya murió no hay captura */ }
    }
  },
};
