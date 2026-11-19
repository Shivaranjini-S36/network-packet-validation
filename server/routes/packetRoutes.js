const express = require('express');
const router = express.Router();
const packetController = require('../controllers/packetController');

// Packets Endpoints
router.post('/packets', packetController.createPacket);
router.get('/packets', packetController.getAllPackets);
router.get('/packets/:id', packetController.getPacketById);
router.delete('/packets/:id', packetController.deletePacket);

// Dashboard Statistics Endpoint
router.get('/stats', packetController.getDashboardStats);

// Sample Packet Testing Endpoints
router.get('/samples', packetController.getSamplePackets);
router.post('/samples/test/:id', packetController.testSamplePacket);
router.post('/samples/reset', packetController.resetSamples);

// DFA Automata Specification Endpoint
router.get('/automata', packetController.getAutomataDefinition);

module.exports = router;
