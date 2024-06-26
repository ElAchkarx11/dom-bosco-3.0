import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import firebase from 'firebase/compat/app';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

import Logo from '../Images/logo.png';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

function Login() {


  const [email, setEmail] = useState(''); // Estado para armazenar o valor do usuário
  const [senha, setSenha] = useState(''); // Estado para armazenar o valor da senha
  const [mostrarSenha, setMostrarSenha] = useState(false); // Estado para controlar se a senha está sendo mostrada ou não

  const navigate = useNavigate();
  const handleUsuarioChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSenhaChange = (event) => {
    setSenha(event.target.value);
  };

  const alternarMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Evita o comportamento padrão do formulário (recarregar a página)

    const authInstance = getAuth(); // Obtenha a instância auth
    signInWithEmailAndPassword(authInstance, email, senha) // Use a instância auth corretamente
      .then(userCredential => {
        const user = userCredential.user;
        toast.success("Login bem-sucedido");
        navigate('/Inicial')
      })
      .catch(error => {
        console.error('Erro ao fazer login:', error);
        toast.error("Erro ao fazer login!");
      });  // Verifica se o usuário e a senha correspondem aos valores esperados



  };

  return (
    <div className="container-fluid bg-pastel-blue vh-100">
      <div className="row justify-content-center ">
        <img className='pt-4' title='Instituto Dom Bosco' style={{width: "150px"}} src={Logo} alt='Instituto Dom Bosco'></img>
        <h2 className='text-center pb-4'></h2>
        <div className="col-md-4">

          <div className="card">
            <div className="card-header text-dark">
              <h3 className="mb-0 text-center">Login</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="usuario">Usuário:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="usuario"
                    name="usuario"
                    placeholder="Digite seu usuário"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="senha">Senha:</label>
                  <div className="input-group">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      className="form-control"
                      id="senha"
                      name="senha"
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      required
                    />
                    <div className="input-group-append">
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={alternarMostrarSenha}
                      >
                        {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>
                </div>
                <button type="submit" className="btn btn-outline-primary btn-block mt-4">
                  Entrar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login; 
