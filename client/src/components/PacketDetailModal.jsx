import React from 'react';

export default function PacketDetailModal({ packet, onClose }) {
  if (!packet) return null;

  const isIcmp = packet.protocol === 'ICMP';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📦</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: '#fff' }}>Packet Details: {packet.packetId}</h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Recorded: {new Date(packet.createdAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">×</button>
        </div>

        {/* Overview Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <span className={`badge ${packet.isValid ? 'badge-valid' : 'badge-invalid'}`}>
            {packet.isValid ? 'STATUS: VALID' : 'STATUS: INVALID'}
          </span>
          <span className={`badge badge-${packet.protocol?.toLowerCase()}`}>
            PROTOCOL: {packet.protocol}
          </span>
          <span className="badge badge-tcp">
            DFA: {packet.dfaClassification}
          </span>
          <span className="badge" style={{ background: '#1e293b', border: '1px solid #475569' }}>
            FINAL STATE: {packet.dfaFinalState}
          </span>
        </div>

        {/* Packet Fields Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.25rem'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SOURCE IP ADDRESS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#38bdf8' }}>
              {packet.sourceIp}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DESTINATION IP ADDRESS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#38bdf8' }}>
              {packet.destinationIp}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SOURCE PORT</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0' }}>
              {isIcmp ? 'N/A (ICMP - No Port)' : (packet.sourcePort || 'None')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>DESTINATION PORT</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0' }}>
              {isIcmp ? 'N/A (ICMP - No Port)' : (packet.destinationPort || 'None')}
            </div>
          </div>
        </div>

        {/* Validation Errors if any */}
        {packet.validationErrors && packet.validationErrors.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', marginBottom: '0.4rem' }}>
              Validation Failure Reasons ({packet.validationErrors.length})
            </div>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.775rem', color: '#fca5a5' }}>
              {packet.validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* DFA Execution Trace */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
            ⚙️ DFA State Transition History ({packet.stateTransitions?.length || 0} Steps)
          </div>
          <div className="dfa-timeline" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {packet.stateTransitions?.map((step, idx) => (
              <div key={idx} className="dfa-step-card">
                <div className="dfa-step-num">{step.step}</div>
                <div className="dfa-step-content">
                  <div className="dfa-step-title">
                    <span style={{ color: '#94a3b8' }}>δ({step.fromState},</span>
                    <span style={{ color: '#38bdf8' }}>{step.inputSymbol}</span>
                    <span style={{ color: '#94a3b8' }}>) →</span>
                    <span style={{
                      color: step.toState === 'REJECTED' ? '#f87171' :
                             step.toState === 'ACCEPTED' ? '#34d399' : '#a855f7',
                      fontWeight: 700
                    }}>
                      {step.toState}
                    </span>
                  </div>
                  <div className="dfa-step-desc">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
