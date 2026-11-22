// Caché en memoria (TTL corto) de lo que el servidor sabe de cada sesión: evita una consulta a la BD por request.
// Los cambios hechos desde esta misma API invalidan la entrada al instante; los hechos por otra vía
// (por ejemplo el script prisma/usuario.js) se reflejan en, como máximo, TTL segundos.
class SesionCache {
  constructor(ttlMs = 10_000, maximo = 500) {
    this.ttl = ttlMs;
    this.maximo = maximo;
    this.mapa = new Map();
  }

  get(id) {
    const e = this.mapa.get(id);
    if (!e) return undefined;
    if (e.vence < Date.now()) {
      this.mapa.delete(id);
      return undefined;
    }
    return e.valor;
  }

  set(id, valor) {
    if (this.mapa.size >= this.maximo) this.mapa.delete(this.mapa.keys().next().value);
    this.mapa.set(id, { valor, vence: Date.now() + this.ttl });
  }

  invalidar(id) { this.mapa.delete(id); }

  limpiar() { this.mapa.clear(); }
}

module.exports = SesionCache;
