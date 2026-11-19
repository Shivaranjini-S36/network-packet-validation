import React from 'react';

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const cards = [
    { label: 'Total Packets', val: stats.total || 0, icon: '📦', color: 'cyan' },
    { label: 'Valid Packets', val: stats.validCount || 0, icon: '✅', color: 'green' },
    { label: 'Invalid Packets', val: stats.invalidCount || 0, icon: '❌', color: 'red' },
    { label: 'TCP Packets', val: stats.protocolDistribution?.TCP || 0, icon: '🌐', color: 'blue' },
    { label: 'UDP Packets', val: stats.protocolDistribution?.UDP || 0, icon: '⚡', color: 'purple' },
    { label: 'ICMP Packets', val: stats.protocolDistribution?.ICMP || 0, icon: '📡', color: 'amber' }
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => (
        <div key={i} className="stat-card">
          <div className={`stat-icon ${c.color}`}>{c.icon}</div>
          <div>
            <div className="stat-val">{c.val}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
