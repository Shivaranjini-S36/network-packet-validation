/**
 * Network Packet Validation Engine
 * Implements Regular Expressions and logical validation rules
 * Question No. 51 - Network Packet Format Validation and Classification System
 */

// Regular Expression for IPv4 Address Validation:
// Matches 4 octets separated by dots, each in the range 0 to 255.
// Octet pattern:
//   25[0-5]     -> 250 - 255
//   2[0-4][0-9] -> 200 - 249
//   1[0-9]{2}   -> 100 - 199
//   [1-9]?[0-9] -> 0 - 99
const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;

// Regular Expression for Port Format (positive digits only)
const PORT_REGEX = /^[0-9]+$/;

// Regular Expression for Protocol Validation (TCP, UDP, ICMP)
const PROTOCOL_REGEX = /^(TCP|UDP|ICMP)$/i;

/**
 * Validates an IPv4 address string using regex and logical octet verification.
 * @param {string} ip - The IP string to validate
 * @returns {object} { isValid: boolean, error?: string }
 */
function validateIPv4(ip) {
  if (typeof ip !== 'string') {
    return { isValid: false, error: 'IP address must be a string' };
  }

  const trimmed = ip.trim();
  if (!trimmed) {
    return { isValid: false, error: 'IP address cannot be empty' };
  }

  // 1. Regular expression test
  if (!IPV4_REGEX.test(trimmed)) {
    // Determine specific reason for informative feedback
    const parts = trimmed.split('.');
    if (parts.length !== 4) {
      return { isValid: false, error: `Malformed IP address: expected 4 octets, got ${parts.length}` };
    }
    for (let i = 0; i < parts.length; i++) {
      const octet = parts[i];
      if (!/^\d+$/.test(octet)) {
        return { isValid: false, error: `Octet ${i + 1} ('${octet}') contains non-numeric characters` };
      }
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { isValid: false, error: `Octet ${i + 1} (${num}) out of range (must be 0-255)` };
      }
    }
    return { isValid: false, error: 'Invalid IPv4 address format (e.g., must be 192.168.1.1)' };
  }

  // 2. Logical range verification on each octet
  const octets = trimmed.split('.').map(o => parseInt(o, 10));
  for (let i = 0; i < 4; i++) {
    if (octets[i] < 0 || octets[i] > 255 || isNaN(octets[i])) {
      return { isValid: false, error: `Octet ${i + 1} (${octets[i]}) is out of bounds [0, 255]` };
    }
  }

  return { isValid: true, sanitized: trimmed };
}

/**
 * Validates a port number string or number.
 * @param {string|number} port - Port to validate
 * @param {string} fieldName - 'Source Port' or 'Destination Port'
 * @returns {object} { isValid: boolean, error?: string, portNumber?: number }
 */
function validatePort(port, fieldName = 'Port') {
  if (port === undefined || port === null || port === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const portStr = String(port).trim();
  if (!PORT_REGEX.test(portStr)) {
    return { isValid: false, error: `${fieldName} must be an integer between 1 and 65535` };
  }

  const portNum = parseInt(portStr, 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return { isValid: false, error: `${fieldName} (${portNum}) is out of allowable range [1 - 65535]` };
  }

  return { isValid: true, portNumber: portNum };
}

/**
 * Validates a network packet record.
 * @param {object} packet - { sourceIp, destinationIp, protocol, sourcePort, destinationPort }
 * @returns {object} Validation result
 */
function validatePacket(packet) {
  const errors = [];
  const fieldValidations = {
    sourceIpValid: false,
    destinationIpValid: false,
    protocolValid: false,
    portsValid: false
  };

  if (!packet || typeof packet !== 'object') {
    return {
      isValid: false,
      errors: ['Packet record data payload is missing or invalid'],
      fieldValidations,
      cleanedData: null
    };
  }

  const rawSrc = typeof packet.sourceIp === 'string' ? packet.sourceIp.trim() : '';
  const rawDst = typeof packet.destinationIp === 'string' ? packet.destinationIp.trim() : '';
  const rawProto = typeof packet.protocol === 'string' ? packet.protocol.trim().toUpperCase() : '';

  // 1. Source IP Validation
  if (!rawSrc) {
    errors.push('Source IP address is required');
  } else {
    const srcCheck = validateIPv4(rawSrc);
    if (!srcCheck.isValid) {
      errors.push(`Source IP error: ${srcCheck.error}`);
    } else {
      fieldValidations.sourceIpValid = true;
    }
  }

  // 2. Destination IP Validation
  if (!rawDst) {
    errors.push('Destination IP address is required');
  } else {
    const dstCheck = validateIPv4(rawDst);
    if (!dstCheck.isValid) {
      errors.push(`Destination IP error: ${dstCheck.error}`);
    } else {
      fieldValidations.destinationIpValid = true;
    }
  }

  // 3. Protocol Validation
  if (!rawProto) {
    errors.push('Protocol is required (TCP, UDP, or ICMP)');
  } else if (!PROTOCOL_REGEX.test(rawProto)) {
    errors.push(`Invalid protocol '${rawProto}'. Only TCP, UDP, and ICMP are supported`);
  } else {
    fieldValidations.protocolValid = true;
  }

  // 4. Port Validation (Protocol dependent)
  let cleanedSrcPort = null;
  let cleanedDstPort = null;

  if (rawProto === 'ICMP') {
    // ICMP does not use TCP/UDP port numbers (RFC 792)
    // If ports are provided, we accept them as null/NA with an informative notice
    fieldValidations.portsValid = true;
    cleanedSrcPort = null;
    cleanedDstPort = null;
  } else if (rawProto === 'TCP' || rawProto === 'UDP') {
    // Both Source Port and Destination Port are required for TCP/UDP
    const srcPortCheck = validatePort(packet.sourcePort, 'Source Port');
    const dstPortCheck = validatePort(packet.destinationPort, 'Destination Port');

    if (!srcPortCheck.isValid) {
      errors.push(srcPortCheck.error);
    } else {
      cleanedSrcPort = srcPortCheck.portNumber;
    }

    if (!dstPortCheck.isValid) {
      errors.push(dstPortCheck.error);
    } else {
      cleanedDstPort = dstPortCheck.portNumber;
    }

    if (srcPortCheck.isValid && dstPortCheck.isValid) {
      fieldValidations.portsValid = true;
    }
  } else {
    // Unknown or missing protocol - port validation cannot succeed
    fieldValidations.portsValid = false;
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    fieldValidations,
    cleanedData: {
      sourceIp: rawSrc,
      destinationIp: rawDst,
      protocol: rawProto || 'UNKNOWN',
      sourcePort: cleanedSrcPort,
      destinationPort: cleanedDstPort
    }
  };
}

module.exports = {
  IPV4_REGEX,
  PORT_REGEX,
  PROTOCOL_REGEX,
  validateIPv4,
  validatePort,
  validatePacket
};
