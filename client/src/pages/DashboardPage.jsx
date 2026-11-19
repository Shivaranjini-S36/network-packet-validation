import React from 'react';
import DashboardStats from '../components/DashboardStats';

export default function DashboardPage({ stats, onNavigate, onInspectPacket }) {
  if (!stats) {
    return <div style={{ color: '#94a3b8', padding: '2rem' }}>Loading dashboard metrics...</div>;
  }

  const total = stats.total || 0;
  const tcp = stats.protocolDistribution?.TCP || 0;
  const udp = stats.protocolDistribution?.UDP || 0;
  const icmp = stats.protocolDistribution?.ICMP || 0;

  const tcpPct = total > 0 ? ((tcp / total) * 100).toFixed(1) : 0;
  const udpPct = total > 0 ? ((udp / total) * 100).toFixed(1) : 0;
  const icmpPct = total > 0 ? ((icmp / total) * 100).toFixed(1) : 0;

  const validCount = stats.validCount || 0;
  const invalidCount = stats.invalidCount || 0;
  const passRate = stats.validationPassRate || 0;

  return (
    <div>
      {/* 6 Key Stat Cards */}
      <DashboardStats stats={stats} />

      {/* Two Columns: Protocol Distribution & Validation Ratios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Protocol Distribution Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <span>🌐 Protocol Distribution</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Dynamic MongoDB Count</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* TCP Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>TCP (Transmission Control Protocol)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{tcp} pkts ({tcpPct}%)</span>
              </div>
              <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${tcpPct}%`, height: '100%', background: 'var(--cyan)' }}></div>
              </div>
            </div>

            {/* UDP Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--blue)', fontWeight: 600 }}>UDP (User Datagram Protocol)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{udp} pkts ({udpPct}%)</span>
              </div>
              <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${udpPct}%`, height: '100%', background: 'var(--blue)' }}></div>
              </div>
            </div>

            {/* ICMP Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--amber)', fontWeight: 600 }}>ICMP (Internet Control Message Protocol)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{icmp} pkts ({icmpPct}%)</span>
              </div>
              <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${icmpPct}%`, height: '100%', background: 'var(--amber)' }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('add-packet')}>
              ➕ Ingest Packet
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('records')}>
              📋 View All Records
            </button>
          </div>
        </div>

        {/* Validation Statistics Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <span>🛡️ Validation &amp; DFA Accuracy</span>
            </div>
            <span className="badge badge-valid">{passRate}% Pass Rate</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: `conic-gradient(var(--green) ${passRate * 3.6}deg, var(--red) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)'
              }}>
                {passRate}%
              </div>
            </div>

            <div style={{ flex: 1, fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Valid Accepted Packets:</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>{validCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Rejected (Trap State):</span>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>{invalidCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Total Processed:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{total}</span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.785rem', color: '#94a3b8', lineHeight: 1.4 }}>
            Input packets undergo real-time IPv4 octet bounds checks [0-255], protocol validation, and port range checks [1-65535]. Only structurally sound packets transit to the <code>ACCEPTED</code> state in the DFA.
          </p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>⚡ Recent Packet Ingest Activity</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('records')}>
            Full Audit Table →
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Packet ID</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Ports (Src → Dst)</th>
                <th>Status</th>
                <th>DFA Classification</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity?.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                    No packet records in database. Use 'Add Packet' or 'Sample Testing' to ingest records.
                  </td>
                </tr>
              ) : (
                stats.recentActivity?.map(p => (
                  <tr key={p._id || p.packetId}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {p.packetId}
                    </td>
                    <td className="mono-cell">{p.sourceIp}</td>
                    <td className="mono-cell">{p.destinationIp}</td>
                    <td>
                      <span className={`badge badge-${p.protocol?.toLowerCase()}`}>
                        {p.protocol}
                      </span>
                    </td>
                    <td className="mono-cell" style={{ fontSize: '0.8rem' }}>
                      {p.protocol === 'ICMP' ? '— (ICMP)' : `${p.sourcePort ?? '—'} → ${p.destinationPort ?? '—'}`}
                    </td>
                    <td>
                      <span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                        {p.isValid ? 'VALID' : 'INVALID'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-tcp">{p.dfaClassification}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onInspectPacket(p)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
