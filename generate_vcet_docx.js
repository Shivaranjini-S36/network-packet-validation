const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join(__dirname, 'temp_vcet_docx');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

// 1. [Content_Types].xml
const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypes);

// 2. _rels/.rels
const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), rels);

// 3. word/_rels/document.xml.rels
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRels);

// 4. word/styles.xml
const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:color w:val="000000"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), styles);

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function p(text, options = {}) {
  const { bold, sz = 24, align = 'left', color = '000000', font = 'Times New Roman', spaceAfter = 120 } = options;
  const bTag = bold ? '<w:b/><w:bCs/>' : '';
  const jTag = align !== 'left' ? `<w:jc w:val="${align}"/>` : '';
  return `<w:p>
    <w:pPr>${jTag}<w:spacing w:after="${spaceAfter}"/></w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>
        ${bTag}
        <w:sz w:val="${sz}"/>
        <w:szCs w:val="${sz}"/>
        <w:color w:val="${color}"/>
      </w:rPr>
      <w:t xml:space="preserve">${esc(text)}</w:t>
    </w:r>
  </w:p>`;
}

function codeBlock(codeText) {
  const lines = codeText.split('\n');
  return lines.map(line => `<w:p>
    <w:pPr>
      <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
      <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/>
        <w:sz w:val="18"/>
        <w:szCs w:val="18"/>
        <w:color w:val="0F172A"/>
      </w:rPr>
      <w:t xml:space="preserve">${esc(line)}</w:t>
    </w:r>
  </w:p>`).join('') + `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>`;
}

let bodyXml = '';

// College Header
bodyXml += p('VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY, ERODE -12', { bold: true, sz: 28, align: 'center', spaceAfter: 60 });
bodyXml += p('(AUTONOMOUS)', { bold: true, sz: 24, align: 'center', spaceAfter: 60 });
bodyXml += p('DEPARTMENT OF INFORMATION TECHNOLOGY', { bold: true, sz: 24, align: 'center', spaceAfter: 120 });
bodyXml += p('ACADEMIC YEAR: 2026 -27 (ODD)', { bold: true, sz: 24, align: 'center', spaceAfter: 120 });
bodyXml += p('ACTIVITY- Project-Based Assessment', { bold: true, sz: 24, align: 'center', spaceAfter: 200 });

// Student Details
bodyXml += p('NAME : KUNGUMA SHIVARANJINI S', { bold: true, sz: 24 });
bodyXml += p('CLASS: 24IT5A', { bold: true, sz: 24 });
bodyXml += p('REG.NO: 732924ITR018', { bold: true, sz: 24 });
bodyXml += p('SUBJECT CODE: 22ITT51', { bold: true, sz: 24 });
bodyXml += p('SUBJECT NAME: FULL STACK WEB DEVELOPMENT (FSWD)', { bold: true, sz: 24 });
bodyXml += p('ACTIVITY : 2', { bold: true, sz: 24 });
bodyXml += p('PROBLEM STATEMENT : Create a web application that accepts sample network packet records containing source address, destination address, protocol, and port information. Use regular expressions and validation rules to verify packet fields, and finite automata to classify packets according to predefined protocol patterns. Display valid and invalid packets, protocol classifications, and validation errors in a searchable interface.', { sz: 24, spaceAfter: 160 });
bodyXml += p('Title Assigned : Network Packet Format Validation and Classification System', { bold: true, sz: 24, spaceAfter: 160 });

// Folder Structure
bodyXml += p('Project Folder Structure :', { bold: true, sz: 24, spaceAfter: 80 });
const treeStructure = `network-packet-validation/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DashboardStats.jsx
│   │   │   ├── DfaVisualizer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── PacketDetailModal.jsx
│   │   │   ├── PacketForm.jsx
│   │   │   ├── PacketTable.jsx
│   │   │   ├── SampleTester.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TransitionTable.jsx
│   │   ├── pages/
│   │   │   ├── AddPacketPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DfaVisualizationPage.jsx
│   │   │   ├── PacketHistoryPage.jsx
│   │   │   ├── PacketRecordsPage.jsx
│   │   │   └── SampleTestingPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── validator.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── standaloneApp.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── automata/
│   │   └── packetDFA.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── packetController.js
│   ├── data/
│   │   ├── fallbackPackets.json
│   │   └── samplePackets.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   └── Packet.js
│   ├── routes/
│   │   └── packetRoutes.js
│   ├── test/
│   │   ├── api.test.js
│   │   ├── controllers.test.js
│   │   ├── dfa.test.js
│   │   └── e2e.test.js
│   ├── validators/
│   │   └── packetValidator.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── documentation/
│   ├── DFA-Design.md
│   ├── Problem-Statement.md
│   ├── Project-Report.md
│   ├── State-Transition-Table.md
│   ├── System-Architecture.md
│   └── Test-Cases.md
├── index.html
├── README.md
└── package.json`;
bodyXml += codeBlock(treeStructure);

