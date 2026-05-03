import { useState, useEffect } from 'react';
import CountUp from 'react-countup';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';
import { Thermometer, Droplets, Wind, Sun, UserCheck, Activity, BarChart3, TrendingUp, Settings, LogOut, Smartphone, Moon } from 'lucide-react';

// 1. IMPORT FIREBASE INSTEAD OF THE LOCAL JSON
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';

// Maps sensor names to professional SVG components
const iconMap = {
  "Temperature": <Thermometer size={20} />,
  "Humidity": <Droplets size={20} />,
  "Air Quality": <Wind size={20} />,
  "Light Level": <Sun size={20} />,
  "Posture Distance": <UserCheck size={20} />,
  "Phone Detected": <Smartphone size={20} />
};

function Dashboard({ onLogout, isDarkMode, toggleDarkMode }) {
  // 2. START WITH EMPTY DATA OR A LOADING STATE
  const [data, setData] = useState(null); 
  const [lastUpdated, setLastUpdated] = useState('');
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    // 3. THE FIREBASE LISTENER (The Magic Part)
    const dbRef = ref(database, '/'); // Listens to the very root of your database
    
    // onValue runs instantly when the page loads, AND automatically whenever data changes in the cloud!
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const cloudData = snapshot.val();
      if (cloudData) {
        setData(cloudData);
        
        // Update the timestamp whenever new data arrives
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    });

    // Check if dark theme is already active and update isSleepMode accordingly
    const isDarkMode = document.body.classList.contains('dark-theme');
    setIsSleepMode(isDarkMode);

    // Cleanup listeners when you leave the page
    return () => {
      unsubscribe(); // Stop listening to Firebase
    };
  }, []);

  // 4. SHOW A LOADING SCREEN IF DATA HASN'T ARRIVED YET
  if (!data || !data.systemStatus) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-main)',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <h2 style={{ color: 'var(--text-muted)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Connecting to StudyBuddy Cloud...
        </h2>
      </div>
    );
  }

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  return (
    <div className="dashboard-page">
      
      {/* Header */}
      <header className="main-header">
        <div>
          <h1 className="logo-text">StudyBuddy</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={toggleDarkMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-main)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button 
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              padding: '8px 12px',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        
        {/* The Premium Status Hero */}
        <div className="status-hero">
          <div className="status-indicator">
            <div className="dot"></div>
            <h2>{data.systemStatus.mode}</h2>
          </div>
          <span className="sync-time">Live • {lastUpdated}</span>
        </div>

        <h3 className="section-title">Environment Live Feed</h3>
        <div className="data-grid">
          {data.environment.map(sensor => (
            <div key={sensor.id} className="sensor-card">
              <div className="card-header">
                <span className="card-emoji">{iconMap[sensor.name]}</span>
                <span className="card-label">{sensor.name}</span>
              </div>
              <p className={`reading-value ${sensor.value.toString().length > 4 ? 'long-text' : ''}`}>
                {sensor.value}<span className="unit">{sensor.unit}</span>
              </p>
            </div>
          ))}
        </div>

        <h3 className="section-title">Session Analytics</h3>
        <div className="analytics-grid">
          
          <div className="stat-box">
            <h4>Today's Overview</h4>
            <ul className="stat-list">
              <li>
                <span>Total Desk Time</span>
                <span>{data.dailyStats.totalStudyTime}</span>
              </li>
              <li>
                <span>Deep Focus Time</span>
                <span>{data.dailyStats.focusTime}</span>
              </li>
              <li>
                <span>Completed Sessions</span>
                <span>{data.dailyStats.numberOfSessions}</span>
              </li>
              <li>
                <span>Phone Interruptions</span>
                <span style={{color: '#EF4444'}}> {data.dailyStats.interruptions}</span>
              </li>
            </ul>
          </div>

          {/* The Hero Metric Box for the Judges */}
          <div className="score-box">
            <h4>Overall Focus Score</h4>
            <div className="score-circle">
              {data.coolMetrics.focusScore}
            </div>
            <p style={{margin: 0, opacity: 0.95, fontWeight: 600, fontSize: '0.95rem'}}>
              Longest Streak: {data.coolMetrics.longestFocusSession}
            </p>
          </div>

        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;