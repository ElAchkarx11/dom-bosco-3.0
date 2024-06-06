import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';

import { ArrowLeft, DoorOpen } from 'react-bootstrap-icons';

//Navbar
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function Cadastro() {
  const navigate = useNavigate();

  // Estado de autenticação
  const [authenticated, setAuthenticated] = useState(false);

  // Verificar o estado de autenticação ao carregar o componente
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        navigate('/');
      }
    });
    return unsubscribe;
  }, [navigate]);

  //Definindo os valores qe vão ser alterados
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [secao, setSecao] = useState('');
  const [qtdestoque, setEstoque] = useState('');


  //Atualizador do estado com os valores
  const handleChangeCodigo = (event) => {
    setCodigo(event.target.value);
  }
  const handleChangeNome = (event) => {
    setNome(event.target.value);
  }
  const handleChangePreco = (event) => {
    setPreco(event.target.value);
  }
  const handleChangeSecao = (event) => {
    setSecao(event.target.value);
  }
  const handleChangeEstoque = (event) => {
    setEstoque(event.target.value);
  }

  // Função para gerar um valor aleatório de 6 dígitos
  const generateRandomCode = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigo(randomCode);
  }

  const handleLogout = () => {
    signOut(auth);
  }

  const handleClickInicial = () => {
    navigate('/Inicial');
  }

  const handleClickCadastro = () => {
    navigate('/Cadastro');
  }

  const handleClickBazar = () => {
    navigate('/Vendas Bazar/Bazar');
  }

  const handleClickAlimentacao = () => {
    navigate('/Vendas Alimento/Alimentacao');
  }

  const handleClickVisualizacao = () => {
    navigate('/Visualizacao');
  }

  const handleBack = () => {
    navigate(-1);
  }

  const handleClickRelatorio = () => {
    navigate('/Relatorio');
  }

  const handleSubmitCadastro = async (event) => {
    try {
      event.preventDefault();

      const docRef = await addDoc(collection(db, "produtos"), {
        codigo: codigo,
        nome: nome,
        preco: preco,
        secao: secao,
        estoque: qtdestoque,
        timestamp: serverTimestamp()
      });
      alert("Cadastro bem-sucedido!");
      setCodigo('');
      setNome('');
      setPreco('');
      setSecao('');
      setEstoque('');
    } catch (e) {
      console.error("Erro em adicionar documento: ", e);
      alert("Cadastro mal-sucedido");
    }

  }

  return (
    <div className='container-fluid'>
      <Navbar className='row' bg="dark" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand onClick={handleClickInicial}>Dom Bosco</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={handleClickInicial}>Inicio</Nav.Link>
              <Nav.Link onClick={handleClickCadastro}>Cadastro</Nav.Link>
              <Nav.Link onClick={handleClickVisualizacao}>Produtos</Nav.Link>
              <NavDropdown title="Vendas" id="basic-nav-dropdown">
                <NavDropdown.Item onClick={handleClickAlimentacao}>Alimentação</NavDropdown.Item>
                <NavDropdown.Item onClick={handleClickBazar}>Bazar</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Nav>
              <Nav.Link onClick={handleLogout}>
                <DoorOpen title='Sair' color='white' fontSize={20} />
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className='row justify-content-center'>
        <div className='opcoes-container'>
          <div className='opcoes container-sm bg-white rounded p-4'>
            <div className='row justify-content-center'>
              <div className='header col-md-12 text-start'>
                <h3>Cadastro de Produtos</h3>
                <hr />
              </div>
            </div>

            <form onSubmit={handleSubmitCadastro} className='row'>
              <div className=' row '>
                <div className='form-group col-md-6 p-2'>
                  <label htmlFor='cod_prod'>Código do Produto</label>
                  <input
                    value={codigo}
                    onChange={handleChangeCodigo}
                    type="text"
                    className="form-control"
                    id="cod_prod"
                    name="cod_prod"
                    placeholder="Digíte o código do produto"
                    required
                    onFocus={generateRandomCode} // Gera o código ao focar no campo
                  />
                </div>
                <div className='form-group col-md-6 p-2'>
                  <label htmlFor='nome_prod'>Nome do Produto</label>
                  <input
                    value={nome}
                    onChange={handleChangeNome}
                    type="text"
                    className="form-control"
                    id="nome_prod"
                    name="nome_prod"
                    placeholder="Digíte o nome do produto"
                    required
                  />
                </div>
                <div className='form-group col-md-4 p-2'>
                  <label htmlFor='preco_prod'>Preço do Produto</label>
                  <input
                    value={preco}
                    onChange={handleChangePreco}
                    type="number"
                    className="form-control"
                    id="preco_prod"
                    name="preco_prod"
                    placeholder="Preço R$"
                    required
                  />
                </div>
                <div className='form-group col-md-4 p-2'>
                  <label htmlFor='preco_prod'>Quantidade em estoque</label>
                  <input
                    value={qtdestoque}
                    onChange={handleChangeEstoque}
                    type="number"
                    className="form-control"
                    id="preco_prod"
                    name="preco_prod"
                    placeholder="Quantidade em estoque"
                    required
                  />
                </div>
                <div className='form-group col-md-3 mt-2'>
                  <label htmlFor='secao'>Seção</label>
                  <div>
                    <select onChange={handleChangeSecao} style={{ padding: "6.5px" }} value={secao} id='secao' name='secao' className=' form-control rounded border'>
                      <option value="">Selecione</option>
                      <option value="Bazar">Bazar</option>
                      <option value="Alimentacao">Alimentação</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className='row'>
                <div className='col-6'>
                  <button type="submit" className="btn btn-outline-success btn-block m-2 mt-5">
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cadastro;
