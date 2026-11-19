/**
 * Packet Controller
 * Question No. 51 - Network Packet Format Validation and Classification System
 * 
 * Handles CRUD operations, Regex Validation, DFA Execution, Dynamic Stats,
 * Searching, Filtering, Sample Packet Testing, and Fallback Persistence.
 */

const fs = require('fs');
const path = require('path');
const Packet = require('../models/Packet');
const { getStatus } = require('../config/db');
const { validatePacket } = require('../validators/packetValidator');
const { runPacketDFA, getFormalDFADefinition } = require('../automata/packetDFA');
const { SAMPLE_TEST_CASES, INITIAL_SEED_PACKETS } = require('../data/samplePackets');

const FALLBACK_FILE = path.join(__dirname, '..', 'data', 'fallbackPackets.json');

// --- Helper: Local Fallback File Persistence ---
function readFallbackPackets() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[Fallback Storage] Error reading fallback file:', err.message);
  }

  // If file doesn't exist or is empty, initialize with INITIAL_SEED_PACKETS
  const initialized = INITIAL_SEED_PACKETS.map(p => {
    const valResult = validatePacket(p);
    const dfaResult = runPacketDFA(valResult);
    return {
      _id: 'local_' + p.packetId.toLowerCase(),
      packetId: p.packetId,
      sourceIp: p.sourceIp,
      destinationIp: p.destinationIp,
      protocol: p.protocol,
      sourcePort: p.sourcePort,
      destinationPort: p.destinationPort,
      isValid: p.isValid,
      validationErrors: p.validationErrors || [],
      dfaClassification: dfaResult.classification,
      dfaFinalState: dfaResult.finalState,
      stateTransitions: dfaResult.stateTransitions,
      fieldValidations: valResult.fieldValidations,
      rawInput: p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  writeFallbackPackets(initialized);
  return initialized;
}

function writeFallbackPackets(packets) {
  try {
    const dir = path.dirname(FALLBACK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(packets, null, 2), 'utf8');
  } catch (err) {
    console.error('[Fallback Storage] Error writing fallback file:', err.message);
  }
}

/**
 * Generate unique sequential Packet ID (e.g. PKT-1008)
 */
async function generatePacketId() {
  const dbStatus = getStatus();
  if (dbStatus.connected) {
    try {
      const last = await Packet.findOne().sort({ createdAt: -1 });
      if (last && last.packetId && last.packetId.startsWith('PKT-')) {
        const num = parseInt(last.packetId.replace('PKT-', ''), 10);
        if (!isNaN(num)) return `PKT-${num + 1}`;
      }
    } catch (e) {
      // Fall through to local fallback
    }
  }

  const local = readFallbackPackets();
  const maxNum = local.reduce((max, p) => {
    const num = parseInt(String(p.packetId || '').replace('PKT-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1000);

  return `PKT-${maxNum + 1}`;
}

/**
 * POST /api/packets
 * Validates, runs DFA, and stores a network packet record.
 */
exports.createPacket = async (req, res) => {
  try {
    const inputData = req.body || {};

    // 1. Regular Expression and Octet/Port Range Verification
    const validationResult = validatePacket(inputData);

    // 2. Deterministic Finite Automaton (DFA) Classification
    const dfaResult = runPacketDFA(validationResult);

    // 3. Generate Packet ID
    const packetId = inputData.packetId || (await generatePacketId());

    const packetRecord = {
      packetId,
      sourceIp: validationResult.cleanedData.sourceIp || String(inputData.sourceIp || ''),
      destinationIp: validationResult.cleanedData.destinationIp || String(inputData.destinationIp || ''),
      protocol: validationResult.cleanedData.protocol || 'UNKNOWN',
      sourcePort: validationResult.cleanedData.sourcePort,
      destinationPort: validationResult.cleanedData.destinationPort,
      isValid: validationResult.isValid,
      validationErrors: validationResult.errors,
      dfaClassification: dfaResult.classification,
      dfaFinalState: dfaResult.finalState,
      stateTransitions: dfaResult.stateTransitions,
      fieldValidations: validationResult.fieldValidations,
      rawInput: inputData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dbStatus = getStatus();
    let savedRecord = null;

    if (dbStatus.connected) {
      try {
        const newPacket = new Packet(packetRecord);
        savedRecord = await newPacket.save();
      } catch (dbErr) {
        console.warn('[MongoDB] Save failed, saving to local fallback:', dbErr.message);
      }
    }

    // Always update local fallback for consistency
    const local = readFallbackPackets();
    const fallbackItem = {
      ...packetRecord,
      _id: savedRecord ? String(savedRecord._id) : `local_${Date.now()}`
    };
    local.unshift(fallbackItem);
    writeFallbackPackets(local);

    return res.status(201).json({
      success: true,
      message: validationResult.isValid
        ? `Packet ${packetId} successfully validated and classified as ${dfaResult.classification}.`
        : `Packet ${packetId} rejected by validation and DFA trap state.`,
      packet: savedRecord || fallbackItem,
      dfaReport: {
        classification: dfaResult.classification,
        finalState: dfaResult.finalState,
        isAccepted: dfaResult.isAccepted,
        transitionCount: dfaResult.transitionCount,
        stateTransitions: dfaResult.stateTransitions
      },
      validation: {
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        fieldValidations: validationResult.fieldValidations
      }
    });
  } catch (error) {
    console.error('Error creating packet:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error processing packet',
      error: error.message
    });
  }
};

/**
 * GET /api/packets
 * Retrieves all packets with search, filter, and pagination support.
 */
exports.getAllPackets = async (req, res) => {
  try {
    const { search = '', protocol = '', status = '', page = 1, limit = 50 } = req.query;
    const dbStatus = getStatus();

    let packets = [];

    if (dbStatus.connected) {
      try {
        const query = {};

        if (search) {
          const searchRegex = new RegExp(search.trim(), 'i');
          query.$or = [
            { packetId: searchRegex },
            { sourceIp: searchRegex },
            { destinationIp: searchRegex },
            { protocol: searchRegex },
            { dfaClassification: searchRegex }
          ];
        }

        if (protocol && protocol !== 'ALL') {
          query.protocol = protocol.toUpperCase();
        }

        if (status === 'valid') {
          query.isValid = true;
        } else if (status === 'invalid') {
          query.isValid = false;
        }

        packets = await Packet.find(query).sort({ createdAt: -1 });
      } catch (err) {
        console.warn('[MongoDB] Query failed, using fallback:', err.message);
        packets = readFallbackPackets();
      }
    } else {
      packets = readFallbackPackets();
    }

    // Apply filtering for fallback or in-memory search
    if (!dbStatus.connected) {
      const q = search.trim().toLowerCase();
      packets = packets.filter(p => {
        const matchesSearch = !q ||
          (p.packetId && p.packetId.toLowerCase().includes(q)) ||
          (p.sourceIp && p.sourceIp.toLowerCase().includes(q)) ||
          (p.destinationIp && p.destinationIp.toLowerCase().includes(q)) ||
          (p.protocol && p.protocol.toLowerCase().includes(q)) ||
          (p.dfaClassification && p.dfaClassification.toLowerCase().includes(q));

        const matchesProto = !protocol || protocol === 'ALL' ||
          (p.protocol && p.protocol.toUpperCase() === protocol.toUpperCase());

        const matchesStatus = !status || status === 'ALL' ||
          (status === 'valid' && p.isValid === true) ||
          (status === 'invalid' && p.isValid === false);

        return matchesSearch && matchesProto && matchesStatus;
      });
    }

    const totalCount = packets.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = packets.slice(startIndex, startIndex + limitNum);

    return res.json({
      success: true,
      count: paginated.length,
      total: totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      packets: paginated
    });
  } catch (error) {
    console.error('Error fetching packets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve packets',
      error: error.message
    });
  }
};

/**
 * GET /api/packets/:id
 * Retrieve details for a single packet by ID.
 */
exports.getPacketById = async (req, res) => {
  try {
    const id = req.params.id;
    const dbStatus = getStatus();

    let packet = null;

    if (dbStatus.connected) {
      try {
        packet = await Packet.findOne({
          $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { packetId: id }]
        });
      } catch (e) {
        // Fall through
      }
    }

    if (!packet) {
      const local = readFallbackPackets();
      packet = local.find(p => p.packetId === id || String(p._id) === id);
    }

    if (!packet) {
      return res.status(404).json({
        success: false,
        message: `Packet with ID '${id}' was not found.`
      });
    }

    return res.json({
      success: true,
      packet
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching packet details',
      error: error.message
    });
  }
};

/**
 * DELETE /api/packets/:id
 * Delete a packet record with confirmation.
 */
exports.deletePacket = async (req, res) => {
  try {
    const id = req.params.id;
    const dbStatus = getStatus();
    let deleted = false;

    if (dbStatus.connected) {
      try {
        const resMongo = await Packet.deleteOne({
          $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { packetId: id }]
        });
        if (resMongo.deletedCount > 0) {
          deleted = true;
        }
      } catch (e) {
        // Fallback
      }
    }

    const local = readFallbackPackets();
    const initialLen = local.length;
    const filtered = local.filter(p => p.packetId !== id && String(p._id) !== id);
    if (filtered.length < initialLen) {
      writeFallbackPackets(filtered);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Packet '${id}' not found for deletion.`
      });
    }

    return res.json({
      success: true,
      message: `Packet '${id}' successfully deleted.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting packet',
      error: error.message
    });
  }
};

/**
 * GET /api/stats
 * Computes live dashboard statistics dynamically from MongoDB / stored packets.
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const dbStatus = getStatus();
    let packets = [];

    if (dbStatus.connected) {
      try {
        packets = await Packet.find().sort({ createdAt: -1 });
      } catch (e) {
        packets = readFallbackPackets();
      }
    } else {
      packets = readFallbackPackets();
    }

    const total = packets.length;
    const validCount = packets.filter(p => p.isValid === true).length;
    const invalidCount = packets.filter(p => p.isValid === false).length;

    const tcpCount = packets.filter(p => p.protocol === 'TCP').length;
    const udpCount = packets.filter(p => p.protocol === 'UDP').length;
    const icmpCount = packets.filter(p => p.protocol === 'ICMP').length;
    const otherCount = total - (tcpCount + udpCount + icmpCount);

    const tcpValid = packets.filter(p => p.protocol === 'TCP' && p.isValid).length;
    const udpValid = packets.filter(p => p.protocol === 'UDP' && p.isValid).length;
    const icmpValid = packets.filter(p => p.protocol === 'ICMP' && p.isValid).length;

    const validationPassRate = total > 0 ? ((validCount / total) * 100).toFixed(1) : '0.0';

    // Recent activity (latest 5 packets)
    const recentActivity = packets.slice(0, 7);

    return res.json({
      success: true,
      stats: {
        total,
        validCount,
        invalidCount,
        validationPassRate: Number(validationPassRate),
        protocolDistribution: {
          TCP: tcpCount,
          UDP: udpCount,
          ICMP: icmpCount,
          OTHER: otherCount
        },
        classifiedDistribution: {
          TCP_PACKET: packets.filter(p => p.dfaClassification === 'TCP_PACKET').length,
          UDP_PACKET: packets.filter(p => p.dfaClassification === 'UDP_PACKET').length,
          ICMP_PACKET: packets.filter(p => p.dfaClassification === 'ICMP_PACKET').length,
          REJECTED_PACKET: packets.filter(p => p.dfaClassification === 'REJECTED_PACKET').length
        },
        protocolValidCounts: {
          TCP: tcpValid,
          UDP: udpValid,
          ICMP: icmpValid
        },
        recentActivity
      },
      database: dbStatus
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error computing dashboard statistics',
      error: error.message
    });
  }
};

/**
 * GET /api/samples
 * Returns predefined sample test cases (Section 4.G).
 */
exports.getSamplePackets = (req, res) => {
  return res.json({
    success: true,
    total: SAMPLE_TEST_CASES.length,
    samples: SAMPLE_TEST_CASES
  });
};

/**
 * POST /api/samples/test/:id
 * Executes live validation and DFA classification on a specific sample case.
 */
exports.testSamplePacket = async (req, res) => {
  try {
    const { id } = req.params;
    const sample = SAMPLE_TEST_CASES.find(s => s.id === id);

    if (!sample) {
      return res.status(404).json({
        success: false,
        message: `Sample test case '${id}' not found.`
      });
    }

    // Run validation and DFA
    const validationResult = validatePacket(sample.packet);
    const dfaResult = runPacketDFA(validationResult);

    // Save sample test run to history so it reflects dynamically
    const packetId = await generatePacketId();
    const packetRecord = {
      packetId,
      sourceIp: sample.packet.sourceIp,
      destinationIp: sample.packet.destinationIp,
      protocol: sample.packet.protocol || 'UNKNOWN',
      sourcePort: sample.packet.sourcePort,
      destinationPort: sample.packet.destinationPort,
      isValid: validationResult.isValid,
      validationErrors: validationResult.errors,
      dfaClassification: dfaResult.classification,
      dfaFinalState: dfaResult.finalState,
      stateTransitions: dfaResult.stateTransitions,
      fieldValidations: validationResult.fieldValidations,
      rawInput: sample.packet,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dbStatus = getStatus();
    let saved = null;
    if (dbStatus.connected) {
      try {
        const p = new Packet(packetRecord);
        saved = await p.save();
      } catch (e) {
        // fallback
      }
    }

    const local = readFallbackPackets();
    const fallbackItem = {
      ...packetRecord,
      _id: saved ? String(saved._id) : `local_${Date.now()}`
    };
    local.unshift(fallbackItem);
    writeFallbackPackets(local);

    return res.json({
      success: true,
      sampleCase: sample,
      savedPacket: saved || fallbackItem,
      validationResult,
      dfaResult
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error testing sample packet',
      error: error.message
    });
  }
};

/**
 * POST /api/samples/reset
 * Resets packet records to the initial clean seed dataset.
 */
exports.resetSamples = async (req, res) => {
  try {
    const dbStatus = getStatus();
    if (dbStatus.connected) {
      try {
        await Packet.deleteMany({});
      } catch (e) {
        // ignore
      }
    }

    // Reinitialize fallback
    if (fs.existsSync(FALLBACK_FILE)) {
      fs.unlinkSync(FALLBACK_FILE);
    }
    const fresh = readFallbackPackets();

    if (dbStatus.connected) {
      try {
        for (const item of fresh) {
          const { _id, ...cleanItem } = item;
          await new Packet(cleanItem).save();
        }
      } catch (e) {
        console.warn('[MongoDB] Reseed warning:', e.message);
      }
    }

    return res.json({
      success: true,
      message: 'Sample test records successfully reset and re-seeded.',
      count: fresh.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset sample packets',
      error: error.message
    });
  }
};

/**
 * GET /api/automata
 * Returns the formal DFA definition, states, alphabet, and transition table.
 */
exports.getAutomataDefinition = (req, res) => {
  const definition = getFormalDFADefinition();
  return res.json({
    success: true,
    automata: definition
  });
};
