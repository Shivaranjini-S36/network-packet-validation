const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tempDir = path.join(__dirname, 'temp_docx_build');
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
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), styles);

// XML Helper Functions
function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function p(text, opts = {}) {
  let rPr = '';
  if (opts.bold) rPr += '<w:b/>';
  if (opts.italic) rPr += '<w:i/>';
  if (opts.size) rPr += `<w:sz w:val="${opts.size}"/>`;
  if (opts.color) rPr += `<w:color w:val="${opts.color}"/>`;
  if (opts.font) rPr += `<w:rFonts w:ascii="${opts.font}" w:hAnsi="${opts.font}"/>`;

  let pPr = '';
  let spBefore = opts.spaceBefore || 0;
  let spAfter = opts.spaceAfter || 120;
  pPr += `<w:spacing w:before="${spBefore}" w:after="${spAfter}"/>`;
  if (opts.align) pPr += `<w:jc w:val="${opts.align}"/>`;

  return `<w:p><w:pPr>${pPr}</w:pPr><w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function h1(text) {
  return p(text, { bold: true, size: 32, color: '0F172A', spaceBefore: 280, spaceAfter: 140 });
}

function h2(text) {
  return p(text, { bold: true, size: 26, color: '0369A1', spaceBefore: 220, spaceAfter: 100 });
}

function bullet(text, boldPrefix = '') {
  let content = '';
  if (boldPrefix) {
    content += `<w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve">${escapeXml(boldPrefix)} </w:t></w:r>`;
  }
  content += `<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:before="60" w:after="80"/><w:ind w:left="420"/></w:pPr><w:r><w:rPr><w:color w:val="0284C7"/><w:b/></w:rPr><w:t xml:space="preserve">•  </w:t></w:r>${content}</w:p>`;
}

function codeBlock(lines) {
  const inner = lines.map(line => `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`).join('<w:br/>');
  return `<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/><w:left w:val="single" w:sz="18" w:space="8" w:color="0284C7"/><w:bottom w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:space="4" w:color="CBD5E1"/></w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/><w:spacing w:before="120" w:after="160"/><w:ind w:left="200" w:right="200"/></w:pPr>${inner}</w:p>`;
}

function table(headers, rows, colWidths = []) {
  let xml = `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/></w:tblBorders></w:tblPr>`;

  // Header row
  xml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
  headers.forEach((h, i) => {
    const w = colWidths[i] || Math.floor(9360 / headers.length);
    xml += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/><w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escapeXml(h)}</w:t></w:r></w:p></w:tc>`;
  });
  xml += `</w:tr>`;

  // Data rows
  rows.forEach((r, rowIndex) => {
    const bg = rowIndex % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
    xml += `<w:tr>`;
    r.forEach((cell, i) => {
      const w = colWidths[i] || Math.floor(9360 / r.length);
      xml += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${bg}"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar></w:tcPr><w:p><w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/><w:color w:val="1E293B"/></w:rPr><w:t xml:space="preserve">${escapeXml(cell)}</w:t></w:r></w:p></w:tc>`;
    });
    xml += `</w:tr>`;
  });

  xml += `</w:tbl>`;
  return xml;
}

// Assemble Document Content
let body = '';

// Title & Subtitle
body += p('QUESTION NO. 51: NETWORK PACKET FORMAT VALIDATION AND CLASSIFICATION SYSTEM', { bold: true, size: 36, color: '0F172A', spaceBefore: 100, spaceAfter: 60, align: 'center' });
body += p('Interdisciplinary Assessment: Computer Networks (CN) · Formal Languages & Automata Theory (FLAT) · Full Stack Web Development (FSWD)', { italic: true, size: 22, color: '0284C7', spaceBefore: 0, spaceAfter: 200, align: 'center' });
body += p('Candidate: Kunguma Shivaranjini (Roll No / GitHub: Shivaranjini-S36)  |  Academic Year: 2026–2027', { bold: true, size: 20, color: '475569', spaceBefore: 0, spaceAfter: 300, align: 'center' });

