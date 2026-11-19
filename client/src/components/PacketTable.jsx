import React, { useState } from 'react';

export default function PacketTable({
  packets = [],
  onViewDetails,
  onDeletePacket,
  searchQuery,
  setSearchQuery,
  selectedProtocol,
  setSelectedProtocol,
  selectedStatus,
  setSelectedStatus
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId && onDeletePacket) {
      await onDeletePacket(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div>
      {/* Search & Filter Controls */}
      <div className="filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by IP, Protocol, Classification or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-actions">
          {/* Protocol Filter */}
          <select
            className="filter-select"
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
          >
            <option value="ALL">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ICMP">ICMP</option>
          </select>

          {/* Validation Status Filter */}
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="valid">Valid Packets</option>
            <option value="invalid">Invalid Packets</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Packet ID</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Src Port</th>
              <th>Dst Port</th>
              <th>Status</th>
              <th>DFA Classification</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {packets.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔍</div>
                  <div style={{ fontWeight: 600 }}>No matching packet records found</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Try adjusting your search query or reset filters.
                  </div>
                </td>
              </tr>
            ) : (
              packets.map(p => {
                const isIcmp = p.protocol === 'ICMP';
                return (
                  <tr key={p._id || p.packetId}>
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
                    <td className="mono-cell" style={{ color: isIcmp ? '#64748b' : '#e2e8f0' }}>
                      {isIcmp ? '—' : (p.sourcePort ?? '—')}
                    </td>
                    <td className="mono-cell" style={{ color: isIcmp ? '#64748b' : '#e2e8f0' }}>
                      {isIcmp ? '—' : (p.destinationPort ?? '—')}
                    </td>
                    <td>
                      <span className={`badge ${p.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                        {p.isValid ? 'VALID' : 'INVALID'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-tcp" style={{ fontSize: '0.7rem' }}>
                        {p.dfaClassification}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(p.createdAt || Date.now()).toLocaleTimeString()}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: '0.4rem' }}
                        onClick={() => onViewDetails(p)}
                        title="View Packet Trace &amp; Details"
                      >
                        Inspect
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteClick(p.packetId)}
                        title="Delete Packet Record"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmId(null)}>×</button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Are you sure you want to permanently delete packet record{' '}
              <strong style={{ color: '#f87171' }}>{deleteConfirmId}</strong> from the database?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
