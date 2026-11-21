export const EXTENSIONES = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.txt', '.csv', '.xml'];
export const ACCEPT = EXTENSIONES.join(',');
export const MAX_MB = 15; // debe coincidir con MAX_UPLOAD_MB del backend (el servidor es quien decide en definitiva)

const VISTA_PREVIA = ['.pdf', '.png', '.jpg', '.jpeg'];

export const extensionDe = (nombre = '') => {
  const i = nombre.lastIndexOf('.');
  return i < 0 ? '' : nombre.slice(i).toLowerCase();
};

export const admiteVistaPrevia = (nombre) => VISTA_PREVIA.includes(extensionDe(nombre));

export function formatearTamano(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Devuelve un mensaje si el archivo no sirve, o null si está bien. (Primera barrera; el servidor valida de nuevo.)
export function validarArchivo(archivo) {
  if (!EXTENSIONES.includes(extensionDe(archivo.name))) {
    return `Tipo de archivo no permitido. Permitidos: ${EXTENSIONES.join(', ')}`;
  }
  if (archivo.size === 0) return 'El archivo está vacío.';
  if (archivo.size > MAX_MB * 1024 * 1024) return `El archivo supera el máximo de ${MAX_MB} MB.`;
  return null;
}

// Extrae el nombre de la cabecera Content-Disposition (prefiere filename* en UTF-8, que conserva los acentos).
export function nombreDesdeCabecera(cabecera) {
  if (!cabecera) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecera);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* cae al nombre simple */
    }
  }
  const simple = /filename="?([^";]+)"?/i.exec(cabecera);
  return simple ? simple[1] : null;
}

// Dispara la descarga de un Blob con el nombre indicado.
export function guardarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