// SECTION 1
body += h1('1. NETWORK TOPOLOGY & DEVICE INTERCONNECTION');
body += h2('1.1 Network Architecture & Topology Classification');
body += p('The Network Packet Format Validation and Classification System (NetValidator) implements a Hybrid Client-Server Star Topology deployed across a Wide Area Network (WAN / Public Internet). The system interconnects three distinct architectural tiers: the Edge Client Tier (Network Security Dashboard & Ingestion Interface hosted on GitHub Pages Anycast CDN), the Application Server Tier (Node.js + Express.js REST API Server executing the 10-state Deterministic Finite Automaton Engine), and the Cloud Database Tier (MongoDB Atlas Replica Set Cluster on cluster0.9idrlwn.mongodb.net).');

body += h2('1.2 Network Interconnection & Hardware Device Roles');
body += p('In this network architecture, several physical and logical network devices collaborate to guarantee secure, high-integrity packet transmission and formal automata parsing:');
body += bullet('Operates at the Physical & Data Link layers (OSI Layers 1 & 2) on the client workstation to frame, serialize, and modulate digital signals over Wi-Fi (IEEE 802.11ax) or Gigabit Ethernet (IEEE 802.3ab).', 'Network Interface Card (NIC):');
body += bullet('Inspects incoming Ethernet frame headers, maintains a dynamic MAC Address Forwarding Table (CAM Table), and forwards uncorrupted unicast frames to specific switch ports at wire speed with zero collisions.', 'Network Switch (Layer 2):');
body += bullet('Serves as the default gateway (192.168.1.1), provides dynamic host configuration (DHCP), executes stateful Network Address Port Translation (NAPT) mapping private client sockets to routable public WAN IPs, and routes datagrams to the Internet Service Provider (ISP).', 'Local Gateway Router (Layer 3):');
body += bullet('Forward packets across international backbone links using the Border Gateway Protocol (BGPv4) and Open Shortest Path First (OSPF) routing algorithms.', 'ISP Edge Routers & Autonomous Systems (AS):');
body += bullet('Terminates incoming HTTPS client connections on TCP Port 443 across globally distributed Anycast edge nodes, delivers the React Single Page Application (SPA), and serves static assets (index.html, index.css, standaloneApp.jsx) with low latency.', 'GitHub Pages Anycast Edge CDN:');
body += bullet('Binds to TCP socket 0.0.0.0:5000, receives ingested packet payloads, executes lexical regex checks, and evaluates deterministic state transitions across formal 5-tuple M = (Q, Sigma, q0, F, delta).', 'Application Server Listener (Express.js on Port 5000):');
body += bullet('Receives Mongoose database write queries over TLS encrypted TCP Port 27017, validates write concerns, and commits packet documents to the primary replica node with automated secondary synchronization.', 'MongoDB Atlas Replica Set Router (mongos / Shard Gateways):');

body += h2('1.3 Topology Interconnection Diagram');
body += codeBlock([
  '[Network Analyst Workstation / React Security Dashboard]',
  '    |',
  '    | (LAN: 192.168.1.15 : Ephemeral Port 52140)',
  '    v',
  '[Local Gateway / NAPT Router] (LAN: 192.168.1.1 --> Public WAN IP: 103.212.x.x)',
  '    |',
  '    v (WAN / ISP Optical Fiber / BGP Internet Backbone Routing)',
  '[GitHub Pages Anycast CDN] (185.199.108.153 : Port 443 --> Serves React SPA & DFA UI)',
  '    |',
  '    v (HTTPS REST Ingestion: /api/packets | /api/stats | /api/samples)',
  '[Node.js + Express.js API Server] (Local Host / Port 5000)',
  '    | |-- Regular Expression Validator (IPv4, Port Bounds, Protocol Rules)',
  '    | +-- 10-State DFA Automata Engine: START -> SRC_VAL -> DST_VAL -> PROTO_VAL -> PORT_VAL -> CLASSIFIED -> ACCEPTED / REJECTED',
  '    |',
  '    v (Secure TLS TCP Wire Protocol Socket : Port 27017)',
  '[MongoDB Atlas Cloud Database Cluster] (Host: cluster0.9idrlwn.mongodb.net)',
  '    |-- Primary Database Node (Active Read/Write: network_packet_db)',
  '    +-- Secondary Replica Nodes (Automatic Failover, Sharding & Redundancy)'
]);

