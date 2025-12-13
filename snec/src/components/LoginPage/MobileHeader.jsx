import React from "react";

export default function MobileHeader({ onMenuClick }) {
  return (
    <header className="mobile-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#232734',
      boxShadow: '0 2px 8px #0002',
    }}>
      <h1 style={{ width: '100%', textAlign: 'center', fontSize: '1.3rem', margin: 0 }}>Campus Events Calendar</h1>
      <button
        className="hamburger-btn"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        &#9776;
      </button>
    </header>
  );
} 