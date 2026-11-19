require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB, getStatus } = require('./config/db');
const packetRoutes = require('./routes/packetRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Serve static frontend files from client directory
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));

// Documentation endpoint (serves docs statically)
const docsPath = path.join(__dirname, '..', 'documentation');
app.use('/docs', express.static(docsPath));

// System Health Check Endpoint
app.get('/api/health', (req, res) => {
  const db = getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Network Packet Format Validation and Classification System',
    question: 'Question No. 51',
    academicDetails: {
      program: 'B.Tech Information Technology',
      year: 'Third Year (ODD Semester)',
      subjectIntegration: [
        'Full Stack Web Development (React.js, Node.js, Express.js, MongoDB)',
        'Computer Networks (IPv4, TCP, UDP, ICMP, Port Addressing)',
        'Formal Languages and Automata Theory (DFA, Regular Expressions)'
      ]
    },
    database: {
      connected: db.connected,
      mode: db.mode,
      host: db.host,
      databaseName: db.dbName,
      stateDescription: db.stateDescription
    },
    version: '1.0.0'
  });
});

// API Routes
app.use('/api', packetRoutes);

// Fallback to client/index.html for Single Page Application (SPA) routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientPath, 'index.html');
  res.sendFile(indexPath);
});

// 404 Handler for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist.`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start HTTP Server
async function startServer() {
  await connectDB();

  return app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`🛡️  Question 51: Network Packet Validation & Classification System`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Application URL: http://localhost:${PORT}`);
    console.log(`🩺 Health API:      http://localhost:${PORT}/api/health`);
    console.log(`📊 Packets API:     http://localhost:${PORT}/api/packets`);
    console.log(`⚙️  Automata API:    http://localhost:${PORT}/api/automata`);
    console.log(`================================================================`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