// SECTION 2
body += h1('2. IP ADDRESSING SCHEME & COMMUNICATION ANALYSIS');
body += p('Logical IP addressing enables hierarchical routing, subnet partitioning, and host identification across the network. The table below delineates every entity in our validation system, its assigned IP/Domain, address classification, and operational responsibility:');

body += table(
  ['Network Entity', 'Assigned IP / Domain', 'IP Class / Type', 'Functional Role'],
  [
    ['Client Workstation', '192.168.1.15', 'Private IPv4 (Class C, /24)', 'Originates packet submissions & renders React dashboard UI'],
    ['Local Gateway Router', '192.168.1.1', 'Private Gateway IPv4', 'Handles local DHCP IP allocation and stateful NAPT translation'],
    ['Client Public IP', '103.212.x.x (Dynamic)', 'Public Routable IPv4', 'Identifies client local area network across public WAN'],
    ['GitHub Pages CDN', '185.199.108.153', 'Public Anycast IPv4', 'Serves React UI, stylesheets, and client DFA simulator globally'],
    ['Express Backend API', '127.0.0.1:5000 / Cloud Host', 'Local Loopback / Public Cloud', 'Executes regex validators, computes DFA transitions, serves REST endpoints'],
    ['MongoDB Atlas Host', 'cluster0.9idrlwn.mongodb.net', 'Cloud Distributed Domain', 'Persists packet records, validation errors, and DFA transition histories'],
    ['Sample RFC 5737 Test-Net 1', '192.0.2.1 - 192.0.2.254', 'Documentation Reserved IPv4', 'Standard reserved documentation subnet used for valid TCP/ICMP test cases'],
    ['Sample RFC 5737 Test-Net 2', '198.51.100.1 - 198.51.100.254', 'Documentation Reserved IPv4', 'Standard reserved documentation subnet used for destination IP testing'],
    ['Sample RFC 5737 Test-Net 3', '203.0.113.1 - 203.0.113.254', 'Documentation Reserved IPv4', 'Standard reserved documentation subnet used for UDP DNS query vectors']
  ],
  [2200, 2600, 2200, 2360]
);

body += h2('2.1 Network Address Translation (NAT) & Private-to-Public Mapping');
body += p('Under RFC 1918, private IP addresses (192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12) are non-routable on the public Internet. When a client workstation (192.168.1.15) transmits packet data to the cloud database or fetches assets from GitHub Pages:');
body += bullet('The local gateway router executes Network Address Port Translation (NAPT).');
body += bullet('The router replaces the private source IP and ephemeral port (192.168.1.15:52140) with its public WAN IP and a dynamically reserved external port (103.212.x.x:61025).');
body += bullet('An entry is entered into the router stateful NAT translation table: (192.168.1.15:52140) <-> (103.212.x.x:61025).');
body += bullet('When incoming return traffic arrives from MongoDB Atlas or GitHub Pages, the router demultiplexes the packet using its NAT table, restores the private destination IP (192.168.1.15:52140), and forwards it through the local switch to the browser.');

body += h2('2.2 Domain Name System (DNS) Resolution Process');
body += p('Before the backend can open a Mongoose connection to cluster0.9idrlwn.mongodb.net or before the browser loads shivaranjini-s36.github.io:');
body += bullet('The host operating system queries its local DNS cache and hosts file.', '1. Cache Inspection:');
body += bullet('If un-cached, a recursive DNS query is dispatched over UDP Port 53 to the configured DNS resolver (e.g., 8.8.8.8 or 1.1.1.1).', '2. Recursive DNS Dispatch:');
body += bullet('Root DNS Servers (.) -> TLD Servers (.net / .io) -> Authoritative Name Servers (AWS Route 53 / Cloudflare).', '3. Iterative Hierarchy Traversal:');
body += bullet('For MongoDB Atlas, an SRV Record lookup (_mongodb._tcp.cluster0.9idrlwn.mongodb.net) returns the replica set host addresses and standard port 27017. For GitHub Pages, the authoritative server returns A records pointing to 185.199.108.153.', '4. SRV & A Record Return:');
body += bullet('The client caches the returned IP mapping and initiates the transport-layer TCP 3-way handshake.', '5. Session Initiation:');

