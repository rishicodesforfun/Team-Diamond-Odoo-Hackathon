import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import './Layout.css';

function Layout({ children, user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('user');
    setUser(null);
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
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
          {/* Teams - Only visible to Managers */}
          {user?.role === 'manager' && (
            <Link to="/teams" className={`nav-item ${isActive('/teams') ? 'active' : ''}`}>
              Teams
            </Link>
          )}
        </nav>
      </div>

      <div className="main-content">
        <header className="header">
          <div>
            {user ? (
              <>
                <h1>Welcome back, {user.name || 'User'}</h1>
                <p className="subtitle">
                  {user.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} - ` : ''}
                  Maintenance Dashboard
                </p>
              </>
            ) : (
              <>
                <h1>GearGuard</h1>
                <p className="subtitle">Smart Maintenance Planner</p>
              </>
            )}
          </div>
          {user ? (
            <button onClick={handleLogout} className="btn-logout">
              Log Out
            </button>
          ) : (
            <button onClick={handleLogin} className="btn-logout">
              Login / Sign Up
            </button>
          )}
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;

