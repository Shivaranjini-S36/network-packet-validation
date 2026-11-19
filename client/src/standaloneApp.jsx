/**
 * NetValidator - Complete React 18 Browser-Executable Application
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Runs seamlessly in the browser via Babel Standalone & React 18 UMD,
 * allowing instant execution with just 'node server.js' on port 5000!
 */

const { useState, useEffect, useCallback, useMemo } = React;

// --- API Service Wrapper ---
const API = {
  fetchHealth: async () => (await fetch('/api/health')).json(),
  fetchStats: async () => (await fetch('/api/stats')).json(),
  fetchPackets: async (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.append('search', params.search);
    if (params.protocol) q.append('protocol', params.protocol);
    if (params.status) q.append('status', params.status);
    return (await fetch(`/api/packets?${q.toString()}`)).json();
  },
  submitPacket: async (data) => (await fetch('/api/packets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })).json(),
  removePacket: async (id) => (await fetch(`/api/packets/${id}`, { method: 'DELETE' })).json(),
  fetchSamples: async () => (await fetch('/api/samples')).json(),
  testSample: async (id) => (await fetch(`/api/samples/test/${id}`, { method: 'POST' })).json(),
  resetSamples: async () => (await fetch('/api/samples/reset', { method: 'POST' })).json(),
  fetchAutomata: async () => (await fetch('/api/automata')).json()
};

// --- Client Validation Rules ---
const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
const PORT_REGEX = /^[0-9]+$/;
const PROTOCOL_REGEX = /^(TCP|UDP|ICMP)$/i;

function validateClient(packet) {
  const errors = {};
  const src = (packet.sourceIp || '').trim();
  const dst = (packet.destinationIp || '').trim();
  const proto = (packet.protocol || '').trim().toUpperCase();

  if (!src) {
    errors.sourceIp = 'Source IP address is required';
  } else if (!IPV4_REGEX.test(src)) {
    errors.sourceIp = 'Invalid IPv4 address format or octet out of range [0-255]';
  }

  if (!dst) {
    errors.destinationIp = 'Destination IP address is required';
  } else if (!IPV4_REGEX.test(dst)) {
    errors.destinationIp = 'Invalid IPv4 address format or octet out of range [0-255]';
  }

  if (!proto) {
    errors.protocol = 'Protocol is required (TCP, UDP, or ICMP)';
  } else if (!PROTOCOL_REGEX.test(proto)) {
    errors.protocol = 'Invalid protocol. Choose TCP, UDP, or ICMP';
  }

  if (proto === 'TCP' || proto === 'UDP') {
    const sp = String(packet.sourcePort || '').trim();
    const dp = String(packet.destinationPort || '').trim();

    if (!sp) {
      errors.sourcePort = 'Source Port is required';
    } else if (!PORT_REGEX.test(sp) || Number(sp) < 1 || Number(sp) > 65535) {
      errors.sourcePort = 'Source Port must be an integer between 1 and 65535';
    }

    if (!dp) {
      errors.destinationPort = 'Destination Port is required';
    } else if (!PORT_REGEX.test(dp) || Number(dp) < 1 || Number(dp) > 65535) {
      errors.destinationPort = 'Destination Port must be an integer between 1 and 65535';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// --- Main App Component ---
function StandaloneApp() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [packets, setPackets] = useState([]);
  const [samples, setSamples] = useState([]);
  const [automataInfo, setAutomataInfo] = useState(null);
  const [dbStatus, setDbStatus] = useState({ connected: false, mode: 'Local Fallback' });
  const [inspectedPacket, setInspectedPacket] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [sRes, pRes, samRes, aRes] = await Promise.all([
        API.fetchStats(),
        API.fetchPackets({ search: searchQuery, protocol: selectedProtocol, status: selectedStatus }),
        API.fetchSamples(),
        API.fetchAutomata()
      ]);

      if (sRes.success) {
        setStats(sRes.stats);
        if (sRes.database) setDbStatus(sRes.database);
      }
      if (pRes.success) setPackets(pRes.packets || []);
      if (samRes.success) setSamples(samRes.samples || []);
      if (aRes.success) setAutomataInfo(aRes.automata);
    } catch (e) {
      console.warn('Initial fetch error:', e.message);
    }
  }, [searchQuery, selectedProtocol, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleDeletePacket = async (id) => {
    if (window.confirm(`Are you sure you want to delete packet ${id}?`)) {
      await API.removePacket(id);
      loadData();
    }
  };

  const handleResetSamples = async () => {
    if (window.confirm('Reset all packet records back to standard test vector seeds?')) {
      await API.resetSamples();
      loadData();
      alert('Sample records successfully reset!');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">🛡️</div>
          <div>
            <div className="brand-title">NetValidator</div>
            <div className="brand-sub">Question No. 51</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'add-packet', label: 'Add Packet', icon: '➕' },
            { id: 'records', label: 'Packet Records', icon: '📋' },
            { id: 'sample-testing', label: 'Sample Testing', icon: '🧪' },
            { id: 'dfa-visualizer', label: 'DFA Visualization', icon: '⚙️' },
            { id: 'history', label: 'Packet History', icon: '📜' }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { setActivePage(item.id); setIsMobileOpen(false); }}
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
            <span className={`dot ${dbStatus?.connected ? 'online' : 'fallback'}`}></span>
            <span style={{ color: dbStatus?.connected ? '#34d399' : '#fbbf24' }}>
              {dbStatus?.connected ? 'MongoDB Connected' : 'Local Fallback Storage'}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#64748b' }}>
            FSWD · CN · FLAT Integrations
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="page-heading">
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              ☰
            </button>
            <div>
              <h1 className="page-title">
                {activePage === 'dashboard' && 'Security Dashboard'}
                {activePage === 'add-packet' && 'Packet Input Form'}
                {activePage === 'records' && 'Packet Records'}
                {activePage === 'sample-testing' && 'Sample Packet Testing'}
                {activePage === 'dfa-visualizer' && 'DFA Automata Engine'}
                {activePage === 'history' && 'Historical Audit Trail'}
              </h1>
              <p className="page-sub">Question 51: Network Packet Validation &amp; Classification System</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleResetSamples}>
              🔄 Reset Samples
            </button>
          </div>
        </header>

        <main className="content-body">
          {/* 1. Dashboard View */}
          {activePage === 'dashboard' && (
            <div>
              {stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon cyan">📦</div>
                    <div><div className="stat-val">{stats.total || 0}</div><div className="stat-label">Total Packets</div></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon green">✅</div>
                    <div><div className="stat-val">{stats.validCount || 0}</div><div className="stat-label">Valid Packets</div></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon red">❌</div>
                    <div><div className="stat-val">{stats.invalidCount || 0}</div><div className="stat-label">Invalid Packets</div></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon blue">🌐</div>
                    <div><div className="stat-val">{stats.protocolDistribution?.TCP || 0}</div><div className="stat-label">TCP Packets</div></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon purple">⚡</div>
                    <div><div className="stat-val">{stats.protocolDistribution?.UDP || 0}</div><div className="stat-label">UDP Packets</div></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon amber">📡</div>
                    <div><div className="stat-val">{stats.protocolDistribution?.ICMP || 0}</div><div className="stat-label">ICMP Packets</div></div>
                  </div>
                </div>
              )}

              {/* Protocol Distribution & Validation Ratio */}
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-header">
                      <div className="card-title"><span>🌐 Protocol Distribution</span></div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dynamic MongoDB Record Count</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                      {['TCP', 'UDP', 'ICMP'].map(proto => {
                        const cnt = stats.protocolDistribution?.[proto] || 0;
                        const pct = stats.total > 0 ? ((cnt / stats.total) * 100).toFixed(1) : 0;
                        const color = proto === 'TCP' ? 'var(--cyan)' : proto === 'UDP' ? 'var(--blue)' : 'var(--amber)';
                        return (
                          <div key={proto}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                              <span style={{ color, fontWeight: 600 }}>{proto} Protocol</span>
                              <span style={{ fontFamily: 'var(--font-mono)' }}>{cnt} pkts ({pct}%)</span>
                            </div>
                            <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: color }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card" style={{ marginBottom: 0 }}>
                    <div className="card-header">
                      <div className="card-title"><span>🛡️ Validation Pass Rate</span></div>
                      <span className="badge badge-valid">{stats.validationPassRate || 0}% Pass Rate</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
                      <div style={{
                        width: '90px', height: '90px', borderRadius: '50%',
                        background: `conic-gradient(var(--green) ${(stats.validationPassRate || 0) * 3.6}deg, var(--red) 0deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <div style={{
                          width: '70px', height: '70px', borderRadius: '50%',
                          background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontFamily: 'var(--font-mono)'
                        }}>
                          {stats.validationPassRate}%
                        </div>
                      </div>
                      <div style={{ flex: 1, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div>Accepted: <strong style={{ color: 'var(--green)' }}>{stats.validCount}</strong></div>
                        <div>Rejected (Trap): <strong style={{ color: 'var(--red)' }}>{stats.invalidCount}</strong></div>
                        <div>Total: <strong>{stats.total}</strong></div>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                      Evaluated through lexical regular expressions and 10-state DFA logic.
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Activity Table */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><span>⚡ Recent Activity</span></div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('records')}>All Records →</button>
                </div>
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Packet ID</th>
                        <th>Source IP</th>
                        <th>Destination IP</th>
                        <th>Protocol</th>
                        <th>Ports</th>
                        <th>Status</th>
                        <th>DFA Classification</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentActivity?.map(p => (
                        <tr key={p._id || p.packetId}>
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>{p.packetId}</td>
                          <td className="mono-cell">{p.sourceIp}</td>
                          <td className="mono-cell">{p.destinationIp}</td>
                          <td><span className={`badge badge-${p.protocol?.toLowerCase()}`}>{p.protocol}</span></td>
                          <td className="mono-cell" style={{ fontSize: '0.8rem' }}>
                            {p.protocol === 'ICMP' ? '— (ICMP)' : `${p.sourcePort ?? '—'} → ${p.destinationPort ?? '—'}`}
                          </td>
                          <td><span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>{p.isValid ? 'VALID' : 'INVALID'}</span></td>
                          <td><span className="badge badge-tcp">{p.dfaClassification}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => setInspectedPacket(p)}>Inspect</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. Add Packet View */}
          {activePage === 'add-packet' && (
            <AddPacketView onPacketCreated={() => loadData()} />
          )}

          {/* 3. Packet Records View */}
          {activePage === 'records' && (
            <div className="card">
              <div className="filter-bar">
                <div className="search-box">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by IP, Protocol, Classification, or ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>×</button>}
                </div>
                <div className="filter-actions">
                  <select className="filter-select" value={selectedProtocol} onChange={e => setSelectedProtocol(e.target.value)}>
                    <option value="ALL">All Protocols</option>
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                  </select>
                  <select className="filter-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                    <option value="ALL">All Status</option>
                    <option value="valid">Valid Packets</option>
                    <option value="invalid">Invalid Packets</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Packet ID</th>
                      <th>Source IP</th>
                      <th>Destination IP</th>
                      <th>Protocol</th>
                      <th>Src Port</th>
                      <th>Dst Port</th>
                      <th>Status</th>
                      <th>DFA Classification</th>
                      <th>Timestamp</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packets.length === 0 ? (
                      <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records found.</td></tr>
                    ) : (
                      packets.map(p => (
                        <tr key={p._id || p.packetId}>
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>{p.packetId}</td>
                          <td className="mono-cell">{p.sourceIp}</td>
                          <td className="mono-cell">{p.destinationIp}</td>
                          <td><span className={`badge badge-${p.protocol?.toLowerCase()}`}>{p.protocol}</span></td>
                          <td className="mono-cell">{p.protocol === 'ICMP' ? '—' : (p.sourcePort ?? '—')}</td>
                          <td className="mono-cell">{p.protocol === 'ICMP' ? '—' : (p.destinationPort ?? '—')}</td>
                          <td><span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>{p.isValid ? 'VALID' : 'INVALID'}</span></td>
                          <td><span className="badge badge-tcp">{p.dfaClassification}</span></td>
                          <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(p.createdAt || Date.now()).toLocaleTimeString()}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }} onClick={() => setInspectedPacket(p)}>Inspect</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeletePacket(p.packetId)}>Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Sample Testing View */}
          {activePage === 'sample-testing' && (
            <SampleTestingView
              samples={samples}
              onRunTest={async (sample) => {
                const res = await API.testSample(sample.id);
                loadData();
                return res;
              }}
            />
          )}

          {/* 5. DFA Visualization View */}
          {activePage === 'dfa-visualizer' && (
            <DfaView automataInfo={automataInfo} />
          )}

          {/* 6. Packet History View */}
          {activePage === 'history' && (
            <HistoryView packets={packets} onInspectPacket={setInspectedPacket} />
          )}
        </main>
      </div>

      {/* Detail Inspection Modal */}
      {inspectedPacket && (
        <div className="modal-overlay" onClick={() => setInspectedPacket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>Packet Inspection: {inspectedPacket.packetId}</h2>
              <button className="modal-close" onClick={() => setInspectedPacket(null)}>×</button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className={`badge ${inspectedPacket.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                {inspectedPacket.isValid ? 'VALID' : 'INVALID'}
              </span>
              <span className={`badge badge-${inspectedPacket.protocol?.toLowerCase()}`}>
                {inspectedPacket.protocol}
              </span>
              <span className="badge badge-tcp">DFA: {inspectedPacket.dfaClassification}</span>
              <span className="badge" style={{ background: '#334155' }}>Final State: {inspectedPacket.dfaFinalState}</span>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem',
              background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem'
            }}>
              <div><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SOURCE IP</span><div style={{ color: '#38bdf8' }}>{inspectedPacket.sourceIp}</div></div>
              <div><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DESTINATION IP</span><div style={{ color: '#38bdf8' }}>{inspectedPacket.destinationIp}</div></div>
              <div><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SRC PORT</span><div>{inspectedPacket.protocol === 'ICMP' ? 'N/A (ICMP)' : (inspectedPacket.sourcePort ?? 'None')}</div></div>
              <div><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DST PORT</span><div>{inspectedPacket.protocol === 'ICMP' ? 'N/A (ICMP)' : (inspectedPacket.destinationPort ?? 'None')}</div></div>
            </div>

            {inspectedPacket.validationErrors?.length > 0 && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <strong style={{ color: '#f87171', fontSize: '0.8rem' }}>Validation Errors:</strong>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#fca5a5' }}>
                  {inspectedPacket.validationErrors.map((e, idx) => <li key={idx}>{e}</li>)}
                </ul>
              </div>
            )}

            <div>
              <strong style={{ color: '#fff', fontSize: '0.85rem' }}>⚙️ State Transitions ({inspectedPacket.stateTransitions?.length || 0} steps):</strong>
              <div className="dfa-timeline" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem' }}>
                {inspectedPacket.stateTransitions?.map((step, idx) => (
                  <div key={idx} className="dfa-step-card">
                    <div className="dfa-step-num">{step.step}</div>
                    <div className="dfa-step-content">
                      <div className="dfa-step-title">
                        δ({step.fromState}, <span style={{ color: '#38bdf8' }}>{step.inputSymbol}</span>) →{' '}
                        <span style={{ color: step.toState === 'ACCEPTED' ? '#34d399' : step.toState === 'REJECTED' ? '#f87171' : '#a855f7' }}>
                          {step.toState}
                        </span>
                      </div>
                      <div className="dfa-step-desc">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setInspectedPacket(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper View: Add Packet ---
function AddPacketView({ onPacketCreated }) {
  const [form, setForm] = useState({ sourceIp: '', destinationIp: '', protocol: 'TCP', sourcePort: '', destinationPort: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isIcmp = form.protocol === 'ICMP';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    const check = validateClient(form);
    if (!check.isValid) {
      setErrors(check.errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sourceIp: form.sourceIp.trim(),
        destinationIp: form.destinationIp.trim(),
        protocol: form.protocol.trim().toUpperCase(),
        sourcePort: isIcmp ? null : Number(form.sourcePort.trim()),
        destinationPort: isIcmp ? null : Number(form.destinationPort.trim())
      };
      const res = await API.submitPacket(payload);
      setResult(res);
      if (res.success && onPacketCreated) onPacketCreated();
    } catch (err) {
      setResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📡 Ingest Packet Record</span></div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '192.0.2.10', destinationIp: '198.51.100.80', protocol: 'TCP', sourcePort: '49152', destinationPort: '80' })}>
              Fill TCP
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '198.51.100.15', destinationIp: '203.0.113.53', protocol: 'UDP', sourcePort: '53535', destinationPort: '53' })}>
              Fill UDP
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '192.0.2.1', destinationIp: '203.0.113.1', protocol: 'ICMP', sourcePort: '', destinationPort: '' })}>
              Fill ICMP
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Protocol (TCP, UDP, ICMP)</label>
            <div className="protocol-cards">
              {['TCP', 'UDP', 'ICMP'].map(p => (
                <button
                  key={p}
                  type="button"
                  className={`proto-btn ${form.protocol === p ? `active ${p.toLowerCase()}` : ''}`}
                  onClick={() => setForm({ ...form, protocol: p, sourcePort: p === 'ICMP' ? '' : form.sourcePort, destinationPort: p === 'ICMP' ? '' : form.destinationPort })}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Source IP Address</label>
              <input
                type="text"
                className={`form-control ${errors.sourceIp ? 'error' : ''}`}
                placeholder="e.g. 192.0.2.10"
                value={form.sourceIp}
                onChange={e => { setForm({ ...form, sourceIp: e.target.value }); delete errors.sourceIp; }}
              />
              {errors.sourceIp && <div className="error-msg">⚠️ {errors.sourceIp}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Destination IP Address</label>
              <input
                type="text"
                className={`form-control ${errors.destinationIp ? 'error' : ''}`}
                placeholder="e.g. 198.51.100.80"
                value={form.destinationIp}
                onChange={e => { setForm({ ...form, destinationIp: e.target.value }); delete errors.destinationIp; }}
              />
              {errors.destinationIp && <div className="error-msg">⚠️ {errors.destinationIp}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Source Port {isIcmp ? '(Bypassed for ICMP)' : ''}</label>
              <input
                type="text"
                className={`form-control ${errors.sourcePort ? 'error' : ''}`}
                placeholder={isIcmp ? 'N/A' : 'e.g. 49152'}
                value={form.sourcePort}
                disabled={isIcmp}
                onChange={e => { setForm({ ...form, sourcePort: e.target.value }); delete errors.sourcePort; }}
              />
              {errors.sourcePort && <div className="error-msg">⚠️ {errors.sourcePort}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Destination Port {isIcmp ? '(Bypassed for ICMP)' : ''}</label>
              <input
                type="text"
                className={`form-control ${errors.destinationPort ? 'error' : ''}`}
                placeholder={isIcmp ? 'N/A' : 'e.g. 80'}
                value={form.destinationPort}
                disabled={isIcmp}
                onChange={e => { setForm({ ...form, destinationPort: e.target.value }); delete errors.destinationPort; }}
              />
              {errors.destinationPort && <div className="error-msg">⚠️ {errors.destinationPort}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Running DFA...' : 'Validate & Classify'}
            </button>
          </div>
        </form>

        {result && (
          <div style={{
            marginTop: '1.25rem', padding: '1rem', borderRadius: '8px',
            background: result.success ? (result.packet?.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)') : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${result.success ? (result.packet?.isValid ? '#10b981' : '#f59e0b') : '#ef4444'}`
          }}>
            <strong style={{ color: result.success ? (result.packet?.isValid ? '#34d399' : '#fbbf24') : '#f87171' }}>
              {result.message}
            </strong>
            {result.dfaReport && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
                Classification: <strong>{result.dfaReport.classification}</strong> | Final State: <strong>{result.dfaReport.finalState}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Helper View: Sample Testing ---
function SampleTestingView({ samples, onRunTest }) {
  const [activeReport, setActiveReport] = useState(null);
  const [runningId, setRunningId] = useState(null);

  const handleTest = async (s) => {
    setRunningId(s.id);
    try {
      const res = await onRunTest(s);
      setActiveReport(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div>
      <div className="sample-grid">
        {samples.map(s => (
          <div key={s.id} className={`sample-card ${s.category}`}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{s.name}</strong>
                <span className={`badge ${s.category === 'valid' ? 'badge-valid' : 'badge-invalid'}`}>{s.category.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{s.description}</p>
              <div className="sample-packet-code">
                <div>src: {s.packet.sourceIp || '""'} | dst: {s.packet.destinationIp || '""'}</div>
                <div>proto: {s.packet.protocol || '""'} | ports: {s.packet.sourcePort ?? 'null'} → {s.packet.destinationPort ?? 'null'}</div>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleTest(s)} disabled={runningId === s.id}>
              {runningId === s.id ? 'Running...' : '⚡ Run Live Test'}
            </button>
          </div>
        ))}
      </div>

      {activeReport && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title"><span>Output: {activeReport.sampleCase?.name}</span></div>
            <span className={`badge ${activeReport.validationResult?.isValid ? 'badge-valid' : 'badge-invalid'}`}>
              {activeReport.validationResult?.isValid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Classification: <strong>{activeReport.dfaResult?.classification}</strong> | Final State: <strong>{activeReport.dfaResult?.finalState}</strong>
          </div>
          <div className="dfa-timeline">
            {activeReport.dfaResult?.stateTransitions?.map((step, idx) => (
              <div key={idx} className="dfa-step-card active">
                <div className="dfa-step-num">{step.step}</div>
                <div className="dfa-step-content">
                  <div className="dfa-step-title">
                    δ({step.fromState}, <span style={{ color: '#38bdf8' }}>{step.inputSymbol}</span>) → <span style={{ color: step.toState === 'ACCEPTED' ? '#34d399' : step.toState === 'REJECTED' ? '#f87171' : '#a855f7' }}>{step.toState}</span>
                  </div>
                  <div className="dfa-step-desc">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helper View: DFA Visualization ---
function DfaView({ automataInfo }) {
  const [activeNode, setActiveNode] = useState('START');

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>📐 Formal DFA Definition: M = (Q, Σ, q0, F, δ)</span></div>
          <span className="badge badge-valid">DETERMINISTIC FINITE AUTOMATON</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
          <div><strong>States (Q):</strong> START, SOURCE_VALIDATION, DESTINATION_VALIDATION, PROTOCOL_VALIDATION, PORT_VALIDATION, TCP_CLASSIFIED, UDP_CLASSIFIED, ICMP_CLASSIFIED, ACCEPTED, REJECTED</div>
          <div><strong>Initial (q0):</strong> START | <strong>Final (F):</strong> &#123; ACCEPTED &#125; | <strong>Trap:</strong> &#123; REJECTED &#125;</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><span>🗺️ State Transition Diagram</span></div>
          <span style={{ fontSize: '0.8rem', color: '#38bdf8' }}>Click any node to inspect</span>
        </div>
        <div className="dfa-diagram-box">
          <svg width="1050" height="420" viewBox="0 0 1050 420" style={{ background: '#0b1120', borderRadius: '12px' }}>
            {/* Draw nodes */}
            {[
              { id: 'START', x: 60, y: 150, label: 'START (q0)', color: '#38bdf8' },
              { id: 'SOURCE_VALIDATION', x: 220, y: 150, label: 'SRC_VAL', color: '#60a5fa' },
              { id: 'DESTINATION_VALIDATION', x: 380, y: 150, label: 'DST_VAL', color: '#818cf8' },
              { id: 'PROTOCOL_VALIDATION', x: 540, y: 100, label: 'PROTO_VAL', color: '#a78bfa' },
              { id: 'ICMP_CLASSIFIED', x: 540, y: 220, label: 'ICMP_CLASS', color: '#fbbf24' },
              { id: 'PORT_VALIDATION', x: 690, y: 100, label: 'PORT_VAL', color: '#c084fc' },
              { id: 'TCP_CLASSIFIED', x: 830, y: 70, label: 'TCP_CLASS', color: '#06b6d4' },
              { id: 'UDP_CLASSIFIED', x: 830, y: 130, label: 'UDP_CLASS', color: '#3b82f6' },
              { id: 'ACCEPTED', x: 960, y: 150, label: 'ACCEPTED (F)', color: '#34d399', isFinal: true },
              { id: 'REJECTED', x: 540, y: 340, label: 'REJECTED (Trap)', color: '#f87171' }
            ].map(node => (
              <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => setActiveNode(node.id)}>
                {node.isFinal && <circle cx={node.x} cy={node.y} r="32" fill="none" stroke="#10b981" strokeWidth="2" />}
                <circle
                  cx={node.x} cy={node.y} r="26"
                  fill={activeNode === node.id ? 'rgba(6, 182, 212, 0.4)' : '#1e293b'}
                  stroke={activeNode === node.id ? '#06b6d4' : node.color}
                  strokeWidth="2"
                />
                <text cx={node.x} cy={node.y} x={node.x} y={node.y + 4} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">
                  {node.label.split(' ')[0]}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- Helper View: History ---
function HistoryView({ packets, onInspectPacket }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span>📜 Historical Packet Audit Log ({packets.length})</span></div>
      </div>
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Packet ID</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Status</th>
              <th>DFA Classification</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {packets.map(p => (
              <tr key={p._id || p.packetId}>
                <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(p.createdAt || Date.now()).toLocaleString()}</td>
                <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>{p.packetId}</td>
                <td className="mono-cell">{p.sourceIp}</td>
                <td className="mono-cell">{p.destinationIp}</td>
                <td><span className={`badge badge-${p.protocol?.toLowerCase()}`}>{p.protocol}</span></td>
                <td><span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>{p.isValid ? 'VALID' : 'INVALID'}</span></td>
                <td><span className="badge badge-tcp">{p.dfaClassification}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => onInspectPacket(p)}>Audit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mount React Root
if (typeof ReactDOM !== 'undefined') {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<StandaloneApp />);
}