// SECTION 3
body += h1('3. PROTOCOLS USED & WORKING PRINCIPLES');
body += p('The system utilizes an enterprise multi-layer protocol stack conforming to both the OSI 7-Layer Reference Model and the TCP/IP 4-Layer Architecture:');

body += table(
  ['OSI Layer', 'Protocol(s) Used', 'Role in Network Packet Validation System'],
  [
    ['Layer 7: Application', 'HTTP/1.1, HTTPS, REST, DNS', 'Formats and transmits serialized JSON packet payloads; handles REST endpoints (/api/packets, /api/stats, /api/samples, /api/automata, /api/health).'],
    ['Layer 6: Presentation', 'TLS 1.3, SSL, JSON Encoding', 'Executes asymmetric/symmetric cryptographic encryption, data formatting, and JSON serialization of packet objects and state traces.'],
    ['Layer 5: Session', 'POSIX Sockets, TLS Session State', 'Establishes, manages, and terminates full-duplex session state between browser client, Express backend, and MongoDB Atlas.'],
    ['Layer 4: Transport', 'TCP (RFC 793), UDP (RFC 768)', 'TCP: Guarantees reliable, ordered delivery of database queries & REST API traffic.\nUDP: Evaluated and classified by the DFA engine for datagram traffic; handles DNS queries.'],
    ['Layer 3: Network', 'IPv4 (RFC 791), ICMP (RFC 792), BGP, ARP', 'IPv4: Evaluated by regular expressions and DFA octet bounds [0, 255].\nICMP: Evaluated by DFA; transport port checks are formally bypassed per RFC 792.'],
    ['Layers 1 & 2: Link / Physical', 'Ethernet 802.3, Wi-Fi 802.11, Cat6a', 'Governs frame encapsulation, 48-bit MAC addressing, CSMA/CA / CSMA/CD collision avoidance, and bit transmission across physical media.']
  ],
  [2200, 2600, 4560]
);

body += h2('3.1 Application Layer: HTTP/1.1 & REST Architecture');
body += p('Communication between the frontend client and the backend server follows strict RESTful (Representational State Transfer) constraints:');
body += bullet('Ingests packet records { sourceIp, destinationIp, protocol, sourcePort, destinationPort }. Executes regular expression validation and runs the 10-state DFA engine. Persists the classified packet and transition trace into MongoDB Atlas.', 'POST /api/packets:');
body += bullet('Retrieves historical packet logs with real-time keyword search (IP, protocol, classification) and multi-attribute filters.', 'GET /api/packets:');
body += bullet('Dynamically aggregates dashboard metrics from MongoDB Atlas (Total, Valid, Invalid, TCP, UDP, ICMP counts, and Validation Pass Rate).', 'GET /api/stats:');
body += bullet('Supplies the 8 predefined RFC 5737 academic test vectors.', 'GET /api/samples:');
body += bullet('Executes an on-demand validation and DFA classification cycle for a specific test vector.', 'POST /api/samples/test/:id:');
body += bullet('Exposes the formal 5-tuple mathematical specification M = (Q, Sigma, q0, F, delta) and transition matrix.', 'GET /api/automata:');
body += bullet('Provides live diagnostic telemetry on database connectivity (connected: true, host, database name).', 'GET /api/health:');

body += h2('3.2 Transport & Network Layer Protocol Analysis');
body += p('A. Transmission Control Protocol (TCP - RFC 793): Connection-oriented, reliable, and byte-stream-based. Relies on a 3-way handshake (SYN -> SYN-ACK -> ACK), sequence and acknowledgment numbers, and flow control. Ingested TCP packets must contain valid 16-bit integer source and destination ports in the range [1, 65535].');
body += p('B. User Datagram Protocol (UDP - RFC 768): Connectionless, lightweight, and message-oriented without handshakes or retransmissions. Ideal for real-time datagrams and DNS queries. Ingested UDP datagrams must contain valid 16-bit integer source and destination ports in the range [1, 65535].');
body += p('C. Internet Control Message Protocol (ICMP - RFC 792): An essential network-layer control and diagnostic protocol (used by ping and traceroute). Critical architectural difference: ICMP operates directly over IP (IP Protocol 1) and does not use TCP/UDP port numbers. In our system, the DFA recognizes PROTO_ICMP and transitions directly from DESTINATION_VALIDATION to ICMP_CLASSIFIED, bypassing port validation and upholding RFC standards.');

