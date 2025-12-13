import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const API_BASE = 'https://kiris-ka-gana-sunega.onrender.com/api/admin';

function apiFetch(path, adminSecret, options = {}) {
  return fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': adminSecret,
      ...(options.headers || {})
    },
  }).then(async res => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  });
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [adminSecret, setAdminSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
  const [permissionEmail, setPermissionEmail] = useState('');
  const [pending, setPending] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [newSecret, setNewSecret] = useState('');

  // Try to fetch data, handle 403 error for bad secret
  const fetchData = () => {
    if (!adminSecret) return;
    setLoadingPending(true);
    setLoadingUsers(true);
    setError('');
    setAuthError(false);
    apiFetch('/pending-signups', adminSecret)
      .then(setPending)
      .catch(e => {
        if (e.message.toLowerCase().includes('forbidden')) setAuthError(true);
        else setError(e.message);
      })
      .finally(() => setLoadingPending(false));
    apiFetch('/users', adminSecret)
      .then(setUsers)
      .catch(e => {
        if (e.message.toLowerCase().includes('forbidden')) setAuthError(true);
        else setError(e.message);
      })
      .finally(() => setLoadingUsers(false));
  };

  useEffect(() => { fetchData(); }, [adminSecret]);

  // Add permission
  const handleAddPermission = e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    apiFetch('/permission', adminSecret, {
      method: 'POST',
      body: JSON.stringify({ email: permissionEmail })
    })
      .then(res => {
        setMessage(res.message);
        setPermissionEmail('');
        fetchData();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Approve signup
  const handleApprove = email => {
    if (!window.confirm(`Approve signup for ${email}?`)) return;
    setLoading(true);
    setError('');
    apiFetch('/approve-signup', adminSecret, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
      .then(res => {
        setMessage(res.message);
        fetchData();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Reject signup
  const handleReject = email => {
    if (!window.confirm(`Reject signup for ${email}?`)) return;
    setLoading(true);
    setError('');
    apiFetch('/reject-signup', adminSecret, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
      .then(res => {
        setMessage(res.message);
        fetchData();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Delete user
  const handleDeleteUser = (email) => {
    if (!window.confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setLoading(true);
    setError('');
    apiFetch('/user', adminSecret, {
      method: 'DELETE',
      body: JSON.stringify({ email })
    })
      .then(res => {
        setMessage(res.message);
        fetchData();
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminSecret');
    navigate('/login');
  };

  // Allow admin to re-enter secret if forbidden
  const handleSecretSubmit = e => {
    e.preventDefault();
    sessionStorage.setItem('adminSecret', newSecret);
    setAdminSecret(newSecret);
    setNewSecret('');
    setAuthError(false);
    setError('');
    setMessage('');
  };

  if (authError) {
    return (
      <div className="admin-panel-container">
        <div className="admin-panel-header">
          <h2>Admin Authentication Failed</h2>
        </div>
        <div style={{ color: 'red', marginBottom: 16 }}>The admin secret is incorrect or expired. Please re-enter the correct secret.</div>
        <form onSubmit={handleSecretSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" value={newSecret} onChange={e => setNewSecret(e.target.value)} placeholder="Admin Secret" required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <button type="submit" className="admin-action-btn">Submit</button>
        </form>
        <button onClick={handleLogout} className="admin-action-btn" style={{ marginTop: 16 }}>Back to Login</button>
      </div>
    );
  }

  if (!adminSecret) return null;

  // Defensive: always use arrays for pending and users
  const safePending = Array.isArray(pending) ? pending : [];
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-header">
        <h2>Admin Panel</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/delete-events')} className="admin-action-btn">Delete Events</button>
          <button onClick={handleLogout} className="admin-action-btn">Logout</button>
        </div>
      </div>
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <section className="admin-section">
        <h3 className="admin-section-title">Add Permission</h3>
        <form onSubmit={handleAddPermission} style={{ display: 'flex', gap: 8 }}>
          <input type="email" value={permissionEmail} onChange={e => setPermissionEmail(e.target.value)} placeholder="Email" required style={{ flex: 1, padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
          <button type="submit" className="admin-action-btn" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
        </form>
      </section>
      <section className="admin-section">
        <h3 className="admin-section-title">Pending Signups</h3>
        {loadingPending ? <div>Loading...</div> : safePending.length === 0 ? <div>No pending signups.</div> : (
          <ul className="admin-user-list">
            {safePending.map(p => (
              <li key={p.email} className="admin-user-item">
                <span>{p.username} ({p.email})</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(p.email)} className="admin-action-btn" disabled={loading}>Approve</button>
                  <button onClick={() => handleReject(p.email)} className="admin-action-btn" style={{ background: '#888' }} disabled={loading}>Reject</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="admin-section">
        <h3 className="admin-section-title">All Users</h3>
        {loadingUsers ? <div>Loading...</div> : safeUsers.length === 0 ? <div>No users found.</div> : (
          <ul className="admin-user-list">
            {safeUsers.map(u => (
              <li key={u.email} className="admin-user-item">
                <span>{u.username} ({u.email})</span>
                <button onClick={() => handleDeleteUser(u.email)} className="admin-action-btn" style={{ background: '#e63946' }} disabled={loading}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
} 