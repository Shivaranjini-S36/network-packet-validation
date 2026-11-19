import React, { useState } from 'react';

export default function PacketHistoryPage({ packets, onInspectPacket }) {
  const [historySearch, setHistorySearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');

  const filtered = packets.filter(p => {
    const q = historySearch.toLowerCase().trim();
    const matchQ = !q ||
      p.packetId.toLowerCase().includes(q) ||
      p.sourceIp.toLowerCase().includes(q) ||
      p.destinationIp.toLowerCase().includes(q) ||
      p.protocol.toLowerCase().includes(q);

    const matchClass = filterClass === 'ALL' || p.dfaClassification === filterClass;

    return matchQ && matchClass;
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `packet_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportCSV = () => {
    const headers = ['PacketID', 'SourceIP', 'DestinationIP', 'Protocol', 'SourcePort', 'DestinationPort', 'IsValid', 'DFAClassification', 'FinalState', 'Timestamp'];
    const rows = packets.map(p => [
      p.packetId,
      p.sourceIp,
      p.destinationIp,
      p.protocol,
      p.sourcePort ?? 'N/A',
      p.destinationPort ?? 'N/A',
      p.isValid ? 'VALID' : 'INVALID',
      p.dfaClassification,
      p.dfaFinalState,
      p.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `packet_history_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Historical audit trail of all packet submissions stored in MongoDB. Records remain permanently available across restarts and refreshes.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={exportJSON}>
            📥 Export JSON
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search historical audit logs..."
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
            />
            {historySearch && (
              <button
                onClick={() => setHistorySearch('')}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-actions">
            <select
              className="filter-select"
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
            >
              <option value="ALL">All Classifications</option>
              <option value="TCP_PACKET">TCP Packets</option>
              <option value="UDP_PACKET">UDP Packets</option>
              <option value="ICMP_PACKET">ICMP Packets</option>
              <option value="REJECTED_PACKET">Rejected Packets</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Packet ID</th>
                <th>Source IP</th>
                <th>Destination IP</th>
                <th>Protocol</th>
                <th>Validation Result</th>
                <th>DFA Classification</th>
                <th>Transitions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No matching history records found.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id || p.packetId}>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(p.createdAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {p.packetId}
                    </td>
                    <td className="mono-cell">{p.sourceIp}</td>
                    <td className="mono-cell">{p.destinationIp}</td>
                    <td>
                      <span className={`badge badge-${p.protocol?.toLowerCase()}`}>
                        {p.protocol}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                        {p.isValid ? 'ACCEPTED' : 'REJECTED'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-tcp">
                        {p.dfaClassification}
                      </span>
                    </td>
                    <td className="mono-cell" style={{ fontSize: '0.8rem' }}>
                      {p.stateTransitions?.length || 0} transitions
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onInspectPacket(p)}
                      >
                        Audit Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
