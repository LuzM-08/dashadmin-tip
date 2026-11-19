/**
 * Contenedor de inyección de dependencias liviano.
 * - Registro por nombre con factory; singletons perezosos.
 * - Las factories reciben un "cradle" (Proxy) para desestructurar dependencias.
 */
class Container {
  constructor() {
    this.factories = new Map();
    this.instances = new Map();
    this.resolving = new Set();
    this.cradle = new Proxy({}, { get: (_, name) => this.resolve(name) });
  }

  register(name, factory) {
    this.factories.set(name, factory);
    return this;
  }

  resolve(name) {
    if (this.instances.has(name)) return this.instances.get(name);

    const factory = this.factories.get(name);
    if (!factory) throw new Error(`Dependencia no registrada: "${String(name)}"`);
    if (this.resolving.has(name)) throw new Error(`Dependencia circular detectada: "${String(name)}"`);

    this.resolving.add(name);
    try {
      const instance = factory(this.cradle);
      this.instances.set(name, instance);
      return instance;
    } finally {
      this.resolving.delete(name);
    }
  }
}

module.exports = Container;
