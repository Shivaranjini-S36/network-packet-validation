/**
 * Sample Network Packet Records
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Includes:
 * 1. Valid TCP packet
 * 2. Valid UDP packet
 * 3. Valid ICMP packet
 * 4. Invalid source IP
 * 5. Invalid destination IP
 * 6. Invalid port
 * 7. Missing protocol
 * 8. Malformed packet
 * 
 * Uses realistic reserved documentation IPv4 addresses (RFC 5737: 192.0.2.0/24,
 * 198.51.100.0/24, 203.0.113.0/24) and private subnets (RFC 1918: 192.168.0.0/16, 10.0.0.0/8).
 */

const SAMPLE_TEST_CASES = [
  {
    id: 'sample-1',
    name: '1. Valid TCP Packet (HTTP/Web)',
    category: 'valid',
    description: 'Standard HTTP web traffic packet with valid source/destination IPs and allowable ports.',
    packet: {
      sourceIp: '192.0.2.10',
      destinationIp: '198.51.100.80',
      protocol: 'TCP',
      sourcePort: 49152,
      destinationPort: 80
    },
    expectedResult: {
      isValid: true,
      dfaClassification: 'TCP_PACKET',
      dfaFinalState: 'ACCEPTED'
    }
  },
  {
    id: 'sample-2',
    name: '2. Valid UDP Packet (DNS Query)',
    category: 'valid',
    description: 'Standard DNS lookup datagram using UDP protocol with valid source/destination ports.',
    packet: {
      sourceIp: '198.51.100.15',
      destinationIp: '203.0.113.53',
      protocol: 'UDP',
      sourcePort: 53535,
      destinationPort: 53
    },
    expectedResult: {
      isValid: true,
      dfaClassification: 'UDP_PACKET',
      dfaFinalState: 'ACCEPTED'
    }
  },
  {
    id: 'sample-3',
    name: '3. Valid ICMP Packet (Ping/Echo)',
    category: 'valid',
    description: 'ICMP Echo Request (RFC 792). Network layer protocol; transport ports are omitted/null.',
    packet: {
      sourceIp: '192.0.2.1',
      destinationIp: '203.0.113.1',
      protocol: 'ICMP',
      sourcePort: null,
      destinationPort: null
    },
    expectedResult: {
      isValid: true,
      dfaClassification: 'ICMP_PACKET',
      dfaFinalState: 'ACCEPTED'
    }
  },
  {
    id: 'sample-4',
    name: '4. Invalid Source IP (Octet Out of Range)',
    category: 'invalid',
    description: 'Source IP contains octet value 299 which exceeds valid IPv4 8-bit octet range [0-255].',
    packet: {
      sourceIp: '192.0.2.299',
      destinationIp: '198.51.100.20',
      protocol: 'TCP',
      sourcePort: 12345,
      destinationPort: 443
    },
    expectedResult: {
      isValid: false,
      dfaClassification: 'REJECTED_PACKET',
      dfaFinalState: 'REJECTED'
    }
  },
  {
    id: 'sample-5',
    name: '5. Invalid Destination IP (Malformed / Non-numeric)',
    category: 'invalid',
    description: 'Destination IP contains non-numeric octet characters and incorrect format.',
    packet: {
      sourceIp: '192.0.2.55',
      destinationIp: '198.51.100.xyz',
      protocol: 'TCP',
      sourcePort: 45000,
      destinationPort: 8080
    },
    expectedResult: {
      isValid: false,
      dfaClassification: 'REJECTED_PACKET',
      dfaFinalState: 'REJECTED'
    }
  },
  {
    id: 'sample-6',
    name: '6. Invalid Port Number (Port Out of Range)',
    category: 'invalid',
    description: 'Destination port 72000 exceeds maximum allowable 16-bit integer port number (65535).',
    packet: {
      sourceIp: '192.0.2.50',
      destinationIp: '198.51.100.70',
      protocol: 'UDP',
      sourcePort: 4000,
      destinationPort: 72000
    },
    expectedResult: {
      isValid: false,
      dfaClassification: 'REJECTED_PACKET',
      dfaFinalState: 'REJECTED'
    }
  },
  {
    id: 'sample-7',
    name: '7. Missing / Unrecognized Protocol',
    category: 'invalid',
    description: 'Protocol field is missing or contains unsupported protocol type.',
    packet: {
      sourceIp: '192.0.2.25',
      destinationIp: '203.0.113.40',
      protocol: '',
      sourcePort: 8080,
      destinationPort: 80
    },
    expectedResult: {
      isValid: false,
      dfaClassification: 'REJECTED_PACKET',
      dfaFinalState: 'REJECTED'
    }
  },
  {
    id: 'sample-8',
    name: '8. Malformed Packet (Multiple Corrupted Fields)',
    category: 'invalid',
    description: 'Multiple syntax and structural violations across source IP, destination IP, protocol and ports.',
    packet: {
      sourceIp: '300.500.700.900',
      destinationIp: 'not-an-ip-address',
      protocol: 'INVALID_PROTO',
      sourcePort: -50,
      destinationPort: 999999
    },
    expectedResult: {
      isValid: false,
      dfaClassification: 'REJECTED_PACKET',
      dfaFinalState: 'REJECTED'
    }
  }
];

