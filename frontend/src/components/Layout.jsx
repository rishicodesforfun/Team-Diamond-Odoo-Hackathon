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
    <div className="layout-container">
      <aside className="dock glass">
        <div className="dock-header">
          <div className="dock-logo">
            <span className="logo-text">GearGuard</span>
          </div>
        </div>
        
        <nav className="dock-nav">
          <Link 
            to="/dashboard" 
            className={`dock-item ${isActive('/dashboard') ? 'active' : ''}`}
            title="Dashboard"
          >
            <span className="dock-label">Dashboard</span>
          </Link>
          
          <Link 
            to="/calendar" 
            className={`dock-item ${isActive('/calendar') ? 'active' : ''}`}
            title="Calendar"
          >
            <span className="dock-label">Calendar</span>
          </Link>
          
          <Link 
            to="/requests" 
            className={`dock-item ${isActive('/requests') ? 'active' : ''}`}
            title="Requests"
          >
            <span className="dock-label">Requests</span>
          </Link>
          
          <Link 
            to="/equipment" 
            className={`dock-item ${isActive('/equipment') ? 'active' : ''}`}
            title="Equipment"
          >
            <span className="dock-label">Equipment</span>
          </Link>
          
          {user?.role === 'manager' && (
            <>
              <div className="dock-divider"></div>
              
              <Link 
                to="/teams" 
                className={`dock-item ${isActive('/teams') ? 'active' : ''}`}
                title="Teams"
              >
                <span className="dock-label">Teams</span>
              </Link>
              
              <Link 
                to="/users" 
                className={`dock-item ${isActive('/users') ? 'active' : ''}`}
                title="Users"
              >
                <span className="dock-label">Users</span>
              </Link>
            </>
          )}
        </nav>

        <div className="dock-footer">
          {user ? (
            <button onClick={handleLogout} className="dock-logout" title="Log Out">
              <span className="dock-label">Logout</span>
            </button>
          ) : (
            <button onClick={handleLogin} className="dock-logout" title="Login">
              <span className="dock-label">Login</span>
            </button>
          )}
        </div>
      </aside>

      <main className="stage">
        <div className="stage-header glass">
          <div className="header-info">
            {user ? (
              <>
                <h1 className="header-title">Welcome back, {user.name || 'User'}</h1>
                <p className="header-subtitle">
                  {user.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} · ` : ''}
                  Maintenance Dashboard
                </p>
              </>
            ) : (
              <>
                <h1 className="header-title">GearGuard</h1>
                <p className="header-subtitle">Smart Maintenance Planner</p>
              </>
            )}
          </div>
        </div>
        
        <div className="stage-content">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;

