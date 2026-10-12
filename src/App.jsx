import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.jsx';
import LoginRegister from './components/LoginRegister.jsx';
import UserDashboard from './components/UserDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import DoctorDashboard from './components/DoctorDashboard.jsx';
import AiAssistantModal from './components/AiAssistantModal.jsx';

function App() {
  const [sessionUser, setSessionUser] = useState(() => {
    try {
      const stored = localStorage.getItem('medicare_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const getViewFromPath = (user) => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === '/login' || pathname === '/auth' || pathname === '/register') {
      return user ? 'dashboard' : 'auth';
    }
    if (pathname === '/dashboard') {
      return user ? 'dashboard' : 'auth';
    }
    return user ? 'dashboard' : 'landing';
  };

  const [view, setView] = useState(() => getViewFromPath(sessionUser));

  const navigateTo = (newView, replace = false) => {
    setView(newView);
    let targetPath = '/';
    if (newView === 'auth') targetPath = '/login';
    else if (newView === 'dashboard') targetPath = '/dashboard';

    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ view: newView }, '', targetPath);
      } else {
        window.history.pushState({ view: newView }, '', targetPath);
      }
    }
  };

  // Sync initial URL with browser history on first load
  useEffect(() => {
    const initialView = getViewFromPath(sessionUser);
    setView(initialView);
    let targetPath = '/';
    if (initialView === 'auth') targetPath = '/login';
    else if (initialView === 'dashboard') targetPath = '/dashboard';
    window.history.replaceState({ view: initialView }, '', targetPath);
  }, []);

  // Listen for browser Back (←) and Forward (→) buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView(getViewFromPath(sessionUser));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sessionUser]);

  // Handle token expiry events dispatched by axios interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      setSessionUser(null);
      navigateTo('auth', true);
      alert('Your login session has expired. Please log in again.');
    };

    window.addEventListener('medicare_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('medicare_auth_expired', handleAuthExpired);
  }, []);

  const handleAuth = (userData) => {
    if (userData.token) {
      localStorage.setItem('medicare_token', userData.token);
    }
    localStorage.setItem('medicare_user', JSON.stringify(userData));
    setSessionUser(userData);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('medicare_token');
    localStorage.removeItem('medicare_user');
    setSessionUser(null);
    navigateTo('landing');
  };

  return (
    <div className="relative min-h-screen">
      {view === 'landing' && <LandingPage onNavigate={navigateTo} sessionUser={sessionUser} />}
      {view === 'auth' && <LoginRegister onAuthSuccess={handleAuth} onBack={() => navigateTo('landing')} />}
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