// Repository
bodyXml += p('Repository :', { bold: true, sz: 24, spaceAfter: 60 });
bodyXml += p(' GitHub: https://github.com/Shivaranjini-S36/network-packet-validation', { sz: 24 });
bodyXml += p(' Live Site (GitHub Pages): https://shivaranjini-s36.github.io/network-packet-validation/', { sz: 24, spaceAfter: 200 });

// 1.4 Working Principle
bodyXml += p('1.4 Working Principle of the Project', { bold: true, sz: 26, spaceAfter: 120 });
bodyXml += p('The NetValidator application works through a sequence of network packet ingestion, lexical validation, deterministic finite automata classification, persistent storage, and interactive visualization operations.', { sz: 24, spaceAfter: 100 });
bodyXml += p('1. Packet Data Ingestion: The web application accepts incoming network packet records containing source address, destination address, protocol type (TCP, UDP, ICMP), and transport port numbers (source and destination ports) through an intuitive form or preloaded academic test cases.', { sz: 24 });
bodyXml += p('2. Lexical Format Validation: The validation subsystem verifies IPv4 address structures using regular expressions. Each IP address is verified across all four octets within the legitimate range [0 - 255]. Port numbers are confirmed as 16-bit positive integers between 1 and 65535.', { sz: 24 });
bodyXml += p('3. Deterministic Finite Automaton (DFA) Execution: A formal 10-state DFA engine processes the packet fields as an input alphabet sequence. The machine starts at initial state q0 (START) and transitions through intermediate states (SOURCE_VALIDATION, DESTINATION_VALIDATION).', { sz: 24 });
bodyXml += p('4. Protocol Branching & RFC 792 Port Bypassing: At DESTINATION_VALIDATION, the automaton branches depending on the protocol. For TCP and UDP, the DFA transitions to PROTOCOL_VALIDATION and requires port range checks in PORT_VALIDATION. For ICMP (RFC 792), transport ports are naturally bypassed, transitioning directly to ICMP_CLASSIFIED.', { sz: 24 });
bodyXml += p('5. Classification and Trap Detection: If any field fails syntax or range checks, the automaton transits to the non-accepting sink state REJECTED (Trap) via INVALID_* input symbols. Packets satisfying all constraints transit to TCP_CLASSIFIED, UDP_CLASSIFIED, or ICMP_CLASSIFIED, reaching the final accepting state ACCEPTED (F).', { sz: 24 });
bodyXml += p('6. Database Storage: Classified packet records, complete validation status, error messages, and automaton audit trails are persistently saved to MongoDB Atlas cloud database using Mongoose ODM schemas, supported by a local JSON fallback file for high availability.', { sz: 24 });
bodyXml += p('7. Dashboard & Searchable Interface: The React frontend dynamically presents security metrics, pass rates, protocol distribution graphs, and a real-time searchable table with interactive inspection modals.', { sz: 24 });
bodyXml += p('8. State Transition Diagram & Table Management: The system features an interactive SVG transition diagram with glowing active nodes, step-by-step simulator, and a dedicated State Transition Table with 2D matrix view for academic evaluation.', { sz: 24, spaceAfter: 240 });

// Source Code File Index
bodyXml += p('SOURCE CODE FILE INDEX :', { bold: true, sz: 26, spaceAfter: 120 });

