const assert = require('assert');
const { crearDriver } = require('../support/driver');
const { entrarComo } = require('../support/sesion');
const { visible, existe, By } = require('../support/esperas');
const api = require('../support/api');
const datos = require('../support/datos');
const TareasPage = require('../pages/TareasPage');
const Shell = require('../pages/Shell');

describe('TAR · Tareas', function () {
  let d; let tareas; let shell;

  before(async () => { d = await crearDriver(); tareas = new TareasPage(d); shell = new Shell(d); });
  after(async () => { await d?.quit(); await datos.limpiarTareas(); });

  describe('ciclo completo (jefatura)', () => {
    const titulo = datos.nombreUnico('crear');
    const tituloEditado = `${titulo} editada`;
    let tituloActual = titulo; // TAR-03 lo cambia; TAR-04..06 usan el vigente para no depender de que TAR-03 se haya ejecutado (p. ej. con --grep @humo)

    before(async () => { await entrarComo(d, 'jefatura', '/tareas'); await tareas.esperarCarga(); });

    it('TAR-01 @humo crea una tarea y aparece en la tabla con aviso de confirmación', async () => {
      await tareas.crear({ titulo, descripcion: 'Creada por Selenium', modulo: 'Prioridad', prioridad: 'Alta', fecha: '2030-01-15' });
      await tareas.esperarAvisoQueContenga('Tarea creada.');
      const fila = await tareas.esperarTarea(titulo);
      const texto = await fila.getText();
      assert.ok(texto.includes('Prioridad'), 'muestra el módulo');
      assert.ok(texto.includes('Alta'), 'muestra la prioridad');
      assert.strictEqual(await tareas.estadoEnFila(titulo), 'Sin iniciar');
    });

    it('TAR-02 la tarea creada queda guardada en el servidor', async () => {
      const lista = (await api.pedir('jefatura', 'GET', `/tareas?q=${encodeURIComponent(titulo)}`)).json.data;
      assert.strictEqual(lista.length, 1);
      assert.strictEqual(lista[0].prioridad, 'Alta');
    });

    it('TAR-03 edita el título de la tarea', async () => {
      await tareas.editar(titulo);
      await tareas.llenar({ titulo: tituloEditado });
      await tareas.enviarFormulario();
      await tareas.esperarFormularioCerrado();
      await tareas.esperarAvisoQueContenga('Tarea actualizada.');
      await tareas.esperarTarea(tituloEditado);
      tituloActual = tituloEditado;
      assert.strictEqual(await tareas.existeTarea(titulo), false);
    });

    it('TAR-04 cambia el estado desde la tabla y se mantiene al recargar la página', async () => {
      await tareas.cambiarEstadoEnFila(tituloActual, 'En progreso');
      await d.wait(async () => (await tareas.estadoEnFila(tituloActual)) === 'En progreso', 5000);
      await d.navigate().refresh();
      await tareas.esperarTarea(tituloActual);
      assert.strictEqual(await tareas.estadoEnFila(tituloActual), 'En progreso');
    });

    it('TAR-05 cancelar la eliminación conserva la tarea', async () => {
      await tareas.pedirEliminar(tituloActual);
      await tareas.cancelarEliminar();
      assert.strictEqual(await tareas.existeTarea(tituloActual), true);
    });

    it('TAR-06 @humo confirmar la eliminación quita la tarea', async () => {
      await tareas.pedirEliminar(tituloActual);
      await tareas.confirmarEliminar();
      await tareas.esperarAvisoQueContenga('Tarea eliminada.');
      await tareas.esperarSinTarea(tituloActual);
    });
  });

  describe('validaciones del formulario', () => {
    before(async () => { await entrarComo(d, 'jefatura', '/tareas'); await tareas.esperarCarga(); });

    it('TAR-07 un título de menos de 3 caracteres no se envía y no crea nada', async () => {
      await tareas.abrirFormularioNueva();
      await tareas.llenar({ titulo: 'ab', modulo: 'Prioridad' });
      await tareas.enviarFormulario();
      assert.strictEqual((await tareas.campoTituloInvalido()).corto, true);
      assert.ok(await existe(d, By.css('[role="dialog"]')), 'el formulario sigue abierto');
      await tareas.cerrarFormulario();
    });

    it('TAR-08 sin título ni módulo el formulario no se envía', async () => {
      await tareas.abrirFormularioNueva();
      await tareas.enviarFormulario();
      assert.strictEqual((await tareas.campoTituloInvalido()).falta, true);
      await tareas.cerrarFormulario();
    });
  });

  describe('búsqueda y filtros', () => {
    const marca = datos.sello();
    let a; let b;
    before(async () => {
      a = await datos.crearTarea('jefatura', { titulo: `E2E buscar ${marca} alfa` });
      b = await datos.crearTarea('jefatura', { titulo: `E2E buscar ${marca} beta`, estado: 'En progreso' });
      await entrarComo(d, 'jefatura', '/');
    });

    it('TAR-09 @humo el buscador de la barra superior filtra la lista de tareas', async () => {
      await shell.buscarEnBarra(`${marca} alfa`);
      await d.wait(async () => (await d.getCurrentUrl()).includes('/tareas?q='), 8000);
      await tareas.esperarCarga();
      await tareas.esperarTarea(a.titulo);
      await d.wait(async () => !(await tareas.existeTarea(b.titulo)), 5000);
    });

    it('TAR-10 filtrar por estado desde la URL muestra solo ese estado', async () => {
      await tareas.abrir(`?q=${marca}&estado=En%20progreso`);
      await tareas.esperarTarea(b.titulo);
      assert.strictEqual(await tareas.existeTarea(a.titulo), false);
    });

    it('TAR-11 una búsqueda sin resultados muestra el mensaje y permite limpiar filtros', async () => {
      await tareas.abrir(`?q=${marca}-no-existe`);
      await visible(d, By.xpath("//p[contains(.,'No hay tareas que coincidan con los filtros.')]"));
      await (await visible(d, By.xpath("//button[normalize-space()='Limpiar filtros']"))).click();
      await d.wait(async () => !(await d.getCurrentUrl()).includes('q='), 5000);
    });
  });

  describe('plazos', () => {
    it('TAR-12 una tarea con fecha límite pasada se marca como vencida', async () => {
      const t = await datos.crearTarea('jefatura', { titulo: datos.nombreUnico('vencida'), fecha_limite: new Date(Date.now() - 3 * 86400000).toISOString() });
      await entrarComo(d, 'jefatura', `/tareas?q=${encodeURIComponent(t.titulo)}`);
      assert.ok((await (await tareas.esperarTarea(t.titulo)).getText()).includes('Vencida'));
    });

    it('TAR-13 una tarea terminada con fecha pasada ya no se marca como vencida', async () => {
      const t = await datos.crearTarea('jefatura', { titulo: datos.nombreUnico('terminada'), estado: 'Terminadas', fecha_limite: new Date(Date.now() - 3 * 86400000).toISOString() });
      await tareas.abrir(`?q=${encodeURIComponent(t.titulo)}`);
      assert.ok(!(await (await tareas.esperarTarea(t.titulo)).getText()).includes('Vencida'));
    });
  });

  describe('permisos distintos por rol', () => {
    it('TAR-14 el analista puede crear y editar, pero no ve "Eliminar"', async () => {
      const t = await datos.crearTarea('analista', { titulo: datos.nombreUnico('analista') });
      await entrarComo(d, 'analista', `/tareas?q=${encodeURIComponent(t.titulo)}`);
      await tareas.esperarCarga();
      assert.strictEqual(await tareas.hayBotonNueva(), true);
      const botones = await tareas.botonesDeFila(t.titulo);
      assert.ok(botones.includes('Editar'));
      assert.ok(!botones.includes('Eliminar'));
    });

    it('TAR-15 el visor ve el estado como insignia (no editable) y ninguna acción', async () => {
      const t = await datos.crearTarea('jefatura', { titulo: datos.nombreUnico('visor') });
      await entrarComo(d, 'visor', `/tareas?q=${encodeURIComponent(t.titulo)}`);
      await tareas.esperarTarea(t.titulo);
      assert.strictEqual(await existe(d, By.css(`select[aria-label="Estado de ${t.titulo}"]`)), false);
      assert.deepStrictEqual(await tareas.botonesDeFila(t.titulo), []);
    });
  });
});
