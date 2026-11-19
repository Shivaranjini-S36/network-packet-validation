/**
 * NetValidator - Complete React 18 Application
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Works seamlessly both on:
 * 1. Full-Stack Localhost (Express + MongoDB Atlas on port 5000)
 * 2. Static GitHub Pages (Automatic client-side DFA engine & LocalStorage persistence)
 */

const { useState, useEffect, useCallback } = React;

// --- Built-in Predefined Seed Vectors (RFC 5737 & RFC 1918) ---
const SEED_DATA = [
  {
    packetId: 'PKT-1001',
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: 49152,
    destinationPort: 80,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'TCP_PACKET',
    dfaFinalState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    packetId: 'PKT-1002',
    sourceIp: '198.51.100.15',
    destinationIp: '203.0.113.53',
    protocol: 'UDP',
    sourcePort: 53535,
    destinationPort: 53,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'UDP_PACKET',
    dfaFinalState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    packetId: 'PKT-1003',
    sourceIp: '192.0.2.1',
    destinationIp: '203.0.113.1',
    protocol: 'ICMP',
    sourcePort: null,
    destinationPort: null,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'ICMP_PACKET',
    dfaFinalState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 2400000).toISOString()
  },
  {
    packetId: 'PKT-1004',
    sourceIp: '192.0.2.299',
    destinationIp: '198.51.100.20',
    protocol: 'TCP',
    sourcePort: 12345,
    destinationPort: 443,
    isValid: false,
    validationErrors: ['Source IP error: Octet 4 (299) out of range [0-255]'],
    dfaClassification: 'REJECTED_PACKET',
    dfaFinalState: 'REJECTED',
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    packetId: 'PKT-1005',
    sourceIp: '10.0.0.4',
    destinationIp: '172.16.254.1',
    protocol: 'TCP',
    sourcePort: 3389,
    destinationPort: 3389,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'TCP_PACKET',
    dfaFinalState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 1200000).toISOString()
  },
  {
    packetId: 'PKT-1006',
    sourceIp: '192.168.1.100',
    destinationIp: '192.168.1.1',
    protocol: 'UDP',
    sourcePort: 67,
    destinationPort: 68,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'UDP_PACKET',
    dfaFinalState: 'ACCEPTED',
    createdAt: new Date(Date.now() - 600000).toISOString()
  },
  {
    packetId: 'PKT-1007',
    sourceIp: '192.0.2.50',
    destinationIp: '198.51.100.70',
    protocol: 'UDP',
    sourcePort: 4000,
    destinationPort: 72000,
    isValid: false,
    validationErrors: ['Destination Port (72000) is out of allowable range [1 - 65535]'],
    dfaClassification: 'REJECTED_PACKET',
    dfaFinalState: 'REJECTED',
    createdAt: new Date().toISOString()
  }
];