// App.jsx
bodyXml += p('frontend/src/standaloneApp.jsx (Core Application Engine):', { bold: true, sz: 24, spaceAfter: 60 });
const appCodeSample = `// --- Lexical Regular Expressions ---
const IPV4_REGEX = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;
const PORT_REGEX = /^[0-9]+$/;
const PROTOCOL_REGEX = /^(TCP|UDP|ICMP)$/i;

// --- DFA Execution Engine ---
function executeDFA(packet) {
  const errors = [];
  const transitions = [];
  let currentState = 'START';
  let step = 1;

  function record(fromState, inputSymbol, toState, description) {
    transitions.push({ step, fromState, inputSymbol, toState, description, timestamp: new Date().toISOString() });
    currentState = toState;
    step++;
  }

  const src = (packet.sourceIp || '').trim();
  const dst = (packet.destinationIp || '').trim();
  const proto = (packet.protocol || '').trim().toUpperCase();

  // 1. Source IP
  if (IPV4_REGEX.test(src)) {
    record(currentState, 'VALID_SRC_IP', 'SOURCE_VALIDATION', \`Source IP '\${src}' matched IPv4 format and octets within [0-255].\`);
  } else {
    const err = 'Source IP format invalid or octet out of range [0-255]';
    errors.push(err);
    record(currentState, 'INVALID_SRC_IP', 'REJECTED', \`Source IP validation failed: \${err}. Transited to REJECTED trap state.\`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 2. Destination IP
  if (IPV4_REGEX.test(dst)) {
    record(currentState, 'VALID_DST_IP', 'DESTINATION_VALIDATION', \`Destination IP '\${dst}' matched IPv4 format and octets within [0-255].\`);
  } else {
    const err = 'Destination IP format invalid or octet out of range [0-255]';
    errors.push(err);
    record(currentState, 'INVALID_DST_IP', 'REJECTED', \`Destination IP validation failed: \${err}. Transited to REJECTED.\`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 3. Protocol
  if (proto === 'TCP') {
    record(currentState, 'PROTO_TCP', 'PROTOCOL_VALIDATION', 'Protocol identified as TCP. Transport port validation required.');
  } else if (proto === 'UDP') {
    record(currentState, 'PROTO_UDP', 'PROTOCOL_VALIDATION', 'Protocol identified as UDP. Transport port validation required.');
  } else if (proto === 'ICMP') {
    record(currentState, 'PROTO_ICMP', 'ICMP_CLASSIFIED', 'Protocol identified as ICMP. Port verification bypassed (RFC 792).');
    record(currentState, 'FINALIZE_ACCEPT', 'ACCEPTED', 'All packet criteria satisfied. Officially ACCEPTED as ICMP_PACKET.');
    return { isValid: true, errors: [], finalState: 'ACCEPTED', classification: 'ICMP_PACKET', transitions };
  } else {
    const err = \`Unrecognized or missing protocol '\${proto}'. Choose TCP, UDP, or ICMP.\`;
    errors.push(err);
    record(currentState, 'INVALID_PROTO', 'REJECTED', \`\${err} Transited to REJECTED.\`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 4. Ports for TCP / UDP
  const sp = packet.sourcePort !== null && packet.sourcePort !== undefined ? String(packet.sourcePort).trim() : '';
  const dp = packet.destinationPort !== null && packet.destinationPort !== undefined ? String(packet.destinationPort).trim() : '';
  const spNum = Number(sp);
  const dpNum = Number(dp);
  const spOk = PORT_REGEX.test(sp) && spNum >= 1 && spNum <= 65535;
  const dpOk = PORT_REGEX.test(dp) && dpNum >= 1 && dpNum <= 65535;

  if (spOk && dpOk) {
    record(currentState, 'VALID_PORTS', 'PORT_VALIDATION', \`Ports verified: src \${spNum}, dst \${dpNum} within allowable range [1-65535].\`);
  } else {
    const err = 'Port validation failed: Ports must be positive integers between 1 and 65535.';
    errors.push(err);
    record(currentState, 'INVALID_PORTS', 'REJECTED', \`\${err} Transited to REJECTED.\`);
    return { isValid: false, errors, finalState: currentState, classification: 'REJECTED_PACKET', transitions };
  }

  // 5. Classification
  if (proto === 'TCP') {
    record(currentState, 'DISPATCH_TCP', 'TCP_CLASSIFIED', 'Packet confirmed and classified as TCP transmission.');
  } else {
    record(currentState, 'DISPATCH_UDP', 'UDP_CLASSIFIED', 'Packet confirmed and classified as UDP datagram.');
  }

  // 6. Final Accept
  record(currentState, 'FINALIZE_ACCEPT', 'ACCEPTED', 'All validation rules and DFA transitions passed. Officially ACCEPTED.');
  return {
    isValid: true,
    errors: [],
    finalState: 'ACCEPTED',
    classification: proto === 'TCP' ? 'TCP_PACKET' : 'UDP_PACKET',
    transitions
  };
}`;
bodyXml += codeBlock(appCodeSample);

