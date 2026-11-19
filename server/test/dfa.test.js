/**
 * Deterministic Finite Automaton (DFA) Unit Test Suite
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Verifies formal language properties, state transitions, determinism, and classification.
 */

const assert = require('assert');
const {
  DFA_STATES,
  INPUT_SYMBOLS,
  TRANSITION_TABLE,
  runPacketDFA,
  getFormalDFADefinition
} = require('../automata/packetDFA');
const { validatePacket } = require('../validators/packetValidator');

console.log('====================================================');
console.log('🧪 RUNNING DFA AUTOMATA ENGINE TEST SUITE (Question 51)');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// 1. Formal Definition Verification
it('DFA Formal Tuple M = (Q, Σ, q0, F, δ) is complete', () => {
  const formal = getFormalDFADefinition();
  assert.strictEqual(formal.initialState, DFA_STATES.START, 'Initial state must be START (q0)');
  assert.deepStrictEqual(formal.finalStates, [DFA_STATES.ACCEPTED], 'Final state set F must contain ACCEPTED');
  assert.strictEqual(formal.trapState, DFA_STATES.REJECTED, 'Trap state must be REJECTED');
  assert.strictEqual(formal.states.length, 10, 'States set Q must contain 10 defined states');
  assert.ok(formal.inputAlphabet.length > 0, 'Alphabet Σ must contain defined symbols');
});

// 2. Determinism Verification
it('DFA Transition Table is strictly deterministic (at most 1 next state per symbol)', () => {
  for (const state of Object.keys(TRANSITION_TABLE)) {
    const transitions = TRANSITION_TABLE[state];
    for (const symbol of Object.keys(transitions)) {
      const target = transitions[symbol];
      assert.strictEqual(typeof target, 'string', `Transition δ(${state}, ${symbol}) must be a single deterministic state`);
      assert.ok(Object.values(DFA_STATES).includes(target), `Target state '${target}' must be in Q`);
    }
  }
});

// 3. Valid TCP Packet Transition Path
it('Valid TCP Packet transitions: START -> SOURCE_VALIDATION -> DESTINATION_VALIDATION -> PROTOCOL_VALIDATION -> PORT_VALIDATION -> TCP_CLASSIFIED -> ACCEPTED', () => {
  const sample = {
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: 49152,
    destinationPort: 80
  };
  const valResult = validatePacket(sample);
  assert.strictEqual(valResult.isValid, true, 'Packet should be valid');

  const dfaResult = runPacketDFA(valResult);
  assert.strictEqual(dfaResult.finalState, DFA_STATES.ACCEPTED, 'Final state must be ACCEPTED');
  assert.strictEqual(dfaResult.isAccepted, true, 'isAccepted flag must be true');
  assert.strictEqual(dfaResult.classification, 'TCP_PACKET', 'Classification must be TCP_PACKET');

  const states = dfaResult.stateTransitions.map(t => t.toState);
  assert.deepStrictEqual(states, [
    DFA_STATES.SOURCE_VALIDATION,
    DFA_STATES.DESTINATION_VALIDATION,
    DFA_STATES.PROTOCOL_VALIDATION,
    DFA_STATES.PORT_VALIDATION,
    DFA_STATES.TCP_CLASSIFIED,
    DFA_STATES.ACCEPTED
  ], 'Exact TCP state sequence must match specification');
});

// 4. Valid UDP Packet Transition Path
it('Valid UDP Packet transitions: START -> ... -> UDP_CLASSIFIED -> ACCEPTED', () => {
  const sample = {
    sourceIp: '198.51.100.15',
    destinationIp: '203.0.113.53',
    protocol: 'UDP',
    sourcePort: 53535,
    destinationPort: 53
  };
  const valResult = validatePacket(sample);
  const dfaResult = runPacketDFA(valResult);

  assert.strictEqual(dfaResult.finalState, DFA_STATES.ACCEPTED);
  assert.strictEqual(dfaResult.classification, 'UDP_PACKET');
  assert.ok(dfaResult.stateTransitions.some(t => t.toState === DFA_STATES.UDP_CLASSIFIED));
});

