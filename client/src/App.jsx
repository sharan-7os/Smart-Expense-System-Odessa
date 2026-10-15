import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import DashboardSummary from './components/DashboardSummary';
import ParticipantManager from './components/ParticipantManager';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BalanceTable from './components/BalanceTable';
import SettlementList from './components/SettlementList';
import CreateGroupModal from './components/CreateGroupModal';
import './App.css';

export default function App() {
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [suggestedSettlements, setSuggestedSettlements] = useState([]);
  const [completedSettlements, setCompletedSettlements] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balances' | 'settlements'
  const [editingExpense, setEditingExpense] = useState(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all groups
  const loadGroups = useCallback(async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.data);
      if (res.data.length > 0 && !currentGroup) {
        setCurrentGroup(res.data[0]);
      } else if (res.data.length === 0) {
        // Create an initial default group if none exists
        const initial = await api.createGroup(
          'Odessa Tech Fest 2026',
          'Hackathon and technical event group expenses'
        );
        setGroups([initial.data]);
        setCurrentGroup(initial.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentGroup]);

  // Fetch data for the active group
  const loadGroupData = useCallback(async (groupId) => {
    if (!groupId) return;
    try {
      const [partRes, expRes, balRes] = await Promise.all([
        api.getParticipants(groupId),
        api.getExpenses(groupId),
        api.getBalancesAndSettlements(groupId),
      ]);

      setParticipants(partRes.data);
      setExpenses(expRes.data);
      setBalances(balRes.data.balances);
      setSuggestedSettlements(balRes.data.suggestedSettlements);
      setCompletedSettlements(balRes.data.completedSettlements);
      setMetrics(balRes.data.metrics);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (currentGroup?._id) {
      loadGroupData(currentGroup._id);
    }
  }, [currentGroup, loadGroupData]);

  // Group handlers
  const handleSelectGroup = (groupId) => {
    const selected = groups.find((g) => g._id === groupId);
    if (selected) {
      setCurrentGroup(selected);
      setEditingExpense(null);
    }
  };

  const handleCreateGroup = async (name, description) => {
    const res = await api.createGroup(name, description);
    setGroups([res.data, ...groups]);
    setCurrentGroup(res.data);
    showToast(`Group "${res.data.name}" created!`);
  };

  // Participant handlers
  const handleAddParticipant = async (name) => {
    if (!currentGroup?._id) return;
    const res = await api.addParticipant(currentGroup._id, name);
    setParticipants([...participants, res.data]);
    showToast(`Added ${res.data.name} to group`);
    await loadGroupData(currentGroup._id);
  };

  const handleDeleteParticipant = async (id, name) => {
    if (!currentGroup?._id) return;
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    try {
      await api.deleteParticipant(currentGroup._id, id);
      showToast(`Removed ${name}`);
      await loadGroupData(currentGroup._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Expense handlers
  const handleExpenseSubmit = async (expenseData) => {
    if (!currentGroup?._id) return;
    if (editingExpense) {
      await api.updateExpense(currentGroup._id, editingExpense._id, expenseData);
      setEditingExpense(null);
      showToast('Expense updated successfully!');
    } else {
      await api.createExpense(currentGroup._id, expenseData);
      showToast('Expense recorded successfully!');
    }
    await loadGroupData(currentGroup._id);
    await loadGroups();
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setActiveTab('expenses');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteExpense = async (id, desc) => {
    if (!currentGroup?._id) return;
    if (!window.confirm(`Delete expense "${desc}"?`)) return;
    try {
      await api.deleteExpense(currentGroup._id, id);
      showToast(`Deleted "${desc}"`);
      if (editingExpense?._id === id) setEditingExpense(null);
      await loadGroupData(currentGroup._id);
      await loadGroups();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Settlement handlers
  const handleMarkPaid = async (paymentData) => {
    if (!currentGroup?._id) return;
    try {
      await api.recordSettlementPayment(currentGroup._id, paymentData);
      showToast(`Payment of ₹${paymentData.amount.toFixed(2)} marked as completed!`);
      await loadGroupData(currentGroup._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!currentGroup?._id) return;
    try {
      await api.deleteSettlementPayment(currentGroup._id, settlementId);
      showToast('Payment record removed');
      await loadGroupData(currentGroup._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading CampusSplit...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.type === 'success' ? '✓ ' : '⚠️ '}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="logo-icon">💸</div>
          <div>
            <h1 className="brand-title">CampusSplit</h1>
            <span className="brand-tagline">Group Expense Management & Fair Settlement</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Dashboard summary card & metrics */}
        <DashboardSummary
          group={currentGroup}
          metrics={metrics}
          groups={groups}
          onSelectGroup={handleSelectGroup}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        />

        {/* Participant Manager */}
        <ParticipantManager
          participants={participants}
          onAddParticipant={handleAddParticipant}
          onDeleteParticipant={handleDeleteParticipant}
        />

        {/* Tab Navigation */}
        <div className="tabs-navigation">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            🧾 Expenses & Ledger ({expenses.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`}
            onClick={() => setActiveTab('balances')}
          >
            ⚖️ Balances ({balances.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'settlements' ? 'active' : ''}`}
            onClick={() => setActiveTab('settlements')}
          >
            🤝 Settlements ({suggestedSettlements.length})
          </button>
        </div>

        {/* Tab Panels */}
        <div className="tab-content">
          {activeTab === 'expenses' && (
            <div className="tab-pane">
              <ExpenseForm
                participants={participants}
                editingExpense={editingExpense}
                onSubmit={handleExpenseSubmit}
                onCancel={() => setEditingExpense(null)}
              />
              <ExpenseList
                expenses={expenses}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>
          )}

          {activeTab === 'balances' && (
            <div className="tab-pane">
              <BalanceTable balances={balances} />
            </div>
          )}

          {activeTab === 'settlements' && (
            <div className="tab-pane">
              <SettlementList
                suggestedSettlements={suggestedSettlements}
                completedSettlements={completedSettlements}
                onMarkPaid={handleMarkPaid}
                onDeleteSettlement={handleDeleteSettlement}
              />
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
