/**
 * API Service Client
 * Handles HTTP requests to the Express backend for Question 51.
 */

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
}

export async function fetchPackets(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.protocol) query.append('protocol', params.protocol);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);

  const res = await fetch(`${BASE_URL}/packets?${query.toString()}`);
  return res.json();
}

export async function fetchPacketById(id) {
  const res = await fetch(`${BASE_URL}/packets/${id}`);
  return res.json();
}

export async function submitPacket(packetData) {
  const res = await fetch(`${BASE_URL}/packets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(packetData)
  });
  return res.json();
}

export async function removePacket(id) {
  const res = await fetch(`${BASE_URL}/packets/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function fetchSamples() {
  const res = await fetch(`${BASE_URL}/samples`);
  return res.json();
}

export async function testSampleById(id) {
  const res = await fetch(`${BASE_URL}/samples/test/${id}`, {
    method: 'POST'
  });
  return res.json();
}

export async function resetSampleData() {
  const res = await fetch(`${BASE_URL}/samples/reset`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchAutomata() {
  const res = await fetch(`${BASE_URL}/automata`);
  return res.json();
}
