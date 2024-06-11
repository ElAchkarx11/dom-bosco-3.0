import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth } from '../firebase.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, DoorOpen } from 'react-bootstrap-icons';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

import jsPDF from 'jspdf';
import 'jspdf-autotable';

function Inicial() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [vendas, setVendas] = useState([]);
  const [startDate, setStartDate] = useState(localStorage.getItem('startDate') || '');
  const [endDate, setEndDate] = useState(localStorage.getItem('endDate') || '');
  const [showAlimentacao, setShowAlimentacao] = useState(true);
  const [showBazar, setShowBazar] = useState(true);



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
    localStorage.setItem('startDate', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('endDate', endDate);
  }, [endDate]);


  const fetchRelatorios = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor, selecione o intervalo de datas.");
      return;
    }

    // Define a data inicial no início do dia seguinte (00:00:00)
    const inicio = new Date(startDate);
    inicio.setDate(inicio.getDate() + 1); // Adiciona um dia
    inicio.setHours(0, 0, 0, 0);

    // Define a data final no fim do dia seguinte (23:59:59)
    const fim = new Date(endDate);
    fim.setDate(fim.getDate() + 1); // Adiciona um dia
    fim.setHours(23, 59, 59, 999);

    try {
      let relatorios = [];

      // Consultas para alimentação
      if (showAlimentacao) {
        const alimentacaoQuery = query(
          collection(db, "alimentacao"),
          where("timestamp", ">=", inicio),
          where("timestamp", "<=", fim)
        );
        const alimentacaoSnapshot = await getDocs(alimentacaoQuery);

        const alimentacaoData = alimentacaoSnapshot.docs.map(doc => {
          const data = doc.data();
          const secao = (data.alimentos && data.alimentos.length > 0 && data.alimentos[0].secao) || 'N/A';
          return {
            ...data,
            id: doc.id,
            tipo: "alimentacao",
            secao: secao
          };
        });

        relatorios = [...relatorios, ...alimentacaoData];
      }

      // Consultas para bazar
      if (showBazar) {
        const bazarQuery = query(
          collection(db, "bazar"),
          where("timestamp", ">=", inicio),
          where("timestamp", "<=", fim)
        );
        const bazarSnapshot = await getDocs(bazarQuery);

        const bazarData = bazarSnapshot.docs.map(doc => {
          const data = doc.data();
          const secao = (data.bazar && data.bazar.length > 0 && data.bazar[0].secao) || 'N/A';
          return {
            ...data,
            id: doc.id,
            tipo: "bazar",
            secao: secao
          };
        });

        relatorios = [...relatorios, ...bazarData];
      }

      setVendas(relatorios);
    } catch (error) {
      console.error("Erro ao buscar relatórios: ", error);
    }
  };

  const renderVendas = () => {
    // Filtra as vendas com base nos checkboxes de exibição
    const vendasFiltradas = vendas.filter((venda) => {
      if (venda.tipo === "alimentacao") {
        return showAlimentacao;
      } else if (venda.tipo === "bazar") {
        return showBazar;
      }
      return false;
    });

    // Mapeia as vendas filtradas para elementos JSX
    return vendasFiltradas.map((venda, index) => {
      let valorTotal = 0;

      if (venda.tipo === "alimentacao") {
        valorTotal = venda.alimentos.reduce((acc, item) => acc + (item.qtd * item.preco), 0);
      } else if (venda.tipo === "bazar") {
        valorTotal = venda.bazar.reduce((acc, item) => acc + (item.qtd * item.preco), 0);
      }

      return (
        <div
          key={venda.id}
          className="venda-bloco border rounded p-3 mb-2"
          onClick={() => navigate(`/${venda.tipo}/${venda.id}`, { state: { venda } })}
          style={{ cursor: 'pointer' }}
        >
          <h4>{`Venda Data ${new Date(venda.timestamp.seconds * 1000).toLocaleString()}`}</h4>
          <p><strong>Seção:</strong> {venda.secao || 'N/A'}</p>
          <p><strong>Valor Total:</strong> R$ {valorTotal.toFixed(2)}</p>
        </div>
      );
    });
  };

  const handleClickRelatorioTotal = () => {
    // Verifica se há vendas a serem incluídas no relatório total
    if (vendas.length === 0) {
      toast.error("Não há vendas para gerar o relatório total.");
      return;
    }

    const doc = new jsPDF();
    let startY = 10; // Posição inicial na página

    const vendasFiltradas = vendas.filter((venda) => {
      if (venda.tipo === "alimentacao") {
        return showAlimentacao;
      } else if (venda.tipo === "bazar") {
        return showBazar;
      }
      return false;
    });

    vendasFiltradas.forEach((venda, index) => {
      let valorTotalVenda = 0; // Variável para armazenar o valor total da venda

      // Adiciona título da venda
      doc.text(`Venda Data ${new Date(venda.timestamp.seconds * 1000).toLocaleString()}`, 10, startY);

      // Verifica o tipo de venda e constrói a tabela correspondente
      if (venda.tipo === "alimentacao" && venda.alimentos) {
        const headers = ['codigo', 'Nome', 'Quantidade', 'Valor Und.', 'Valor Total']; // Adiciona o cabeçalho para as duas colunas extras
        const data = venda.alimentos.map(item => {
          const preco = Number(item.preco);
          const valorTotalItem = item.qtd * preco;
          valorTotalVenda += valorTotalItem; // Adiciona o valor total deste item ao total da venda
          return [
            item.codigo,
            item.nome,
            item.qtd,
            `R$ ${preco.toFixed(2)}`, // Converte para número e formata o valor unitário
            `R$ ${valorTotalItem.toFixed(2)}`, // Calcula o valor total e formata
          ];
        });

        // Adiciona uma linha extra com o total da venda
        data.push(['', '', '', 'Total da Venda:', `R$ ${valorTotalVenda.toFixed(2)}`]);

        doc.autoTable({
          startY: startY + 20, // Ajusta a posição inicial da tabela
          head: [headers],
          body: data,
        });
      } else if (venda.tipo === "bazar" && venda.bazar) {
        const headers = ['Nome', 'Quantidade', 'Valor Und.', 'Valor Total']; // Adiciona o cabeçalho para as duas colunas extras
        const data = venda.bazar.map(item => {
          const preco = Number(item.preco);
          const valorTotalItem = item.qtd * preco;
          valorTotalVenda += valorTotalItem; // Adiciona o valor total deste item ao total da venda
          return [
            item.nome,
            item.qtd,
            `R$ ${preco.toFixed(2)}`, // Converte para número e formata o valor unitário
            `R$ ${valorTotalItem.toFixed(2)}`, // Calcula o valor total e formata
          ];
        });

        // Adiciona uma linha extra com o total da venda
        data.push(['', '', 'Total da Venda:', `R$ ${valorTotalVenda.toFixed(2)}`]);

        doc.autoTable({
          startY: startY + 20, // Ajusta a posição inicial da tabela
          head: [headers],
          body: data,
        });
      }
      startY = doc.autoTable.previous.finalY + 10; // Atualiza a posição inicial para a próxima tabela
    });

    doc.save('relatorio_historico_vendas.pdf');
  };


  const handleClickRelatorio = () => {
    // Verifica se há vendas a serem incluídas no relatório
    if (vendas.length === 0) {
      toast.error("Não há vendas para gerar o relatório.");
      return;
    }

    const doc = new jsPDF();
    let startY = 10; // Posição inicial na página
    let totalPagesExp = '{total_pages_count_string}';

    const vendasFiltradas = vendas.filter((venda) => {
      if (venda.tipo === "alimentacao") {
        return showAlimentacao;
      } else if (venda.tipo === "bazar") {
        return showBazar;
      }
      return false;
    });

    let allProducts = {}; // Objeto para armazenar todos os produtos

    vendasFiltradas.forEach((venda, index) => {
      let valorTotalVenda = 0; // Variável para armazenar o valor total da venda

      // Verifica o tipo de venda e itera sobre os itens correspondentes
      if (venda.tipo === "alimentacao" && venda.alimentos) {
        venda.alimentos.forEach(item => {
          const chave = `${item.codigo}-${item.nome}`; // Cria uma chave única para o produto
          const preco = Number(item.preco);
          const valorTotalItem = item.qtd * preco;
          valorTotalVenda += valorTotalItem; // Adiciona o valor total deste item ao total da venda

          // Adiciona o item ao objeto allProducts ou atualiza a quantidade e valor total se já existir
          if (!allProducts[chave]) {
            allProducts[chave] = { ...item, totalQuantidade: item.qtd, totalValor: valorTotalItem, precoUnitario: preco };
          } else {
            allProducts[chave].totalQuantidade += item.qtd;
            allProducts[chave].totalValor += valorTotalItem;
          }
        });
      } else if (venda.tipo === "bazar" && venda.bazar) {
        venda.bazar.forEach(item => {
          const chave = `${item.codigo}-${item.nome}`; // Cria uma chave única para o produto
          const preco = Number(item.preco);
          const valorTotalItem = item.qtd * preco;
          valorTotalVenda += valorTotalItem; // Adiciona o valor total deste item ao total da venda

          // Adiciona o item ao objeto allProducts ou atualiza a quantidade e valor total se já existir
          if (!allProducts[chave]) {
            allProducts[chave] = { ...item, totalQuantidade: item.qtd, totalValor: valorTotalItem, precoUnitario: preco };
          } else {
            allProducts[chave].totalQuantidade += item.qtd;
            allProducts[chave].totalValor += valorTotalItem;
          }
        });
      }
    });

    // Inicia a criação da tabela
    const headers = ['Código', 'Nome', 'Quantidade', 'Preço Unitário', 'Valor Total'];

    const data = Object.values(allProducts).map(item => [
      item.codigo,
      item.nome,
      item.totalQuantidade,
      `R$ ${item.precoUnitario.toFixed(2)}`, // Adiciona o preço unitário formatado
      `R$ ${item.totalValor.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: startY,
      head: [headers],
      body: data,

      didDrawPage: function (data) {
        const totalPages = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text('Página ' + data.pageNumber + ' de ' + totalPagesExp, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save('relatorio_valores_totais.pdf');
  };


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
  }

  const handleClickAlimentacao = () => {
    navigate('/Vendas Alimento/Alimentacao');
  };
  const handleClickVisualizacao = () => {
    navigate('/Visualizacao');
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
        <div className='inicial-container'>
          <div className='inicial container-sm bg-white rounded p-4'>
            <div className='row sistemas justify-content-center'>
              <div className='cabecalho text-start col-12 mb-4'>
                <h3>Relatório de Vendas</h3>
                <hr />
              </div>
              <div style={{ height: "400px" }} className='border rounded col-md-4'>
                <div className=''>
                  <div className='row'>
                    <div className='text-center border-bottom'>
                      <h3 className='p-2'>Histórico</h3>
                    </div>
                    <div className='col-md-12'>
                      <label htmlFor="startDate">Data de Início:</label>
                      <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-control" />
                    </div>
                    <div className='col-md-12'>
                      <label htmlFor="endDate">Data de Término:</label>
                      <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-control" />
                    </div>
                  </div>
                  <div className='align-itens-center'>
                    <div className="text-end my-2">
                      <button className="btn btn-primary col-12" onClick={fetchRelatorios}>Buscar Relatórios</button>
                    </div>
                    <div className="text-end my-2">
                      <button className="btn btn-primary col-12" onClick={handleClickRelatorio}>Relatório - Resumo de Itens</button>
                    </div>
                    <div className="text-end my-2">
                      <button className="btn btn-primary col-12" onClick={handleClickRelatorioTotal}>Relatório - Histórico de Vendas</button>
                    </div>
                    <div className='d-flex'>
                      <div className='form-check m-2'>
                        <input
                          className='form-check-input'
                          type="checkbox"
                          id="alimentacaoCheckbox"
                          checked={showAlimentacao}
                          onChange={() => setShowAlimentacao(!showAlimentacao)}
                        />
                        <label htmlFor="alimentacaoCheckbox">Mostrar Alimentação</label>
                      </div>
                      <div className='form-check m-2'>
                        <input
                          className='form-check-input'
                          type="checkbox"
                          id="bazarCheckbox"
                          checked={showBazar}
                          onChange={() => setShowBazar(!showBazar)}
                        />
                        <label htmlFor="bazarCheckbox">Mostrar Bazar</label>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              <div style={{ height: "400px", overflowY: "auto" }} className='col-md-8'>
                {renderVendas()}
              </div>
              <div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicial;
