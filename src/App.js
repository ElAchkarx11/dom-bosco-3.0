import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Telas/Login';
import Inicial from './Telas/Inicial';
import Cadastro from './Telas/Cadastro';
import Bazar from './Telas/Bazar';
import Alimentacao from './Telas/Alimentacao';
import Visualizacao from './Telas/Visualizacao'
import Relatorio from './Telas/Relatorio'
import EditarProduto from './Telas/EditarProduto';

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
        <Route path="/Relatorio" element={<Relatorio />} />
        <Route path="/EditarProduto/:id" element={<EditarProduto />} />
      </Routes>
    </Router>
  );
}

export default App;