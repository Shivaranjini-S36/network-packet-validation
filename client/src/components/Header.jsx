import React from 'react';

export default function Header({ activePage, onToggleMobile, onResetSamples, dbStatus }) {
  const titles = {
    'dashboard': { title: 'Security Dashboard', sub: 'Dynamic Network Packet Statistics & Overview' },
    'add-packet': { title: 'Packet Input Form', sub: 'Validate & Classify New Network Packets' },
    'records': { title: 'Packet Records', sub: 'Searchable & Filterable Packet Log' },
    'sample-testing': { title: 'Sample Packet Testing', sub: 'Predefined Academic RFC Test Vectors' },
    'dfa-visualizer': { title: 'DFA Automata Engine', sub: 'Formal Language State Machine & Transition Diagram' },
    'history': { title: 'Historical Audit Trail', sub: 'Persistent Packet Processing Log' }
  };

  const current = titles[activePage] || { title: 'Network Packet System', sub: 'Question 51' };

  return (
    <header className="topbar">
      <div className="page-heading">
        <button className="mobile-menu-btn" onClick={onToggleMobile} title="Toggle Menu">
          ☰
        </button>
        <div>
          <h1 className="page-title">{current.title}</h1>
          <p className="page-sub">{current.sub}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={onResetSamples}
          title="Reset to clean academic test records"
        >
          🔄 Reset Samples
        </button>
      </div>
    </header>
  );
}
