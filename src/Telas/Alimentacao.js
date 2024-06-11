import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import { CartX, DoorOpen } from 'react-bootstrap-icons';
import { useState, useEffect } from 'react';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import { collection, addDoc, query, getDocs, writeBatch, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Select from 'react-select';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

// Navbar
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function Alimentacao() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [inputQtd, setInputQtd] = useState('');
  const [selectedProduto, setSelectedProduto] = useState(null); // Estado para armazenar o produto selecionado
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
    if (selectedProduto) { // Verifica se um produto foi selecionado
      const produtoSelecionado = produtos.find(produto => produto.id === selectedProduto.value);

      if (produtoSelecionado) {
        const newAlimentoList = [...alimento, {
          codigo: produtoSelecionado.codigo,
          nome: produtoSelecionado.nome,
          secao: produtoSelecionado.secao,
          estoque: produtoSelecionado.estoque,
          qtd: parseInt(inputQtd, 10),
          preco: Number(produtoSelecionado.preco) // Converte o preço do produto para número
        }];
        setAlimento(newAlimentoList);
        localStorage.setItem("alimentacao", JSON.stringify(newAlimentoList));
        setSelectedProduto(null); // Limpa o produto selecionado após a inserção
        setInputQtd('');
      } else {
        toast.error("Item não cadastrado!");
      }
    }
  }

  const renderOptions = () => {
    const alimentacaoProdutos = produtos.filter(produto => produto.secao === "Alimentacao");

    return alimentacaoProdutos.map((produto) => ({
      value: produto.id,
      label: produto.nome
    }));
  };

  const calculateTotal = () => {
    return alimento.reduce((total, item) => total + (item.preco * item.qtd), 0).toFixed(2);
  };

  const renderItems = () => {
    return alimento.map((item, index) => (
      <div className='row pt-2' key={index}>
        <div className='col-3'>
          <p className='pb-3 border-0 border-dark' style={{ wordWrap: 'break-word' }}>
            {item.nome}
          </p>
        </div>
        <div className='col-2 text-center'><p>{item.preco.toFixed(2)}</p></div>
        <div className='col-2 text-center'><p>{item.qtd}</p></div>
        <div className='col-3 text-center'><p>{(item.preco * item.qtd).toFixed(2)}</p></div> {/* Novo campo Valor total */}
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
        toast.error(`Não há estoque suficiente para os produtos: ${productsString}. Por favor, ajuste as quantidades.`);
        return;
      }

      const userConfirmed = window.confirm("Gerar Recibo?");

      if (userConfirmed) {
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

          gerarReciboPDF(alimento);
          limparLista();
          toast.success("Venda finalizada com sucesso!");
        } catch (e) {
          console.error("Erro ao adicionar o documento: ", e);
          toast.error("Erro ao finalizar a venda. Tente novamente.");
        }
      } else {
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
          toast.success("Venda finalizada com sucesso!");
        } catch (e) {
          console.error("Erro ao adicionar o documento: ", e);
          toast.error("Erro ao finalizar a venda. Tente novamente.");
        }
      }
    } else {
      toast.error("Nenhum item no carrinho!");
    }
  };

  const gerarReciboPDF = (alimento) => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("Recibo de Venda", 20, 20);
    pdf.setFontSize(12);

    const columns = ["Produto", "Código", "Quantidade", "Preço Unitário", "Total"];
    const rows = alimento.map(item => [
      item.nome,
      item.codigo,
      item.qtd,
      Number(item.preco).toFixed(2),
      (item.qtd * item.preco).toFixed(2)
    ]);

    const total = alimento.reduce((sum, item) => sum + (item.qtd * item.preco), 0).toFixed(2);

    pdf.autoTable({
      head: [columns],
      body: rows,
      foot: [['', '', '', 'Total da Venda:', total]],
      startY: 30,
      theme: 'grid',
      footStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
    });

    pdf.save('Recibo_Alimento.pdf');
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
          <Navbar.Brand onClick={handleClickInicial}><img style={{width: "50px"}} src={Logo} alt='Dom Bosco' title='Instituto Dom Bosco'></img></Navbar.Brand>
          <Navbar.Brand onClick={handleClickInicial}>Dom Bosco</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link onClick={handleClickInicial}>Inicio</Nav.Link>
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
      <ToastContainer />
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
                    <div className='col-3'>
                      <strong className='pb-3 border-0 border-dark'>
                        NOME
                      </strong>
                    </div>
                    <div className='col-2 text-center'><strong>PREÇO</strong></div>
                    <div className='col-2 text-center'><strong>QTD.</strong></div>
                    <div className='col-3 text-center'><strong>VALOR TOTAL</strong></div> {/* Novo header */}
                  </div>
                  <div style={{ height: '280px', overflowY: 'auto' }}>

                    <div className='item'>{renderItems()}</div>
                  </div>
                </div>
                <div className='col-md-6'>
                  <form onSubmit={handleAddItem}>
                    <div className='form-group'>
                      <label htmlFor='id'>Selecione o Produto:</label>
                      <Select
                        value={selectedProduto}
                        onChange={setSelectedProduto}
                        options={renderOptions()}
                        id='id'
                        name='id'
                        placeholder='Selecione um produto'
                        isClearable
                      />
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
                  <div className='form-group mt-3'>
                    <label htmlFor='total'>Valor Total:</label>
                    <input
                      type='text'
                      className='form-control'
                      value={`R$ ${calculateTotal()}`}
                      id='total'
                      name='total'
                      readOnly
                    />
                  </div>
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
