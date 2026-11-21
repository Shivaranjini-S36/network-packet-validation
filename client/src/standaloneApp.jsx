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
            { id: 'transition-table', label: 'Transition Table', icon: '📑' },
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
                {activePage === 'transition-table' && 'State Transition Table'}
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

          {/* 6. State Transition Table */}
          {activePage === 'transition-table' && (
            <TransitionTableView />
          )}

          {/* 7. History */}
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
  const [filterState, setFilterState] = useState('ALL');
  const [selectedSample, setSelectedSample] = useState('sample-1');
  const [simPacket, setSimPacket] = useState({
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: '49152',
    destinationPort: '80'
  });
  const [simSteps, setSimSteps] = useState([]);
  const [simIndex, setSimIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const nodePositions = {
    START: {
      x: 70, y: 160, label: 'START (q0)', color: '#38bdf8', type: 'Initial State (q0)',
      desc: 'Packet ingest begins. Extracts Source IP field for RFC 791 IPv4 format and [0–255] octet validation.'
    },
    SOURCE_VALIDATION: {
      x: 220, y: 160, label: 'SRC_VAL', color: '#60a5fa', type: 'Validation State',
      desc: 'Source IP passed lexical validation. Ingests Destination IP for format and octet range verification.'
    },
    DESTINATION_VALIDATION: {
      x: 370, y: 160, label: 'DST_VAL', color: '#818cf8', type: 'Validation State',
      desc: 'Both IP addresses verified. Automaton inspects Protocol header (TCP, UDP, or ICMP).'
    },
    PROTOCOL_VALIDATION: {
      x: 520, y: 100, label: 'PROTO_VAL', color: '#a78bfa', type: 'Validation State',
      desc: 'Transport protocol identified (TCP/UDP). Requires verification of 16-bit integer ports [1–65535].'
    },
    ICMP_CLASSIFIED: {
      x: 520, y: 230, label: 'ICMP_CLASS', color: '#fbbf24', type: 'Classification State',
      desc: 'Network layer ICMP (RFC 792) confirmed. Transport ports are naturally bypassed.'
    },
    PORT_VALIDATION: {
      x: 670, y: 100, label: 'PORT_VAL', color: '#c084fc', type: 'Validation State',
      desc: 'Source and Destination ports validated within integer range [1–65535]. Ready to dispatch protocol classification.'
    },
    TCP_CLASSIFIED: {
      x: 810, y: 65, label: 'TCP_CLASS', color: '#06b6d4', type: 'Classification State',
      desc: 'Transmission Control Protocol (RFC 793) confirmed with full connection-oriented header integrity.'
    },
    UDP_CLASSIFIED: {
      x: 810, y: 135, label: 'UDP_CLASS', color: '#3b82f6', type: 'Classification State',
      desc: 'User Datagram Protocol (RFC 768) confirmed with valid connectionless ports.'
    },
    ACCEPTED: {
      x: 935, y: 160, label: 'ACCEPTED (F)', color: '#34d399', isFinal: true, type: 'Final Accepting State (F)',
      desc: 'Acceptance state reached. Packet conforms to all networking standards, regex rules, and protocol criteria.'
    },
    REJECTED: {
      x: 520, y: 370, label: 'REJECTED (Trap)', color: '#f87171', isTrap: true, type: 'Trap / Sink State (Non-Accepting)',
      desc: 'Dead-end trap state entered whenever any field fails lexical regex or semantic constraints. Irrecoverable.'
    }
  };

  const TRANSITION_TABLE = [
    { from: 'START', input: 'VALID_SRC_IP', to: 'SOURCE_VALIDATION', type: 'valid', rule: 'IPv4 format matching regex, octets 0–255' },
    { from: 'START', input: 'INVALID_SRC_IP', to: 'REJECTED', type: 'invalid', rule: 'Non-IPv4 format or octet > 255' },
    { from: 'SOURCE_VALIDATION', input: 'VALID_DST_IP', to: 'DESTINATION_VALIDATION', type: 'valid', rule: 'IPv4 format matching regex, octets 0–255' },
    { from: 'SOURCE_VALIDATION', input: 'INVALID_DST_IP', to: 'REJECTED', type: 'invalid', rule: 'Non-IPv4 format or octet > 255' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_TCP', to: 'PROTOCOL_VALIDATION', type: 'valid', rule: 'Protocol equals TCP; transport ports required' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_UDP', to: 'PROTOCOL_VALIDATION', type: 'valid', rule: 'Protocol equals UDP; transport ports required' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_ICMP', to: 'ICMP_CLASSIFIED', type: 'valid', rule: 'Protocol equals ICMP; port verification bypassed (RFC 792)' },
    { from: 'DESTINATION_VALIDATION', input: 'INVALID_PROTO', to: 'REJECTED', type: 'invalid', rule: 'Protocol missing or unsupported' },
    { from: 'PROTOCOL_VALIDATION', input: 'VALID_PORTS', to: 'PORT_VALIDATION', type: 'valid', rule: 'Source & Dest ports in range [1 - 65535]' },
    { from: 'PROTOCOL_VALIDATION', input: 'INVALID_PORTS', to: 'REJECTED', type: 'invalid', rule: 'Port out of range or non-numeric' },
    { from: 'PORT_VALIDATION', input: 'DISPATCH_TCP', to: 'TCP_CLASSIFIED', type: 'valid', rule: 'Dispatch to Transmission Control Protocol' },
    { from: 'PORT_VALIDATION', input: 'DISPATCH_UDP', to: 'UDP_CLASSIFIED', type: 'valid', rule: 'Dispatch to User Datagram Protocol' },
    { from: 'TCP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', rule: 'All validation criteria met; packet accepted' },
    { from: 'UDP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', rule: 'All validation criteria met; packet accepted' },
    { from: 'ICMP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', rule: 'ICMP criteria met; packet accepted' },
    { from: 'REJECTED', input: 'ANY_INPUT', to: 'REJECTED', type: 'invalid', rule: 'Trap / Sink state self-loop (irrecoverable dead-end)' }
  ];

  const handleSelectSample = (sampleId) => {
    setSelectedSample(sampleId);
    const found = SAMPLE_VECTORS.find(s => s.id === sampleId);
    if (found) {
      setSimPacket({
        sourceIp: found.packet.sourceIp || '',
        destinationIp: found.packet.destinationIp || '',
        protocol: found.packet.protocol || 'TCP',
        sourcePort: found.packet.sourcePort !== null && found.packet.sourcePort !== undefined ? String(found.packet.sourcePort) : '',
        destinationPort: found.packet.destinationPort !== null && found.packet.destinationPort !== undefined ? String(found.packet.destinationPort) : ''
      });
      setIsSimulating(false);
      setSimSteps([]);
      setSimIndex(0);
      setActiveNode('START');
    }
  };

  const handleStartSim = () => {
    const res = executeDFA({
      sourceIp: simPacket.sourceIp,
      destinationIp: simPacket.destinationIp,
      protocol: simPacket.protocol,
      sourcePort: simPacket.protocol === 'ICMP' ? null : simPacket.sourcePort,
      destinationPort: simPacket.protocol === 'ICMP' ? null : simPacket.destinationPort
    });
    setSimSteps(res.transitions || []);
    setSimIndex(0);
    setActiveNode('START');
    setIsSimulating(true);
  };

  const handleNextStep = () => {
    if (simIndex < simSteps.length) {
      const step = simSteps[simIndex];
      setActiveNode(step.toState);
      setSimIndex(prev => prev + 1);
    }
  };

  const handleResetSim = () => {
    setIsSimulating(false);
    setSimSteps([]);
    setSimIndex(0);
    setActiveNode('START');
  };

  const currentStep = simIndex > 0 ? simSteps[simIndex - 1] : null;
  const isSimComplete = isSimulating && simIndex >= simSteps.length && simSteps.length > 0;
  const currentNodeInfo = nodePositions[activeNode] || nodePositions.START;

  const filteredTransitions = TRANSITION_TABLE.filter(t => {
    if (filterState === 'VALID') return t.type === 'valid';
    if (filterState === 'INVALID') return t.type === 'invalid';
    return true;
  });

  return (
    <div>
      {/* Formal Automaton 5-Tuple Definition */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📐 Formal Automaton Definition: M = (Q, Σ, q0, F, δ)</span>
          </div>
          <span className="badge badge-valid">DETERMINISTIC FINITE AUTOMATON (DFA)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Set of States (Q): |Q| = 10</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem', marginTop: '0.25rem', wordBreak: 'break-word' }}>
              &#123; START, SOURCE_VALIDATION, DESTINATION_VALIDATION, PROTOCOL_VALIDATION, PORT_VALIDATION, TCP_CLASSIFIED, UDP_CLASSIFIED, ICMP_CLASSIFIED, ACCEPTED, REJECTED &#125;
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Initial (q0), Final (F) &amp; Trap States</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ color: '#60a5fa' }}>q0 = START</span> | <span style={{ color: '#34d399' }}>F = &#123; ACCEPTED &#125;</span> | <span style={{ color: '#f87171' }}>Trap = &#123; REJECTED &#125;</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Input Alphabet (Σ)</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#c084fc', fontSize: '0.75rem', marginTop: '0.25rem', wordBreak: 'break-word' }}>
              &#123; VALID_SRC_IP, INVALID_SRC_IP, VALID_DST_IP, INVALID_DST_IP, PROTO_TCP, PROTO_UDP, PROTO_ICMP, INVALID_PROTO, VALID_PORTS, INVALID_PORTS, DISPATCH_TCP, DISPATCH_UDP, FINALIZE_ACCEPT &#125;
            </div>
          </div>
        </div>
      </div>

      {/* State Transition Diagram (SVG) */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🗺️ DFA State Transition Diagram</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Active Node: <strong style={{ color: currentNodeInfo.color }}>{activeNode}</strong>
            </span>
          </div>
        </div>

        <div className="dfa-diagram-box">
          <svg viewBox="0 0 1000 470" style={{ width: '100%', maxWidth: '1000px', height: 'auto', display: 'block', background: '#0a0f1d', borderRadius: '12px' }}>
            <defs>
              <marker id="dfa-arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker id="dfa-arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="dfa-arrow-reject" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="dfa-arrow-accept" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <filter id="dfa-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Initial State Arrow */}
            <line x1="15" y1="160" x2="45" y2="160" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#dfa-arrow-active)" />
            <text x="18" y="148" fill="#38bdf8" fontSize="11" fontWeight="700">Start</text>

            {/* START -> SRC_VAL */}
            <line x1="70" y1="160" x2="220" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="98" y="140" width="94" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="145" y="153" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_SRC_IP</text>

            {/* SRC_VAL -> DST_VAL */}
            <line x1="220" y1="160" x2="370" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="248" y="140" width="94" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="295" y="153" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_DST_IP</text>

            {/* DST_VAL -> PROTO_VAL */}
            <line x1="370" y1="160" x2="520" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="390" y="112" width="105" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="442" y="125" fill="#a78bfa" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">PROTO_TCP / UDP</text>

            {/* DST_VAL -> ICMP_CLASS */}
            <line x1="370" y1="160" x2="520" y2="230" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="395" y="198" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="440" y="211" fill="#fbbf24" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">PROTO_ICMP</text>

            {/* PROTO_VAL -> PORT_VAL */}
            <line x1="520" y1="100" x2="670" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="550" y="80" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="595" y="93" fill="#c084fc" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_PORTS</text>

            {/* PORT_VAL -> TCP_CLASS */}
            <line x1="670" y1="100" x2="810" y2="65" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="698" y="58" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="743" y="71" fill="#06b6d4" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">DISPATCH_TCP</text>

            {/* PORT_VAL -> UDP_CLASS */}
            <line x1="670" y1="100" x2="810" y2="135" stroke="#64748b" strokeWidth="2" markerEnd="url(#dfa-arrow)" />
            <rect x="698" y="122" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="743" y="135" fill="#3b82f6" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">DISPATCH_UDP</text>

            {/* TCP_CLASS -> ACCEPTED */}
            <line x1="810" y1="65" x2="935" y2="160" stroke="#10b981" strokeWidth="2" markerEnd="url(#dfa-arrow-accept)" />

            {/* UDP_CLASS -> ACCEPTED */}
            <line x1="810" y1="135" x2="935" y2="160" stroke="#10b981" strokeWidth="2" markerEnd="url(#dfa-arrow-accept)" />

            {/* ICMP_CLASS -> ACCEPTED */}
            <path d="M 520 230 C 660 260, 800 240, 935 160" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#dfa-arrow-accept)" />
            <rect x="670" y="222" width="110" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="725" y="235" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">FINALIZE_ACCEPT</text>

            {/* Rejection dashed red curves to REJECTED (520, 370) */}
            <path d="M 70 186 Q 130 370 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#dfa-arrow-reject)" />
            <path d="M 220 186 Q 270 360 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#dfa-arrow-reject)" />
            <path d="M 370 186 Q 410 350 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#dfa-arrow-reject)" />
            <line x1="520" y1="126" x2="520" y2="345" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#dfa-arrow-reject)" />
            <path d="M 670 126 Q 640 330 545 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#dfa-arrow-reject)" />

            <text x="280" y="380" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">INVALID_INPUT (REJECT PATHS)</text>

            {/* REJECTED Trap Self Loop */}
            <path d="M 535 396 C 570 435, 470 435, 505 396" fill="none" stroke="#ef4444" strokeWidth="1.6" markerEnd="url(#dfa-arrow-reject)" />
            <text x="520" y="445" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">Any Input (Trap / Sink)</text>

            {/* State Circles */}
            {Object.entries(nodePositions).map(([key, node]) => {
              const isActive = activeNode === key;
              return (
                <g key={key} style={{ cursor: 'pointer' }} onClick={() => setActiveNode(key)}>
                  {/* Outer double circle for final state ACCEPTED */}
                  {node.isFinal && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="32"
                      fill="none"
                      stroke={isActive ? '#34d399' : '#10b981'}
                      strokeWidth="2.5"
                    />
                  )}
                  {/* Active Halo */}
                  {isActive && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.isFinal ? '38' : '32'}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      opacity="0.6"
                      filter="url(#dfa-glow)"
                    />
                  )}
                  {/* Main Node Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="26"
                    fill={isActive ? 'rgba(6, 182, 212, 0.35)' : '#0f172a'}
                    stroke={isActive ? '#38bdf8' : node.color}
                    strokeWidth={isActive ? '3' : '2'}
                  />
                  {/* Node Label Text */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {node.label.split(' ')[0]}
                  </text>
                  {/* Subtitle Under Node */}
                  <text
                    x={node.x}
                    y={node.y + 36}
                    fill={node.color}
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {node.isFinal ? 'FINAL (F)' : node.isTrap ? 'TRAP' : key === 'START' ? 'q0' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Active State Inspector Card */}
      <div className="card" style={{ borderLeft: `4px solid ${currentNodeInfo.color}` }}>
        <div className="card-header">
          <div className="card-title">
            <span>🔍 Inspected State: <span style={{ color: currentNodeInfo.color }}>{activeNode}</span></span>
          </div>
          <span className="badge badge-tcp">{currentNodeInfo.type}</span>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6 }}>
          {currentNodeInfo.desc}
        </div>
      </div>

      {/* Interactive Step-by-Step Automaton Simulator */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🎮 Interactive Step-by-Step Automaton Simulator</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isSimulating ? (
              <button className="btn btn-primary btn-sm" onClick={handleStartSim}>
                ▶ Start DFA Simulation
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleNextStep}
                  disabled={simIndex >= simSteps.length}
                >
                  ⏭ Next Step ({simIndex}/{simSteps.length})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleResetSim}>
                  ↺ Reset
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preset Sample Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">Load Predefined RFC 5737 Test Vector</label>
          <select
            className="form-control"
            value={selectedSample}
            onChange={e => handleSelectSample(e.target.value)}
            disabled={isSimulating}
          >
            {SAMPLE_VECTORS.map(s => (
              <option key={s.id} value={s.id}>{s.name} - ({s.category.toUpperCase()})</option>
            ))}
          </select>
        </div>

        {/* Input Parameters for Simulation */}
        <div className="form-grid" style={{ marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Source IP</label>
            <input
              type="text"
              className="form-control"
              value={simPacket.sourceIp}
              onChange={e => setSimPacket({ ...simPacket, sourceIp: e.target.value })}
              disabled={isSimulating}
            />
          </div>
          <div>
            <label className="form-label">Destination IP</label>
            <input
              type="text"
              className="form-control"
              value={simPacket.destinationIp}
              onChange={e => setSimPacket({ ...simPacket, destinationIp: e.target.value })}
              disabled={isSimulating}
            />
          </div>
          <div>
            <label className="form-label">Protocol</label>
            <select
              className="form-control"
              value={simPacket.protocol}
              onChange={e => setSimPacket({ ...simPacket, protocol: e.target.value })}
              disabled={isSimulating}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div>
            <label className="form-label">Source Port</label>
            <input
              type="text"
              className="form-control"
              value={simPacket.sourcePort}
              onChange={e => setSimPacket({ ...simPacket, sourcePort: e.target.value })}
              disabled={isSimulating || simPacket.protocol === 'ICMP'}
            />
          </div>
          <div>
            <label className="form-label">Destination Port</label>
            <input
              type="text"
              className="form-control"
              value={simPacket.destinationPort}
              onChange={e => setSimPacket({ ...simPacket, destinationPort: e.target.value })}
              disabled={isSimulating || simPacket.protocol === 'ICMP'}
            />
          </div>
        </div>

        {/* Live Step Tracker Box */}
        {isSimulating && currentStep && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginTop: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-tcp">Step {simIndex} of {simSteps.length}</span>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                δ({currentStep.fromState}, <span style={{ color: '#38bdf8' }}>{currentStep.inputSymbol}</span>) →{' '}
                <span style={{
                  color: currentStep.toState === 'ACCEPTED' ? '#34d399' :
                         currentStep.toState === 'REJECTED' ? '#f87171' : '#a855f7'
                }}>
                  {currentStep.toState}
                </span>
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              {currentStep.description}
            </div>

            {isSimComplete && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                borderRadius: '6px',
                background: activeNode === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${activeNode === 'ACCEPTED' ? '#10b981' : '#ef4444'}`,
                fontWeight: 700,
                fontSize: '0.9rem',
                color: activeNode === 'ACCEPTED' ? '#34d399' : '#f87171'
              }}>
                Automaton Execution Complete: {activeNode === 'ACCEPTED' ? '✓ PACKET OFFICIALLY ACCEPTED' : '✗ PACKET TRAPPED IN REJECTED STATE'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formal State Transition Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📋 State Transition Function: δ(q, a) → q&apos;</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${filterState === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterState('ALL')}
            >
              All ({TRANSITION_TABLE.length})
            </button>
            <button
              className={`btn btn-sm ${filterState === 'VALID' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterState('VALID')}
            >
              Valid Paths
            </button>
            <button
              className={`btn btn-sm ${filterState === 'INVALID' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterState('INVALID')}
            >
              Rejection Paths
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Current State (q)</th>
                <th>Input Symbol (a ∈ Σ)</th>
                <th>Next State δ(q, a)</th>
                <th>Operational Rule &amp; Constraint Verified</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransitions.map((t, idx) => (
                <tr key={idx}>
                  <td className="mono-cell" style={{ fontWeight: 600, color: '#38bdf8' }}>{t.from}</td>
                  <td className="mono-cell" style={{ color: t.type === 'valid' ? '#a78bfa' : '#f87171' }}>{t.input}</td>
                  <td className="mono-cell">
                    <span className={`badge ${t.to === 'ACCEPTED' ? 'badge-valid' : t.to === 'REJECTED' ? 'badge-invalid' : 'badge-tcp'}`}>
                      {t.to}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- State Transition Table View ---
function TransitionTableView() {
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [selectedState, setSelectedState] = useState('START');
  const [selectedSymbol, setSelectedSymbol] = useState('VALID_SRC_IP');

  const TRANSITIONS = [
    { from: 'START', input: 'VALID_SRC_IP', to: 'SOURCE_VALIDATION', type: 'valid', category: 'IPv4 Validation', rule: 'Source IP format valid and octets within [0–255]' },
    { from: 'START', input: 'INVALID_SRC_IP', to: 'REJECTED', type: 'invalid', category: 'Rejection Path', rule: 'Source IP malformed or octet exceeds 255' },
    { from: 'SOURCE_VALIDATION', input: 'VALID_DST_IP', to: 'DESTINATION_VALIDATION', type: 'valid', category: 'IPv4 Validation', rule: 'Destination IP format valid and octets within [0–255]' },
    { from: 'SOURCE_VALIDATION', input: 'INVALID_DST_IP', to: 'REJECTED', type: 'invalid', category: 'Rejection Path', rule: 'Destination IP malformed or octet exceeds 255' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_TCP', to: 'PROTOCOL_VALIDATION', type: 'valid', category: 'Protocol Analysis', rule: 'Protocol identified as TCP (RFC 793); port bounds validation required' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_UDP', to: 'PROTOCOL_VALIDATION', type: 'valid', category: 'Protocol Analysis', rule: 'Protocol identified as UDP (RFC 768); port bounds validation required' },
    { from: 'DESTINATION_VALIDATION', input: 'PROTO_ICMP', to: 'ICMP_CLASSIFIED', type: 'valid', category: 'RFC 792 Bypass', rule: 'Protocol identified as ICMP; transport ports bypassed per RFC 792' },
    { from: 'DESTINATION_VALIDATION', input: 'INVALID_PROTO', to: 'REJECTED', type: 'invalid', category: 'Rejection Path', rule: 'Protocol missing, unsupported, or unrecognized' },
    { from: 'PROTOCOL_VALIDATION', input: 'VALID_PORTS', to: 'PORT_VALIDATION', type: 'valid', category: 'Port Validation', rule: 'Source and Destination ports in valid integer range [1–65535]' },
    { from: 'PROTOCOL_VALIDATION', input: 'INVALID_PORTS', to: 'REJECTED', type: 'invalid', category: 'Rejection Path', rule: 'Port non-numeric or out of allowable range [1–65535]' },
    { from: 'PORT_VALIDATION', input: 'DISPATCH_TCP', to: 'TCP_CLASSIFIED', type: 'valid', category: 'Classification', rule: 'Packet confirmed as Transmission Control Protocol' },
    { from: 'PORT_VALIDATION', input: 'DISPATCH_UDP', to: 'UDP_CLASSIFIED', type: 'valid', category: 'Classification', rule: 'Packet confirmed as User Datagram Protocol' },
    { from: 'TCP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', category: 'Final Accept', rule: 'All validation criteria met; packet accepted as TCP_PACKET' },
    { from: 'UDP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', category: 'Final Accept', rule: 'All validation criteria met; packet accepted as UDP_PACKET' },
    { from: 'ICMP_CLASSIFIED', input: 'FINALIZE_ACCEPT', to: 'ACCEPTED', type: 'valid', category: 'Final Accept', rule: 'All validation criteria met; packet accepted as ICMP_PACKET' },
    { from: 'REJECTED', input: 'ANY_INPUT', to: 'REJECTED', type: 'trap', category: 'Sink State Loop', rule: 'Trap / Dead state: irreversible loop for all subsequent symbols' }
  ];

  const ALL_STATES = [
    'START',
    'SOURCE_VALIDATION',
    'DESTINATION_VALIDATION',
    'PROTOCOL_VALIDATION',
    'PORT_VALIDATION',
    'TCP_CLASSIFIED',
    'UDP_CLASSIFIED',
    'ICMP_CLASSIFIED',
    'ACCEPTED',
    'REJECTED'
  ];

  const ALL_SYMBOLS = [
    'VALID_SRC_IP',
    'INVALID_SRC_IP',
    'VALID_DST_IP',
    'INVALID_DST_IP',
    'PROTO_TCP',
    'PROTO_UDP',
    'PROTO_ICMP',
    'INVALID_PROTO',
    'VALID_PORTS',
    'INVALID_PORTS',
    'DISPATCH_TCP',
    'DISPATCH_UDP',
    'FINALIZE_ACCEPT',
    'ANY_INPUT'
  ];

  const getTransition = (state, symbol) => {
    if (state === 'REJECTED') {
      return { to: 'REJECTED', type: 'trap', rule: 'Trap state self-loop: packet remains trapped in REJECTED state' };
    }
    const found = TRANSITIONS.find(t => t.from === state && t.input === symbol);
    if (found) return found;
    return { to: 'REJECTED', type: 'invalid', rule: `Undefined transition from ${state} on symbol ${symbol}; routes to REJECTED` };
  };

  const currentEval = getTransition(selectedState, selectedSymbol);

  const filtered = TRANSITIONS.filter(t => {
    if (filterType === 'valid' && t.type !== 'valid') return false;
    if (filterType === 'invalid' && t.type !== 'invalid') return false;
    if (filterType === 'trap' && t.type !== 'trap') return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        t.from.toLowerCase().includes(q) ||
        t.input.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.rule.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const MATRIX_COLUMNS = [
    { key: 'VALID_SRC_IP', label: 'VALID_SRC' },
    { key: 'INVALID_SRC_IP', label: 'INV_SRC' },
    { key: 'VALID_DST_IP', label: 'VALID_DST' },
    { key: 'INVALID_DST_IP', label: 'INV_DST' },
    { key: 'PROTO_TCP', label: 'TCP' },
    { key: 'PROTO_UDP', label: 'UDP' },
    { key: 'PROTO_ICMP', label: 'ICMP' },
    { key: 'INVALID_PROTO', label: 'INV_PROTO' },
    { key: 'VALID_PORTS', label: 'PORTS_OK' },
    { key: 'INVALID_PORTS', label: 'PORTS_BAD' },
    { key: 'DISPATCH_TCP', label: 'DISP_TCP' },
    { key: 'DISPATCH_UDP', label: 'DISP_UDP' },
    { key: 'FINALIZE_ACCEPT', label: 'ACCEPT' },
    { key: 'ANY_INPUT', label: 'ANY' }
  ];

  return (
    <div>
      {/* Formal Definition Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📐 Formal Automaton Specification: M = (Q, Σ, q0, F, δ)</span>
          </div>
          <span className="badge badge-valid">10-STATE DETERMINISTIC FINITE AUTOMATON</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>States Q (|Q| = 10)</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem', marginTop: '0.25rem', wordBreak: 'break-word' }}>
              &#123; START, SOURCE_VALIDATION, DESTINATION_VALIDATION, PROTOCOL_VALIDATION, PORT_VALIDATION, TCP_CLASSIFIED, UDP_CLASSIFIED, ICMP_CLASSIFIED, ACCEPTED, REJECTED &#125;
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Initial (q0), Final (F) &amp; Trap States</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ color: '#60a5fa' }}>q0 = START</span> | <span style={{ color: '#34d399' }}>F = &#123; ACCEPTED &#125;</span> | <span style={{ color: '#f87171' }}>Trap = &#123; REJECTED &#125;</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Input Alphabet Σ (|Σ| = 13)</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#c084fc', fontSize: '0.75rem', marginTop: '0.25rem', wordBreak: 'break-word' }}>
              &#123; VALID_SRC_IP, INVALID_SRC_IP, VALID_DST_IP, INVALID_DST_IP, PROTO_TCP, PROTO_UDP, PROTO_ICMP, INVALID_PROTO, VALID_PORTS, INVALID_PORTS, DISPATCH_TCP, DISPATCH_UDP, FINALIZE_ACCEPT &#125;
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Live State-Input Evaluator */}
      <div className="card" style={{ borderLeft: '4px solid var(--cyan)' }}>
        <div className="card-header">
          <div className="card-title">
            <span>⚡ Interactive Transition Evaluator: δ(q, a) → q&apos;</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select any State and Symbol to evaluate transition</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="form-label">Current State (q ∈ Q)</label>
            <select
              className="form-control"
              value={selectedState}
              onChange={e => setSelectedState(e.target.value)}
            >
              {ALL_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Input Symbol (a ∈ Σ)</label>
            <select
              className="form-control"
              value={selectedSymbol}
              onChange={e => setSelectedSymbol(e.target.value)}
            >
              {ALL_SYMBOLS.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Evaluated Output Box */}
        <div style={{
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
              δ({selectedState}, <span style={{ color: '#38bdf8' }}>{selectedSymbol}</span>) →{' '}
              <span style={{
                color: currentEval.to === 'ACCEPTED' ? '#34d399' :
                       currentEval.to === 'REJECTED' ? '#f87171' : '#60a5fa'
              }}>
                {currentEval.to}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {currentEval.rule}
            </div>
          </div>
          <span className={`badge ${currentEval.type === 'valid' ? 'badge-valid' : currentEval.type === 'trap' ? 'badge-invalid' : 'badge-invalid'}`}>
            {currentEval.type === 'valid' ? '✓ ACCEPTING PATH' : currentEval.type === 'trap' ? '⚠ SINK TRAP LOOP' : '✗ REJECTION PATH'}
          </span>
        </div>
      </div>

      {/* Main State Transition Table Section */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="card-title">
            <span>📋 State Transition Function δ: Q × Σ → Q</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('table')}
            >
              📑 Audit Table View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('matrix')}
            >
              📐 2D Matrix Grid (Q × Σ)
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType('ALL')}
                >
                  All ({TRANSITIONS.length})
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType('valid')}
                >
                  Valid Paths (8)
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'invalid' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType('invalid')}
                >
                  Rejection Paths (7)
                </button>
                <button
                  className={`btn btn-sm ${filterType === 'trap' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterType('trap')}
                >
                  Trap Loop (1)
                </button>
              </div>

              <div style={{ minWidth: '220px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search state or rule..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}
                />
              </div>
            </div>

            {/* Transition Table */}
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Current State (q ∈ Q)</th>
                    <th>Input Symbol (a ∈ Σ)</th>
                    <th>Next State δ(q, a)</th>
                    <th>Path Type</th>
                    <th>Operational Verification Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, idx) => (
                    <tr key={idx}>
                      <td className="mono-cell" style={{ fontWeight: 600, color: '#38bdf8' }}>{t.from}</td>
                      <td className="mono-cell" style={{ color: t.type === 'valid' ? '#a78bfa' : '#f87171' }}>{t.input}</td>
                      <td className="mono-cell">
                        <span className={`badge ${t.to === 'ACCEPTED' ? 'badge-valid' : t.to === 'REJECTED' ? 'badge-invalid' : 'badge-tcp'}`}>
                          {t.to}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${t.type === 'valid' ? 'badge-valid' : 'badge-invalid'}`} style={{ fontSize: '0.68rem' }}>
                          {t.type === 'valid' ? 'ACCEPTING' : t.type === 'trap' ? 'SINK TRAP' : 'REJECTION'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.rule}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                        No transitions match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 2D Matrix Grid (Q x Sigma) */
          <div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Standard automata theory 2D state transition matrix mapping every state q ∈ Q (rows) against alphabet symbols a ∈ Σ (columns).
            </p>
            <div className="table-responsive">
              <table className="custom-table" style={{ fontSize: '0.72rem' }}>
                <thead>
                  <tr>
                    <th style={{ minWidth: '140px' }}>State (Q)</th>
                    {MATRIX_COLUMNS.map(col => (
                      <th key={col.key} style={{ textAlign: 'center', padding: '0.5rem 0.35rem' }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_STATES.map(st => (
                    <tr key={st}>
                      <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8', whiteSpace: 'nowrap' }}>{st}</td>
                      {MATRIX_COLUMNS.map(col => {
                        const tr = TRANSITIONS.find(t => t.from === st && t.input === col.key);
                        if (st === 'REJECTED') {
                          return (
                            <td key={col.key} style={{ textAlign: 'center', color: '#f87171', fontWeight: 600 }}>
                              REJECT
                            </td>
                          );
                        }
                        if (!tr) {
                          return (
                            <td key={col.key} style={{ textAlign: 'center', color: '#475569' }}>—</td>
                          );
                        }
                        return (
                          <td key={col.key} style={{
                            textAlign: 'center',
                            fontWeight: 700,
                            color: tr.to === 'ACCEPTED' ? '#34d399' : tr.to === 'REJECTED' ? '#f87171' : '#60a5fa'
                          }}>
                            {tr.to.replace('_VALIDATION', '_VAL').replace('_CLASSIFIED', '_CLS')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Protocol Pathways Comparison Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🔀 Protocol-Specific Transition Pathways</span>
          </div>
          <span className="badge badge-valid">RFC STANDARDS ALIGNMENT</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid var(--cyan)' }}>
            <div style={{ fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.5rem' }}>🌐 TCP Pathway (RFC 793)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.8 }}>
              START → SRC_VAL → DST_VAL → PROTO_VAL → PORT_VAL → TCP_CLASS → ACCEPTED
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Full 7-step sequence requiring 16-bit source and destination port validation.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid var(--blue)' }}>
            <div style={{ fontWeight: 700, color: 'var(--blue)', marginBottom: '0.5rem' }}>⚡ UDP Pathway (RFC 768)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.8 }}>
              START → SRC_VAL → DST_VAL → PROTO_VAL → PORT_VAL → UDP_CLASS → ACCEPTED
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Validates connectionless datagram ports and dispatches to UDP classifier.
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', borderTop: '3px solid var(--amber)' }}>
            <div style={{ fontWeight: 700, color: 'var(--amber)', marginBottom: '0.5rem' }}>📡 ICMP Pathway (RFC 792)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.8 }}>
              START → SRC_VAL → DST_VAL → ICMP_CLASS → ACCEPTED
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 600 }}>
              ★ Port check bypassed: Network layer control messages carry no transport ports.
            </div>
          </div>
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
