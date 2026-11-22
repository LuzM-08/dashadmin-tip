import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { alNoAutorizado, api, TOKEN_KEY } from '../api/client.js';
import { PASSWORD_DEMO } from '../config/pruebas.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  // Si la API responde 401 (token vencido), se cierra la sesión y el router redirige al login.
  useEffect(() => alNoAutorizado(logout), [logout]);

  // Al recargar la página: recupera el perfil con los permisos vigentes.
  useEffect(() => {
    if (!token) {
      setCargando(false);
      return undefined;
    }
    if (usuario) return undefined; // ya cargado por un login reciente
    let activo = true;
    api
      .get('/auth/me')
      .then(({ data }) => activo && setUsuario(data))
      .catch(() => {}) // un 401 ya dispara logout vía alNoAutorizado
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password }, { omitirAutenticacion: true });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUsuario(data.usuario);
    setCargando(false);
    return data.usuario;
  }, []);

  // Tras cambiar la contraseña el servidor emite un token nuevo (el anterior queda inválido).
  const actualizarSesion = useCallback((nuevoToken, nuevoUsuario) => {
    localStorage.setItem(TOKEN_KEY, nuevoToken);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  }, []);

  // SOLO PRUEBAS: cambia de usuario de demostración para ver el sistema con otros permisos.
  const cambiarVista = useCallback((email) => login(email, PASSWORD_DEMO), [login]);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      login,
      logout,
      cambiarVista,
      actualizarSesion,
      tienePermiso: (codigo) => Boolean(usuario?.permisos?.includes(codigo)),
    }),
    [usuario, cargando, login, logout, cambiarVista, actualizarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
