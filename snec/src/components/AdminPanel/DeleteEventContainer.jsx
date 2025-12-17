import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AdminPanel/AdminPanel.css';
import axios from 'axios';

const API_BASE = '/api/admin';

async function apiFetch(path, adminSecret, options = {}) {
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

export default function DeleteEventContainer() {
  const navigate = useNavigate();
  const [adminSecret] = useState(() => sessionStorage.getItem('adminSecret') || '');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/events');
      if (res.statusText !== "OK") throw new Error('Failed to fetch events');

      const data = await res.data;

      setEvents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await apiFetch('/event', adminSecret, {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      setEvents(events => events.filter(ev => ev._id !== id));
      setMessage('Event deleted successfully.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-panel-header">
        <h2>Delete Events</h2>
        <button onClick={() => navigate('/admin')} className="admin-action-btn">Back to Admin Panel</button>
      </div>
      {message && <div style={{ color: 'green', marginBottom: 12 }}>{message}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      <section className="admin-section">
        <h3 className="admin-section-title">All Events</h3>
        {loading ? <div>Loading...</div> : events.length === 0 ? <div>No events found.</div> : (
          <ul className="admin-user-list">
            {events.map(ev => (
              <li key={ev._id} className="admin-user-item">
                <span>
                  <strong>{ev.title}</strong> | {ev.organizer} | {new Date(ev.date).toLocaleDateString()} | {ev.time} | {ev.location}
                </span>
                <button onClick={() => handleDeleteEvent(ev._id)} className="admin-action-btn" style={{ background: '#e63946' }} disabled={loading}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
} 