body += h2('3.3 Security Layer: TLS 1.3 Cryptographic Handshake');
body += p('All cloud interactions with MongoDB Atlas and GitHub Pages use Transport Layer Security (TLS 1.3). The client verifies the server X.509 digital certificate signed by a trusted root Certificate Authority. An Elliptic Curve Diffie-Hellman Ephemeral (ECDHE) key exchange establishes ephemeral symmetric keys, and session payloads are encrypted using AES-256-GCM, ensuring confidentiality, data integrity, and anti-replay protection.');

// SECTION 4
body += h1('4. PORT NUMBERS & JUSTIFICATION');
body += p('Port numbers are 16-bit unsigned integers (0 to 65535) defined at the Transport Layer to demultiplex concurrent communication flows to specific processes:');

body += table(
  ['Port Number', 'Protocol', 'Associated Service', 'Technical Justification & Purpose'],
  [
    ['443', 'TCP', 'HTTPS (Secure Web)', 'Standard IANA encrypted port used to deliver the React frontend from GitHub Pages CDN. Prevents packet sniffing on public networks.'],
    ['80', 'TCP', 'HTTP (Standard Web)', 'Standard web port. The system validates destination port 80 during HTTP packet classification.'],
    ['5000', 'TCP', 'Express Backend API', 'Dedicated local application server listener port (process.env.PORT || 5000) for REST API routing.'],
    ['53', 'UDP/TCP', 'DNS Resolution', 'Standard IANA port for domain resolution queries (cluster0.9idrlwn.mongodb.net and github.io).'],
    ['27017', 'TCP', 'MongoDB Wire Protocol', 'Standard IANA port for MongoDB database engine socket connections over TLS.'],
    ['1 - 65535', 'TCP/UDP', 'Allowable Packet Ports', 'Full 16-bit integer range validated by PORT_REGEX and logical boundary checks in packetValidator.js.'],
    ['49152 - 65535', 'TCP', 'Ephemeral Client Ports', 'Dynamically assigned by client operating system to distinguish multiple outbound client sessions.']
  ],
  [1400, 1400, 2400, 4160]
);

body += h2('4.1 Socket Pair Analysis');
body += p('At the Transport Layer, every unique, bidirectional network connection is formally defined by a 4-tuple Socket Pair:');
body += p('Socket Pair = (Source IP, Source Port, Destination IP, Destination Port)', { bold: true, color: '0369A1' });
body += p('Example 1: Ingested Web Traffic Packet (HTTP Web Query): (192.0.2.10 : 49152, 198.51.100.80 : 80). Source Port 49152 is dynamically allocated by the client OS, while Destination Port 80 identifies the web server. Both ports fall within [1, 65535]. The DFA transits through PORT_VALIDATION to TCP_CLASSIFIED and finally ACCEPTED.');
body += p('Example 2: Ingested ICMP Diagnostic Packet (RFC 792): (192.0.2.1 : null, 203.0.113.1 : null). Because ICMP is a Layer 3 protocol, transport ports are null. The DFA recognizes PROTO_ICMP and transits directly to ICMP_CLASSIFIED, preventing false rejections.');

// SECTION 5
body += h1('5. END-TO-END PACKET FLOW & LIFECYCLE');
body += p('The sequence diagram below illustrates the complete traversal lifecycle of a network packet from user ingestion to regex validation, DFA state transitions, MongoDB Atlas persistence, and dashboard visualization:');

