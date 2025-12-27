import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getEquipment, deleteEquipment, createEquipment } from '../api/equipment';
import { getRequests } from '../api/requests';
import { getTeams } from '../api/teams';
import './EquipmentList.css';

// Mock user fallback
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function EquipmentList() {
  const [user, setUser] = useState(MOCK_USER);
  const [equipment, setEquipment] = useState([]);
  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    maintenance_team_id: ''
  });

  useEffect(() => {
    // Bypass auth - use mock user
    setUser(MOCK_USER);
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [equipmentData, requestsData, teamsData] = await Promise.all([
        getEquipment(),
        getRequests(),
        getTeams()
      ]);
      
      setEquipment(equipmentData.data || []);
      setRequests(requestsData.data || []);
      setTeams(teamsData.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      await deleteEquipment(id);
      setEquipment(prev => prev.filter(eq => eq.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete equipment');
    }
  };

  const getRequestCount = (equipmentId) => {
    return requests.filter(req => req.equipment_id === equipmentId).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEquipment(formData);
      setShowModal(false);
      setFormData({
        name: '',
        category: '',
        location: '',
        maintenance_team_id: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create equipment');
    }
  };

  if (loading) {
    return <div className="equipment-loading">Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="equipment-list">
      <div className="equipment-header">
        <h1>Equipment</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Add Equipment
        </button>
      </div>

      <div className="equipment-grid">
        {equipment.map(item => (
          <div key={item.id} className="equipment-card">
            <div className="card-header">
              <h3>{item.name}</h3>
              <div className="card-actions">
                <Link to={`/equipment/${item.id}`} className="btn-link">
                  View
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="card-body">
              {item.category && (
                <div className="info-item">
                  <span className="label">Category:</span>
                  <span className="value">{item.category}</span>
                </div>
              )}
              {item.location && (
                <div className="info-item">
                  <span className="label">Location:</span>
                  <span className="value">{item.location}</span>
                </div>
              )}
              {item.team_name && (
                <div className="info-item">
                  <span className="label">Team:</span>
                  <span className="value">{item.team_name}</span>
                </div>
              )}
              <div className="info-item">
                <span className="label">Requests:</span>
                <span className="value">{getRequestCount(item.id)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="empty-state">
          <p>No equipment found. Add your first equipment to get started.</p>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Equipment</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Motor A"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electrical"
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Building A, Floor 2"
                />
              </div>
              <div className="form-group">
                <label>Maintenance Team</label>
                <select
                  value={formData.maintenance_team_id}
                  onChange={(e) => setFormData({ ...formData, maintenance_team_id: e.target.value })}
                >
                  <option value="">No team assigned</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
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
                  Add Equipment
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

export default EquipmentList;

