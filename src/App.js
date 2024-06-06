import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Telas/Login';
import Inicial from './Telas/Inicial';
import Cadastro from './Telas/Cadastro';
import Bazar from './Telas/Bazar';
import Alimentacao from './Telas/Alimentacao';
import Visualizacao from './Telas/Visualizacao'
import EditarProduto from './Telas/EditarProduto';
import VendaDetail from './Telas/VendaDetail';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Inicial" element={<Inicial />} />
        <Route path="/Cadastro" element={<Cadastro />} />
        <Route path="/Vendas Bazar/Bazar" element={<Bazar />} />
        <Route path="/Vendas Alimento/Alimentacao" element={<Alimentacao />} />
        <Route path="/Visualizacao" element={<Visualizacao />} />
        <Route path="/EditarProduto/:id" element={<EditarProduto />} />
        <Route path="/:tipo/:id" element={<VendaDetail />} />
      </Routes>
    </Router>
  );
}

export default App;