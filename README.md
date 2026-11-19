# Network Packet Format Validation and Classification System
### Academic College Project Assessment – Question No. 51

![NetValidator](https://img.shields.io/badge/Question-51-06b6d4?style=for-the-badge)
![MERN Stack](https://img.shields.io/badge/Stack-React_|_Node_|_Express_|_MongoDB-10b981?style=for-the-badge)
![FLAT Automata](https://img.shields.io/badge/Automata-DFA_Engine-8b5cf6?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-17%2F17_Passed-success?style=for-the-badge)

---

## 1. Project Description

**NetValidator** is a full-stack web application developed for **Question No. 51: Network Packet Format Validation and Classification System**.

The application accepts network packet records containing Source IP Address, Destination IP Address, Protocol, and Port Information. It applies rigorous JavaScript Regular Expressions and numerical range checks to verify packet fields, executes a 10-state **Deterministic Finite Automaton (DFA)** to classify packets according to predefined protocol patterns, and presents valid and invalid packets, classifications, and validation error diagnostics in a responsive, searchable interface.

### Official Problem Statement
> *"Create a web application that accepts sample network packet records containing source address, destination address, protocol, and port information. Use regular expressions and validation rules to verify packet fields, and finite automata to classify packets according to predefined protocol patterns. Display valid and invalid packets, protocol classifications, and validation errors in a searchable interface."*

---

## 2. Mandatory Technologies

- **Frontend:** React.js 18 (Single Page Application, Hooks, Modular Components)
- **Runtime Environment:** Node.js
- **Backend Framework:** Express.js 4.x
- **Database:** MongoDB (via Mongoose ODM) with automated local persistence fallback
- **Input Validation:** Regular Expressions (`IPV4_REGEX`, `PORT_REGEX`, `PROTOCOL_REGEX`) and range boundary logic
- **Formal Language Implementation:** Deterministic Finite Automaton (DFA) $M = (Q, \Sigma, q_0, F, \delta)$

---

## 3. Project Directory Structure

```
network-packet-validation/
│
├── client/                               # Frontend React Application
│   ├── src/
│   │   ├── components/                   # Reusable React components
│   │   │   ├── Sidebar.jsx               # Responsive navigation sidebar
│   │   │   ├── Header.jsx                # Top bar with status and quick actions
│   │   │   ├── DashboardStats.jsx        # 6-card dynamic metric overview
│   │   │   ├── PacketForm.jsx            # Ingestion form with real-time validation
│   │   │   ├── PacketTable.jsx           # Searchable audit table with filters & delete
│   │   │   ├── PacketDetailModal.jsx     # Detailed inspect modal with transition trace
│   │   │   ├── DfaVisualizer.jsx         # SVG state diagram & step simulator
│   │   │   ├── TransitionTable.jsx       # Formal transition matrix table
│   │   │   └── SampleTester.jsx          # 8 RFC test case runners
│   │   ├── pages/                        # Application view modules
│   │   │   ├── DashboardPage.jsx         # Live metrics & protocol distribution
│   │   │   ├── AddPacketPage.jsx         # Packet submission interface
│   │   │   ├── PacketRecordsPage.jsx     # Full audit records with search
│   │   │   ├── SampleTestingPage.jsx     # Predefined RFC sample testing
│   │   │   ├── DfaVisualizationPage.jsx  # Automaton diagram & formal definition
│   │   │   └── PacketHistoryPage.jsx     # Historical log with CSV/JSON export
│   │   ├── services/                     # API & validation service clients
│   │   │   ├── api.js                    # Fetch wrapper for backend endpoints
│   │   │   └── validator.js              # Client-side regex & range validator
│   │   ├── App.jsx                       # Root React state container
│   │   ├── main.jsx                      # React 18 DOM mount point
│   │   └── index.css                     # Custom network security dark theme
│   ├── index.html                        # Application HTML entry point
│   ├── package.json                      # Client package configuration
│   └── vite.config.js                    # Vite bundler configuration
│
├── server/                               # Backend Express.js Server & DFA Engine
│   ├── automata/
│   │   └── packetDFA.js                  # Deterministic Finite Automaton (Q, Σ, q0, F, δ)
│   ├── config/
│   │   └── db.js                         # MongoDB connection & fallback storage manager
│   ├── controllers/
│   │   └── packetController.js           # CRUD, search, stats, DFA execution handlers
│   ├── data/
│   │   └── samplePackets.js              # 8 RFC test vectors & seed data
│   ├── middleware/
│   │   └── errorHandler.js               # Global error handler
│   ├── models/
│   │   └── Packet.js                     # Mongoose packet schema & indexes
│   ├── routes/
│   │   └── packetRoutes.js               # REST API endpoints
│   ├── test/                             # Automated test suites
│   │   ├── dfa.test.js                   # 9 formal DFA state machine tests
│   │   └── api.test.js                   # 8 regex, validation & sample tests
│   ├── validators/
│   │   └── packetValidator.js            # Lexical regex & range verification
│   ├── server.js                         # Main Express application entrypoint
│   ├── package.json                      # Backend dependencies & test scripts
│   ├── .env                              # Active environment configuration
│   └── .env.example                      # Template environment variables
│
├── documentation/                        # Comprehensive Academic Documentation
│   ├── Problem-Statement.md              # Question 51 problem description & scope
│   ├── System-Architecture.md            # 3-tier architecture, sequence & REST APIs
│   ├── DFA-Design.md                     # Formal 5-tuple M=(Q, Σ, q0, F, δ) specification
│   ├── State-Transition-Table.md         # Complete transition table for all paths
│   ├── Test-Cases.md                     # 17 test cases with expected vs actual results
│   └── Project-Report.md                 # Complete formal academic report
│
├── .gitignore                            # Excludes node_modules, .env, build artifacts
├── .env.example                          # Root environment template
└── README.md                             # Project documentation & run guide
```

---

## 4. Environment & Database Configuration

1. In the `server/` directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your MongoDB connection string in `server/.env`:
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/network_packet_db
   DB_NAME=network_packet_db
   NODE_ENV=development
   ```
   > **Note on Database Connection:**
   > - If MongoDB is running locally or a MongoDB Atlas URI is provided, the application connects to MongoDB and stores records in the `packets` collection.
   > - If MongoDB is not yet running, the built-in **Local Persistence Fallback Engine** ensures that all operations (Ingestion, Validation, DFA Execution, Filtering, Deletion, and Statistics) continue to work seamlessly without application crashes.

---

## 5. How to Run the Application in VS Code

### Step 1: Open Terminal in VS Code
Ensure you are in the project root:
```bash
cd "C:\Users\Admin\.gemini\antigravity\scratch\network-packet-validation"
```

### Step 2: Run Automated Tests
Execute the comprehensive DFA and API unit tests:
```bash
# Run DFA Automata Unit Tests (9 Tests)
cd server
node test/dfa.test.js

# Run API, Regex & Sample Tests (8 Tests)
node test/api.test.js
```
*Expected Result: 17/17 Tests Pass with 100% success rate.*

### Step 3: Start the Backend Server
From the `server` directory, execute:
```bash
node server.js
```
The server will start on port 5000:
- **Application URL:** `http://localhost:5000`
- **Health Check API:** `http://localhost:5000/api/health`
- **Packets API:** `http://localhost:5000/api/packets`
- **Automata Specification API:** `http://localhost:5000/api/automata`

### Step 4: Open the Web Application
Open your web browser and navigate to:
```
http://localhost:5000
```

---

## 6. Predefined College Sample Test Cases (Section 4.G)

Navigate to the **Sample Testing** section in the sidebar to execute the 8 required test cases:

1. **Valid TCP Packet:** `192.0.2.10:49152` → `198.51.100.80:80` (HTTP) → **ACCEPTED (`TCP_PACKET`)**
2. **Valid UDP Packet:** `198.51.100.15:53535` → `203.0.113.53:53` (DNS) → **ACCEPTED (`UDP_PACKET`)**
3. **Valid ICMP Packet:** `192.0.2.1` → `203.0.113.1` (Echo) → **ACCEPTED (`ICMP_PACKET`, Port check bypassed)**
4. **Invalid Source IP:** `192.0.2.299` (Octet 299 > 255) → **REJECTED (Trap State)**
5. **Invalid Destination IP:** `198.51.100.xyz` (Non-numeric characters) → **REJECTED (Trap State)**
6. **Invalid Port:** Port `72000` (Exceeds 16-bit integer 65535) → **REJECTED (Trap State)**
7. **Missing Protocol:** Protocol empty or unsupported → **REJECTED (Trap State)**
8. **Malformed Packet:** Multiple structural errors across octets and ports → **REJECTED (Trap State)**

---

## 7. Deterministic Finite Automaton (DFA) Specification

The formal 5-tuple:
$$M = (Q, \Sigma, q_0, F, \delta)$$

- **States Set ($Q$):**
  `START`, `SOURCE_VALIDATION`, `DESTINATION_VALIDATION`, `PROTOCOL_VALIDATION`, `PORT_VALIDATION`, `TCP_CLASSIFIED`, `UDP_CLASSIFIED`, `ICMP_CLASSIFIED`, `ACCEPTED`, `REJECTED`
- **Alphabet ($\Sigma$):**
  `VALID_SRC_IP`, `INVALID_SRC_IP`, `VALID_DST_IP`, `INVALID_DST_IP`, `PROTO_TCP`, `PROTO_UDP`, `PROTO_ICMP`, `INVALID_PROTO`, `VALID_PORTS`, `INVALID_PORTS`, `DISPATCH_TCP`, `DISPATCH_UDP`, `FINALIZE_ACCEPT`
- **Initial State ($q_0$):** `START`
- **Final States ($F$):** `{ ACCEPTED }`
- **Trap / Sink State:** `REJECTED`

---

## 8. License & Academic Attribution
Developed for Third-Year B.Tech Information Technology Assessment.
Under MIT License.