// 5. Valid ICMP Packet Transition Path (Bypasses Port Validation)
it('Valid ICMP Packet transitions: START -> ... -> ICMP_CLASSIFIED -> ACCEPTED (port check bypassed)', () => {
  const sample = {
    sourceIp: '192.0.2.1',
    destinationIp: '203.0.113.1',
    protocol: 'ICMP',
    sourcePort: null,
    destinationPort: null
  };
  const valResult = validatePacket(sample);
  assert.strictEqual(valResult.isValid, true);

  const dfaResult = runPacketDFA(valResult);
  assert.strictEqual(dfaResult.finalState, DFA_STATES.ACCEPTED);
  assert.strictEqual(dfaResult.classification, 'ICMP_PACKET');
  
  // Verify port validation state was bypassed
  const visitedStates = dfaResult.stateTransitions.map(t => t.toState);
  assert.ok(!visitedStates.includes(DFA_STATES.PORT_VALIDATION), 'ICMP must bypass PORT_VALIDATION state');
  assert.ok(visitedStates.includes(DFA_STATES.ICMP_CLASSIFIED), 'ICMP must reach ICMP_CLASSIFIED');
});

// 6. Invalid Source IP Rejection
it('Invalid Source IP triggers immediate transition to REJECTED trap state', () => {
  const sample = {
    sourceIp: '192.0.2.299', // 299 > 255
    destinationIp: '198.51.100.20',
    protocol: 'TCP',
    sourcePort: 12345,
    destinationPort: 443
  };
  const valResult = validatePacket(sample);
  assert.strictEqual(valResult.isValid, false);

  const dfaResult = runPacketDFA(valResult);
  assert.strictEqual(dfaResult.finalState, DFA_STATES.REJECTED);
  assert.strictEqual(dfaResult.isAccepted, false);
  assert.strictEqual(dfaResult.stateTransitions[0].toState, DFA_STATES.REJECTED);
});

// 7. Invalid Destination IP Rejection
it('Invalid Destination IP triggers transition to REJECTED from SOURCE_VALIDATION', () => {
  const sample = {
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.xyz',
    protocol: 'TCP',
    sourcePort: 12345,
    destinationPort: 443
  };
  const valResult = validatePacket(sample);
  assert.strictEqual(valResult.isValid, false);

  const dfaResult = runPacketDFA(valResult);
  assert.strictEqual(dfaResult.finalState, DFA_STATES.REJECTED);
  assert.strictEqual(dfaResult.stateTransitions[1].toState, DFA_STATES.REJECTED);
});

// 8. Invalid Port Rejection
it('Invalid Port triggers transition to REJECTED from PROTOCOL_VALIDATION', () => {
  const sample = {
    sourceIp: '192.0.2.50',
    destinationIp: '198.51.100.70',
    protocol: 'TCP',
    sourcePort: 80,
    destinationPort: 72000 // > 65535
  };
  const valResult = validatePacket(sample);
  assert.strictEqual(valResult.isValid, false);

  const dfaResult = runPacketDFA(valResult);
  assert.strictEqual(dfaResult.finalState, DFA_STATES.REJECTED);
  assert.strictEqual(dfaResult.isAccepted, false);
});

// 9. Missing Protocol Rejection
it('Missing Protocol triggers transition to REJECTED from DESTINATION_VALIDATION', () => {
  const sample = {
    sourceIp: '192.0.2.25',
    destinationIp: '203.0.113.40',
    protocol: '',
    sourcePort: 8080,
    destinationPort: 80
  };
  const valResult = validatePacket(sample);
  const dfaResult = runPacketDFA(valResult);

  assert.strictEqual(dfaResult.finalState, DFA_STATES.REJECTED);
  assert.strictEqual(dfaResult.classification, 'REJECTED_PACKET');
});

console.log('\n----------------------------------------------------');
console.log(`DFA Tests Completed: ${passedTests}/${totalTests} Passed.`);
console.log('----------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
