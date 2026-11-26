// Configuración única de la suite. Todo se puede sobrescribir con variables de entorno (o un archivo .env).
const fs = require('fs');
const path = require('path');

// Lector mínimo de .env (sin dependencias): no pisa variables ya definidas.
const archivo = path.join(__dirname, '.env');
if (fs.existsSync(archivo)) {
  for (const linea of fs.readFileSync(archivo, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const quitarBarra = (u) => u.replace(/\/$/, '');
const PASSWORD_DEMO = process.env.PASSWORD_DEMO || 'ApDemo2026!';

module.exports = {
  BASE_URL: quitarBarra(process.env.BASE_URL || 'http://localhost:5173'),
  API_URL: quitarBarra(process.env.API_URL || 'http://localhost:4000/api'),
  HEADLESS: process.env.HEADLESS !== 'false',
  ACEPTAR_CERT_INVALIDO: process.env.ACEPTAR_CERT_INVALIDO === 'true',
  PASSWORD_DEMO,
  ESPERA_MS: 10000,
  CAPTURAS: path.join(__dirname, 'capturas'),
  // Usuarios creados por seed.js (clave en PASSWORD_DEMO)
  USUARIOS: {
    jefatura: { email: 'jefatura.ap@empresa.local', rol: 'jefatura' },
    analista: { email: 'diego.fuentes@empresa.local', rol: 'analista_ap' },
    analista2: { email: 'valentina.soto@empresa.local', rol: 'analista_ap' },
    visor: { email: 'rodrigo.paredes@empresa.local', rol: 'visor' },
  },
  // Pestañas que debe ver cada rol, en orden
  PESTANAS: {
    jefatura: ['Inicio', 'Módulos', 'Tareas', 'Eventos', 'Usuarios'],
    analista: ['Inicio', 'Módulos', 'Tareas', 'Eventos'],
    visor: ['Inicio', 'Módulos', 'Tareas', 'Eventos'],
  },
};
