import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import LoginRegister from './components/LoginRegister.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import AiAssistantModal from './components/AiAssistantModal.jsx';

function App() {
  const [view, setView] = useState('landing');
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const stored = localStorage.getItem('medicare_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // If user already logged in from previous session, go straight to dashboard
    if (sessionUser && view === 'landing') {
      setView('dashboard');
    }

    // Handle token expiry events dispatched by axios interceptor
    const handleAuthExpired = () => {
      setSessionUser(null);
      setView('auth');
      alert('Your login session has expired. Please log in again.');
    };

    window.addEventListener('medicare_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('medicare_auth_expired', handleAuthExpired);
  }, [sessionUser]);

  const handleAuth = (userData) => {
    // Save user & token to localStorage
    if (userData.token) {
      localStorage.setItem('medicare_token', userData.token);
    }
    localStorage.setItem('medicare_user', JSON.stringify(userData));
    setSessionUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
    setSessionUser(null);
    setView('landing');
  };

  return (
    <div className="relative min-h-screen">
      {view === 'landing' && <LandingPage onNavigate={setView} sessionUser={sessionUser} />}
      {view === 'auth' && <LoginRegister onAuthSuccess={handleAuth} onBack={() => setView('landing')} />}
      {view === 'dashboard' && sessionUser && (
        sessionUser.role === 'admin' 
          ? <AdminDashboard user={sessionUser} onLogout={handleLogout} />
          : sessionUser.role === 'doctor'
          ? <DoctorDashboard user={sessionUser} onLogout={handleLogout} />
          : <UserDashboard user={sessionUser} onLogout={handleLogout} />
      )}

      {/* Floating AI Assistant available on all views */}
      <AiAssistantModal user={sessionUser} />
    </div>
  );
}

export default App;