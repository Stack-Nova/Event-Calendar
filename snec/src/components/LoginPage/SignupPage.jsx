// Updated SignupPage.jsx
import React from 'react';
import './styles.css';
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../../App'; // Import the responsive hook if available, or define locally

const SignupPage = () => {
  const navigate = useNavigate();
  const isDesktop = typeof useIsDesktop === 'function' ? useIsDesktop(1024) : window.innerWidth >= 1024;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const username = e.target.name.value;
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await fetch('http://localhost:8000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Signup successful!');
        navigate('/login');
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An error occurred. Please try again.');
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
          <h2 className="login-id">Sign Up</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" required />

            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />

            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />

            <button type="submit">SIGN UP</button>
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

export default SignupPage;
