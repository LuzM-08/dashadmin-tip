import { Route, Routes } from 'react-router-dom';
import { RequierePermiso, RutaProtegida } from './auth/RutaProtegida.jsx';
import Layout from './components/layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Inicio from './pages/Inicio.jsx';
import Modulos from './pages/Modulos.jsx';
import Tareas from './pages/Tareas.jsx';
import Eventos from './pages/Eventos.jsx';
import NoEncontrada from './pages/NoEncontrada.jsx';

// SPA: todas las rutas se resuelven en el navegador; el servidor solo entrega index.html.
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route element={<RequierePermiso permiso="modulos:ver" />}>
            <Route path="modulos" element={<Modulos />} />
            <Route path="modulos/:id" element={<Modulos />} />
          </Route>
          <Route element={<RequierePermiso permiso="tareas:leer" />}>
            <Route path="tareas" element={<Tareas />} />
          </Route>
          <Route element={<RequierePermiso permiso="eventos:gestionar" />}>
            <Route path="eventos" element={<Eventos />} />
          </Route>
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Route>
    </Routes>
  );
}