// main.jsx
bodyXml += p('frontend/src/main.jsx:', { bold: true, sz: 24, spaceAfter: 60 });
const mainCode = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
bodyXml += codeBlock(mainCode);

// backend/server.js
bodyXml += p('backend/server.js:', { bold: true, sz: 24, spaceAfter: 60 });
const serverCode = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const packetRoutes = require('./routes/packetRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/packets', packetRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Network Packet Format Validation & Classification System',
    question: 'Question No. 51',
    author: 'Kunguma Shivaranjini S'
  });
});

app.use(errorHandler);

// Connect MongoDB Atlas & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(\`NetValidator Server running on port \${PORT}\`);
  });
});`;
bodyXml += codeBlock(serverCode);

// OUTPUT SECTION
bodyXml += p('OUTPUT :', { bold: true, sz: 26, spaceAfter: 120 });
bodyXml += p('The NetValidator application interface provides comprehensive monitoring, validation, automata inspection, and database management through the following modules:', { sz: 24, spaceAfter: 80 });
bodyXml += p('1. Security Dashboard: Displays total packet records, valid packets count, rejected packets count, and protocol distribution metrics (TCP, UDP, ICMP) with animated percentage indicators.', { sz: 24 });
bodyXml += p('2. Packet Input Form: Allows users to input Source IP, Destination IP, Protocol, and Port fields with real-time regex feedback and instant DFA classification results.', { sz: 24 });
bodyXml += p('3. Packet Records Table: Searchable and filterable data grid listing all validated packets with protocol badges, validation status (VALID / INVALID), and detailed audit view modals.', { sz: 24 });
bodyXml += p('4. Sample Packet Testing: Provides 8 predefined RFC 5737 test cases covering valid HTTP web traffic, DNS datagrams, ICMP echo messages, octet range boundary violations, and port overflow errors with one-click test execution.', { sz: 24 });
bodyXml += p('5. DFA State Transition Diagram: A responsive SVG state diagram visualizing all 10 states, directed transition arrows, glowing active halos, rejection curved paths to trap state, and interactive step-by-step packet simulator.', { sz: 24 });
bodyXml += p('6. State Transition Table: Dedicated formal state transition function (δ: Q × Σ → Q) with live state-input evaluator, filter controls, and a complete 2D automata matrix grid.', { sz: 24, spaceAfter: 200 });

// MongoDB Commands
bodyXml += p('MONGODB COMMANDS USED IN NETVALIDATOR PROJECT', { bold: true, sz: 26, spaceAfter: 100 });
bodyXml += p('MongoDB Atlas cloud database is used to store and retrieve validated network packet records and DFA classification audit trails.', { sz: 24, spaceAfter: 80 });
bodyXml += p('1. Display Available Databases', { bold: true, sz: 24 });
bodyXml += codeBlock('show dbs');
bodyXml += p('2. Select NetValidator Database', { bold: true, sz: 24 });
bodyXml += codeBlock('use network_packet_db');
bodyXml += p('3. Display Collections', { bold: true, sz: 24 });
bodyXml += codeBlock('show collections');
bodyXml += p('4. Retrieve All Packet Records', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find()');
bodyXml += p('5. Display Packets in Readable Format', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find().pretty()');
bodyXml += p('6. Retrieve Packets from a Specific Source IP', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find({ sourceIp: "192.0.2.10" })');
bodyXml += p('7. Count Total Packets', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.countDocuments()');
bodyXml += p('8. Retrieve All Valid Accepted Packets', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find({ isValid: true })');
bodyXml += p('9. Retrieve All Rejected Packets', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find({ isValid: false })');
bodyXml += p('10. Filter Packets by Protocol', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find({ protocol: "TCP" })');
bodyXml += p('11. Retrieve Latest Five Packets', { bold: true, sz: 24 });
bodyXml += codeBlock('db.packets.find().sort({ _id: -1 }).limit(5)');

// GitHub Commands
bodyXml += p('GITHUB COMMANDS TO PUSH NETVALIDATOR PROJECT', { bold: true, sz: 26, spaceAfter: 100 });
bodyXml += p('Open PowerShell in your project folder:', { sz: 24 });
bodyXml += codeBlock('cd "C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\network-packet-validation"');
bodyXml += p('1. Initialize Git Repository', { bold: true, sz: 24 });
bodyXml += codeBlock('git init');
bodyXml += p('2. Add all project files', { bold: true, sz: 24 });
bodyXml += codeBlock('git add .');
bodyXml += p('3. Commit the files', { bold: true, sz: 24 });
bodyXml += codeBlock('git commit -m "Initial NetValidator project upload"');
bodyXml += p('4. Connect GitHub repository', { bold: true, sz: 24 });
bodyXml += codeBlock('git remote add origin https://github.com/Shivaranjini-S36/network-packet-validation.git');
bodyXml += p('5. Set the main branch', { bold: true, sz: 24 });
bodyXml += codeBlock('git branch -M main');
bodyXml += p('6. Push the project to GitHub', { bold: true, sz: 24 });
bodyXml += codeBlock('git push -u origin main');

// Procedure to run locally
bodyXml += p('PROCEDURE TO RUN NETVALIDATOR PROJECT LOCALLY', { bold: true, sz: 26, spaceAfter: 100 });
bodyXml += p('Step 1: Open the project folder', { bold: true, sz: 24 });
bodyXml += codeBlock('cd "C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\network-packet-validation"');
bodyXml += p('Step 2: Verify MongoDB Connection', { bold: true, sz: 24 });
bodyXml += p('Ensure MongoDB Atlas URI is configured in server/.env or MongoDB service is running locally.', { sz: 24, spaceAfter: 80 });
bodyXml += p('Step 3: Start the Backend Server', { bold: true, sz: 24 });
bodyXml += p('Open the first terminal:', { sz: 24 });
bodyXml += codeBlock(`cd server
npm install
npm start
Backend URL: http://localhost:5000`);
bodyXml += p('Step 4: Start the Frontend Client', { bold: true, sz: 24 });
bodyXml += p('Open a second terminal:', { sz: 24 });
bodyXml += codeBlock(`cd client
npm install
npm run dev
Frontend URL: http://localhost:5173`);
bodyXml += p('Step 5: Direct GitHub Pages Live Execution', { bold: true, sz: 24 });
bodyXml += p('Open any browser and navigate to the live deployment:', { sz: 24 });
bodyXml += codeBlock('https://shivaranjini-s36.github.io/network-packet-validation/');
bodyXml += p('Step 6: Test the Project', { bold: true, sz: 24 });
bodyXml += p('• Check packet validation pass rates on dashboard.\n• Ingest custom packets using the Add Packet form.\n• Observe DFA state transitions and active glowing nodes.\n• Test 8 predefined RFC 5737 test vectors.\n• Inspect formal state transition rules and 2D matrix grid.\n• Verify persistently stored packet documents in MongoDB Atlas cluster.', { sz: 24, spaceAfter: 240 });

