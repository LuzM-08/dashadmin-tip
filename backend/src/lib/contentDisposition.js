// Cabecera Content-Disposition con nombre seguro y soporte de acentos (RFC 5987/6266).
module.exports = (tipo, nombre) => {
  const ascii = nombre.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const utf8 = encodeURIComponent(nombre).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `${tipo}; filename="${ascii}"; filename*=UTF-8''${utf8}`;
};
