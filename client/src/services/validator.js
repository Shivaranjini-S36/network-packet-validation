/**
 * Client-Side Regular Expressions & Range Validators
 * Question No. 51 - Network Packet Format Validation and Classification System
 */

export const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
export const PORT_REGEX = /^[0-9]+$/;
export const PROTOCOL_REGEX = /^(TCP|UDP|ICMP)$/i;

export function validateClientIPv4(ip) {
  if (typeof ip !== 'string') return { isValid: false, error: 'Must be a string' };
  const trimmed = ip.trim();
  if (!trimmed) return { isValid: false, error: 'IP address is required' };

  if (!IPV4_REGEX.test(trimmed)) {
    const parts = trimmed.split('.');
    if (parts.length !== 4) {
      return { isValid: false, error: `Malformed: expected 4 octets, found ${parts.length}` };
    }
    for (let i = 0; i < parts.length; i++) {
      const octet = parts[i];
      if (!/^\d+$/.test(octet)) {
        return { isValid: false, error: `Octet ${i + 1} contains non-numeric character` };
      }
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return { isValid: false, error: `Octet ${i + 1} (${num}) out of range [0-255]` };
      }
    }
    return { isValid: false, error: 'Invalid IPv4 address format' };
  }

  return { isValid: true, sanitized: trimmed };
}

export function validateClientPort(port, fieldName = 'Port') {
  if (port === undefined || port === null || port === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const str = String(port).trim();
  if (!PORT_REGEX.test(str)) {
    return { isValid: false, error: `${fieldName} must be an integer` };
  }

  const num = parseInt(str, 10);
  if (num < 1 || num > 65535) {
    return { isValid: false, error: `${fieldName} (${num}) out of range [1-65535]` };
  }

  return { isValid: true, portNumber: num };
}

export function validateClientPacket(form) {
  const errors = {};
  const srcCheck = validateClientIPv4(form.sourceIp || '');
  if (!srcCheck.isValid) errors.sourceIp = srcCheck.error;

  const dstCheck = validateClientIPv4(form.destinationIp || '');
  if (!dstCheck.isValid) errors.destinationIp = dstCheck.error;

  const proto = (form.protocol || '').trim().toUpperCase();
  if (!proto) {
    errors.protocol = 'Protocol is required (TCP, UDP, ICMP)';
  } else if (!PROTOCOL_REGEX.test(proto)) {
    errors.protocol = `Invalid protocol '${proto}'. Choose TCP, UDP, or ICMP`;
  }

  if (proto === 'TCP' || proto === 'UDP') {
    const srcPortCheck = validateClientPort(form.sourcePort, 'Source Port');
    if (!srcPortCheck.isValid) errors.sourcePort = srcPortCheck.error;

    const dstPortCheck = validateClientPort(form.destinationPort, 'Destination Port');
    if (!dstPortCheck.isValid) errors.destinationPort = dstPortCheck.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
