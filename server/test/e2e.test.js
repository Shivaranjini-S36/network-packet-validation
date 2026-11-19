/**
 * End-to-End API Integration Test Suite
 * Question No. 51 - Network Packet Format Validation and Classification System
 */

const assert = require('assert');
const http = require('http');
const app = require('../server');

let server;
const PORT = 5051;
const BASE_HOST = '127.0.0.1';

console.log('====================================================');
console.log('🧪 RUNNING FULL END-TO-END HTTP API INTEGRATION TESTS');
console.log('====================================================\n');

function request(method, endpointPath, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE_HOST,
      port: PORT,
      path: endpointPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) req.write(postData);
    req.end();
  });
}

let passed = 0;
let total = 0;

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

async function runTests() {
  await new Promise((resolve) => {
    server = app.listen(PORT, BASE_HOST, () => {
      resolve();
    });
  });

  // 1. Health API
  await test('GET /api/health returns 200 and Question 51 metadata', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.strictEqual(res.body.question, 'Question No. 51');
    assert.ok(res.body.database);
  });

  // 2. Automata API
  await test('GET /api/automata returns formal DFA specification', async () => {
    const res = await request('GET', '/api/automata');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.automata.formalDefinition, 'M = (Q, Σ, q0, F, δ)');
    assert.strictEqual(res.body.automata.states.length, 10);
  });

  // 3. Stats API
  await test('GET /api/stats returns dynamic statistics', async () => {
    const res = await request('GET', '/api/stats');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.stats.total === 'number');
    assert.ok(typeof res.body.stats.validCount === 'number');
    assert.ok(res.body.stats.protocolDistribution);
  });

  // 4. Sample Packets API
  await test('GET /api/samples returns all 8 required sample vectors', async () => {
    const res = await request('GET', '/api/samples');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 8);
    assert.strictEqual(res.body.samples.length, 8);
  });

  // 5. Test Live Sample 1 (Valid TCP)
  await test('POST /api/samples/test/sample-1 executes and accepts TCP packet', async () => {
    const res = await request('POST', '/api/samples/test/sample-1');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.validationResult.isValid, true);
    assert.strictEqual(res.body.dfaResult.classification, 'TCP_PACKET');
    assert.strictEqual(res.body.dfaResult.finalState, 'ACCEPTED');
  });

  // 6. Test Live Sample 3 (Valid ICMP without ports)
  await test('POST /api/samples/test/sample-3 accepts ICMP without ports (RFC 792)', async () => {
    const res = await request('POST', '/api/samples/test/sample-3');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.validationResult.isValid, true);
    assert.strictEqual(res.body.dfaResult.classification, 'ICMP_PACKET');
    assert.strictEqual(res.body.dfaResult.finalState, 'ACCEPTED');
  });

  // 7. Test Live Sample 4 (Invalid Source IP 299)
  await test('POST /api/samples/test/sample-4 rejects invalid source IP to trap state', async () => {
    const res = await request('POST', '/api/samples/test/sample-4');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.validationResult.isValid, false);
    assert.strictEqual(res.body.dfaResult.finalState, 'REJECTED');
  });

  // 8. Custom Ingestion: Valid UDP Packet
  let createdPktId = null;
  await test('POST /api/packets creates, validates, and stores custom packet', async () => {
    const payload = {
      sourceIp: '198.51.100.22',
      destinationIp: '203.0.113.88',
      protocol: 'UDP',
      sourcePort: 1024,
      destinationPort: 53
    };
    const res = await request('POST', '/api/packets', payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.packet.isValid, true);
    assert.strictEqual(res.body.dfaReport.classification, 'UDP_PACKET');
    assert.strictEqual(res.body.dfaReport.finalState, 'ACCEPTED');
    createdPktId = res.body.packet.packetId;
  });

  // 9. Search Packets
  await test('GET /api/packets supports query search and filtering', async () => {
    const res = await request('GET', `/api/packets?search=${createdPktId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.packets.length, 1);
    assert.strictEqual(res.body.packets[0].packetId, createdPktId);
  });

  // 10. Delete Packet
  await test('DELETE /api/packets/:id removes packet record', async () => {
    const res = await request('DELETE', `/api/packets/${createdPktId}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  server.close();

  console.log('\n----------------------------------------------------');
  console.log(`E2E Integration Tests Completed: ${passed}/${total} Passed.`);
  console.log('----------------------------------------------------\n');

  if (passed !== total) process.exit(1);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error during E2E tests:', err);
  if (server) server.close();
  process.exit(1);
});
