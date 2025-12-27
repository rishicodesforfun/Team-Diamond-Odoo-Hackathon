import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getCalendarEvents, createRequest } from '../api/requests';
import { getEquipment } from '../api/equipment';
import { getTeams } from '../api/teams';
import './CalendarView.css';

// Mock user fallback
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
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    team_id: '',
    type: 'preventive',
    title: '',
    description: '',
    start_time: '09:00',
    duration_hours: 1.0
  });

  useEffect(() => {
    // Bypass auth - use mock user
    setUser(MOCK_USER);
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [currentWeek]);

  const loadData = async () => {
    try {
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);
      
      const [eventsData, equipmentData, teamsData] = await Promise.all([
        getCalendarEvents(weekStart, weekEnd),
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

  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    return formatDate(weekStart);
  };

  const getWeekEnd = (date) => {
    const weekStart = new Date(getWeekStart(date));
    weekStart.setDate(weekStart.getDate() + 6);
    return formatDate(weekStart);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getWeekDays = () => {
    const start = new Date(getWeekStart(currentWeek));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getHours = () => {
    return Array.from({ length: 24 }, (_, i) => i);
  };

  const handleSlotClick = (day, hour) => {
    const date = new Date(day);
    date.setHours(hour, 0, 0, 0);
    setSelectedSlot({ day: formatDate(day), hour });
    setFormData(prev => ({
      ...prev,
      scheduled_date: formatDate(day),
      start_time: `${hour.toString().padStart(2, '0')}:00`
    }));
    setShowModal(true);
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

  const getEventsForSlot = (day, hour) => {
    const dayStr = formatDate(day);
    return events.filter(event => {
      if (event.date !== dayStr) return false;
      const eventHour = parseInt(event.startTime?.split(':')[0] || 0);
      const duration = parseFloat(event.durationHours || 1);
      return eventHour <= hour && (eventHour + duration) > hour;
    });
  };

  const getEventStyle = (event) => {
    const startHour = parseInt(event.startTime?.split(':')[0] || 0);
    const duration = parseFloat(event.durationHours || 1);
    const top = (startHour % 24) * 60;
    const height = duration * 60;
    
    const statusColors = {
      new: '#3498db',
      in_progress: '#f39c12',
      repaired: '#27ae60',
      scrap: '#95a5a6'
    };

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: statusColors[event.status] || '#3498db',
      position: 'absolute',
      width: 'calc(100% - 4px)',
      margin: '2px',
      borderRadius: '4px',
      padding: '4px 8px',
      color: 'white',
      fontSize: '0.85rem',
      overflow: 'hidden',
      cursor: 'pointer',
      zIndex: 10
    };
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const weekDays = getWeekDays();
  const hours = getHours();
  const now = new Date();

  return (
    <Layout user={user}>
      <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={() => navigateWeek(-1)}>← Previous</button>
          <button onClick={goToToday}>Today</button>
          <button onClick={() => navigateWeek(1)}>Next →</button>
        </div>
        <h2>
          {weekDays[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
          {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        <Link to="/requests" className="btn-secondary">View Kanban</Link>
      </div>

      <div className="calendar-container">
        <div className="calendar-time-column">
          {hours.map(hour => (
            <div key={hour} className="time-slot">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="calendar-day">
              <div className="day-header">
                <div className="day-name">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="day-number">
                  {day.getDate()}
                </div>
              </div>
              <div className="day-slots">
                {hours.map(hour => {
                  const slotEvents = getEventsForSlot(day, hour);
                  const isCurrentTime = 
                    formatDate(day) === formatDate(now) && 
                    hour === now.getHours();
                  
                  return (
                    <div
                      key={hour}
                      className={`time-slot ${isCurrentTime ? 'current-time' : ''}`}
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {slotEvents.map(event => (
                        <div
                          key={event.id}
                          style={getEventStyle(event)}
                          title={`${event.title} - ${event.equipment_name || ''}`}
                        >
                          <div className="event-title">{event.title}</div>
                          <div className="event-time">
                            {event.startTime} ({event.durationHours}h)
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
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
                  <option value="preventive">Preventive</option>
                  <option value="corrective">Corrective</option>
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
      </div>
    </Layout>
  );
}

export default CalendarView;

