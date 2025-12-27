import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import './Layout.css';

function Layout({ children, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>GearGuard</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/calendar" className={`nav-item ${isActive('/calendar') ? 'active' : ''}`}>
            Calendar
          </Link>
          <Link to="/requests" className={`nav-item ${isActive('/requests') ? 'active' : ''}`}>
            Requests
          </Link>
          <Link to="/equipment" className={`nav-item ${isActive('/equipment') ? 'active' : ''}`}>
            Equipment
          </Link>
          <Link to="/teams" className={`nav-item ${isActive('/teams') ? 'active' : ''}`}>
            Teams
          </Link>
        </nav>
      </div>

      <div className="main-content">
        <header className="header">
          <div>
            <h1>Welcome back, {user?.name || 'User'}</h1>
            <p className="subtitle">Maintenance Dashboard</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Log Out
          </button>
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;

