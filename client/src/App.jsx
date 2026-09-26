import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Turmas from './pages/Turmas.jsx';
import TurmaDetalhe from './pages/TurmaDetalhe.jsx';
import AtividadeForm from './pages/AtividadeForm.jsx';
import RedacaoCaptura from './pages/RedacaoCaptura.jsx';
import RedacaoResultado from './pages/RedacaoResultado.jsx';
import BancoQuestoes from './pages/BancoQuestoes.jsx';
import QuestoesImpressao from './pages/QuestoesImpressao.jsx';
import TextosAcervo from './pages/TextosAcervo.jsx';
import Baixar from './pages/Baixar.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex" style={{ minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner-dark" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/baixar" element={<Baixar />} />
        <Route path="/" element={<Protected><Dashboard /></Protected>} />
        <Route path="/turmas" element={<Protected><Turmas /></Protected>} />
        <Route path="/turmas/:id" element={<Protected><TurmaDetalhe /></Protected>} />
        <Route path="/turmas/:id/atividades/nova" element={<Protected><AtividadeForm /></Protected>} />
        <Route path="/turmas/:id/atividades/:atvId" element={<Protected><AtividadeForm /></Protected>} />
        <Route path="/turmas/:id/corrigir" element={<Protected><RedacaoCaptura /></Protected>} />
        <Route path="/turmas/:id/corrigir/:atvId" element={<Protected><RedacaoCaptura /></Protected>} />
        <Route path="/redacoes/:id" element={<Protected><RedacaoResultado /></Protected>} />
        <Route path="/questoes" element={<Protected><BancoQuestoes /></Protected>} />
        <Route path="/questoes/imprimir" element={<Protected><QuestoesImpressao /></Protected>} />
        <Route path="/textos" element={<Protected><TextosAcervo /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}