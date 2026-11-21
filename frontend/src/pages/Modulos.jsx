import { useParams } from 'react-router-dom';
import ListaModulos from './modulos/ListaModulos.jsx';
import DetalleModulo from './modulos/DetalleModulo.jsx';

export default function Modulos() {
  const { id } = useParams();
  return id ? <DetalleModulo key={id} id={id} /> : <ListaModulos />;
}
