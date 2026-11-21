import React from 'react';

export default function Sidebar({ activePage, setActivePage, isMobileOpen, setIsMobileOpen, dbStatus }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'add-packet', label: 'Add Packet', icon: '➕' },
    { id: 'records', label: 'Packet Records', icon: '📋' },
    { id: 'sample-testing', label: 'Sample Testing', icon: '🧪' },
    { id: 'dfa-visualizer', label: 'DFA Visualization', icon: '⚙️' },
    { id: 'transition-table', label: 'Transition Table', icon: '📑' },
    { id: 'history', label: 'Packet History', icon: '📜' }
  ];

  const handleSelect = (id) => {
    setActivePage(id);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  const isConnected = dbStatus?.connected;

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-icon">🛡️</div>
        <div>
          <div className="brand-title">NetValidator</div>
          <div className="brand-sub">Question No. 51</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => handleSelect(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>
          Database Engine
        </div>
        <div className="db-pill">
          <span className={`dot ${isConnected ? 'online' : 'fallback'}`}></span>
          <span style={{ color: isConnected ? '#34d399' : '#fbbf24' }}>
            {isConnected ? 'MongoDB Connected' : 'Local Fallback Storage'}
          </span>
        </div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#64748b' }}>
          MERN · CN · FLAT Integrations
        </div>
      </div>
    </aside>
  );
}
