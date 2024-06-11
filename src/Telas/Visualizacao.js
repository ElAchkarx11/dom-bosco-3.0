import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { PencilSquare, Trash, DoorOpen } from "react-bootstrap-icons";
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { query, collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.js';
import { useEffect, useState } from 'react';

import { Plus } from 'react-bootstrap-icons';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

// Navbar
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function Visualizacao() {
    const [produtos, setProdutos] = useState([]);
    const navigate = useNavigate();

    // Estado de autenticação
    const [authenticated, setAuthenticated] = useState(false);

    // Estados para ordenação e filtro de seção
    const [orderOption, setOrderOption] = useState('nome'); // Inicialmente ordenar por nome
    const [sectionFilter, setSectionFilter] = useState('');

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

    useEffect(() => {
        async function loadProdutos() {
            const produtosRef = collection(db, "produtos");
            const unsub = onSnapshot(produtosRef, (snapshot) => {
                let lista = [];
                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        codigo: doc.data().codigo,
                        nome: doc.data().nome,
                        secao: doc.data().secao,
                        estoque: doc.data().estoque
                    });
                });
                setProdutos(lista);
            });
        }
        loadProdutos();
    }, []);

    // Função para ordenar os produtos com base na opção selecionada
    const sortedProducts = produtos.sort((a, b) => {
        if (orderOption === 'nome') {
            return a.nome.localeCompare(b.nome);
        } else if (orderOption === 'secao') {
            return a.secao.localeCompare(b.secao);
        } else {
            return 0;
        }
    });

    // Função para filtrar os produtos com base na seção selecionada
    const filteredProducts = sectionFilter ? sortedProducts.filter(item => item.secao === sectionFilter) : sortedProducts;

    // Função para manipular a mudança na opção de ordenação
    const handleOrderChange = (e) => {
        setOrderOption(e.target.value);
    };

    // Função para manipular a mudança no filtro de seção
    const handleSectionFilterChange = (e) => {
        setSectionFilter(e.target.value);
    };

    // Função para editar um produto
    const handleEditProduto = (id) => {
        navigate(`/EditarProduto/${id}`);
    };

    // Função para excluir um produto
    const handleDeleteProduto = async (id) => {
        try {
            await deleteDoc(doc(db, "produtos", id));
            setProdutos(produtos.filter((produto) => produto.id !== id));
            toast.success("Produto deletado com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar o produto: ", error);
            toast.error("Erro ao deletar o produto. Tente novamente.");
        }
    };

    // Função para navegar para a página inicial
    const handleClickInicial = () => {
        navigate('/Inicial');
    };

    // Função para navegar para a página de cadastro
    const handleClickCadastro = () => {
        navigate('/Cadastro');
    };

    // Função para navegar para a página de vendas de bazar
    const handleClickBazar = () => {
        navigate('/Vendas Bazar/Bazar');
    };

    // Função para navegar para a página de vendas de alimentação
    const handleClickAlimentacao = () => {
        navigate('/Vendas Alimento/Alimentacao');
    };

    // Função para navegar para a página de visualização de produtos
    const handleClickVisualizacao = () => {
        navigate('/Visualizacao');
    };

    // Função para fazer logout
    const handleLogout = () => {
        signOut(auth);
    };

    // Função para navegar para a página de relatório
    const handleClickRelatorio = () => {
        navigate('/Relatorio');
    };

    // Renderização da lista
    return (
        <div className='container-fluid bg-pastel-blue'>
            <Navbar className='row' bg="dark" variant="dark" expand="lg">
                <Container fluid>
                    <Navbar.Brand onClick={handleClickInicial}><img style={{ width: "50px" }} src={Logo} alt='Dom Bosco' title='Instituto Dom Bosco'></img></Navbar.Brand>
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
                        <div className='row justify-content-center'>
                            <div className='header col-md-12 text-start'>
                                <h3>Visualização de produto</h3>
                                <hr />
                            </div>
                            <div className='col-md-12 text-end'>
                                <Nav.Link onClick={handleClickCadastro}><button className='btn btn-outline-primary'>Novo Registro</button></Nav.Link>
                            </div>
                            <div className='header col-md-6 text-start'>
                                <label htmlFor="orderOption">Ordenar por:</label>
                                <select id="orderOption" className="form-control" value={orderOption} onChange={handleOrderChange}>
                                    <option value="nome">Nome</option>
                                    <option value="secao">Seção</option>
                                </select>
                            </div>
                            <div className='header col-md-6 text-start'>
                                <label htmlFor="sectionFilter">Filtrar por Seção:</label>
                                <select id="sectionFilter" className="form-control" value={sectionFilter} onChange={handleSectionFilterChange}>
                                    <option value="">Todas as Seções</option>
                                    {/* Adicione opções de seção com base nos dados */}
                                    {Array.from(new Set(produtos.map(item => item.secao))).map((secao, index) => (
                                        <option key={index} value={secao}>{secao}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='header col-12 text-start mt-4'>
                                <div className='' style={{ height: '300px', overflowY: 'auto' }}>
                                    <article className="list-header container mb-3">
                                        <div className='row'>
                                            <div className='col-2 d-none d-md-block'>
                                                <strong >#</strong>
                                            </div>
                                            <div className='col-md-4 col-6'>
                                                <strong >NOME</strong>
                                            </div>
                                            <div className='col-md-2 col-6'>
                                                <strong >SEÇÃO</strong>
                                            </div>
                                            <div className='col-md-1 d-none d-md-block'>
                                                <strong >ESTOQUE</strong>
                                            </div>
                                            <div className='col-md-3'></div>
                                        </div>
                                    </article>
                                    {filteredProducts.map((item) => (
                                        <article key={item.id} className="list container">
                                            <div className='row align-items-center mb-2'>
                                                <div className='col-2 d-none d-md-block'>
                                                    <p>{item.codigo}</p>
                                                </div>
                                                <div className='col-md-4 col-6'>
                                                    <p>{item.nome}</p>
                                                </div>
                                                <div className='col-md-2 col-6'>
                                                    <p>{item.secao}</p>
                                                </div>
                                                <div className='col-md-1 d-none d-md-block'>
                                                    <p>{item.estoque}</p>
                                                </div>
                                                <div className='col-md-3'>
                                                    <button className="btn btn-outline-warning mx-2" onClick={() => handleEditProduto(item.id)}><PencilSquare title='Sair' fontSize={15} /></button>
                                                    <button className="btn btn-outline-danger" onClick={() => handleDeleteProduto(item.id)}><Trash title='Sair' fontSize={15} /></button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Visualizacao;

