import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './components/Layout';
import { getRequestStats } from './api/requests';
import './Dashboard.css';

// Mock user fallback
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = user || MOCK_USER;

  useEffect(() => {
    loadStats();
    // Poll every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await getRequestStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={currentUser}>
      <div className="dashboard-content">
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Requests</h3>
              <div className="stat-value">{stats?.total_count || 0}</div>
            </div>
            <div className="summary-card">
              <h3>New</h3>
              <div className="stat-value new">{stats?.new_count || 0}</div>
            </div>
            <div className="summary-card">
              <h3>In Progress</h3>
              <div className="stat-value in-progress">{stats?.in_progress_count || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Repaired</h3>
              <div className="stat-value repaired">{stats?.repaired_count || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Corrective</h3>
              <div className="stat-value corrective">{stats?.corrective_count || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Preventive</h3>
              <div className="stat-value preventive">{stats?.preventive_count || 0}</div>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/requests" className="action-card">
              <h3>View All Requests</h3>
              <p>Manage maintenance requests in Kanban board</p>
            </Link>
            <Link to="/calendar" className="action-card">
              <h3>Weekly Calendar</h3>
              <p>Plan and schedule maintenance visually</p>
            </Link>
            <Link to="/equipment" className="action-card">
              <h3>Equipment</h3>
              <p>View and manage all assets</p>
            </Link>
          </div>
        </div>
    </Layout>
  );
}

export default Dashboard;

