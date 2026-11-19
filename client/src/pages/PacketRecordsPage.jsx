import React from 'react';
import PacketTable from '../components/PacketTable';

export default function PacketRecordsPage({
  packets,
  onViewDetails,
  onDeletePacket,
  searchQuery,
  setSearchQuery,
  selectedProtocol,
  setSelectedProtocol,
  selectedStatus,
  setSelectedStatus,
  onNavigate
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Browse, search, and filter stored packet records from MongoDB. Inspect individual state transition traces or delete records with confirmation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('add-packet')}>
            ➕ Ingest Packet
          </button>
        </div>
      </div>

      <div className="card">
        <PacketTable
          packets={packets}
          onViewDetails={onViewDetails}
          onDeletePacket={onDeletePacket}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProtocol={selectedProtocol}
          setSelectedProtocol={setSelectedProtocol}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />
      </div>
    </div>
  );
}
