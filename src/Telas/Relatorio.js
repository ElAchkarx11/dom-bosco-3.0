import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, DoorOpen } from 'react-bootstrap-icons';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Relatorio() {
    const navigate = useNavigate();
    const [authenticated, setAuthenticated] = useState(false);
    const [diarioAlimentacao, setDiarioAlimentacao] = useState([]);
    const [diarioBazar, setDiarioBazar] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

    const fetchRelatorios = async () => {
        if (!startDate || !endDate) {
            alert("Por favor, selecione o intervalo de datas.");
            return;
        }

        const inicio = new Date(startDate);
        const fim = new Date(endDate);
        fim.setDate(fim.getDate() + 1); // Avança para o próximo dia
        fim.setHours(0, 0, 0, 0); // Define o horário para 00:00:00.000 do próximo dia


        try {
            // Consultas para alimentação
            const alimentacaoQuery = query(collection(db, "alimentacao"), where("timestamp", ">=", inicio), where("timestamp", "<=", fim));
            const alimentacaoSnapshot = await getDocs(alimentacaoQuery);

            const alimentacaoData = alimentacaoSnapshot.docs.flatMap(doc =>
                (doc.data().alimentos || []).map(item => ({ ...item, timestamp: doc.data().timestamp }))
            );

            setDiarioAlimentacao(alimentacaoData);

            // Consultas para bazar
            const bazarQuery = query(collection(db, "bazar"), where("timestamp", ">=", inicio), where("timestamp", "<=", fim));
            const bazarSnapshot = await getDocs(bazarQuery);

            const bazarData = bazarSnapshot.docs.flatMap(doc => {
                const bazarInfo = doc.data();
                // Verificar se o documento possui a propriedade "alimentos"
                if (bazarInfo.hasOwnProperty("bazar")) {
                    // Se possui, mapear os alimentos e adicionar o timestamp
                    return bazarInfo.bazar.map(item => ({ ...item, timestamp: bazarInfo.timestamp }));
                } else {
                    // Se não possui, retornar um array vazio
                    return [];
                }
            });

            setDiarioBazar(bazarData);
        } catch (error) {
            console.error("Erro ao buscar relatórios: ", error);
        }
    };

    const renderTable = (data) => (
        <table className="table">
            <thead>
                <tr>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Seção</th>
                    <th>Qtd. Vendida</th>
                    <th>Data</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index}>
                        <td>{item.nome || 'N/A'}</td>
                        <td>{item.codigo || 'N/A'}</td>
                        <td>{item.secao || 'N/A'}</td>
                        <td>{item.qtd || 'N/A'}</td>
                        <td>{item.timestamp ? format(item.timestamp.toDate(), 'dd/MM/yyyy') : 'N/A'}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const calculateTotal = (data) => {
        return data.reduce((total, item) => total + (item.qtd || 0), 0);
    };

    const generatePDF = () => {
        const pdf = new jsPDF('p', 'pt', 'a4');
        let yPos = 40;

        pdf.setFontSize(18);
        pdf.text("Relatório de Vendas", 40, yPos);
        yPos += 20;

        pdf.setFontSize(14);
        pdf.text(`Período: ${startDate} - ${endDate}`, 40, yPos);
        yPos += 20;

        if (diarioAlimentacao.length > 0) {
            pdf.text("Alimentação", 40, yPos);
            yPos += 20;

            pdf.autoTable({
                startY: yPos,
                head: [['Nome', 'Código', 'Seção', 'Qtd. Vendida', 'Data']],
                body: diarioAlimentacao.map(item => [
                    item.nome || 'N/A',
                    item.codigo || 'N/A',
                    item.secao || 'N/A',
                    item.qtd || 'N/A',
                    item.timestamp ? format(item.timestamp.toDate(), 'dd/MM/yyyy') : 'N/A'
                ])
            });

            yPos = pdf.autoTable.previous.finalY + 20;

            const totalAlimentacao = calculateTotal(diarioAlimentacao);
            pdf.text(`Total de Qtd. Vendida: ${totalAlimentacao}`, 40, yPos);
            yPos += 20;
        }

        if (diarioBazar.length > 0) {
            pdf.text("Bazar", 40, yPos);
            yPos += 20;

            pdf.autoTable({
                startY: yPos,
                head: [['Nome', 'Código', 'Seção', 'Qtd. Vendida', 'Data']],
                body: diarioBazar.map(item => [
                    item.nome || 'N/A',
                    item.codigo || 'N/A',
                    item.secao || 'N/A',
                    item.qtd || 'N/A',
                    item.timestamp ? format(item.timestamp.toDate(), 'dd/MM/yyyy') : 'N/A'
                ])
            });

            yPos = pdf.autoTable.previous.finalY + 20;

            const totalBazar = calculateTotal(diarioBazar);
            pdf.text(`Total de Qtd. Vendida: ${totalBazar}`, 40, yPos);
            yPos += 20;
        }

        pdf.save('relatorio.pdf');
    };

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
                <div className='container-sm col-11 bg-white rounded p-4'>
                    <div className='row sistemas justify-content-center'>
                        <div className='cabecalho text-start col-12 mb-4'>
                            <h2>Relatório de Vendas</h2>
                            <hr />
                        </div>
                        <div className='col-12'>
                            <div className='row'>
                                <div className='col-md-6'>
                                    <label htmlFor="startDate">Data de Início:</label>
                                    <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" />
                                </div>
                                <div className='col-md-6'>
                                    <label htmlFor="endDate">Data de Término:</label>
                                    <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" />
                                </div>
                            </div>
                            <div className="text-end mt-3">
                                <button className="btn btn-primary" onClick={fetchRelatorios}>Buscar Relatórios</button>
                            </div>
                        </div>
                        <div className='col-12 mt-4'>
                            {diarioAlimentacao.length > 0 && (
                                <>
                                    <h3>Alimentação</h3>
                                    {renderTable(diarioAlimentacao)}
                                    <p><strong>Total de Qtd. Vendida:</strong> {calculateTotal(diarioAlimentacao)}</p>
                                </>
                            )}
                            {diarioBazar.length > 0 && (
                                <>
                                    <h3 className="mt-4">Bazar</h3>
                                    {renderTable(diarioBazar)}
                                    <p><strong>Total de Qtd. Vendida:</strong> {calculateTotal(diarioBazar)}</p>
                                </>
                            )}
                        </div>
                        <div className="text-end">
                            <button className="btn btn-primary" onClick={generatePDF}>Gerar PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Relatorio;
