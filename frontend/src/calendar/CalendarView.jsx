import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCalendarEvents, createRequest, updateRequest } from '../api/requests';
import { getEquipment, getEquipmentAutofill } from '../api/equipment';
import { getTeams } from '../api/teams';
import api from '../api/api';
import './CalendarView.css';

const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function CalendarView() {
  const [user, setUser] = useState(MOCK_USER);
  const [events, setEvents] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [teams, setTeams] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    team_id: '',
    type: 'preventive',
    title: '',
    description: '',
    start_time: '09:00',
    duration_hours: 1.0
  });
  const [editFormData, setEditFormData] = useState({
    equipment_id: '',
    team_id: '',
    type: 'preventive',
    title: '',
    description: '',
    scheduled_date: '',
    start_time: '09:00',
    duration_hours: 1.0
  });

  useEffect(() => {
    // Get user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Fallback to mock user
      setUser(MOCK_USER);
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [currentMonth]);

  const loadData = async () => {
    try {
      const monthStart = getMonthStart(currentMonth);
      const monthEnd = getMonthEnd(currentMonth);
      
      const [eventsData, equipmentData, teamsData] = await Promise.all([
        getCalendarEvents(monthStart, monthEnd),
        getEquipment(),
        getTeams()
      ]);
      
      setEvents(eventsData.data || []);
      setEquipment(equipmentData.data || []);
      setTeams(teamsData.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const getMonthStart = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    return formatDate(d);
  };

  const getMonthEnd = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return formatDate(d);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days = [];

    // Add previous month padding
    for (let i = 0; i < startPadding; i++) {
      const d = new Date(year, month, -startPadding + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = formatDate(date);
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date.split('T')[0];
      return eventDate === dateStr;
    });
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleTimeSlotClick = (hour) => {
    if (!selectedDate) return;
    
    // Employees cannot create events from calendar
    if (user?.role === 'employee') {
      alert('Employees can only create corrective requests from the Requests page.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      scheduled_date: formatDate(selectedDate),
      start_time: `${hour.toString().padStart(2, '0')}:00`,
      type: user?.role === 'technician' ? 'corrective' : 'preventive'
    }));
    setShowModal(true);
  };

  const handleEquipmentChange = async (equipmentId) => {
    setFormData({ ...formData, equipment_id: equipmentId });
    
    if (equipmentId) {
      try {
        const autofillData = await getEquipmentAutofill(equipmentId);
        if (autofillData.data) {
          setFormData(prev => ({
            ...prev,
            equipment_id: equipmentId,
            team_id: autofillData.data.team_id || prev.team_id
          }));
        }
      } catch (err) {
        console.error('Failed to load autofill data:', err);
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
        type: 'preventive',
        title: '',
        description: '',
        start_time: '09:00',
        duration_hours: 1.0
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create request');
    }
  };

  const handleEventClick = (event) => {
    // Employees have read-only access
    if (user?.role === 'employee') {
      alert('Employees have read-only access to the calendar.');
      return;
    }
    
    setSelectedEvent(event);
    setEditFormData({
      equipment_id: event.equipment_id || '',
      team_id: event.team_id || '',
      type: event.type || 'preventive',
      title: event.title || '',
      description: event.description || '',
      scheduled_date: event.date?.split('T')[0] || '',
      start_time: event.startTime || '09:00',
      duration_hours: event.durationHours || 1.0
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRequest(selectedEvent.id, editFormData);
      setShowEditModal(false);
      setSelectedEvent(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update request');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }
    try {
      await api.delete(`/requests/${selectedEvent.id}`);
      setShowEditModal(false);
      setSelectedEvent(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete request');
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const monthDays = getMonthDays();
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Layout user={user}>
      <div className="calendar-view">
        <div className="calendar-header">
          <div className="calendar-nav">
            <button onClick={() => navigateMonth(-1)}>← Previous</button>
            <button onClick={goToToday}>Today</button>
            <button onClick={() => navigateMonth(1)}>Next →</button>
          </div>
          <h2>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Link to="/requests" className="btn-secondary">View Kanban</Link>
        </div>

        <div className="calendar-layout">
          {/* Month Grid */}
          <div className="month-grid">
            <div className="weekday-headers">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday-header">{day}</div>
              ))}
            </div>
            <div className="month-days">
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                const isToday = formatDate(day.date) === formatDate(today);
                const isSelected = selectedDate && formatDate(day.date) === formatDate(selectedDate);
                
                return (
                  <div
                    key={index}
                    className={`month-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <div className="day-number">{day.date.getDate()}</div>
                    {dayEvents.length > 0 && (
                      <div className="event-indicators">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`event-dot ${event.status}`}
                            title={event.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="more-events">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Detail Panel */}
          {selectedDate && (
            <div className="day-detail">
              <div className="day-detail-header">
                <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <button onClick={() => setSelectedDate(null)} className="close-btn">×</button>
              </div>
              <div className="day-detail-content">
                {getEventsForDate(selectedDate).length === 0 ? (
                  <div className="no-events">
                    <p>No events scheduled</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>Click a time slot to create one</p>
                  </div>
                ) : (
                  <div className="events-list">
                    {getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className={`event-item ${event.status}`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="event-time">
                          {event.startTime} ({event.durationHours}h)
                        </div>
                        <div className="event-title">{event.title}</div>
                        <div className="event-equipment">{event.equipment_name}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="time-slots">
                  <h4>Add New Event</h4>
                  {user?.role === 'employee' ? (
                    <p style={{ color: '#666', fontSize: '0.9rem', padding: '1rem' }}>
                      Employees have read-only access. Create corrective requests from the Requests page.
                    </p>
                  ) : (
                    <div className="time-slot-grid">
                      {hours.map(hour => (
                        <button
                          key={hour}
                          className="time-slot-btn"
                          onClick={() => handleTimeSlotClick(hour)}
                        >
                          {hour.toString().padStart(2, '0')}:00
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
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
                  {user?.role === 'technician' ? (
                    <>
                      <input
                        type="text"
                        value="Auto-assigned to you"
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                      <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                        Technicians are automatically assigned to their own requests
                      </small>
                    </>
                  ) : (
                    <select
                      value={formData.team_id}
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    >
                      <option value="">Select team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    disabled={user?.role === 'technician'}
                  >
                    {user?.role === 'manager' && (
                      <option value="preventive">Preventive</option>
                    )}
                    <option value="corrective">Corrective</option>
                  </select>
                  {user?.role === 'technician' && (
                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                      Technicians can only create corrective requests
                    </small>
                  )}
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                    />
                  </div>
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

        {showEditModal && selectedEvent && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Maintenance Request</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label>Equipment *</label>
                  <select
                    value={editFormData.equipment_id}
                    onChange={(e) => setEditFormData({ ...editFormData, equipment_id: e.target.value })}
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
                  {user?.role === 'technician' ? (
                    <>
                      <input
                        type="text"
                        value="Auto-assigned to you"
                        disabled
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </>
                  ) : (
                    <select
                      value={editFormData.team_id}
                      onChange={(e) => setEditFormData({ ...editFormData, team_id: e.target.value })}
                    >
                      <option value="">Select team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>{team.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    required
                    disabled={user?.role === 'technician'}
                  >
                    {user?.role === 'manager' && (
                      <option value="preventive">Preventive</option>
                    )}
                    <option value="corrective">Corrective</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    placeholder="e.g., Motor Repair"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows="3"
                    placeholder="Additional details..."
                  />
                </div>
                <div className="form-group">
                  <label>Scheduled Date</label>
                  <input
                    type="date"
                    value={editFormData.scheduled_date}
                    onChange={(e) => setEditFormData({ ...editFormData, scheduled_date: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={editFormData.start_time}
                      onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={editFormData.duration_hours}
                      onChange={(e) => setEditFormData({ ...editFormData, duration_hours: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={handleDelete} className="btn-delete">
                    Delete
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
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

export default CalendarView;
