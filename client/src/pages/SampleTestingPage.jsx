import React from 'react';
import SampleTester from '../components/SampleTester';

export default function SampleTestingPage({ samples, onSampleExecuted, onLoadIntoForm, onResetSamples }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Academic test vectors fulfilling Question 51 Section 4.G. Test both valid protocol variations and multiple failure vectors using reserved documentation IP addresses (RFC 5737).
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onResetSamples}>
          🔄 Reset Test Suite
        </button>
      </div>

      <SampleTester
        samples={samples}
        onSampleExecuted={onSampleExecuted}
        onLoadIntoForm={onLoadIntoForm}
      />
    </div>
  );
}
