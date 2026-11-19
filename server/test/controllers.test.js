/**
 * Controller & Integration Unit Test Suite
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Tests controllers in-process with mock Request & Response objects.
 * Requires zero external TCP sockets, enabling 100% deterministic local execution.
 */

const assert = require('assert');
const packetController = require('../controllers/packetController');

console.log('====================================================');
console.log('🧪 RUNNING IN-PROCESS CONTROLLER INTEGRATION TESTS');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function test(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message || err}`);
  }
}

async function run() {
  // 1. Automata Definition
  await test('getAutomataDefinition returns complete 5-tuple specification', async () => {
    const req = {};
    const res = createMockRes();
    await packetController.getAutomataDefinition(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.automata.formalDefinition, 'M = (Q, Σ, q0, F, δ)');
    assert.strictEqual(res.data.automata.states.length, 10);
    assert.strictEqual(res.data.automata.initialState, 'START');
    assert.deepStrictEqual(res.data.automata.finalStates, ['ACCEPTED']);
  });

  // 2. Dashboard Statistics
  await test('getDashboardStats computes dynamic totals and protocol counts', async () => {
    const req = {};
    const res = createMockRes();
    await packetController.getDashboardStats(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(typeof res.data.stats.total === 'number');
    assert.ok(typeof res.data.stats.validCount === 'number');
    assert.ok(res.data.stats.protocolDistribution);
    assert.ok('TCP' in res.data.stats.protocolDistribution);
    assert.ok('UDP' in res.data.stats.protocolDistribution);
    assert.ok('ICMP' in res.data.stats.protocolDistribution);
  });

  // 3. Predefined Sample Packets List
  await test('getSamplePackets returns all 8 mandatory college test cases', async () => {
    const req = {};
    const res = createMockRes();
    packetController.getSamplePackets(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.total, 8);
    assert.strictEqual(res.data.samples.length, 8);
    assert.strictEqual(res.data.samples[0].id, 'sample-1');
  });

  // 4. Test Sample 1 (Valid TCP)
  await test('testSamplePacket executes Sample 1 and verifies ACCEPTED state', async () => {
    const req = { params: { id: 'sample-1' } };
    const res = createMockRes();
    await packetController.testSamplePacket(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.validationResult.isValid, true);
    assert.strictEqual(res.data.dfaResult.classification, 'TCP_PACKET');
    assert.strictEqual(res.data.dfaResult.finalState, 'ACCEPTED');
  });

  // 5. Test Sample 3 (Valid ICMP without ports per RFC 792)
  await test('testSamplePacket executes Sample 3 and verifies port bypass for ICMP', async () => {
    const req = { params: { id: 'sample-3' } };
    const res = createMockRes();
    await packetController.testSamplePacket(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.validationResult.isValid, true);
    assert.strictEqual(res.data.dfaResult.classification, 'ICMP_PACKET');
    assert.strictEqual(res.data.dfaResult.finalState, 'ACCEPTED');
    const states = res.data.dfaResult.stateTransitions.map(t => t.toState);
    assert.ok(!states.includes('PORT_VALIDATION'));
  });

  // 6. Test Sample 4 (Invalid Source IP 299)
  await test('testSamplePacket executes Sample 4 and enters REJECTED trap state', async () => {
    const req = { params: { id: 'sample-4' } };
    const res = createMockRes();
    await packetController.testSamplePacket(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.validationResult.isValid, false);
    assert.strictEqual(res.data.dfaResult.finalState, 'REJECTED');
  });

  // 7. Create Custom Valid UDP Packet
  let createdPkt = null;
  await test('createPacket ingests, validates, runs DFA, and stores record', async () => {
    const req = {
      body: {
        sourceIp: '198.51.100.33',
        destinationIp: '203.0.113.77',
        protocol: 'UDP',
        sourcePort: 5353,
        destinationPort: 53
      }
    };
    const res = createMockRes();
    await packetController.createPacket(req, res);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.packet.isValid, true);
    assert.strictEqual(res.data.dfaReport.classification, 'UDP_PACKET');
    assert.strictEqual(res.data.dfaReport.finalState, 'ACCEPTED');
    createdPkt = res.data.packet;
  });

  // 8. Retrieve All Packets with Search
  await test('getAllPackets retrieves stored records with search filtering', async () => {
    const req = { query: { search: createdPkt.packetId } };
    const res = createMockRes();
    await packetController.getAllPackets(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.packets.some(p => p.packetId === createdPkt.packetId));
  });

  // 9. Retrieve Packet by ID
  await test('getPacketById retrieves individual packet details and transitions', async () => {
    const req = { params: { id: createdPkt.packetId } };
    const res = createMockRes();
    await packetController.getPacketById(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.packet.packetId, createdPkt.packetId);
    assert.ok(res.data.packet.stateTransitions.length > 0);
  });

  // 10. Delete Packet Record
  await test('deletePacket deletes record from database', async () => {
    const req = { params: { id: createdPkt.packetId } };
    const res = createMockRes();
    await packetController.deletePacket(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);

    // Verify deletion
    const verifyReq = { params: { id: createdPkt.packetId } };
    const verifyRes = createMockRes();
    await packetController.getPacketById(verifyReq, verifyRes);
    assert.strictEqual(verifyRes.statusCode, 404);
  });

  console.log('\n----------------------------------------------------');
  console.log(`Controller Tests Completed: ${passed}/${total} Passed.`);
  console.log('----------------------------------------------------\n');

  if (passed !== total) process.exit(1);
  process.exit(0);
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
