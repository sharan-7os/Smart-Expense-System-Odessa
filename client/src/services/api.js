/**
 * CampusSplit - API Client Service
 * Centralized fetch functions with JSON parsing and standardized error handling.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Groups
  getGroups: () => request('/groups'),
  createGroup: (name, description) =>
    request('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  getGroup: (groupId) => request(`/groups/${groupId}`),
  deleteGroup: (groupId) =>
    request(`/groups/${groupId}`, {
      method: 'DELETE',
    }),

  // Participants
  getParticipants: (groupId) => request(`/groups/${groupId}/participants`),
  addParticipant: (groupId, name) =>
    request(`/groups/${groupId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  deleteParticipant: (groupId, participantId) =>
    request(`/groups/${groupId}/participants/${participantId}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (groupId) => request(`/groups/${groupId}/expenses`),
  createExpense: (groupId, expenseData) =>
    request(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),
  updateExpense: (groupId, expenseId, expenseData) =>
    request(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),
  deleteExpense: (groupId, expenseId) =>
    request(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Balances & Settlements
  getBalancesAndSettlements: (groupId) =>
    request(`/groups/${groupId}/settlements/balances-and-settlements`),
  recordSettlementPayment: (groupId, paymentData) =>
    request(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  deleteSettlementPayment: (groupId, settlementId) =>
    request(`/groups/${groupId}/settlements/${settlementId}`, {
      method: 'DELETE',
    }),
};
