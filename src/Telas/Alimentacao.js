import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { CartX, DoorOpen } from 'react-bootstrap-icons';
import { useState, useEffect } from 'react';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import { collection, addDoc, query, getDocs, writeBatch, where } from 'firebase/firestore';

//Navbar
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function Alimentacao() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputQtd, setInputQtd] = useState('');
  const [alimento, setAlimento] = useState(() => {
    const savedAlimentos = localStorage.getItem("alimentos");
    return savedAlimentos ? JSON.parse(savedAlimentos) : [];
  });
  const [produtos, setProdutos] = useState([]);

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

  useEffect(() => {
    async function fetchProdutos() {
      try {
        const produtosRef = collection(db, "produtos");
        const produtosSnapshot = await getDocs(produtosRef);
        const produtosData = produtosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProdutos(produtosData);
      } catch (error) {
        console.error("Erro ao carregar produtos: ", error);
      }
    }

    fetchProdutos();
  }, []);

  const handleAddItem = (event) => {
    event.preventDefault();
    loadProdutos();
  };

  async function loadProdutos() {
    const produtoSelecionado = produtos.find(produto => produto.id === inputValue);

    if (produtoSelecionado) {
      const newAlimentoList = [...alimento, {
        codigo: produtoSelecionado.codigo,
        nome: produtoSelecionado.nome,
        secao: produtoSelecionado.secao,
        estoque: produtoSelecionado.estoque,
        qtd: parseInt(inputQtd, 10)
      }];
      setAlimento(newAlimentoList);
      localStorage.setItem("alimentacao", JSON.stringify(newAlimentoList));
      setInputValue('');
      setInputQtd('');
    } else {
      alert("Item não cadastrado!");
    }
  }
  const renderOptions = () => {
    const alimentacaoProdutos = produtos.filter(produto => produto.secao === "Alimentacao");

    return alimentacaoProdutos.map((produto) => (
      <option key={produto.id} value={produto.id}>{produto.nome}</option>
    ));
  };

  const renderItems = () => {
    return alimento.map((item, index) => (
      <div className='row pt-2' key={index}>
        <div className='col-4'>
          <p className='pb-3 border-0 border-dark' style={{ wordWrap: 'break-word' }}>
            {item.nome}
          </p>
        </div>
        <div className='col-3 text-center'><p>{item.codigo}</p></div>
        <div className='col-2 text-center'><p>{item.qtd}</p></div>
        <div className='col-1 text-center'>
          <button onClick={() => limparItem(index)} className='btn btn-outline-danger btn-sm'><CartX title='Sair' fontSize={20} /></button>
        </div>
      </div>
    ));
  };

  const limparItem = (indexR) => {
    const newAlimentoList = alimento.filter((_, index) => index !== indexR);
    setAlimento(newAlimentoList);
    localStorage.setItem("alimentacao", JSON.stringify(newAlimentoList));
  }

  const limparLista = () => {
    localStorage.removeItem('alimentacao');
    setAlimento([]);
  }

  const handleFinalizar = async () => {
    if (alimento.length > 0) {
      const insufficientStockProducts = [];

      // Verificar o estoque de cada item no carrinho
      for (const item of alimento) {
        const produtosRef = query(collection(db, "produtos"), where("codigo", "==", item.codigo));
        const snapshot = await getDocs(produtosRef);

        snapshot.forEach((doc) => {
          const estoqueDisponivel = doc.data().estoque;
          if (item.qtd > estoqueDisponivel) {
            insufficientStockProducts.push(doc.data().nome);
          }
        });
      }

      if (insufficientStockProducts.length > 0) {
        const productsString = insufficientStockProducts.join(', ');
        alert(`Não há estoque suficiente para os produtos: ${productsString}. Por favor, ajuste as quantidades.`);
        return;
      }

      try {
        const batch = writeBatch(db);

        for (const item of alimento) {
          const produtosRef = query(collection(db, "produtos"), where("codigo", "==", item.codigo));
          const snapshot = await getDocs(produtosRef);

          snapshot.forEach((doc) => {
            const produtoRef = doc.ref;
            const newEstoque = doc.data().estoque - item.qtd;
            batch.update(produtoRef, { estoque: newEstoque });
          });
        }

        await batch.commit();

        await addDoc(collection(db, "alimentacao"), {
          alimentos: alimento,
          timestamp: new Date()
        });

        limparLista();
        alert("Venda finalizada com sucesso!");
      } catch (e) {
        console.error("Erro ao adicionar o documento: ", e);
        alert("Erro ao finalizar a venda. Tente novamente.");
      }
    } else {
      alert("Nenhum item no carrinho!");
    }
  };



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

  const handleLogout = () => {
    signOut(auth);
  }

  const handleClickRelatorio = () => {
    navigate('/Relatorio');
  }

  return (
    <div className='container-fluid bg-pastel-blue'>
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
            <div className='row sistemas justify-content-center'>
              <div className='cabecalho mb-4'>
                <h3>Vendas - Alimentação</h3>
                <hr />
              </div>
              <div className='row justify-content-center'>
                <div className='col-md-6 col-12'>
                  <div className='row pb-4'>
                    <div className='col-4'>
                      <strong className='pb-3 border-0 border-dark'>
                        NOME
                      </strong>
                    </div>
                    <div className='col-3 text-center'><strong>CÓDIGO</strong></div>
                    <div className='col-2 text-center'><strong>QTD.</strong></div>
                  </div>
                  <div style={{ height: '350px', overflowY: 'auto' }}>

                    <div className='item'>{renderItems()}</div>
                  </div>
                </div>
                <div className='col-md-6'>
                  <form onSubmit={handleAddItem}>
                    <div className='form-group'>
                      <label htmlFor='id'>Selecione o Produto:</label>
                      <select
                        className='form-control'
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        id='id'
                        name='id'
                        required
                      >
                        <option value=''>Selecione um produto</option>
                        {renderOptions()}
                      </select>
                      <label htmlFor='qtd'>Quantidade</label>
                      <input
                        type='number'
                        className='form-control'
                        value={inputQtd}
                        onChange={(e) => setInputQtd(e.target.value)}
                        id='qtd'
                        name='qtd'
                        placeholder='Digite a quantidade'
                        required
                      />
                      <button className='btn btn-outline-primary m-3' type='submit'>
                        Inserir
                      </button>
                      <button onClick={limparLista} className='btn btn-outline-danger m-3' type='button'>
                        Apagar lista
                      </button>
                    </div>
                  </form>
                </div>
                <button onClick={handleFinalizar} type="button" className="btn btn-outline-success btn-lg btn-block mt-4">
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alimentacao;

