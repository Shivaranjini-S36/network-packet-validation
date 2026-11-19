# State Transition Table

## 1. Formal Transition Matrix ($\delta: Q \times \Sigma \to Q$)

This table specifies the exact transition behavior of the Deterministic Finite Automaton (DFA) implemented in `server/automata/packetDFA.js`. Both valid accepting paths and invalid rejection paths leading to the absorbing trap state are comprehensively documented.

| Current State ($q \in Q$) | Input / Event Symbol ($\sigma \in \Sigma$) | Next State ($\delta(q, \sigma)$) | Transition Type | Explanation |
|---|---|---|---|---|
| `START` | `VALID_SRC_IP` | `SOURCE_VALIDATION` | Valid Transition | Source IP string matched 4 octets separated by dots, each octet in range $[0, 255]$. |
| `START` | `INVALID_SRC_IP` | `REJECTED` | Rejection (Trap) | Source IP was empty, had non-numeric octets, had wrong number of octets, or octet $> 255$. |
| `SOURCE_VALIDATION` | `VALID_DST_IP` | `DESTINATION_VALIDATION` | Valid Transition | Destination IP matched IPv4 regex and each octet satisfied range bounds $[0, 255]$. |
| `SOURCE_VALIDATION` | `INVALID_DST_IP` | `REJECTED` | Rejection (Trap) | Destination IP failed format test or octet range bounds. |
| `DESTINATION_VALIDATION` | `PROTO_TCP` | `PROTOCOL_VALIDATION` | Valid Transition | Protocol identified as Transmission Control Protocol (TCP). Transport port validation required. |
| `DESTINATION_VALIDATION` | `PROTO_UDP` | `PROTOCOL_VALIDATION` | Valid Transition | Protocol identified as User Datagram Protocol (UDP). Transport port validation required. |
| `DESTINATION_VALIDATION` | `PROTO_ICMP` | `ICMP_CLASSIFIED` | Valid Transition | Protocol identified as ICMP. RFC 792 bypass: ICMP is network layer, so transport ports are omitted. |
| `DESTINATION_VALIDATION` | `INVALID_PROTO` | `REJECTED` | Rejection (Trap) | Protocol was empty, misspelled, or unsupported (e.g., HTTP, FTP, unknown string). |
| `PROTOCOL_VALIDATION` | `VALID_PORTS` | `PORT_VALIDATION` | Valid Transition | Both Source Port and Destination Port are valid integers within $[1, 65535]$. |
| `PROTOCOL_VALIDATION` | `INVALID_PORTS` | `REJECTED` | Rejection (Trap) | Source or Destination port is missing, non-numeric, or outside valid range $[1, 65535]$. |
| `PORT_VALIDATION` | `DISPATCH_TCP` | `TCP_CLASSIFIED` | Valid Transition | Port validation completed. Automaton enters TCP classification state. |
| `PORT_VALIDATION` | `DISPATCH_UDP` | `UDP_CLASSIFIED` | Valid Transition | Port validation completed. Automaton enters UDP classification state. |
| `TCP_CLASSIFIED` | `FINALIZE_ACCEPT` | `ACCEPTED` | Acceptance ($F$) | All TCP criteria verified. Automaton reaches final accepting state $F$. |
| `UDP_CLASSIFIED` | `FINALIZE_ACCEPT` | `ACCEPTED` | Acceptance ($F$) | All UDP criteria verified. Automaton reaches final accepting state $F$. |
| `ICMP_CLASSIFIED` | `FINALIZE_ACCEPT` | `ACCEPTED` | Acceptance ($F$) | All ICMP criteria verified. Automaton reaches final accepting state $F$. |
| `REJECTED` | *Any Symbol* | `REJECTED` | Absorbing Self-loop | The trap state is non-escapable; any further input symbols preserve the `REJECTED` status. |
| `ACCEPTED` | *Terminating* | `ACCEPTED` | Terminal State | Acceptance state reached. Final packet classification persisted to MongoDB. |

---

## 2. Path Traces for Primary Protocol Classes

### A. Valid TCP Packet Path Trace
$$\text{START} \xrightarrow{\text{VALID\_SRC\_IP}} \text{SOURCE\_VALIDATION} \xrightarrow{\text{VALID\_DST\_IP}} \text{DESTINATION\_VALIDATION} \xrightarrow{\text{PROTO\_TCP}} \text{PROTOCOL\_VALIDATION} \xrightarrow{\text{VALID\_PORTS}} \text{PORT\_VALIDATION} \xrightarrow{\text{DISPATCH\_TCP}} \text{TCP\_CLASSIFIED} \xrightarrow{\text{FINALIZE\_ACCEPT}} \mathbf{ACCEPTED}$$
- **Total Transitions:** 6 steps
- **Outcome:** Accepted, Classified as `TCP_PACKET`.

### B. Valid UDP Packet Path Trace
$$\text{START} \xrightarrow{\text{VALID\_SRC\_IP}} \text{SOURCE\_VALIDATION} \xrightarrow{\text{VALID\_DST\_IP}} \text{DESTINATION\_VALIDATION} \xrightarrow{\text{PROTO\_UDP}} \text{PROTOCOL\_VALIDATION} \xrightarrow{\text{VALID\_PORTS}} \text{PORT\_VALIDATION} \xrightarrow{\text{DISPATCH\_UDP}} \text{UDP\_CLASSIFIED} \xrightarrow{\text{FINALIZE\_ACCEPT}} \mathbf{ACCEPTED}$$
- **Total Transitions:** 6 steps
- **Outcome:** Accepted, Classified as `UDP_PACKET`.

### C. Valid ICMP Packet Path Trace (RFC 792 Bypass)
$$\text{START} \xrightarrow{\text{VALID\_SRC\_IP}} \text{SOURCE\_VALIDATION} \xrightarrow{\text{VALID\_DST\_IP}} \text{DESTINATION\_VALIDATION} \xrightarrow{\text{PROTO\_ICMP}} \text{ICMP\_CLASSIFIED} \xrightarrow{\text{FINALIZE\_ACCEPT}} \mathbf{ACCEPTED}$$
- **Total Transitions:** 4 steps
- **Outcome:** Accepted, Classified as `ICMP_PACKET`.

### D. Invalid Source IP Path Trace
$$\text{START} \xrightarrow{\text{INVALID\_SRC\_IP}} \mathbf{REJECTED}$$
- **Total Transitions:** 1 step
- **Outcome:** Rejected, Classified as `REJECTED_PACKET`.

### E. Invalid Destination IP Path Trace
$$\text{START} \xrightarrow{\text{VALID\_SRC\_IP}} \text{SOURCE\_VALIDATION} \xrightarrow{\text{INVALID\_DST\_IP}} \mathbf{REJECTED}$$
- **Total Transitions:** 2 steps
- **Outcome:** Rejected, Classified as `REJECTED_PACKET`.

### F. Invalid Port Path Trace (TCP/UDP)
$$\text{START} \xrightarrow{\text{VALID\_SRC\_IP}} \text{SOURCE\_VALIDATION} \xrightarrow{\text{VALID\_DST\_IP}} \text{DESTINATION\_VALIDATION} \xrightarrow{\text{PROTO\_TCP}} \text{PROTOCOL\_VALIDATION} \xrightarrow{\text{INVALID\_PORTS}} \mathbf{REJECTED}$$
- **Total Transitions:** 4 steps
- **Outcome:** Rejected, Classified as `REJECTED_PACKET`.