const SAMPLE_VECTORS = [
  {
    id: 'sample-1',
    name: '1. Valid TCP Packet (HTTP/Web)',
    category: 'valid',
    description: 'Standard HTTP web traffic packet with valid IPs and allowable ports.',
    packet: { sourceIp: '192.0.2.10', destinationIp: '198.51.100.80', protocol: 'TCP', sourcePort: 49152, destinationPort: 80 }
  },
  {
    id: 'sample-2',
    name: '2. Valid UDP Packet (DNS Query)',
    category: 'valid',
    description: 'Standard DNS lookup datagram with valid source and destination ports.',
    packet: { sourceIp: '198.51.100.15', destinationIp: '203.0.113.53', protocol: 'UDP', sourcePort: 53535, destinationPort: 53 }
  },
  {
    id: 'sample-3',
    name: '3. Valid ICMP Packet (Echo / Ping RFC 792)',
    category: 'valid',
    description: 'ICMP network layer message; transport ports are omitted/null.',
    packet: { sourceIp: '192.0.2.1', destinationIp: '203.0.113.1', protocol: 'ICMP', sourcePort: null, destinationPort: null }
  },
  {
    id: 'sample-4',
    name: '4. Invalid Source IP (Octet Out of Range)',
    category: 'invalid',
    description: 'Source IP contains octet value 299 exceeding valid 8-bit octet range [0-255].',
    packet: { sourceIp: '192.0.2.299', destinationIp: '198.51.100.20', protocol: 'TCP', sourcePort: 12345, destinationPort: 443 }
  },
  {
    id: 'sample-5',
    name: '5. Invalid Destination IP (Malformed)',
    category: 'invalid',
    description: 'Destination IP contains non-numeric octet characters and incorrect format.',
    packet: { sourceIp: '192.0.2.55', destinationIp: '198.51.100.xyz', protocol: 'TCP', sourcePort: 45000, destinationPort: 8080 }
  },
  {
    id: 'sample-6',
    name: '6. Invalid Port (Port Out of Range)',
    category: 'invalid',
    description: 'Destination port 72000 exceeds maximum allowable 16-bit integer port number (65535).',
    packet: { sourceIp: '192.0.2.50', destinationIp: '198.51.100.70', protocol: 'UDP', sourcePort: 4000, destinationPort: 72000 }
  },
  {
    id: 'sample-7',
    name: '7. Missing / Unrecognized Protocol',
    category: 'invalid',
    description: 'Protocol field is missing or contains unsupported protocol type.',
    packet: { sourceIp: '192.0.2.25', destinationIp: '203.0.113.40', protocol: '', sourcePort: 8080, destinationPort: 80 }
  },
  {
    id: 'sample-8',
    name: '8. Malformed Packet (Multiple Corrupted Fields)',
    category: 'invalid',
    description: 'Multiple syntax and structural violations across octets and ports.',
    packet: { sourceIp: '300.500.700.900', destinationIp: 'not-an-ip-address', protocol: 'INVALID_PROTO', sourcePort: -50, destinationPort: 999999 }
  }
];

// --- Lexical Regular Expressions ---
const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
const PORT_REGEX = /^[0-9]+$/;
const PROTOCOL_REGEX = /^(TCP|UDP|ICMP)$/i;

