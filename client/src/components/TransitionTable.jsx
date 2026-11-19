import React, { useState } from 'react';

export default function TransitionTable() {
  const [filter, setFilter] = useState('ALL');

  const transitions = [
    {
      from: 'START',
      input: 'VALID_SRC_IP',
      to: 'SOURCE_VALIDATION',
      type: 'valid',
      desc: 'Source IP successfully verified with IPv4 regex and octet range checks [0-255].'
    },
    {
      from: 'START',
      input: 'INVALID_SRC_IP',
      to: 'REJECTED',
      type: 'invalid',
      desc: 'Source IP malformed, non-numeric octet, or octet out of bounds [0-255].'
    },
    {
      from: 'SOURCE_VALIDATION',
      input: 'VALID_DST_IP',
      to: 'DESTINATION_VALIDATION',
      type: 'valid',
      desc: 'Destination IP successfully verified with IPv4 regex and octet range checks [0-255].'
    },
    {
      from: 'SOURCE_VALIDATION',
      input: 'INVALID_DST_IP',
      to: 'REJECTED',
      type: 'invalid',
      desc: 'Destination IP malformed, non-numeric octet, or octet out of bounds [0-255].'
    },
    {
      from: 'DESTINATION_VALIDATION',
      input: 'PROTO_TCP',
      to: 'PROTOCOL_VALIDATION',
      type: 'valid',
      desc: 'Protocol identified as TCP. Transport layer port validation required next.'
    },
    {
      from: 'DESTINATION_VALIDATION',
      input: 'PROTO_UDP',
      to: 'PROTOCOL_VALIDATION',
      type: 'valid',
      desc: 'Protocol identified as UDP. Transport layer port validation required next.'
    },
    {
      from: 'DESTINATION_VALIDATION',
      input: 'PROTO_ICMP',
      to: 'ICMP_CLASSIFIED',
      type: 'valid',
      desc: 'Protocol identified as ICMP. RFC 792 network layer protocol: port verification bypassed.'
    },
    {
      from: 'DESTINATION_VALIDATION',
      input: 'INVALID_PROTO',
      to: 'REJECTED',
      type: 'invalid',
      desc: 'Protocol missing, unsupported, or unrecognized.'
    },
    {
      from: 'PROTOCOL_VALIDATION',
      input: 'VALID_PORTS',
      to: 'PORT_VALIDATION',
      type: 'valid',
      desc: 'Source & Destination ports verified as integers within allowable range [1-65535].'
    },
    {
      from: 'PROTOCOL_VALIDATION',
      input: 'INVALID_PORTS',
      to: 'REJECTED',
      type: 'invalid',
      desc: 'Source or Destination port missing, non-numeric, or outside valid range [1-65535].'
    },
    {
      from: 'PORT_VALIDATION',
      input: 'DISPATCH_TCP',
      to: 'TCP_CLASSIFIED',
      type: 'valid',
      desc: 'Ports confirmed. Automaton classifies packet as Transmission Control Protocol (TCP).'
    },
    {
      from: 'PORT_VALIDATION',
      input: 'DISPATCH_UDP',
      to: 'UDP_CLASSIFIED',
      type: 'valid',
      desc: 'Ports confirmed. Automaton classifies packet as User Datagram Protocol (UDP).'
    },
    {
      from: 'TCP_CLASSIFIED',
      input: 'FINALIZE_ACCEPT',
      to: 'ACCEPTED',
      type: 'valid',
      desc: 'All packet validation rules satisfied. Automaton reaches final accepting state F.'
    },
    {
      from: 'UDP_CLASSIFIED',
      input: 'FINALIZE_ACCEPT',
      to: 'ACCEPTED',
      type: 'valid',
      desc: 'All datagram validation rules satisfied. Automaton reaches final accepting state F.'
    },
    {
      from: 'ICMP_CLASSIFIED',
      input: 'FINALIZE_ACCEPT',
      to: 'ACCEPTED',
      type: 'valid',
      desc: 'All ICMP control message rules satisfied. Automaton reaches final accepting state F.'
    },
    {
      from: 'REJECTED',
      input: 'ANY_INPUT',
      to: 'REJECTED',
      type: 'invalid',
      desc: 'Trap / Dead state: once entered, automaton remains in REJECTED state for all subsequent symbols.'
    }
  ];

  const filtered = transitions.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'valid') return t.type === 'valid';
    if (filter === 'invalid') return t.type === 'invalid';
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span>📋 Formal DFA State Transition Table δ: Q × Σ → Q</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('ALL')}
          >
            All Transitions ({transitions.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('valid')}
          >
            Valid Paths
          </button>
          <button
            className={`btn btn-sm ${filter === 'invalid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('invalid')}
          >
            Rejection Paths
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Current State (q ∈ Q)</th>
              <th>Input / Event Symbol (σ ∈ Σ)</th>
              <th>Next State (δ(q, σ))</th>
              <th>Path Type</th>
              <th>Formal Explanation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => (
              <tr key={idx}>
                <td className="mono-cell" style={{ fontWeight: 600, color: '#38bdf8' }}>
                  {t.from}
                </td>
                <td className="mono-cell" style={{ color: '#a78bfa' }}>
                  {t.input}
                </td>
                <td className="mono-cell" style={{
                  fontWeight: 700,
                  color: t.to === 'ACCEPTED' ? '#34d399' : t.to === 'REJECTED' ? '#f87171' : '#60a5fa'
                }}>
                  {t.to}
                </td>
                <td>
                  <span className={`badge ${t.type === 'valid' ? 'badge-valid' : 'badge-invalid'}`}>
                    {t.type === 'valid' ? 'ACCEPTING PATH' : 'TRAP / SINK'}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {t.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
