/**
 * Deterministic Finite Automaton (DFA) Engine
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Formal Definition:
 * M = (Q, Σ, q0, F, δ)
 * 
 * Q = {
 *   START,
 *   SOURCE_VALIDATION,
 *   DESTINATION_VALIDATION,
 *   PROTOCOL_VALIDATION,
 *   PORT_VALIDATION,
 *   TCP_CLASSIFIED,
 *   UDP_CLASSIFIED,
 *   ICMP_CLASSIFIED,
 *   ACCEPTED,
 *   REJECTED
 * }
 * 
 * Σ = {
 *   VALID_SRC_IP, INVALID_SRC_IP,
 *   VALID_DST_IP, INVALID_DST_IP,
 *   PROTO_TCP, PROTO_UDP, PROTO_ICMP, INVALID_PROTO,
 *   VALID_PORTS, INVALID_PORTS,
 *   DISPATCH_TCP, DISPATCH_UDP,
 *   FINALIZE_ACCEPT
 * }
 * 
 * q0 = START
 * F  = { ACCEPTED }
 */

const DFA_STATES = {
  START: 'START',
  SOURCE_VALIDATION: 'SOURCE_VALIDATION',
  DESTINATION_VALIDATION: 'DESTINATION_VALIDATION',
  PROTOCOL_VALIDATION: 'PROTOCOL_VALIDATION',
  PORT_VALIDATION: 'PORT_VALIDATION',
  TCP_CLASSIFIED: 'TCP_CLASSIFIED',
  UDP_CLASSIFIED: 'UDP_CLASSIFIED',
  ICMP_CLASSIFIED: 'ICMP_CLASSIFIED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

const INPUT_SYMBOLS = {
  VALID_SRC_IP: 'VALID_SRC_IP',
  INVALID_SRC_IP: 'INVALID_SRC_IP',
  VALID_DST_IP: 'VALID_DST_IP',
  INVALID_DST_IP: 'INVALID_DST_IP',
  PROTO_TCP: 'PROTO_TCP',
  PROTO_UDP: 'PROTO_UDP',
  PROTO_ICMP: 'PROTO_ICMP',
  INVALID_PROTO: 'INVALID_PROTO',
  VALID_PORTS: 'VALID_PORTS',
  INVALID_PORTS: 'INVALID_PORTS',
  DISPATCH_TCP: 'DISPATCH_TCP',
  DISPATCH_UDP: 'DISPATCH_UDP',
  FINALIZE_ACCEPT: 'FINALIZE_ACCEPT'
};

// Formal State Transition Table: δ(State, Symbol) -> NextState
const TRANSITION_TABLE = {
  [DFA_STATES.START]: {
    [INPUT_SYMBOLS.VALID_SRC_IP]: DFA_STATES.SOURCE_VALIDATION,
    [INPUT_SYMBOLS.INVALID_SRC_IP]: DFA_STATES.REJECTED
  },
  [DFA_STATES.SOURCE_VALIDATION]: {
    [INPUT_SYMBOLS.VALID_DST_IP]: DFA_STATES.DESTINATION_VALIDATION,
    [INPUT_SYMBOLS.INVALID_DST_IP]: DFA_STATES.REJECTED
  },
  [DFA_STATES.DESTINATION_VALIDATION]: {
    [INPUT_SYMBOLS.PROTO_TCP]: DFA_STATES.PROTOCOL_VALIDATION,
    [INPUT_SYMBOLS.PROTO_UDP]: DFA_STATES.PROTOCOL_VALIDATION,
    [INPUT_SYMBOLS.PROTO_ICMP]: DFA_STATES.ICMP_CLASSIFIED,
    [INPUT_SYMBOLS.INVALID_PROTO]: DFA_STATES.REJECTED
  },
  [DFA_STATES.PROTOCOL_VALIDATION]: {
    [INPUT_SYMBOLS.VALID_PORTS]: DFA_STATES.PORT_VALIDATION,
    [INPUT_SYMBOLS.INVALID_PORTS]: DFA_STATES.REJECTED
  },
  [DFA_STATES.PORT_VALIDATION]: {
    [INPUT_SYMBOLS.DISPATCH_TCP]: DFA_STATES.TCP_CLASSIFIED,
    [INPUT_SYMBOLS.DISPATCH_UDP]: DFA_STATES.UDP_CLASSIFIED
  },
  [DFA_STATES.TCP_CLASSIFIED]: {
    [INPUT_SYMBOLS.FINALIZE_ACCEPT]: DFA_STATES.ACCEPTED
  },
  [DFA_STATES.UDP_CLASSIFIED]: {
    [INPUT_SYMBOLS.FINALIZE_ACCEPT]: DFA_STATES.ACCEPTED
  },
  [DFA_STATES.ICMP_CLASSIFIED]: {
    [INPUT_SYMBOLS.FINALIZE_ACCEPT]: DFA_STATES.ACCEPTED
  },
  [DFA_STATES.ACCEPTED]: {},
  [DFA_STATES.REJECTED]: {} // Trap / Sink state (self-loop on any additional input)
};

// State Metadata for Educational & UI Visualization
const STATE_DETAILS = {
  [DFA_STATES.START]: {
    title: 'Initial State (q0)',
    type: 'initial',
    description: 'Initial resting state awaiting packet submission for sequential parsing.'
  },
  [DFA_STATES.SOURCE_VALIDATION]: {
    title: 'Source IP Verified',
    type: 'intermediate',
    description: 'Source IPv4 address format and octets verified successfully.'
  },
  [DFA_STATES.DESTINATION_VALIDATION]: {
    title: 'Destination IP Verified',
    type: 'intermediate',
    description: 'Destination IPv4 address format and octets verified successfully.'
  },
  [DFA_STATES.PROTOCOL_VALIDATION]: {
    title: 'Protocol Verified',
    type: 'intermediate',
    description: 'Transport layer protocol recognized (TCP or UDP), awaiting port verification.'
  },
  [DFA_STATES.PORT_VALIDATION]: {
    title: 'Port Numbers Verified',
    type: 'intermediate',
    description: 'Transport source and destination ports verified within valid range [1, 65535].'
  },
  [DFA_STATES.TCP_CLASSIFIED]: {
    title: 'TCP Protocol Classified',
    type: 'classification',
    description: 'Packet confirmed and classified as Transmission Control Protocol (TCP).'
  },
  [DFA_STATES.UDP_CLASSIFIED]: {
    title: 'UDP Protocol Classified',
    type: 'classification',
    description: 'Packet confirmed and classified as User Datagram Protocol (UDP).'
  },
  [DFA_STATES.ICMP_CLASSIFIED]: {
    title: 'ICMP Protocol Classified',
    type: 'classification',
    description: 'Packet confirmed as Internet Control Message Protocol (ICMP) network layer packet (no transport ports required).'
  },
  [DFA_STATES.ACCEPTED]: {
    title: 'Packet Accepted (Final State F)',
    type: 'accepting',
    description: 'Packet has satisfied all syntax and protocol rules and is accepted.'
  },
  [DFA_STATES.REJECTED]: {
    title: 'Packet Rejected (Trap State)',
    type: 'trap',
    description: 'Packet contains syntax, range, or protocol errors and was rejected.'
  }
};

/**
 * Executes the Deterministic Finite Automaton on validated packet data.
 * Records every state transition step with timestamp and description.
 * 
 * @param {object} validationResult - Result from packetValidator
 * @returns {object} Execution report { currentState, isAccepted, finalClassification, history }
 */
function runPacketDFA(validationResult) {
  const { isValid, errors, fieldValidations, cleanedData } = validationResult;
  const history = [];
  let currentState = DFA_STATES.START;
  let step = 1;

  function recordTransition(fromState, inputSymbol, toState, description) {
    history.push({
      step,
      fromState,
      inputSymbol,
      toState,
      description,
      timestamp: new Date()
    });
    currentState = toState;
    step++;
  }

  // Step 1: Validate Source IP
  if (fieldValidations.sourceIpValid) {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.VALID_SRC_IP,
      DFA_STATES.SOURCE_VALIDATION,
      `Source IP '${cleanedData.sourceIp}' matched IPv4 format and octet ranges [0-255].`
    );
  } else {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.INVALID_SRC_IP,
      DFA_STATES.REJECTED,
      `Source IP validation failed: ${errors[0] || 'Invalid format'}. Transited to REJECTED trap state.`
    );
    return buildDFAResult(currentState, history, 'REJECTED_PACKET');
  }

  // Step 2: Validate Destination IP
  if (fieldValidations.destinationIpValid) {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.VALID_DST_IP,
      DFA_STATES.DESTINATION_VALIDATION,
      `Destination IP '${cleanedData.destinationIp}' matched IPv4 format and octet ranges [0-255].`
    );
  } else {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.INVALID_DST_IP,
      DFA_STATES.REJECTED,
      `Destination IP validation failed: ${errors.find(e => e.includes('Destination')) || 'Invalid format'}. Transited to REJECTED.`
    );
    return buildDFAResult(currentState, history, 'REJECTED_PACKET');
  }

  // Step 3: Protocol Evaluation
  const proto = cleanedData.protocol;
  if (proto === 'TCP') {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.PROTO_TCP,
      DFA_STATES.PROTOCOL_VALIDATION,
      `Protocol evaluated as TCP. Transport layer port validation required.`
    );
  } else if (proto === 'UDP') {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.PROTO_UDP,
      DFA_STATES.PROTOCOL_VALIDATION,
      `Protocol evaluated as UDP. Transport layer port validation required.`
    );
  } else if (proto === 'ICMP') {
    // ICMP does not require port numbers (RFC 792)
    recordTransition(
      currentState,
      INPUT_SYMBOLS.PROTO_ICMP,
      DFA_STATES.ICMP_CLASSIFIED,
      `Protocol evaluated as ICMP (Network Layer, IP Protocol 1). Port validation bypassed.`
    );

    // Finalize ICMP to ACCEPTED
    recordTransition(
      currentState,
      INPUT_SYMBOLS.FINALIZE_ACCEPT,
      DFA_STATES.ACCEPTED,
      `All packet criteria verified. Packet officially ACCEPTED as ICMP_PACKET.`
    );

    return buildDFAResult(currentState, history, 'ICMP_PACKET');
  } else {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.INVALID_PROTO,
      DFA_STATES.REJECTED,
      `Protocol '${proto}' is unrecognized or invalid. Transited to REJECTED trap state.`
    );
    return buildDFAResult(currentState, history, 'REJECTED_PACKET');
  }

  // Step 4: Port Validation for TCP/UDP
  if (fieldValidations.portsValid) {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.VALID_PORTS,
      DFA_STATES.PORT_VALIDATION,
      `Ports verified: Source Port ${cleanedData.sourcePort}, Destination Port ${cleanedData.destinationPort} within allowable range [1-65535].`
    );
  } else {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.INVALID_PORTS,
      DFA_STATES.REJECTED,
      `Port validation failed: ${errors.find(e => e.includes('Port')) || 'Invalid port values'}. Transited to REJECTED.`
    );
    return buildDFAResult(currentState, history, 'REJECTED_PACKET');
  }

  // Step 5: Protocol Classification Dispatch
  let classification = 'REJECTED_PACKET';
  if (proto === 'TCP') {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.DISPATCH_TCP,
      DFA_STATES.TCP_CLASSIFIED,
      `Packet successfully classified as TCP transmission.`
    );
    classification = 'TCP_PACKET';
  } else if (proto === 'UDP') {
    recordTransition(
      currentState,
      INPUT_SYMBOLS.DISPATCH_UDP,
      DFA_STATES.UDP_CLASSIFIED,
      `Packet successfully classified as UDP datagram.`
    );
    classification = 'UDP_PACKET';
  }

  // Step 6: Finalize Accept
  recordTransition(
    currentState,
    INPUT_SYMBOLS.FINALIZE_ACCEPT,
    DFA_STATES.ACCEPTED,
    `All validation rules and DFA transitions passed. Packet officially ACCEPTED.`
  );

  return buildDFAResult(currentState, history, classification);
}

function buildDFAResult(finalState, history, classification) {
  return {
    finalState,
    isAccepted: finalState === DFA_STATES.ACCEPTED,
    classification,
    stateTransitions: history,
    transitionCount: history.length
  };
}

/**
 * Returns the formal definition of the DFA for educational inspection and documentation.
 */
function getFormalDFADefinition() {
  return {
    formalDefinition: 'M = (Q, Σ, q0, F, δ)',
    states: Object.values(DFA_STATES),
    inputAlphabet: Object.values(INPUT_SYMBOLS),
    initialState: DFA_STATES.START,
    finalStates: [DFA_STATES.ACCEPTED],
    trapState: DFA_STATES.REJECTED,
    stateDetails: STATE_DETAILS,
    transitionTable: TRANSITION_TABLE
  };
}

module.exports = {
  DFA_STATES,
  INPUT_SYMBOLS,
  TRANSITION_TABLE,
  STATE_DETAILS,
  runPacketDFA,
  getFormalDFADefinition
};
