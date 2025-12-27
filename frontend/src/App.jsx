import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import Auth from './auth/Auth';
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for existing user session or use mock user for development
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // Uncomment below to auto-set mock user for development
    // setUser(MOCK_USER);
    setLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <LandingPage />}
      />
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" /> : <Auth setUser={setUser} />}
      />
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
        element={user ? <Dashboard user={user} /> : <Navigate to="/" />}
      />
      <Route
        path="/equipment"
        element={user ? <EquipmentList /> : <Navigate to="/" />}
      />
      <Route
        path="/equipment/:id"
        element={user ? <EquipmentDetail /> : <Navigate to="/" />}
      />
      <Route
        path="/teams"
        element={user ? <TeamsList /> : <Navigate to="/" />}
      />
      <Route
        path="/requests"
        element={user ? <RequestsKanban /> : <Navigate to="/" />}
      />
      <Route
        path="/calendar"
        element={user ? <CalendarView /> : <Navigate to="/" />}
      />
    </Routes>
  );
}

export default App;