body += codeBlock([
  '[Client Dashboard]       [Local Router]        [GitHub Pages]       [Express Server]      [MongoDB Atlas]',
  '        |                      |                      |                     |                    |',
  ' 1. DNS Query (UDP 53) ------->|--------------------->|                     |                    |',
  '    <-- DNS IP Resolved -------|<---------------------|                     |                    |',
  '        |                      |                      |                     |                    |',
  ' 2. HTTPS GET / -------------->|--------------------->|                     |                    |',
  '    <-- Serves React Bundle ---|<---------------------|                     |                    |',
  '        |                      |                      |                     |                    |',
  ' 3. Ingest Packet Form ------->| (Client Regex Check) |                     |                    |',
  '        |                      |                      |                     |                    |',
  ' 4. POST /api/packets -------->|------------------------------------------->|                    |',
  '    Payload: {srcIp, dstIp,    |                      |                     | 5. Regex Engine    |',
  '              proto, ports}    |                      |                     |    Octet Check     |',
  '        |                      |                      |                     | 6. DFA Evaluation: |',
  '        |                      |                      |                     |    q0 --> ACCEPTED |',
  '        |                      |                      |                     | 7. TLS Socket Write|',
  '        |                      |                      |                     |    (Port 27017) -->|',
  '        |                      |                      |                     | <-- Write ACK -----|',
  '        |                      |                      |                     |                    |',
  ' 8. HTTP 201 Created <---------|<-------------------------------------------|                    |',
  '    {success, dfaReport, trace}|                      |                     |                    |',
  '        |                      |                      |                     |                    |',
  ' 9. UI Glows Green & Animates  |                      |                     |                    |',
  '    State Transition Sequence  |                      |                     |                    |'
]);

body += h2('5.1 Detailed 10-Step Packet Traversal');
body += bullet('The network analyst inputs packet parameters (e.g., Source IP 192.0.2.10, Destination IP 198.51.100.80, Protocol TCP, Source Port 49152, Destination Port 80). The browser serializes these values into a JSON object.', '1. User Submission & JSON Serialization:');
body += bullet('The React application runs validateClientPacket(), executing IPV4_REGEX and port range boundary checks for immediate user feedback.', '2. Client-Side Lexical Pre-Validation:');
body += bullet('The client resolves domain names using recursive DNS queries over UDP Port 53, retrieving the destination IP address.', '3. DNS Address Resolution:');
body += bullet('A full TCP 3-way handshake (SYN -> SYN-ACK -> ACK) is established on Port 443, followed by a TLS 1.3 cryptographic key exchange using ECDHE and AES-256-GCM.', '4. Transport Layer TCP Handshake & TLS Encryption:');
body += bullet('The client NIC transmits frames to the local gateway router (192.168.1.1), which translates private IP 192.168.1.15 into public routable IP 103.212.x.x before transmitting across the WAN backbone.', '5. NAPT Gateway Traversal:');
body += bullet('The Express server receives the request at /api/packets. Body-parser middleware sanitizes and trims extraneous whitespace from all string fields.', '6. Express API Ingestion & Sanitization:');
body += bullet('packetValidator.js executes IPV4_REGEX, numerical octet range check [0-255], protocol matching, and port checks [1-65535].', '7. Lexical Regex & Numerical Octet Verification:');
body += bullet('packetDFA.js executes sequential state transitions: START -> SOURCE_VALIDATION -> DESTINATION_VALIDATION -> ... -> ACCEPTED. Every step records step, fromState, inputSymbol, toState, and formal mathematical explanation.', '8. Deterministic Finite Automaton (DFA) Execution:');
body += bullet('The backend initiates an authenticated TLS socket write on Port 27017 to cluster0.9idrlwn.mongodb.net. The MongoDB engine commits the document into the packets collection and returns an acknowledgment.', '9. MongoDB Atlas Persistence:');
body += bullet('The server returns an HTTP 201 Created response containing the packet document, validation flags, and DFA trace. The React UI updates its dashboard statistics, records table, and animates the state transition sequence in real time.', '10. Client Dynamic Render:');

// SECTION 6
body += h1('6. NETWORK SIMULATION SCENARIOS IN THE PROJECT');
body += p('The application includes an integrated testing module executing the 8 mandatory academic test cases (Question 51, Section 4.G) using reserved documentation IP addresses (RFC 5737):');

