import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/api';
import './UserManagement.css';

function UserManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // Technicians only
  const [allUsers, setAllUsers] = useState([]); // All users for stats
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading users and teams...');
      const [allUsersResponse, teamsResponse] = await Promise.all([
        api.get('/users'), // Get all users for stats
        api.get('/teams')
      ]);
      console.log('Users response:', allUsersResponse.data);
      console.log('Teams response:', teamsResponse.data);
      
      // Store all users for stats
      const allUsers = allUsersResponse.data;
      
      // Filter to show only technicians in the table
      const technicians = allUsers.filter(u => u.role === 'technician');
      
      setUsers(technicians);
      setAllUsers(allUsers); // Store all users for stats
      setTeams(teamsResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeam = async (userId) => {
    try {
      await api.patch(`/users/${userId}/team`, {
        team_id: selectedTeam || null
      });
      setEditingUser(null);
      setSelectedTeam('');
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign team');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update role');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'manager': return 'role-badge manager';
      case 'technician': return 'role-badge technician';
      case 'employee': return 'role-badge employee';
      default: return 'role-badge';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Layout user={user} setUser={setUser}>
      <div className="user-management">
        <div className="page-header">
          <h1>Technician Management</h1>
          <p className="subtitle">Assign technicians to teams</p>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Team</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    {editingUser === u.id ? (
                      <div className="team-edit">
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          autoFocus
                        >
                          <option value="">No team</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleAssignTeam(u.id)}
                          className="btn-save"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setSelectedTeam('');
                          }}
                          className="btn-cancel-small"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="team-display">
                        {u.team_name || 'No team'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {editingUser !== u.id && (
                        <button
                          onClick={() => {
                            setEditingUser(u.id);
                            setSelectedTeam(u.team_id || '');
                          }}
                          className="btn-action"
                        >
                          Assign Team
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="empty-state">
              <p>No technicians found.</p>
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{allUsers.length}</p>
          </div>
          <div className="stat-card">
            <h3>Managers</h3>
            <p className="stat-number">
              {allUsers.filter(u => u.role === 'manager').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Technicians</h3>
            <p className="stat-number">
              {allUsers.filter(u => u.role === 'technician').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Employees</h3>
            <p className="stat-number">
              {allUsers.filter(u => u.role === 'employee').length}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UserManagement;
