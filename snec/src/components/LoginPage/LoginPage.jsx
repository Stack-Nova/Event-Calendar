
// Updated LoginPage.jsx
import React from 'react';
import './styles.css';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../../App'; // Import the responsive hook if available, or define locally

const LoginPage = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const isDesktop = typeof useIsDesktop === 'function' ? useIsDesktop(1024) : window.innerWidth >= 1024;
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [adminSecret, setAdminSecret] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isAdmin) {
      if (!adminSecret) {
        alert('Admin secret required');
        return;
      }
      // Store admin secret in sessionStorage
      sessionStorage.setItem('adminSecret', adminSecret);
      const response = await fetch('http://localhost:8000/api/admin/pending-signups', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
      });

      if(response?.ok) {
        navigate('/admin');
      } else {
        alert("Incorrect secret key");
      }

      return; 
    }

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Login successful!');
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        setIsAuthenticated(true);
        navigate('/eventform');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || `Login failed (Status ${response.status})`);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="particle-container">
      {/* Back arrow for mobile/tablet */}
      <button
        onClick={() => navigate('/')}
        aria-label="Go to calendar"
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: 28,
          zIndex: 10,
          cursor: 'pointer',
          padding: 4,
          borderRadius: 8,
          boxShadow: '0 1px 4px #0003',
        }}
      >
        &#8592;
      </button>
      {[...Array(5)].map((_, index) => (
        <div className="particle" key={index}></div>
      ))}

      <div className="login-container">
        <div className="background"></div>
        <div className="login-form">
          <h2 className="login-id">{isAdmin ? 'Admin Login' : 'Login'}</h2>
          <form onSubmit={handleSubmit}>
            {!isAdmin && <>
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" required />

              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" required />
            </>}
            {isAdmin && <>
              <label htmlFor="adminSecret">Admin Secret</label>
              <input type="password" id="adminSecret" name="adminSecret" value={adminSecret} onChange={e => setAdminSecret(e.target.value)} required />
            </>}
            <button type="submit">{isAdmin ? 'LOGIN AS ADMIN' : 'LOGIN'}</button>

            <div className="links">
              {!isAdmin && <>
                <a href="#">Forgot password?</a>
                <a href="#">Forgot ID?</a>
              </>}
            </div>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
              {!isAdmin && <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  background: 'transparent',
                  border: '1px solid white',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Don't have an account? Sign Up
              </button>}
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setIsAdmin(a => !a)}
                className="admin-toggle-btn"
                style={{
                  background: isAdmin ? '#eee' : 'transparent',
                  border: '1px solid #888',
                  color: isAdmin ? '#333' : '#888',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                {isAdmin ? 'User Login' : 'Login as Admin'}
              </button>
            </div>
          </form>
        </div>
        <div className="powered-text">Powered by Stack-Nova(P) Ltd.</div>
      </div>
      {/* Floating Action Button for mobile/tablet */}
      {!isDesktop && (
        <button
          className="fab touch-target"
          aria-label="Add an event"
          style={{
            position: 'fixed',
            right: 'var(--space-lg, 24px)',
            bottom: 'var(--space-lg, 24px)',
            zIndex: 100,
            background: 'var(--color-primary, #1976d2)',
            color: 'var(--color-primary-contrast, #fff)',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            boxShadow: '0 4px 16px var(--color-shadow, #0003)',
            fontSize: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/event-form')}
        >
          +
        </button>
      )}
    </div>
  );
};

export default LoginPage;