// Initial seed packets to populate dynamic dashboard statistics
const INITIAL_SEED_PACKETS = [
  {
    packetId: 'PKT-1001',
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: 49152,
    destinationPort: 80,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'TCP_PACKET',
    dfaFinalState: 'ACCEPTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1002',
    sourceIp: '198.51.100.15',
    destinationIp: '203.0.113.53',
    protocol: 'UDP',
    sourcePort: 53535,
    destinationPort: 53,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'UDP_PACKET',
    dfaFinalState: 'ACCEPTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1003',
    sourceIp: '192.0.2.1',
    destinationIp: '203.0.113.1',
    protocol: 'ICMP',
    sourcePort: null,
    destinationPort: null,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'ICMP_PACKET',
    dfaFinalState: 'ACCEPTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1004',
    sourceIp: '192.0.2.299',
    destinationIp: '198.51.100.20',
    protocol: 'TCP',
    sourcePort: 12345,
    destinationPort: 443,
    isValid: false,
    validationErrors: ['Source IP error: Octet 4 (299) out of range (must be 0-255)'],
    dfaClassification: 'REJECTED_PACKET',
    dfaFinalState: 'REJECTED',
    fieldValidations: { sourceIpValid: false, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1005',
    sourceIp: '10.0.0.4',
    destinationIp: '172.16.254.1',
    protocol: 'TCP',
    sourcePort: 3389,
    destinationPort: 3389,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'TCP_PACKET',
    dfaFinalState: 'ACCEPTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1006',
    sourceIp: '192.168.1.100',
    destinationIp: '192.168.1.1',
    protocol: 'UDP',
    sourcePort: 67,
    destinationPort: 68,
    isValid: true,
    validationErrors: [],
    dfaClassification: 'UDP_PACKET',
    dfaFinalState: 'ACCEPTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: true }
  },
  {
    packetId: 'PKT-1007',
    sourceIp: '192.0.2.50',
    destinationIp: '198.51.100.70',
    protocol: 'UDP',
    sourcePort: 4000,
    destinationPort: 72000,
    isValid: false,
    validationErrors: ['Destination Port (72000) is out of allowable range [1 - 65535]'],
    dfaClassification: 'REJECTED_PACKET',
    dfaFinalState: 'REJECTED',
    fieldValidations: { sourceIpValid: true, destinationIpValid: true, protocolValid: true, portsValid: false }
  }
];

module.exports = {
  SAMPLE_TEST_CASES,
  INITIAL_SEED_PACKETS
};
