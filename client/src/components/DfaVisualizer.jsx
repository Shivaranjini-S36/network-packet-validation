import React, { useState } from 'react';
import { validateClientPacket } from '../services/validator';

export default function DfaVisualizer({ automataInfo }) {
  const [simPacket, setSimPacket] = useState({
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: '49152',
    destinationPort: '80'
  });

  const [simSteps, setSimSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeNode, setActiveNode] = useState('START');
  const [isSimulating, setIsSimulating] = useState(false);

  // States layout coordinates for the SVG state transition diagram
  const nodePositions = {
    START: { x: 70, y: 160, label: 'START (q0)', color: '#38bdf8' },
    SOURCE_VALIDATION: { x: 220, y: 160, label: 'SRC_VAL', color: '#60a5fa' },
    DESTINATION_VALIDATION: { x: 370, y: 160, label: 'DST_VAL', color: '#818cf8' },
    PROTOCOL_VALIDATION: { x: 520, y: 100, label: 'PROTO_VAL', color: '#a78bfa' },
    ICMP_CLASSIFIED: { x: 520, y: 230, label: 'ICMP_CLASS', color: '#fbbf24' },
    PORT_VALIDATION: { x: 670, y: 100, label: 'PORT_VAL', color: '#c084fc' },
    TCP_CLASSIFIED: { x: 810, y: 65, label: 'TCP_CLASS', color: '#06b6d4' },
    UDP_CLASSIFIED: { x: 810, y: 135, label: 'UDP_CLASS', color: '#3b82f6' },
    ACCEPTED: { x: 935, y: 160, label: 'ACCEPTED (F)', color: '#34d399', isFinal: true },
    REJECTED: { x: 520, y: 370, label: 'REJECTED (Trap)', color: '#f87171', isTrap: true }
  };

  // Pre-generate steps for the current simulation packet
  const prepareSimulation = () => {
    // Run local validation to get steps
    const cleaned = {
      sourceIp: simPacket.sourceIp.trim(),
      destinationIp: simPacket.destinationIp.trim(),
      protocol: simPacket.protocol.trim().toUpperCase(),
      sourcePort: simPacket.protocol === 'ICMP' ? null : Number(simPacket.sourcePort),
      destinationPort: simPacket.protocol === 'ICMP' ? null : Number(simPacket.destinationPort)
    };

    const val = validateClientPacket(cleaned);
    const steps = [];

    // Step 1: Source IP
    if (!val.errors.sourceIp) {
      steps.push({
        from: 'START',
        symbol: 'VALID_SRC_IP',
        to: 'SOURCE_VALIDATION',
        desc: `Source IP '${cleaned.sourceIp}' matched IPv4 format and octet range [0-255].`
      });
    } else {
      steps.push({
        from: 'START',
        symbol: 'INVALID_SRC_IP',
        to: 'REJECTED',
        desc: `Source IP failed: ${val.errors.sourceIp}. Transiting to REJECTED trap state.`
      });
      return steps;
    }

    // Step 2: Destination IP
    if (!val.errors.destinationIp) {
      steps.push({
        from: 'SOURCE_VALIDATION',
        symbol: 'VALID_DST_IP',
        to: 'DESTINATION_VALIDATION',
        desc: `Destination IP '${cleaned.destinationIp}' matched IPv4 format and octet range [0-255].`
      });
    } else {
      steps.push({
        from: 'SOURCE_VALIDATION',
        symbol: 'INVALID_DST_IP',
        to: 'REJECTED',
        desc: `Destination IP failed: ${val.errors.destinationIp}. Transiting to REJECTED.`
      });
      return steps;
    }

    // Step 3: Protocol Evaluation
    if (cleaned.protocol === 'TCP') {
      steps.push({
        from: 'DESTINATION_VALIDATION',
        symbol: 'PROTO_TCP',
        to: 'PROTOCOL_VALIDATION',
        desc: 'Protocol recognized as TCP. Proceeding to port verification.'
      });
    } else if (cleaned.protocol === 'UDP') {
      steps.push({
        from: 'DESTINATION_VALIDATION',
        symbol: 'PROTO_UDP',
        to: 'PROTOCOL_VALIDATION',
        desc: 'Protocol recognized as UDP. Proceeding to port verification.'
      });
    } else if (cleaned.protocol === 'ICMP') {
      steps.push({
        from: 'DESTINATION_VALIDATION',
        symbol: 'PROTO_ICMP',
        to: 'ICMP_CLASSIFIED',
        desc: 'Protocol recognized as ICMP. Port verification bypassed (RFC 792).'
      });
      steps.push({
        from: 'ICMP_CLASSIFIED',
        symbol: 'FINALIZE_ACCEPT',
        to: 'ACCEPTED',
        desc: 'All packet constraints verified. Packet ACCEPTED as ICMP_PACKET.'
      });
      return steps;
    } else {
      steps.push({
        from: 'DESTINATION_VALIDATION',
        symbol: 'INVALID_PROTO',
        to: 'REJECTED',
        desc: `Unrecognized protocol '${cleaned.protocol}'. Transiting to REJECTED.`
      });
      return steps;
    }

    // Step 4: Ports Validation for TCP/UDP
    if (!val.errors.sourcePort && !val.errors.destinationPort) {
      steps.push({
        from: 'PROTOCOL_VALIDATION',
        symbol: 'VALID_PORTS',
        to: 'PORT_VALIDATION',
        desc: `Ports verified: src ${cleaned.sourcePort}, dst ${cleaned.destinationPort} within [1, 65535].`
      });
    } else {
      steps.push({
        from: 'PROTOCOL_VALIDATION',
        symbol: 'INVALID_PORTS',
        to: 'REJECTED',
        desc: `Port error: ${val.errors.sourcePort || val.errors.destinationPort}. Transiting to REJECTED.`
      });
      return steps;
    }

    // Step 5: Classification
    if (cleaned.protocol === 'TCP') {
      steps.push({
        from: 'PORT_VALIDATION',
        symbol: 'DISPATCH_TCP',
        to: 'TCP_CLASSIFIED',
        desc: 'Classified successfully as Transmission Control Protocol (TCP).'
      });
    } else {
      steps.push({
        from: 'PORT_VALIDATION',
        symbol: 'DISPATCH_UDP',
        to: 'UDP_CLASSIFIED',
        desc: 'Classified successfully as User Datagram Protocol (UDP).'
      });
    }

    // Step 6: Accept
    steps.push({
      from: cleaned.protocol === 'TCP' ? 'TCP_CLASSIFIED' : 'UDP_CLASSIFIED',
      symbol: 'FINALIZE_ACCEPT',
      to: 'ACCEPTED',
      desc: 'All packet criteria satisfied. Automaton reached ACCEPTED state.'
    });

    return steps;
  };

  const handleStartSimulation = () => {
    const steps = prepareSimulation();
    setSimSteps(steps);
    setCurrentStepIndex(0);
    setActiveNode('START');
    setIsSimulating(true);
  };

  const handleNextStep = () => {
    if (currentStepIndex < simSteps.length) {
      const step = simSteps[currentStepIndex];
      setActiveNode(step.to);
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleResetSim = () => {
    setActiveNode('START');
    setCurrentStepIndex(0);
    setIsSimulating(false);
  };

  const currentStepInfo = currentStepIndex > 0 ? simSteps[currentStepIndex - 1] : null;

  return (
    <div>
      {/* Formal Definition Banner */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>📐 Formal Automaton Definition M = (Q, Σ, q0, F, δ)</span>
          </div>
          <span className="badge badge-valid">DETERMINISTIC FINITE AUTOMATON (DFA)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Set of States (Q): |Q| = 10</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              &#123; START, SOURCE_VALIDATION, DESTINATION_VALIDATION, PROTOCOL_VALIDATION, PORT_VALIDATION, TCP_CLASSIFIED, UDP_CLASSIFIED, ICMP_CLASSIFIED, ACCEPTED, REJECTED &#125;
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Initial State (q0) &amp; Final States (F)</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ color: '#60a5fa' }}>q0 = START</span> | <span style={{ color: '#34d399' }}>F = &#123; ACCEPTED &#125;</span> | <span style={{ color: '#f87171' }}>Trap = &#123; REJECTED &#125;</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontWeight: 600 }}>Input Alphabet (Σ)</div>
            <div style={{ fontFamily: 'var(--font-mono)', color: '#c084fc', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              &#123; VALID_SRC_IP, INVALID_SRC_IP, VALID_DST_IP, INVALID_DST_IP, PROTO_TCP, PROTO_UDP, PROTO_ICMP, INVALID_PROTO, VALID_PORTS, INVALID_PORTS, DISPATCH_TCP, DISPATCH_UDP, FINALIZE_ACCEPT &#125;
            </div>
          </div>
        </div>
      </div>

      {/* Interactive State Diagram SVG */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🗺️ DFA State Transition Diagram</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Active Node: <strong style={{ color: nodePositions[activeNode]?.color }}>{activeNode}</strong>
            </span>
          </div>
        </div>

        <div className="dfa-diagram-box">
          <svg viewBox="0 0 1000 470" style={{ width: '100%', maxWidth: '1000px', height: 'auto', display: 'block', background: '#0a0f1d', borderRadius: '12px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4" />
              </marker>
              <marker id="arrow-reject" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker id="arrow-accept" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <filter id="dfa-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Initial state pointer */}
            <line x1="15" y1="160" x2="45" y2="160" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow-active)" />
            <text x="18" y="148" fill="#38bdf8" fontSize="11" fontWeight="700">Start</text>

            {/* Transitions between valid states */}
            {/* START -> SRC_VAL */}
            <line x1="70" y1="160" x2="220" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="98" y="140" width="94" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="145" y="153" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_SRC_IP</text>

            {/* SRC_VAL -> DST_VAL */}
            <line x1="220" y1="160" x2="370" y2="160" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="248" y="140" width="94" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="295" y="153" fill="#38bdf8" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_DST_IP</text>

            {/* DST_VAL -> PROTO_VAL (TCP/UDP) */}
            <line x1="370" y1="160" x2="520" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="390" y="112" width="105" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="442" y="125" fill="#a78bfa" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">PROTO_TCP / UDP</text>

            {/* DST_VAL -> ICMP_CLASS */}
            <line x1="370" y1="160" x2="520" y2="230" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="395" y="198" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="440" y="211" fill="#fbbf24" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">PROTO_ICMP</text>

            {/* PROTO_VAL -> PORT_VAL */}
            <line x1="520" y1="100" x2="670" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="550" y="80" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="595" y="93" fill="#c084fc" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">VALID_PORTS</text>

            {/* PORT_VAL -> TCP_CLASS */}
            <line x1="670" y1="100" x2="810" y2="65" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="698" y="58" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="743" y="71" fill="#06b6d4" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">DISPATCH_TCP</text>

            {/* PORT_VAL -> UDP_CLASS */}
            <line x1="670" y1="100" x2="810" y2="135" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
            <rect x="698" y="122" width="90" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="743" y="135" fill="#3b82f6" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">DISPATCH_UDP</text>

            {/* TCP_CLASS -> ACCEPTED */}
            <line x1="810" y1="65" x2="935" y2="160" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-accept)" />

            {/* UDP_CLASS -> ACCEPTED */}
            <line x1="810" y1="135" x2="935" y2="160" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-accept)" />

            {/* ICMP_CLASS -> ACCEPTED */}
            <path d="M 520 230 C 660 260, 800 240, 935 160" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-accept)" />
            <rect x="670" y="222" width="110" height="18" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1" />
            <text x="725" y="235" fill="#34d399" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">FINALIZE_ACCEPT</text>

            {/* Rejection transitions to REJECTED (Trap) */}
            <path d="M 70 186 Q 130 370 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#arrow-reject)" />
            <path d="M 220 186 Q 270 360 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#arrow-reject)" />
            <path d="M 370 186 Q 410 350 495 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#arrow-reject)" />
            <line x1="520" y1="126" x2="520" y2="345" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#arrow-reject)" />
            <path d="M 670 126 Q 640 330 545 370" fill="none" stroke="#ef4444" strokeWidth="1.3" strokeDasharray="4 4" markerEnd="url(#arrow-reject)" />

            <text x="280" y="380" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">INVALID_INPUT (REJECT PATHS)</text>

            {/* REJECTED self-loop (Trap state) */}
            <path d="M 535 396 C 570 435, 470 435, 505 396" fill="none" stroke="#ef4444" strokeWidth="1.6" markerEnd="url(#arrow-reject)" />
            <text x="520" y="445" fill="#f87171" fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">Any Input (Trap / Sink)</text>

            {/* State Circles */}
            {Object.entries(nodePositions).map(([stateKey, pos]) => {
              const isActive = activeNode === stateKey;
              return (
                <g key={stateKey} style={{ cursor: 'pointer' }} onClick={() => setActiveNode(stateKey)}>
                  {/* Outer circle for ACCEPTED (Final state) */}
                  {pos.isFinal && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="32"
                      fill="none"
                      stroke={isActive ? '#34d399' : '#10b981'}
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Active Halo */}
                  {isActive && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={pos.isFinal ? '38' : '32'}
                      fill="none"
                      stroke={pos.color}
                      strokeWidth="2"
                      opacity="0.6"
                      filter="url(#dfa-glow)"
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="26"
                    fill={isActive ? 'rgba(6, 182, 212, 0.35)' : '#0f172a'}
                    stroke={isActive ? '#38bdf8' : pos.color}
                    strokeWidth={isActive ? '3' : '2'}
                  />

                  {/* State text */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {pos.label.split(' ')[0]}
                  </text>

                  {/* Subtitle Under Node */}
                  <text
                    x={pos.x}
                    y={pos.y + 36}
                    fill={pos.color}
                    fontSize="8"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {pos.isFinal ? 'FINAL (F)' : pos.isTrap ? 'TRAP' : stateKey === 'START' ? 'q0' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Step-by-Step Packet Simulator */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>🎮 Interactive Step-by-Step Automaton Simulator</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isSimulating ? (
              <button className="btn btn-primary btn-sm" onClick={handleStartSimulation}>
                ▶ Start Simulation
              </button>
            ) : (
              <>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleNextStep}
                  disabled={currentStepIndex >= simSteps.length}
                >
                  ⏭ Next Step ({currentStepIndex}/{simSteps.length})
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleResetSim}>
                  ↺ Reset
                </button>
              </>
            )}
          </div>
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

        {/* Live Step Tracker */}
        {isSimulating && currentStepInfo && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            marginTop: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-tcp">Step {currentStepIndex} of {simSteps.length}</span>
              <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                δ({currentStepInfo.from}, <span style={{ color: '#38bdf8' }}>{currentStepInfo.symbol}</span>) →{' '}
                <span style={{
                  color: currentStepInfo.to === 'ACCEPTED' ? '#34d399' :
                         currentStepInfo.to === 'REJECTED' ? '#f87171' : '#a855f7'
                }}>
                  {currentStepInfo.to}
                </span>
              </span>
            </div>
            <div style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              {currentStepInfo.desc}
            </div>

            {currentStepIndex === simSteps.length && (
              <div style={{ marginTop: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
                Automaton Execution Complete:{' '}
                <span style={{ color: activeNode === 'ACCEPTED' ? '#34d399' : '#f87171' }}>
                  {activeNode === 'ACCEPTED' ? 'PACKET ACCEPTED' : 'PACKET REJECTED'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