// MongoDB & GitHub Section
bodyXml += p('MONGODB & GITHUB :', { bold: true, sz: 26, spaceAfter: 100 });
bodyXml += p('• GitHub Repository: https://github.com/Shivaranjini-S36/network-packet-validation\n• GitHub Pages Live Site: https://shivaranjini-s36.github.io/network-packet-validation/\n• MongoDB Atlas Cluster: cluster0.9idrlwn.mongodb.net\n• Database Name: network_packet_db\n• Collection Name: packets', { sz: 24, spaceAfter: 200 });

// Wrap in document.xml
const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), docXml);

// Compile to .docx
const outputDocx = path.join(__dirname, 'VCET_FSWD_ACTIVITY_2_REPORT_24ITR018.docx');
const docDestDocx = path.join(__dirname, 'documentation', 'VCET_FSWD_ACTIVITY_2_REPORT_24ITR018.docx');
const brainDocx = 'C:/Users/Admin/.gemini/antigravity/brain/e9a87f87-5ad8-4774-a420-0909fc6cb161/VCET_FSWD_ACTIVITY_2_REPORT_24ITR018.docx';

if (fs.existsSync(outputDocx)) fs.unlinkSync(outputDocx);

const zipCmd = `powershell.exe -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${tempDir}', '${outputDocx}', [System.IO.Compression.CompressionLevel]::Optimal, $false)"`;
execSync(zipCmd, { stdio: 'inherit' });

if (fs.existsSync(outputDocx)) {
  fs.copyFileSync(outputDocx, docDestDocx);
  fs.copyFileSync(outputDocx, brainDocx);
  console.log('DOCX created successfully at:', outputDocx);
  console.log('Size:', fs.statSync(outputDocx).size, 'bytes');
}

fs.rmSync(tempDir, { recursive: true, force: true });
