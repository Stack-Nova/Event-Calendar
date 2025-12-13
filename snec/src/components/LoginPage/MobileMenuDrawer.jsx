import React from "react";

export default function MobileMenuDrawer({
  open,
  onClose,
  upcomingEvents = [],
  completedEvents = [],
  onSelectAgenda,
  onSelectMonth,
  onSelectWeek,
  onSelectYear,
  onSelectCompletedEvent,
  onDownloadReport,
  onAddEvent,
  onLogin,
  onSignup,
  isAuthenticated,
  isAdmin,
  onAdminPanel
}) {
  const [showUpcoming, setShowUpcoming] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setShowUpcoming(false);
      setShowCompleted(false);
    }
  }, [open]);

  return (
    <div
      className="mobile-menu-drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: open ? 0 : '-100vw',
        width: '85vw',
        maxWidth: 340,
        height: '100vh',
        background: '#f5f6fa',
        boxShadow: open ? '-2px 0 16px #0003' : 'none',
        zIndex: 2000,
        transition: 'right 0.3s',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE 10+
      }}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <style>{`
        .mobile-menu-drawer::-webkit-scrollbar { display: none; }
        .mobile-menu-drawer { scrollbar-width: none; }
      `}</style>
      <button
        onClick={onClose}
        aria-label="Close menu"
        style={{
          alignSelf: 'flex-end',
          background: 'none',
          border: 'none',
          fontSize: '2rem',
          color: '#1976d2',
          margin: 12,
          cursor: 'pointer',
        }}
      >
        ×
      </button>
      {/* Main navigation options */}
      <div style={{ width: '90%', margin: '0 auto 12px auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={onDownloadReport} style={{ ...menuBtnStyle, background: '#3d3a4e' }}>Download Report</button>
        <button onClick={onAddEvent} style={{ ...menuBtnStyle, background: '#43a047' }}>Add Event</button>
        {isAdmin && (
          <button onClick={onAdminPanel} style={{ ...menuBtnStyle, background: '#1976d2' }}>Admin Panel</button>
        )}
      </div>
      {/* Collapsible Upcoming Events */}
      <section style={{ width: '90%', margin: '0 auto 8px auto' }}>
        <button
          onClick={() => setShowUpcoming((v) => !v)}
          aria-expanded={showUpcoming}
          style={menuBtnStyle}
        >
          Upcoming Events {showUpcoming ? '▲' : '▼'}
        </button>
        {showUpcoming && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 200, overflowY: 'auto' }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center' }}>No upcoming events.</div>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {upcomingEvents.map((ev, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{ev.title}</div>
                    <div style={{ color: '#1976d2', fontSize: '0.98rem' }}>{ev.date} {ev.time}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
      {/* Collapsible Completed Events */}
      <section style={{ width: '90%', margin: '0 auto 8px auto' }}>
        <button
          onClick={() => setShowCompleted((v) => !v)}
          aria-expanded={showCompleted}
          style={menuBtnStyle}
        >
          Completed Events (This Month) {showCompleted ? '▲' : '▼'}
        </button>
        {showCompleted && (
          <div style={{ background: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 200, overflowY: 'auto' }}>
            {completedEvents.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center' }}>No completed events.</div>
            ) : (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {completedEvents.map((ev, idx) => (
                  <li key={idx} style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{ev.title}</div>
                    <div style={{ color: '#1976d2', fontSize: '0.98rem' }}>{ev.date} {ev.time}</div>
                    <button
                      onClick={() => onSelectCompletedEvent && onSelectCompletedEvent(ev)}
                      style={{ fontSize: '0.9rem', color: '#1976d2', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      View Details
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const menuBtnStyle = {
  width: '100%',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '0.7rem',
  fontWeight: 600,
  fontSize: '1rem',
  marginBottom: 2,
  cursor: 'pointer',
  boxShadow: '0 1px 4px #0001',
}; 