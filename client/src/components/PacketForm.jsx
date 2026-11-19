import React, { useState } from 'react';
import { validateClientPacket } from '../services/validator';
import { submitPacket } from '../services/api';

export default function PacketForm({ onPacketAdded }) {
  const [formData, setFormData] = useState({
    sourceIp: '',
    destinationIp: '',
    protocol: 'TCP',
    sourcePort: '',
    destinationPort: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);
  const [latestReport, setLatestReport] = useState(null);

  const isIcmp = formData.protocol === 'ICMP';

  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // If user switches to ICMP, clear port fields
      if (field === 'protocol' && value === 'ICMP') {
        next.sourcePort = '';
        next.destinationPort = '';
      }
      return next;
    });

    // Clear specific field error
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleQuickFill = (preset) => {
    setFormData({
      sourceIp: preset.sourceIp || '',
      destinationIp: preset.destinationIp || '',
      protocol: preset.protocol || 'TCP',
      sourcePort: preset.sourcePort !== null && preset.sourcePort !== undefined ? String(preset.sourcePort) : '',
      destinationPort: preset.destinationPort !== null && preset.destinationPort !== undefined ? String(preset.destinationPort) : ''
    });
    setErrors({});
    setResultMessage(null);
    setLatestReport(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResultMessage(null);
    setLatestReport(null);

    // Cleaned payload with trimmed whitespace
    const cleaned = {
      sourceIp: formData.sourceIp.trim(),
      destinationIp: formData.destinationIp.trim(),
      protocol: formData.protocol.trim().toUpperCase(),
      sourcePort: isIcmp ? null : (formData.sourcePort.trim() !== '' ? Number(formData.sourcePort.trim()) : ''),
      destinationPort: isIcmp ? null : (formData.destinationPort.trim() !== '' ? Number(formData.destinationPort.trim()) : '')
    };

    // Client-side validation check
    const clientVal = validateClientPacket(cleaned);
    if (!clientVal.isValid) {
      setErrors(clientVal.errors);
      setResultMessage({
        type: 'error',
        text: 'Validation errors detected. Please review required fields.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPacket(cleaned);
      if (response.success) {
        setResultMessage({
          type: response.packet?.isValid ? 'success' : 'warning',
          text: response.message
        });
        setLatestReport(response);
        if (onPacketAdded) onPacketAdded(response.packet);
      } else {
        setResultMessage({
          type: 'error',
          text: response.message || 'Server rejected packet submission'
        });
      }
    } catch (err) {
      setResultMessage({
        type: 'error',
        text: `Network / Server request failed: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📡 Ingest Network Packet Record</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill({
                sourceIp: '192.0.2.10',
                destinationIp: '198.51.100.80',
                protocol: 'TCP',
                sourcePort: 49152,
                destinationPort: 80
              })}
            >
              Fill TCP
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill({
                sourceIp: '198.51.100.15',
                destinationIp: '203.0.113.53',
                protocol: 'UDP',
                sourcePort: 53535,
                destinationPort: 53
              })}
            >
              Fill UDP
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickFill({
                sourceIp: '192.0.2.1',
                destinationIp: '203.0.113.1',
                protocol: 'ICMP',
                sourcePort: null,
                destinationPort: null
              })}
            >
              Fill ICMP
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Protocol Selection Cards */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">
              <span>Transport / Network Protocol <span className="req">*</span></span>
              <span style={{ fontSize: '0.725rem', color: '#64748b' }}>RFC 791 / RFC 792 / RFC 793</span>
            </label>
            <div className="protocol-cards">
              {['TCP', 'UDP', 'ICMP'].map(proto => (
                <button
                  key={proto}
                  type="button"
                  className={`proto-btn ${formData.protocol === proto ? `active ${proto.toLowerCase()}` : ''}`}
                  onClick={() => handleChange('protocol', proto)}
                >
                  {proto === 'TCP' && '🌐 TCP'}
                  {proto === 'UDP' && '⚡ UDP'}
                  {proto === 'ICMP' && '📡 ICMP'}
                </button>
              ))}
            </div>
            {errors.protocol && <div className="error-msg">⚠️ {errors.protocol}</div>}
          </div>

          <div className="form-grid">
            {/* Source IP */}
            <div className="form-group">
              <label className="form-label">
                <span>Source IPv4 Address <span className="req">*</span></span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Octets: 0-255</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.sourceIp ? 'error' : ''}`}
                placeholder="e.g. 192.0.2.10"
                value={formData.sourceIp}
                onChange={(e) => handleChange('sourceIp', e.target.value)}
              />
              {errors.sourceIp && <div className="error-msg">⚠️ {errors.sourceIp}</div>}
            </div>

            {/* Destination IP */}
            <div className="form-group">
              <label className="form-label">
                <span>Destination IPv4 Address <span className="req">*</span></span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Octets: 0-255</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.destinationIp ? 'error' : ''}`}
                placeholder="e.g. 198.51.100.80"
                value={formData.destinationIp}
                onChange={(e) => handleChange('destinationIp', e.target.value)}
              />
              {errors.destinationIp && <div className="error-msg">⚠️ {errors.destinationIp}</div>}
            </div>

            {/* Source Port */}
            <div className="form-group">
              <label className="form-label">
                <span>Source Port {!isIcmp && <span className="req">*</span>}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {isIcmp ? 'Bypassed for ICMP' : 'Range: 1 - 65535'}
                </span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.sourcePort ? 'error' : ''}`}
                placeholder={isIcmp ? 'N/A (ICMP has no transport ports)' : 'e.g. 49152'}
                value={formData.sourcePort}
                disabled={isIcmp}
                onChange={(e) => handleChange('sourcePort', e.target.value)}
              />
              {errors.sourcePort && <div className="error-msg">⚠️ {errors.sourcePort}</div>}
            </div>

            {/* Destination Port */}
            <div className="form-group">
              <label className="form-label">
                <span>Destination Port {!isIcmp && <span className="req">*</span>}</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {isIcmp ? 'Bypassed for ICMP' : 'Range: 1 - 65535'}
                </span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.destinationPort ? 'error' : ''}`}
                placeholder={isIcmp ? 'N/A (ICMP has no transport ports)' : 'e.g. 80'}
                value={formData.destinationPort}
                disabled={isIcmp}
                onChange={(e) => handleChange('destinationPort', e.target.value)}
              />
              {errors.destinationPort && <div className="error-msg">⚠️ {errors.destinationPort}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFormData({
                  sourceIp: '',
                  destinationIp: '',
                  protocol: 'TCP',
                  sourcePort: '',
                  destinationPort: ''
                });
                setErrors({});
                setResultMessage(null);
                setLatestReport(null);
              }}
            >
              Clear
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Evaluating & Running DFA...' : 'Submit & Classify Packet'}
            </button>
          </div>
        </form>

        {resultMessage && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: resultMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' :
                         resultMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                resultMessage.type === 'success' ? 'rgba(16, 185, 129, 0.4)' :
                resultMessage.type === 'warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'
              }`,
              color: resultMessage.type === 'success' ? '#34d399' :
                     resultMessage.type === 'warning' ? '#fbbf24' : '#f87171',
              fontSize: '0.875rem'
            }}
          >
            {resultMessage.text}
          </div>
        )}
      </div>

      {/* DFA Execution Trace Report */}
      {latestReport && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>⚙️ DFA Execution Trace &amp; Classification</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className={`badge ${latestReport.packet?.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                {latestReport.packet?.isValid ? 'STATUS: VALID' : 'STATUS: INVALID'}
              </span>
              <span className="badge badge-tcp">
                {latestReport.dfaReport?.classification || 'REJECTED_PACKET'}
              </span>
              <span className="badge" style={{ background: '#334155' }}>
                Final State: {latestReport.dfaReport?.finalState}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Packet ID: <strong style={{ color: '#38bdf8' }}>{latestReport.packet?.packetId}</strong> | 
            Transitions Count: <strong>{latestReport.dfaReport?.transitionCount}</strong> | 
            Automaton Final Decision: 
            <strong style={{ color: latestReport.dfaReport?.isAccepted ? '#34d399' : '#f87171', marginLeft: '0.35rem' }}>
              {latestReport.dfaReport?.isAccepted ? 'ACCEPTED (F)' : 'REJECTED (Trap State)'}
            </strong>
          </div>

          <div className="dfa-timeline">
            {latestReport.dfaReport?.stateTransitions?.map((step, idx) => (
              <div key={idx} className="dfa-step-card active">
                <div className="dfa-step-num">{step.step}</div>
                <div className="dfa-step-content">
                  <div className="dfa-step-title">
                    <span style={{ color: '#94a3b8' }}>δ({step.fromState},</span>
                    <span style={{ color: '#38bdf8' }}>{step.inputSymbol}</span>
                    <span style={{ color: '#94a3b8' }}>) →</span>
                    <span style={{ color: step.toState === 'REJECTED' ? '#f87171' : step.toState === 'ACCEPTED' ? '#34d399' : '#a855f7', fontWeight: 700 }}>
                      {step.toState}
                    </span>
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
