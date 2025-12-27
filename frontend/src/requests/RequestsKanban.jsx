import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { getRequests, updateRequestStatus, createRequest } from '../api/requests';
import { getEquipment, getEquipmentAutofill } from '../api/equipment';
import { getTeams } from '../api/teams';
import './RequestsKanban.css';

const COLUMNS = [
  { id: 'new', title: 'New', color: '#3498db' },
  { id: 'in_progress', title: 'In Progress', color: '#f39c12' },
  { id: 'repaired', title: 'Repaired', color: '#27ae60' },
  { id: 'scrap', title: 'Scrap', color: '#95a5a6' }
];

// Mock user fallback
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function RequestsKanban() {
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(MOCK_USER);
  const [requests, setRequests] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    team_id: '',
    type: 'corrective',
    title: '',
    description: ''
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [filterEquipmentId, setFilterEquipmentId] = useState(null);

  useEffect(() => {
    // Bypass auth - use mock user
    setUser(MOCK_USER);
    
    // Check for equipment filter in URL
    const equipmentId = searchParams.get('equipment_id');
    if (equipmentId) {
      setFilterEquipmentId(equipmentId);
    }
    
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [searchParams]);

  const loadData = async () => {
    try {
      const equipmentId = searchParams.get('equipment_id');
      const filters = equipmentId ? { equipment_id: equipmentId } : {};
      
      const [requestsData, equipmentData, teamsData] = await Promise.all([
        getRequests(filters),
        getEquipment(),
        getTeams()
      ]);
      
      setRequests(requestsData.data || []);
      setEquipment(equipmentData.data || []);
      setTeams(teamsData.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, request) => {
    setDraggedItem(request);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.status === targetStatus) {
      setDraggedItem(null);
      return;
    }

    try {
      await updateRequestStatus(draggedItem.id, targetStatus);
      setRequests(prev => prev.map(req => 
        req.id === draggedItem.id ? { ...req, status: targetStatus } : req
      ));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setDraggedItem(null);
    }
  };

  const handleEquipmentChange = async (equipmentId) => {
    setFormData({ ...formData, equipment_id: equipmentId });
    
    // Auto-fill logic: Get default team and category for equipment
    if (equipmentId) {
      try {
        const autofillData = await getEquipmentAutofill(equipmentId);
        if (autofillData.data) {
          setFormData(prev => ({
            ...prev,
            equipment_id: equipmentId,
            team_id: autofillData.data.team_id || prev.team_id,
            category: autofillData.data.category || prev.category
          }));
        }
      } catch (err) {
        console.error('Failed to load autofill data:', err);
        // Continue without autofill if it fails
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createRequest(formData);
      setShowModal(false);
      setFormData({
        equipment_id: '',
        team_id: '',
        type: 'corrective',
        title: '',
        description: ''
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create request');
    }
  };

  const getRequestsByStatus = (status) => {
    return requests.filter(req => req.status === status);
  };

  if (loading) {
    return <div className="kanban-loading">Loading...</div>;
  }

  return (
    <Layout user={user}>
      <div className="kanban-container">
      <div className="kanban-header">
        <div>
          <h1>Maintenance Requests</h1>
          {filterEquipmentId && (
            <div className="filter-indicator">
              <span>Filtered by Equipment ID: {filterEquipmentId}</span>
              <Link to="/requests" className="clear-filter">Clear Filter</Link>
            </div>
          )}
        </div>
        <div className="kanban-actions">
          <Link to="/calendar" className="btn-secondary">View Calendar</Link>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Request
          </button>
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(column => (
          <div
            key={column.id}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header" style={{ borderTopColor: column.color }}>
              <h2>{column.title}</h2>
              <span className="column-count">{getRequestsByStatus(column.id).length}</span>
            </div>
            <div className="column-content">
              {getRequestsByStatus(column.id).map(request => (
                <div
                  key={request.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, request)}
                >
                  <div className="card-header">
                    <span className={`type-badge ${request.type}`}>
                      {request.type}
                    </span>
                  </div>
                  <h3>{request.title}</h3>
                  {request.description && (
                    <p className="card-description">{request.description}</p>
                  )}
                  <div className="card-meta">
                    {request.equipment_name && (
                      <div className="meta-item">
                        Equipment: {request.equipment_name}
                      </div>
                    )}
                    {request.team_name && (
                      <div className="meta-item">
                        Team: {request.team_name}
                      </div>
                    )}
                    {request.scheduled_date && (
                      <div className="meta-item">
                        Date: {new Date(request.scheduled_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    <small>Created: {new Date(request.created_at).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Maintenance Request</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Equipment *</label>
                <select
                  value={formData.equipment_id}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  required
                >
                  <option value="">Select equipment</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                >
                  <option value="">Select team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="corrective">Corrective (Breakdown)</option>
                  <option value="preventive">Preventive (Scheduled)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Motor Repair"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Additional details..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Request
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

export default RequestsKanban;

