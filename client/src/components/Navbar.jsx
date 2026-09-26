import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const inicial = (user?.name || 'P').trim().charAt(0).toUpperCase();

  return (
    <nav className="navbar">
      <div className="container navbar-in">
        <Link to="/" className="brand">
          ✍️ Redações
          <span className="brand-badge">corretor</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/" end>Início</NavLink>
          <NavLink to="/turmas">Turmas</NavLink>
          <NavLink to="/textos">Textos de interpretação</NavLink>
          <NavLink to="/questoes">Banco de questões</NavLink>
        </div>
        <div className="nav-user">
          <span>{user?.name}</span>
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(255,255,255,0.16)', color: '#fff' }}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}