import React from 'react';
import DfaVisualizer from '../components/DfaVisualizer';
import TransitionTable from '../components/TransitionTable';

export default function DfaVisualizationPage({ automataInfo }) {
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Formal language implementation of the Deterministic Finite Automaton (DFA) defined in Question 51.
          The state machine validates sequential packet components and assigns deterministic protocol classifications.
        </p>
      </div>

      <DfaVisualizer automataInfo={automataInfo} />

      <TransitionTable />
    </div>
  );
}
