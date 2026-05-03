import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // 1. Check if we are already logged in
    const savedLoginState = localStorage.getItem('isAuthenticated');
    if (savedLoginState === 'true') {
      setIsLoggedIn(true);
    }

    // 2. Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      setIsDarkMode(true);
      document.body.classList.add('dark-theme');
    }
  }, []);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      if (newMode) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      return newMode;
    });
  };

  return (
    <>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      )}
    </>
  );
}

export default App;