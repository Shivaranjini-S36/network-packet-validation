import React, { useState } from 'react';
import { testSampleById } from '../services/api';

export default function SampleTester({ samples = [], onSampleExecuted, onLoadIntoForm }) {
  const [activeSampleResult, setActiveSampleResult] = useState(null);
  const [executingId, setExecutingId] = useState(null);

  const handleRunTest = async (sample) => {
    setExecutingId(sample.id);
    try {
      const res = await testSampleById(sample.id);
      if (res.success) {
        setActiveSampleResult(res);
        if (onSampleExecuted) onSampleExecuted(res.savedPacket);
      }
    } catch (err) {
      alert(`Error running sample test: ${err.message}`);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
        Click <strong>Run Live Test</strong> to execute validation and DFA classification through the backend API,
        or click <strong>Load into Form</strong> to inspect or edit the test vector in the packet input interface.
      </div>

      <div className="sample-grid">
        {samples.map((s) => {
          const isTesting = executingId === s.id;
          return (
            <div key={s.id} className={`sample-card ${s.category}`}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#fff' }}>{s.name}</h3>
                  <span className={`badge ${s.category === 'valid' ? 'badge-valid' : 'badge-invalid'}`}>
                    {s.category.toUpperCase()}
                  </span>
                </div>
                <p style={{ fontSize: '0.785rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                  {s.description}
                </p>

                <div className="sample-packet-code">
                  <div><strong>src:</strong> {s.packet.sourceIp || '""'}</div>
                  <div><strong>dst:</strong> {s.packet.destinationIp || '""'}</div>
                  <div><strong>proto:</strong> {s.packet.protocol || '""'}</div>
                  <div><strong>srcPort:</strong> {s.packet.sourcePort ?? 'null'}</div>
                  <div><strong>dstPort:</strong> {s.packet.destinationPort ?? 'null'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleRunTest(s)}
                  disabled={isTesting}
                >
                  {isTesting ? 'Running...' : '⚡ Run Live Test'}
                </button>
                {onLoadIntoForm && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onLoadIntoForm(s.packet)}
                    title="Load into Packet Form"
                  >
                    📝 Load Form
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Execution Results View */}
      {activeSampleResult && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>📊 Sample Test Execution Output: {activeSampleResult.sampleCase?.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${activeSampleResult.validationResult?.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                {activeSampleResult.validationResult?.isValid ? 'VALID' : 'INVALID'}
              </span>
              <span className="badge badge-tcp">
                {activeSampleResult.dfaResult?.classification}
              </span>
              <span className="badge" style={{ background: '#334155' }}>
                State: {activeSampleResult.dfaResult?.finalState}
              </span>
            </div>
          </div>

          {/* Validation Errors */}
          {activeSampleResult.validationResult?.errors?.length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', marginBottom: '0.35rem' }}>
                Validation Errors Detected ({activeSampleResult.validationResult.errors.length}):
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.785rem', color: '#fca5a5' }}>
                {activeSampleResult.validationResult.errors.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* DFA Transitions */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
              DFA State Transition Trace ({activeSampleResult.dfaResult?.stateTransitions?.length} steps)
            </div>
            <div className="dfa-timeline">
              {activeSampleResult.dfaResult?.stateTransitions?.map((step, idx) => (
                <div key={idx} className="dfa-step-card active">
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
        </div>
      )}
    </div>
  );
}
