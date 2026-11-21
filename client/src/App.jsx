import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PacketDetailModal from './components/PacketDetailModal';

// Pages
import DashboardPage from './pages/DashboardPage';
import AddPacketPage from './pages/AddPacketPage';
import PacketRecordsPage from './pages/PacketRecordsPage';
import SampleTestingPage from './pages/SampleTestingPage';
import DfaVisualizationPage from './pages/DfaVisualizationPage';
import PacketHistoryPage from './pages/PacketHistoryPage';
import TransitionTable from './components/TransitionTable';

// API services
import {
  fetchStats,
  fetchPackets,
  fetchSamples,
  fetchAutomata,
  removePacket,
  resetSampleData
} from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Application Data States
  const [stats, setStats] = useState(null);
  const [packets, setPackets] = useState([]);
  const [samples, setSamples] = useState([]);
  const [automataInfo, setAutomataInfo] = useState(null);
  const [dbStatus, setDbStatus] = useState({ connected: false, mode: 'Local Fallback' });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Inspection Modal State
  const [inspectedPacket, setInspectedPacket] = useState(null);

  // Form Pre-fill Buffer
  const [formPreset, setFormPreset] = useState(null);

  // Load Data
  const refreshAllData = useCallback(async () => {
    try {
      const [statsRes, packetsRes, samplesRes, autoRes] = await Promise.all([
        fetchStats(),
        fetchPackets({ search: searchQuery, protocol: selectedProtocol, status: selectedStatus }),
        fetchSamples(),
        fetchAutomata()
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        if (statsRes.database) setDbStatus(statsRes.database);
      }

      if (packetsRes.success) {
        setPackets(packetsRes.packets || []);
      }

      if (samplesRes.success) {
        setSamples(samplesRes.samples || []);
      }

      if (autoRes.success) {
        setAutomataInfo(autoRes.automata);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, [searchQuery, selectedProtocol, selectedStatus]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handler: Packet Added from Form
  const handlePacketAdded = (newPacket) => {
    refreshAllData();
  };

  // Handler: Delete Packet
  const handleDeletePacket = async (packetId) => {
    try {
      const res = await removePacket(packetId);
      if (res.success) {
        refreshAllData();
      }
    } catch (err) {
      alert(`Failed to delete packet: ${err.message}`);
    }
  };

  // Handler: Sample executed
  const handleSampleExecuted = (savedPacket) => {
    refreshAllData();
  };

  // Handler: Load sample into form
  const handleLoadIntoForm = (samplePacket) => {
    setFormPreset(samplePacket);
    setActivePage('add-packet');
  };

  // Handler: Reset samples
  const handleResetSamples = async () => {
    if (window.confirm('Reset all packet records back to standard test vector seeds?')) {
      await resetSampleData();
      await refreshAllData();
      alert('Sample records successfully reset!');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        dbStatus={dbStatus}
      />

      {/* Main Workspace */}
      <div className="main-wrapper">
        <Header
          activePage={activePage}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          onResetSamples={handleResetSamples}
          dbStatus={dbStatus}
        />

        <main className="content-body">
          {activePage === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onNavigate={setActivePage}
              onInspectPacket={setInspectedPacket}
            />
          )}

          {activePage === 'add-packet' && (
            <AddPacketPage
              onPacketAdded={handlePacketAdded}
              onNavigate={setActivePage}
              initialPreset={formPreset}
            />
          )}

          {activePage === 'records' && (
            <PacketRecordsPage
              packets={packets}
              onViewDetails={setInspectedPacket}
              onDeletePacket={handleDeletePacket}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedProtocol={selectedProtocol}
              setSelectedProtocol={setSelectedProtocol}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'sample-testing' && (
            <SampleTestingPage
              samples={samples}
              onSampleExecuted={handleSampleExecuted}
              onLoadIntoForm={handleLoadIntoForm}
              onResetSamples={handleResetSamples}
            />
          )}

          {activePage === 'dfa-visualizer' && (
            <DfaVisualizationPage
              automataInfo={automataInfo}
            />
          )}

          {activePage === 'transition-table' && (
            <TransitionTable />
          )}

          {activePage === 'history' && (
            <PacketHistoryPage
              packets={packets}
              onInspectPacket={setInspectedPacket}
            />
          )}
        </main>
      </div>

      {/* Packet Inspection Modal */}
      {inspectedPacket && (
        <PacketDetailModal
          packet={inspectedPacket}
          onClose={() => setInspectedPacket(null)}
        />
      )}
    </div>
  );
}
