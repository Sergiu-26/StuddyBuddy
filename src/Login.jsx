import { useState } from 'react';
import { database } from './firebase';
import { ref, get, child } from 'firebase/database';
import './App.css'; 
import { Eye, EyeOff, Book, Sun, Moon } from 'lucide-react';

function Login({ onLoginSuccess, isDarkMode, toggleDarkMode }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `users/${username}`));

      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        if (userData.password === password) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userData', JSON.stringify({ username: username, name: userData.name }));
          onLoginSuccess();
        } else {
          setError('Access denied. Incorrect password.');
        }
      } else {
        setError('Access denied. Username not found.');
      }
    } catch (err) {
      setError('Failed to connect to the database. Check your internet.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-main)',
    }}>
      {/* Left Side - Branding & Hero */}
      <div style={{
        flex: 1,
        background: 'var(--gradient-primary)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          top: '-50px',
          right: '-100px',
          opacity: 0.5,
        }}></div>

        <div style={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            margin: '0 0 16px 0',
            lineHeight: '1.2',
            color: 'white',
            letterSpacing: '-0.5px',
          }}>
            StudyBuddy
          </h1>
          <p style={{
            fontSize: '1.1rem',
            fontWeight: 500,
            opacity: 0.95,
            margin: '0 0 40px 0',
            lineHeight: '1.6',
          }}>
            Your intelligent companion for focused, productive learning
          </p>
          
          <div style={{
            marginTop: '60px',
            display: 'grid',
            gap: '20px',
          }}>
            <div style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Real-time Monitoring</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Track your environment and focus metrics live</div>
            </div>
            
            <div style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Smart Insights</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Understand your study patterns and improve</div>
            </div>

            <div style={{
              textAlign: 'left',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Adaptive Experience</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Dark mode activates automatically at night</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
      }}>
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-dark)',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--bg-main)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span style={{ fontSize: '0.85rem' }}>
            {isDarkMode ? 'Light' : 'Dark'}
          </span>
        </button>

        <div style={{
          width: '100%',
          maxWidth: '420px',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: 'var(--text-dark)',
              margin: '0 0 12px 0',
              letterSpacing: '-0.5px',
            }}>
              Sign In
            </h2>
            <p style={{
              color: 'var(--text-muted)',
              fontWeight: 500,
              margin: 0,
              fontSize: '0.9rem',
            }}>
              Access your workspace
            </p>
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2',
              color: '#DC2626',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '28px',
              fontWeight: 600,
              textAlign: 'center',
              border: '1px solid #FECACA',
              fontSize: '0.95rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--text-dark)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                Username
              </label>
              <input 
                className="modern-input"
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="e.g., admin"
                required 
                style={{
                  marginBottom: 0,
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'var(--text-dark)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}>
                Password
              </label>
              <div className="password-wrapper">
                <input 
                  className="modern-input"
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Enter your password"
                  required 
                />
                <button 
                  type="button" 
                  className="eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isLoggingIn}
              style={{
                marginTop: '12px',
                height: '48px',
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              {isLoggingIn ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}></span>
                  Authenticating...
                </span>
              ) : (
                "Enter Workspace →"
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          div:first-of-type {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;