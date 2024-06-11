import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { DoorOpen } from 'react-bootstrap-icons';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

//Navbar
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

function EditarProduto() {
    const navigate = useNavigate();
    const { id } = useParams();

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

    const [produto, setProduto] = useState({
        codigo: '',
        nome: '',
        preco: '',
        secao: '',
        estoque: '',
    });

    useEffect(() => {
        const fetchProduto = async () => {
            const produtoDoc = await getDoc(doc(db, 'produtos', id));
            if (produtoDoc.exists()) {
                setProduto(produtoDoc.data());
            } else {
                toast.error('Produto não encontrado');
                navigate('/Visualizacao');
            }
        };
        fetchProduto();
    }, [id, navigate]);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduto((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'produtos', id), produto);
            toast.success('Produto atualizado com sucesso!');
            navigate('/Visualizacao');
        } catch (error) {
            console.error('Erro ao atualizar o produto: ', error);
            toast.error('Erro ao atualizar o produto. Tente novamente.');
        }
    };


    const handleClickInicial = () => {
        navigate('/Inicial');
    };

    const handleClickCadastro = () => {
        navigate('/Cadastro');
    };

    const handleClickBazar = () => {
        navigate('/Vendas Bazar/Bazar');
    };

    const handleClickAlimentacao = () => {
        navigate('/Vendas Alimento/Alimentacao');
    };

    const handleClickVisualizacao = () => {
        navigate('/Visualizacao');
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const handleClickRelatorio = () => {
        navigate('/Relatorio');
    };


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
                            <div className='header col-12 text-start'>
                                <h3>Editar Produto</h3>
                                <hr />
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className='row'>
                            <div className='form-group col-6 p-2'>
                                <label htmlFor='codigo'>Código do Produto</label>
                                <input
                                    value={produto.codigo}
                                    onChange={handleChange}
                                    type='text'
                                    className='form-control'
                                    id='codigo'
                                    name='codigo'
                                    required
                                />
                            </div>
                            <div className='form-group col-6 p-2'>
                                <label htmlFor='nome'>Nome do Produto</label>
                                <input
                                    value={produto.nome}
                                    onChange={handleChange}
                                    type='text'
                                    className='form-control'
                                    id='nome'
                                    name='nome'
                                    required
                                />
                            </div>
                            <div className='form-group col-4 p-2'>
                                <label htmlFor='preco'>Preço do Produto</label>
                                <input
                                    value={produto.preco}
                                    onChange={handleChange}
                                    type='number'
                                    className='form-control'
                                    id='preco'
                                    name='preco'
                                    required
                                />
                            </div>
                            <div className='form-group col-4 p-2'>
                                <label htmlFor='estoque'>Quantidade em Estoque</label>
                                <input
                                    value={produto.estoque}
                                    onChange={handleChange}
                                    type='number'
                                    className='form-control'
                                    id='estoque'
                                    name='estoque'
                                    required
                                />
                            </div>
                            <div className='form-group col-3 p-2'>
                                <label htmlFor='secao'>Seção</label>
                                <select
                                    value={produto.secao}
                                    onChange={handleChange}
                                    id='secao'
                                    name='secao'
                                    className='form-control'
                                    required
                                >
                                    <option value=''>Selecione</option>
                                    <option value='Bazar'>Bazar</option>
                                    <option value='Alimentacao'>Alimentação</option>
                                </select>
                            </div>
                            <div className='form-group text-start'>
                                <button onClick={handleBack} type='button' className='btn btn-outline-danger btn-block m-2 mt-5'>
                                    Cancelar
                                </button>
                                <button type='submit' className='btn btn-outline-success btn-block m-2 mt-5'>
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditarProduto;
