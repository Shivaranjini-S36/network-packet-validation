/**
 * Full API & Validation Test Suite
 * Question No. 51 - Network Packet Format Validation and Classification System
 */

const assert = require('assert');
const {
  IPV4_REGEX,
  PORT_REGEX,
  PROTOCOL_REGEX,
  validateIPv4,
  validatePort,
  validatePacket
} = require('../validators/packetValidator');
const { runPacketDFA } = require('../automata/packetDFA');
const { SAMPLE_TEST_CASES } = require('../data/samplePackets');

console.log('====================================================');
console.log('🧪 RUNNING REGEX, VALIDATION & API TEST SUITE (Question 51)');
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

// 1. IPv4 Regular Expression Testing
it('IPV4_REGEX correctly validates standard IPv4 addresses', () => {
  const validIPs = [
    '0.0.0.0',
    '127.0.0.1',
    '192.168.1.1',
    '10.0.0.254',
    '172.16.254.1',
    '255.255.255.255',
    '192.0.2.1',
    '198.51.100.25',
    '203.0.113.200'
  ];
  for (const ip of validIPs) {
    assert.strictEqual(IPV4_REGEX.test(ip), true, `Should accept valid IP: ${ip}`);
  }
});

it('IPV4_REGEX rejects invalid IP octets and malformed addresses', () => {
  const invalidIPs = [
    '256.0.0.1',
    '192.168.1.300',
    '192.168.1',
    '192.168.1.1.1',
    'abc.def.ghi.jkl',
    '192.168.01.1', // leading zeros if not standard or handled
    '-1.0.0.0',
    '192.168.1.1/24',
    ''
  ];
  for (const ip of invalidIPs) {
    assert.strictEqual(validateIPv4(ip).isValid, false, `Should reject invalid IP: ${ip}`);
  }
});

// 2. Port Validation & Regular Expression Testing
it('PORT_REGEX and validatePort accept port integers 1-65535', () => {
  const validPorts = [1, 22, 53, 80, 443, 8080, 49152, 65535, '80', '443'];
  for (const port of validPorts) {
    const res = validatePort(port, 'Port');
    assert.strictEqual(res.isValid, true, `Should accept port: ${port}`);
  }
});

it('validatePort rejects out-of-range ports and non-numeric values', () => {
  const invalidPorts = [0, -1, 65536, 70000, 99999, 'abc', '', null, undefined];
  for (const port of invalidPorts) {
    const res = validatePort(port, 'Port');
    assert.strictEqual(res.isValid, false, `Should reject port: ${port}`);
  }
});

// 3. Protocol Validation
it('PROTOCOL_REGEX accepts TCP, UDP, ICMP (case-insensitive)', () => {
  assert.strictEqual(PROTOCOL_REGEX.test('TCP'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('tcp'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('UDP'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('udp'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('ICMP'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('icmp'), true);
  assert.strictEqual(PROTOCOL_REGEX.test('HTTP'), false);
  assert.strictEqual(PROTOCOL_REGEX.test('FTP'), false);
  assert.strictEqual(PROTOCOL_REGEX.test('UNKNOWN'), false);
});

// 4. ICMP Port Independence (RFC 792)
it('ICMP packets are valid without port numbers', () => {
  const icmpPacket = {
    sourceIp: '192.0.2.1',
    destinationIp: '203.0.113.1',
    protocol: 'ICMP',
    sourcePort: null,
    destinationPort: null
  };
  const res = validatePacket(icmpPacket);
  assert.strictEqual(res.isValid, true, 'ICMP without ports must be valid');
  assert.strictEqual(res.fieldValidations.portsValid, true, 'portsValid flag should be true for ICMP');
});

// 5. TCP/UDP Missing Port Rejection
it('TCP packets missing destinationPort are rejected', () => {
  const tcpPacket = {
    sourceIp: '192.0.2.10',
    destinationIp: '198.51.100.80',
    protocol: 'TCP',
    sourcePort: 49152,
    destinationPort: null
  };
  const res = validatePacket(tcpPacket);
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.some(e => e.includes('Destination Port')));
});

// 6. Test All 8 Predefined College Sample Cases
it('All 8 College Sample Test Cases evaluate to their exact expected results', () => {
  for (const sample of SAMPLE_TEST_CASES) {
    const valResult = validatePacket(sample.packet);
    const dfaResult = runPacketDFA(valResult);

    assert.strictEqual(
      valResult.isValid,
      sample.expectedResult.isValid,
      `Sample ${sample.name} validation validity mismatch`
    );
    assert.strictEqual(
      dfaResult.classification,
      sample.expectedResult.dfaClassification,
      `Sample ${sample.name} classification mismatch: expected ${sample.expectedResult.dfaClassification}, got ${dfaResult.classification}`
    );
    assert.strictEqual(
      dfaResult.finalState,
      sample.expectedResult.dfaFinalState,
      `Sample ${sample.name} DFA final state mismatch: expected ${sample.expectedResult.dfaFinalState}, got ${dfaResult.finalState}`
    );
  }
});

console.log('\n----------------------------------------------------');
console.log(`Validation & API Tests Completed: ${passedTests}/${totalTests} Passed.`);
console.log('----------------------------------------------------\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
