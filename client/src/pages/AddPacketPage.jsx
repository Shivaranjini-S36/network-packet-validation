import React from 'react';
import PacketForm from '../components/PacketForm';

export default function AddPacketPage({ onPacketAdded, onNavigate }) {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Submit a network packet record containing Source IP, Destination IP, Protocol, and Port details.
          The backend will execute regular expressions and finite automata classification before persisting to MongoDB.
        </p>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('sample-testing')}>
          🧪 Load Sample Packets
        </button>
      </div>

      <PacketForm onPacketAdded={onPacketAdded} />

      {/* Field Validation Guidelines Card */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <div className="card-title">
            <span>📖 RFC Specifications &amp; Validation Constraints</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', fontSize: '0.825rem' }}>
          <div>
            <strong style={{ color: '#38bdf8' }}>IPv4 Address Rules (RFC 791):</strong>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              Must consist of 4 decimal octets separated by dots (e.g., <code>192.168.1.1</code>).
              Each octet must be an integer between <code>0</code> and <code>255</code>.
            </p>
          </div>
          <div>
            <strong style={{ color: '#a78bfa' }}>Transport Port Rules (RFC 793 / RFC 768):</strong>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              TCP and UDP require 16-bit positive integer port numbers in the range <code>[1, 65535]</code>.
              Common ports include <code>80</code> (HTTP), <code>443</code> (HTTPS), <code>53</code> (DNS).
            </p>
          </div>
          <div>
            <strong style={{ color: '#fbbf24' }}>ICMP Specification (RFC 792):</strong>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              Internet Control Message Protocol operates directly on the Network Layer (IP Protocol 1).
              ICMP packets do not use TCP/UDP port numbers; port validation is bypassed in the DFA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