body += table(
  ['Simulation Action', 'Network Condition Simulated', 'Protocol Layer Behavior', 'DFA & Database Response'],
  [
    ['1. Valid TCP Packet', 'Healthy HTTP/Web traffic transmission (192.0.2.10:49152 -> 198.51.100.80:80)', 'Standard RFC 793 stream; valid IPv4 octets and port bounds', 'DFA sequentially transits to TCP_CLASSIFIED and halts in accepting state ACCEPTED. Stored in MongoDB.'],
    ['2. Valid UDP Packet', 'Healthy DNS query datagram (198.51.100.15:53535 -> 203.0.113.53:53)', 'Standard RFC 768 datagram; valid IPv4 octets and port bounds', 'DFA sequentially transits to UDP_CLASSIFIED and halts in accepting state ACCEPTED. Stored in MongoDB.'],
    ['3. Valid ICMP Packet', 'Network layer diagnostic Echo/Ping message (192.0.2.1 -> 203.0.113.1)', 'RFC 792 network layer control message; transport ports are omitted/null', 'DFA recognizes PROTO_ICMP, bypasses port validation, and halts in ACCEPTED. Stored in MongoDB.'],
    ['4. Invalid Source IP', 'Corrupt / out-of-range packet header (192.0.2.299 -> 198.51.100.20)', 'IP layer violation: Octet 4 (299) exceeds 8-bit unsigned integer limit (255)', 'DFA rejects packet at Step 1 (INVALID_SRC_IP) and immediately enters trap state REJECTED.'],
    ['5. Invalid Destination IP', 'Malformed IP packet (192.0.2.55 -> 198.51.100.xyz)', 'Lexical violation: Destination IP contains non-numeric alphabetic characters', 'DFA rejects packet at Step 2 (INVALID_DST_IP) and transitions to trap state REJECTED.'],
    ['6. Invalid Port Number', 'Transport port overflow (192.0.2.50:4000 -> 198.51.100.70:72000)', 'Transport layer violation: Port 72000 exceeds 16-bit integer maximum (65535)', 'DFA rejects packet at Step 4 (INVALID_PORTS) and transitions to trap state REJECTED.'],
    ['7. Missing Protocol', 'Header without transport protocol identification (protocol: "")', 'Protocol violation: Payload missing protocol specification', 'DFA rejects packet at Step 3 (INVALID_PROTO) and transitions to trap state REJECTED.'],
    ['8. Malformed Packet', 'Corrupted datagram with multiple field errors (300.500.700.900, port 999999)', 'Multiple Layer 3 & Layer 4 syntax and numerical violations', 'DFA triggers immediate trap transition at Step 1 to REJECTED. Multiple diagnostics logged.']
  ],
  [1800, 2600, 2400, 2560]
);

// SECTION 7
body += h1('7. GITHUB REPOSITORY & LIVE DEPLOYMENT LINKS');
body += p('The complete project source code, live deployment, and cloud database cluster details are cataloged below:');

body += table(
  ['Resource', 'Platform', 'Public Access Link'],
  [
    ['GitHub Source Code Repository', 'GitHub', 'https://github.com/Shivaranjini-S36/network-packet-validation'],
    ['Live Web Application (GitHub Pages)', 'GitHub Pages', 'https://shivaranjini-s36.github.io/network-packet-validation/'],
    ['Cloud Database Cluster', 'MongoDB Atlas', 'cluster0.9idrlwn.mongodb.net (Database: network_packet_db)']
  ],
  [2800, 2200, 4360]
);

body += p('Document generated natively in Microsoft Word (.docx) OpenXML format for academic evaluation.', { italic: true, size: 18, color: '64748b', spaceBefore: 300, spaceAfter: 100, align: 'center' });

// 5. word/document.xml
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), documentXml);

// Zip into docx using PowerShell .NET ZipFile API
const docxTarget = path.join(__dirname, 'documentation', 'Network-Packet-Validation-Report.docx');
const rootDocxTarget = path.join(__dirname, 'Network-Packet-Validation-Report.docx');

if (fs.existsSync(docxTarget)) fs.unlinkSync(docxTarget);
if (fs.existsSync(rootDocxTarget)) fs.unlinkSync(rootDocxTarget);

const zipCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('${tempDir}', '${docxTarget}')"`;
execSync(zipCmd);

// Copy to root as well
fs.copyFileSync(docxTarget, rootDocxTarget);

// Clean up temp
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('Successfully generated Word Document (.docx):');
console.log('1.', docxTarget);
console.log('2.', rootDocxTarget);
