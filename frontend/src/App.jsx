import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './auth/Login';
import Signup from './auth/Signup';
import Dashboard from './Dashboard';
import EquipmentList from './equipment/EquipmentList';
import EquipmentDetail from './equipment/EquipmentDetail';
import TeamsList from './teams/TeamsList';
import RequestsKanban from './requests/RequestsKanban';
import CalendarView from './calendar/CalendarView';

// Mock user for bypassing authentication
const MOCK_USER = {
  id: 1,
  name: 'Demo User',
  email: 'demo@gearguard.com'
};

function App() {
  const [user, setUser] = useState(MOCK_USER); // Auto-set mock user
  const [loading, setLoading] = useState(false);

  // Bypass authentication - always use mock user
  useEffect(() => {
    setUser(MOCK_USER);
    setLoading(false);
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<Login setUser={setUser} />}
      />
      <Route
        path="/signup"
        element={<Signup setUser={setUser} />}
      />
      <Route
        path="/dashboard"
        element={<Dashboard user={user} />}
      />
      <Route
        path="/equipment"
        element={<EquipmentList />}
      />
      <Route
        path="/equipment/:id"
        element={<EquipmentDetail />}
      />
      <Route
        path="/teams"
        element={<TeamsList />}
      />
      <Route
        path="/requests"
        element={<RequestsKanban />}
      />
      <Route
        path="/calendar"
        element={<CalendarView />}
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;