// --- DFA Execution Engine ---
function executeDFA(packet) {
  const errors = [];
  const transitions = [];
  let currentState = 'START';
  let step = 1;

  function record(fromState, inputSymbol, toState, description) {
    transitions.push({ step, fromState, inputSymbol, toState, description, timestamp: new Date().toISOString() });
    currentState = toState;
    step++;
  }

  const src = (packet.sourceIp || '').trim();
  const dst = (packet.destinationIp || '').trim();
  const proto = (packet.protocol || '').trim().toUpperCase();

  // 1. Source IP
  if (IPV4_REGEX.test(src)) {
    record(currentState, 'VALID_SRC_IP', 'SOURCE_VALIDATION', `Source IP '${src}' matched IPv4 format and octets within [0-255].`);
  } else {
    const err = 'Source IP format invalid or octet out of range [0-255]';
    errors.push(err);
    record(currentState, 'INVALID_SRC_IP', 'REJECTED', `Source IP validation failed: ${err}. Transited to REJECTED trap state.`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 2. Destination IP
  if (IPV4_REGEX.test(dst)) {
    record(currentState, 'VALID_DST_IP', 'DESTINATION_VALIDATION', `Destination IP '${dst}' matched IPv4 format and octets within [0-255].`);
  } else {
    const err = 'Destination IP format invalid or octet out of range [0-255]';
    errors.push(err);
    record(currentState, 'INVALID_DST_IP', 'REJECTED', `Destination IP validation failed: ${err}. Transited to REJECTED.`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 3. Protocol
  if (proto === 'TCP') {
    record(currentState, 'PROTO_TCP', 'PROTOCOL_VALIDATION', 'Protocol identified as TCP. Transport port validation required.');
  } else if (proto === 'UDP') {
    record(currentState, 'PROTO_UDP', 'PROTOCOL_VALIDATION', 'Protocol identified as UDP. Transport port validation required.');
  } else if (proto === 'ICMP') {
    record(currentState, 'PROTO_ICMP', 'ICMP_CLASSIFIED', 'Protocol identified as ICMP. Port verification bypassed (RFC 792).');
    record(currentState, 'FINALIZE_ACCEPT', 'ACCEPTED', 'All packet criteria satisfied. Officially ACCEPTED as ICMP_PACKET.');
    return { isValid: true, errors: [], finalState: 'ACCEPTED', classification: 'ICMP_PACKET', transitions };
  } else {
    const err = `Unrecognized or missing protocol '${proto}'. Choose TCP, UDP, or ICMP.`;
    errors.push(err);
    record(currentState, 'INVALID_PROTO', 'REJECTED', `${err} Transited to REJECTED.`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 4. Ports for TCP / UDP
  const sp = packet.sourcePort !== null && packet.sourcePort !== undefined ? String(packet.sourcePort).trim() : '';
  const dp = packet.destinationPort !== null && packet.destinationPort !== undefined ? String(packet.destinationPort).trim() : '';
  const spNum = Number(sp);
  const dpNum = Number(dp);
  const spOk = PORT_REGEX.test(sp) && spNum >= 1 && spNum <= 65535;
  const dpOk = PORT_REGEX.test(dp) && dpNum >= 1 && dpNum <= 65535;

  if (spOk && dpOk) {
    record(currentState, 'VALID_PORTS', 'PORT_VALIDATION', `Ports verified: src ${spNum}, dst ${dpNum} within allowable range [1-65535].`);
  } else {
    const err = 'Port validation failed: Ports must be positive integers between 1 and 65535.';
    errors.push(err);
    record(currentState, 'INVALID_PORTS', 'REJECTED', `${err} Transited to REJECTED.`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 5. Classification
  if (proto === 'TCP') {
    record(currentState, 'DISPATCH_TCP', 'TCP_CLASSIFIED', 'Packet confirmed and classified as TCP transmission.');
  } else {
    record(currentState, 'DISPATCH_UDP', 'UDP_CLASSIFIED', 'Packet confirmed and classified as UDP datagram.');
  }

  // 6. Final Accept
  record(currentState, 'FINALIZE_ACCEPT', 'ACCEPTED', 'All validation rules and DFA transitions passed. Officially ACCEPTED.');
  return {
    isValid: true,
    errors: [],
    finalState: 'ACCEPTED',
    classification: proto === 'TCP' ? 'TCP_PACKET' : 'UDP_PACKET',
    transitions
  };
}

// --- LocalStorage Persistence Helper for GitHub Pages ---
function getLocalPackets() {
  try {
    const saved = localStorage.getItem('netvalidator_packets');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  // Initialize with seed data
  const initial = SEED_DATA.map(p => {
    const dfa = executeDFA(p);
    return { ...p, stateTransitions: dfa.transitions };
  });
  localStorage.setItem('netvalidator_packets', JSON.stringify(initial));
  return initial;
}

function saveLocalPackets(packets) {
  try {
    localStorage.setItem('netvalidator_packets', JSON.stringify(packets));
  } catch (e) {}
}

// --- Main Standalone App Component ---
function StandaloneApp() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [packets, setPackets] = useState([]);
  const [dbStatus, setDbStatus] = useState({ connected: true, mode: 'MongoDB' });
  const [inspectedPacket, setInspectedPacket] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Load Packets & Status
  const loadData = useCallback(async () => {
    try {
      // First attempt backend API (when running with Express/Node)
      const res = await fetch('/api/packets');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.packets) {
          setPackets(data.packets);
          const healthRes = await (await fetch('/api/health')).json();
          if (healthRes.database) setDbStatus(healthRes.database);
          return;
        }
      }
    } catch (e) {
      // Backend not running (GitHub Pages static host) -> use LocalStorage & in-memory engine!
    }

    const local = getLocalPackets();
    setPackets(local);
    setDbStatus({
      connected: true,
      mode: 'GitHub Pages Live',
      host: 'Browser LocalStorage Engine',
      dbName: 'network_packet_db'
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic Statistics
  const stats = React.useMemo(() => {
    const total = packets.length;
    const validCount = packets.filter(p => p.isValid).length;
    const invalidCount = total - validCount;
    const tcp = packets.filter(p => p.protocol === 'TCP').length;
    const udp = packets.filter(p => p.protocol === 'UDP').length;
    const icmp = packets.filter(p => p.protocol === 'ICMP').length;
    const passRate = total > 0 ? ((validCount / total) * 100).toFixed(1) : 0;
    return {
      total,
      validCount,
      invalidCount,
      validationPassRate: Number(passRate),
      protocolDistribution: { TCP: tcp, UDP: udp, ICMP: icmp },
      recentActivity: packets.slice(0, 6)
    };
  }, [packets]);

  // Handlers
  const handleCreatePacket = async (newPacketData) => {
    try {
      const res = await fetch('/api/packets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPacketData)
      });
      if (res.ok) {
        loadData();
        return (await res.json());
      }
    } catch (e) {}

    // Fallback: Client execution
    const dfa = executeDFA(newPacketData);
    const packetId = `PKT-${1000 + packets.length + 1}`;
    const newRecord = {
      _id: 'local_' + Date.now(),
      packetId,
      sourceIp: newPacketData.sourceIp,
      destinationIp: newPacketData.destinationIp,
      protocol: newPacketData.protocol,
      sourcePort: newPacketData.sourcePort,
      destinationPort: newPacketData.destinationPort,
      isValid: dfa.isValid,
      validationErrors: dfa.errors,
      dfaClassification: dfa.classification,
      dfaFinalState: dfa.finalState,
      stateTransitions: dfa.transitions,
      createdAt: new Date().toISOString()
    };

    const updated = [newRecord, ...packets];
    setPackets(updated);
    saveLocalPackets(updated);

    return {
      success: true,
      message: dfa.isValid
        ? `Packet ${packetId} successfully validated & classified as ${dfa.classification}`
        : `Packet ${packetId} rejected by DFA trap state`,
      packet: newRecord,
      dfaReport: dfa
    };
  };

  const handleDeletePacket = async (packetId) => {
    if (window.confirm(`Delete packet record ${packetId}?`)) {
      try {
        const res = await fetch(`/api/packets/${packetId}`, { method: 'DELETE' });
        if (res.ok) { loadData(); return; }
      } catch (e) {}

      const filtered = packets.filter(p => p.packetId !== packetId);
      setPackets(filtered);
      saveLocalPackets(filtered);
    }
  };

  const handleResetSamples = async () => {
    if (window.confirm('Reset all packet records to default seed test vectors?')) {
      try {
        const res = await fetch('/api/samples/reset', { method: 'POST' });
        if (res.ok) { loadData(); alert('Sample records successfully reset!'); return; }
      } catch (e) {}

      localStorage.removeItem('netvalidator_packets');
      loadData();
      alert('Sample records successfully reset!');
    }
  };

  const filteredPackets = packets.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ = !q ||
      (p.packetId && p.packetId.toLowerCase().includes(q)) ||
      (p.sourceIp && p.sourceIp.toLowerCase().includes(q)) ||
      (p.destinationIp && p.destinationIp.toLowerCase().includes(q)) ||
      (p.protocol && p.protocol.toLowerCase().includes(q)) ||
      (p.dfaClassification && p.dfaClassification.toLowerCase().includes(q));

    const matchProto = selectedProtocol === 'ALL' || (p.protocol && p.protocol.toUpperCase() === selectedProtocol.toUpperCase());
    const matchStatus = selectedStatus === 'ALL' || (selectedStatus === 'valid' ? p.isValid : !p.isValid);

    return matchQ && matchProto && matchStatus;
  });

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
            System Status
          </div>
          <div className="db-pill">
            <span className="dot online"></span>
            <span style={{ color: '#34d399', fontSize: '0.72rem' }}>
              {dbStatus.mode === 'MongoDB' ? 'MongoDB Atlas Connected' : 'GitHub Pages Live'}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: '#64748b' }}>
            FSWD · CN · FLAT Integrations
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="page-heading">
            <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>☰</button>
            <div>
              <h1 className="page-title">
                {activePage === 'dashboard' && 'Security Dashboard'}
                {activePage === 'add-packet' && 'Packet Input Form'}
                {activePage === 'records' && 'Packet Records'}
                {activePage === 'sample-testing' && 'Sample Packet Testing'}
                {activePage === 'dfa-visualizer' && 'DFA Automata Engine'}
                {activePage === 'history' && 'Historical Audit Trail'}
              </h1>
              <p className="page-sub">Question 51: Network Packet Format Validation &amp; Classification System</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleResetSamples}>
              🔄 Reset Samples
            </button>
          </div>
        </header>

        <main className="content-body">
          {/* 1. Dashboard */}
          {activePage === 'dashboard' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon cyan">📦</div>
                  <div><div className="stat-val">{stats.total}</div><div className="stat-label">Total Packets</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">✅</div>
                  <div><div className="stat-val">{stats.validCount}</div><div className="stat-label">Valid Packets</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon red">❌</div>
                  <div><div className="stat-val">{stats.invalidCount}</div><div className="stat-label">Invalid Packets</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blue">🌐</div>
                  <div><div className="stat-val">{stats.protocolDistribution.TCP}</div><div className="stat-label">TCP Packets</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">⚡</div>
                  <div><div className="stat-val">{stats.protocolDistribution.UDP}</div><div className="stat-label">UDP Packets</div></div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon amber">📡</div>
                  <div><div className="stat-val">{stats.protocolDistribution.ICMP}</div><div className="stat-label">ICMP Packets</div></div>
                </div>
              </div>

              {/* Protocol Distribution & Validation Statistics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <div className="card-title"><span>🌐 Protocol Distribution</span></div>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dynamic Record Calculations</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {['TCP', 'UDP', 'ICMP'].map(proto => {
                      const cnt = stats.protocolDistribution[proto];
                      const pct = stats.total > 0 ? ((cnt / stats.total) * 100).toFixed(1) : 0;
                      const col = proto === 'TCP' ? 'var(--cyan)' : proto === 'UDP' ? 'var(--blue)' : 'var(--amber)';
                      return (
                        <div key={proto}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: col, fontWeight: 600 }}>{proto} Protocol</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>{cnt} pkts ({pct}%)</span>
                          </div>
                          <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: col }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-header">
                    <div className="card-title"><span>🛡️ Validation Pass Rate</span></div>
                    <span className="badge badge-valid">{stats.validationPassRate}% Pass Rate</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: '90px', height: '90px', borderRadius: '50%',
                      background: `conic-gradient(var(--green) ${stats.validationPassRate * 3.6}deg, var(--red) 0deg)`,
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
                      <div>Total Records: <strong>{stats.total}</strong></div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                    Validated through IPv4 regex and 10-state Deterministic Finite Automaton (DFA) execution.
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
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
                      {stats.recentActivity.map(p => (
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

          {/* 2. Add Packet Form */}
          {activePage === 'add-packet' && (
            <AddPacketView onSubmit={handleCreatePacket} />
          )}

          {/* 3. Packet Records */}
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
                    {filteredPackets.length === 0 ? (
                      <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No records found.</td></tr>
                    ) : (
                      filteredPackets.map(p => (
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

          {/* 4. Sample Testing */}
          {activePage === 'sample-testing' && (
            <SampleTestingView
              samples={SAMPLE_VECTORS}
              onRunTest={async (sample) => {
                return await handleCreatePacket(sample.packet);
              }}
            />
          )}

          {/* 5. DFA Visualization */}
          {activePage === 'dfa-visualizer' && (
            <DfaVisualizerView />
          )}

          {/* 6. History */}
          {activePage === 'history' && (
            <HistoryView packets={packets} onInspectPacket={setInspectedPacket} />
          )}
        </main>
      </div>

      {/* Modal */}
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

// --- Add Packet View ---
function AddPacketView({ onSubmit }) {
  const [form, setForm] = useState({ sourceIp: '', destinationIp: '', protocol: 'TCP', sourcePort: '', destinationPort: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const isIcmp = form.protocol === 'ICMP';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    const res = await onSubmit({
      sourceIp: form.sourceIp.trim(),
      destinationIp: form.destinationIp.trim(),
      protocol: form.protocol.trim().toUpperCase(),
      sourcePort: isIcmp ? null : (form.sourcePort.trim() !== '' ? Number(form.sourcePort.trim()) : ''),
      destinationPort: isIcmp ? null : (form.destinationPort.trim() !== '' ? Number(form.destinationPort.trim()) : '')
    });
    setResult(res);
    setSubmitting(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span>📡 Ingest Packet Record</span></div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '192.0.2.10', destinationIp: '198.51.100.80', protocol: 'TCP', sourcePort: '49152', destinationPort: '80' })}>Fill TCP</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '198.51.100.15', destinationIp: '203.0.113.53', protocol: 'UDP', sourcePort: '53535', destinationPort: '53' })}>Fill UDP</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm({ sourceIp: '192.0.2.1', destinationIp: '203.0.113.1', protocol: 'ICMP', sourcePort: '', destinationPort: '' })}>Fill ICMP</button>
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
            <label className="form-label">Source IPv4 Address</label>
            <input type="text" className="form-control" placeholder="e.g. 192.0.2.10" value={form.sourceIp} onChange={e => setForm({ ...form, sourceIp: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Destination IPv4 Address</label>
            <input type="text" className="form-control" placeholder="e.g. 198.51.100.80" value={form.destinationIp} onChange={e => setForm({ ...form, destinationIp: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Source Port {isIcmp ? '(Bypassed for ICMP)' : ''}</label>
            <input type="text" className="form-control" placeholder={isIcmp ? 'N/A' : 'e.g. 49152'} value={form.sourcePort} disabled={isIcmp} onChange={e => setForm({ ...form, sourcePort: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Destination Port {isIcmp ? '(Bypassed for ICMP)' : ''}</label>
            <input type="text" className="form-control" placeholder={isIcmp ? 'N/A' : 'e.g. 80'} value={form.destinationPort} disabled={isIcmp} onChange={e => setForm({ ...form, destinationPort: e.target.value })} />
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
          background: result.packet?.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${result.packet?.isValid ? '#10b981' : '#ef4444'}`
        }}>
          <strong style={{ color: result.packet?.isValid ? '#34d399' : '#f87171' }}>{result.message}</strong>
          {result.dfaReport && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#e2e8f0' }}>
              Classification: <strong>{result.dfaReport.classification}</strong> | Final State: <strong>{result.dfaReport.finalState}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Sample Testing View ---
function SampleTestingView({ samples, onRunTest }) {
  const [activeReport, setActiveReport] = useState(null);
  const [runningId, setRunningId] = useState(null);

  const handleTest = async (s) => {
    setRunningId(s.id);
    const res = await onRunTest(s);
    setActiveReport({ sampleCase: s, ...res });
    setRunningId(null);
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
            <span className={`badge ${activeReport.packet?.isValid ? 'badge-valid' : 'badge-invalid'}`}>
              {activeReport.packet?.isValid ? 'VALID' : 'INVALID'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
            Classification: <strong>{activeReport.dfaReport?.classification}</strong> | Final State: <strong>{activeReport.dfaReport?.finalState}</strong>
          </div>
          <div className="dfa-timeline">
            {activeReport.dfaReport?.transitions?.map((step, idx) => (
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

// --- DFA Visualization View ---
function DfaVisualizerView() {
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
          <svg width="1050" height="400" viewBox="0 0 1050 400" style={{ background: '#0b1120', borderRadius: '12px' }}>
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

// --- History View ---
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
