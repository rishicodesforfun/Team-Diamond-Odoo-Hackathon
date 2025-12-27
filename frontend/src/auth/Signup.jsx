import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import './Auth.css';

function Signup({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!employeeId || !/^\d{6}$/.test(employeeId)) {
      setError('Employee ID must be exactly 6 digits.');
      setLoading(false);
      return;
    }

    if (!password || password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      setError('Password must be at least 8 characters with a letter and a number.');
      setLoading(false);
      return;
    }

    try {
      const data = await signup(email, password, name, employeeId);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>GearGuard</h1>
          <h2>Smart Maintenance Planner</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                placeholder="Enter your 6-digit ID"
                maxLength={6}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create a password"
                minLength={6}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
          <p className="auth-link">
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;

