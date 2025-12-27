import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getTeams, createTeam } from '../api/teams';
import './TeamsList.css';

// Mock user fallback
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function TeamsList() {
  const [user, setUser] = useState(MOCK_USER);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    // Bypass auth - use mock user
    setUser(MOCK_USER);
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const data = await getTeams();
      setTeams(data.data || []);
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTeam(teamName);
      setShowModal(false);
      setTeamName('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create team');
    }
  };

  if (loading) {
    return <div className="teams-loading">Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="teams-list">
      <div className="teams-header">
        <h1>Maintenance Teams</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Team
        </button>
      </div>

      <div className="teams-grid">
        {teams.map(team => (
          <div key={team.id} className="team-card">
            <h3>{team.name}</h3>
            <p className="team-meta">
              Created: {new Date(team.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <p>No teams found. Create your first maintenance team.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Team</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Team Name *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                  placeholder="e.g., Maintenance Team A"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}

export default TeamsList;

