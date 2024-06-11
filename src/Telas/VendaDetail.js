import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { DoorOpen } from 'react-bootstrap-icons';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

function VendaDetail() {
    const { tipo, id } = useParams();
    const [venda, setVenda] = useState(null);
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(false);
    const [totalVenda, setTotalVenda] = useState(0);

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
        const fetchVenda = async () => {
            try {
                const docRef = doc(collection(db, tipo), id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setVenda(docSnap.data());
                } else {
                    console.log("Nenhum documento existente!");
                }
            } catch (error) {
                console.error("Erro ao apresentar venda: ", error);
            }
        };

        fetchVenda();
    }, [tipo, id]);

    useEffect(() => {
        if (venda) {
            let total = 0;
            if (tipo === "alimentacao" && venda.alimentos) {
                venda.alimentos.forEach(item => {
                    total += parseFloat(item.qtd) * parseFloat(item.preco);
                });
            } else if (tipo === "bazar" && venda.bazar) {
                venda.bazar.forEach(item => {
                    total += parseFloat(item.qtd) * parseFloat(item.preco);
                });
            }
            setTotalVenda(total);
        }
    }, [venda, tipo]);


    if (!venda) {
        return <div>Loading...</div>;
    }

    const handleLogout = () => {
        signOut(auth);
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

    const handleClickRelatorio = () => {
        const doc = new jsPDF();
        doc.autoTable({ html: '#venda-table' });
        doc.save('relatorio_venda.pdf');
    };

    return (
        <div className='container-fluid'>
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
                <div className='vendas-container'>
                    <div className='vendas container-sm bg-white rounded p-4'>
                        <div className='row justify-content-center'>
                            <div className='header col-md-12 text-start'>
                                <h3>Relatorio de Venda</h3>
                                <hr />
                            </div>
                        </div>
                        <div className='container-sm'>
                            <p><strong>Data da Venda:</strong> {new Date(venda.timestamp.seconds * 1000).toLocaleDateString()}</p>
                            <table className='table' id='venda-table'>
                                <thead>
                                    <tr>
                                        <th className='col'>
                                            NOME
                                        </th>
                                        <th className='col'>
                                            QUANTIDADE
                                        </th>
                                        <th className='col'>
                                            PRECO UND
                                        </th>
                                        <th className='col'>
                                            VALOR TOTAL
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tipo === "alimentacao" && venda.alimentos && venda.alimentos.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.nome}</td>
                                            <td>{item.qtd}</td>
                                            <td>{item.preco}</td>
                                            <td>{(parseFloat(item.qtd) * parseFloat(item.preco)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {tipo === "bazar" && venda.bazar && venda.bazar.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.nome}</td>
                                            <td>{item.qtd}</td>
                                            <td>{item.preco}</td>
                                            <td>{(parseFloat(item.qtd) * parseFloat(item.preco)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td colSpan="3">Total da Venda:</td>
                                        <td>{totalVenda.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <button className='btn btn-outline-primary' onClick={handleClickRelatorio}>Gerar PDF</button>
                            <button className='btn btn-outline-danger mx-2' onClick={handleBack}>Voltar</button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}

export default VendaDetail;
