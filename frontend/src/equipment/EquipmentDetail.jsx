import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getEquipmentById, updateEquipment } from '../api/equipment';
import { getRequests } from '../api/requests';
import { getTeams } from '../api/teams';
import './EquipmentDetail.css';

// Mock user fallback
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function EquipmentDetail() {
  const [user, setUser] = useState(MOCK_USER);
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [requests, setRequests] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
  }, [id]);

  const loadData = async () => {
    try {
      const [equipmentData, requestsData, teamsData] = await Promise.all([
        getEquipmentById(id),
        getRequests({ equipment_id: id }),
        getTeams()
      ]);
      
      const eq = equipmentData.data;
      setEquipment(eq);
      setFormData({
        name: eq.name || '',
        category: eq.category || '',
        location: eq.location || '',
        maintenance_team_id: eq.maintenance_team_id || ''
      });
      setRequests(requestsData.data || []);
      setTeams(teamsData.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 404) {
        navigate('/equipment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateEquipment(id, formData);
      setEditing(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update equipment');
    }
  };

  if (loading) {
    return <div className="equipment-detail-loading">Loading...</div>;
  }

  if (!equipment) {
    return <div className="equipment-detail-error">Equipment not found</div>;
  }

  return (
    <Layout user={user}>
      <div className="equipment-detail">
      <div className="detail-header">
        <Link to="/equipment" className="back-link">← Back to Equipment</Link>
        <button
          onClick={() => setEditing(!editing)}
          className="btn-edit"
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="detail-content">
        <div className="detail-card">
          <h2>Equipment Details</h2>
          {editing ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
              <div className="form-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="detail-info">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="value">{equipment.name}</span>
              </div>
              {equipment.category && (
                <div className="info-row">
                  <span className="label">Category:</span>
                  <span className="value">{equipment.category}</span>
                </div>
              )}
              {equipment.location && (
                <div className="info-row">
                  <span className="label">Location:</span>
                  <span className="value">{equipment.location}</span>
                </div>
              )}
              {equipment.team_name && (
                <div className="info-row">
                  <span className="label">Maintenance Team:</span>
                  <span className="value">{equipment.team_name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="detail-card">
          <h2>Related Requests ({requests.length})</h2>
          {requests.length > 0 ? (
            <div className="requests-list">
              {requests.map(request => (
                <Link
                  key={request.id}
                  to="/requests"
                  className="request-item"
                >
                  <div className="request-header">
                    <h4>{request.title}</h4>
                    <span className={`status-badge ${request.status}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="request-type">
                    {request.type === 'corrective' ? 'Corrective' : 'Preventive'}
                  </p>
                  {request.scheduled_date && (
                    <p className="request-date">
                      Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty-message">No requests for this equipment yet.</p>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
}

export default EquipmentDetail;

