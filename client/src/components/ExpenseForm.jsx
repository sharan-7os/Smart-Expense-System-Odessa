import React, { useState, useEffect } from 'react';

const CATEGORIES = ['Food', 'Travel', 'Accommodation', 'Tickets', 'Other'];

export default function ExpenseForm({ participants, editingExpense, onSubmit, onCancel }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerId, setPayerId] = useState('');
  const [beneficiaryIds, setBeneficiaryIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description || '');
      setAmount(editingExpense.amount ? String(editingExpense.amount) : '');
      setCategory(editingExpense.category || 'Food');
      setDate(
        editingExpense.date
          ? new Date(editingExpense.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPayerId(editingExpense.payer?._id || editingExpense.payer || '');
      const bIds = (editingExpense.beneficiaries || []).map((b) => (b._id ? b._id : b));
      setBeneficiaryIds(bIds);
    } else {
      // Default new expense
      setDescription('');
      setAmount('');
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      if (participants.length > 0 && !payerId) {
        setPayerId(participants[0]._id);
      }
      // Default: all participants selected as beneficiaries
      setBeneficiaryIds(participants.map((p) => p._id));
    }
  }, [editingExpense, participants]);

  const toggleBeneficiary = (id) => {
    if (beneficiaryIds.includes(id)) {
      setBeneficiaryIds(beneficiaryIds.filter((bId) => bId !== id));
    } else {
      setBeneficiaryIds([...beneficiaryIds, id]);
    }
  };

  const selectAllBeneficiaries = () => {
    setBeneficiaryIds(participants.map((p) => p._id));
  };

  const clearAllBeneficiaries = () => {
    setBeneficiaryIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please provide an expense description.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be a positive number.');
      return;
    }

    if (!payerId) {
      setError('Please select who paid for this expense.');
      return;
    }

    if (beneficiaryIds.length === 0) {
      setError('Please select at least one participant sharing this expense.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        amount: numAmount,
        payerId,
        beneficiaryIds,
        category,
        date,
      });
      if (!editingExpense) {
        // Reset form
        setDescription('');
        setAmount('');
        selectAllBeneficiaries();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Preview split
  const numAmount = parseFloat(amount) || 0;
  const splitPerPerson = beneficiaryIds.length > 0 ? (numAmount / beneficiaryIds.length).toFixed(2) : 0;

  return (
    <div className="card expense-form-card">
      <div className="card-header">
        <h3>{editingExpense ? '✏️ Edit Expense' : '➕ Add New Expense'}</h3>
        {editingExpense && (
          <button type="button" className="btn btn-outline-sm" onClick={onCancel}>
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-row">
          <div className="form-group flex-2">
            <label htmlFor="exp-desc">Description *</label>
            <input
              id="exp-desc"
              type="text"
              className="text-input"
              placeholder="e.g. Hackathon Entry, Cab to venue, Dinner"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="exp-amount">Amount (₹) *</label>
            <input
              id="exp-amount"
              type="number"
              step="0.01"
              min="0.01"
              className="text-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="exp-category">Category</label>
            <select
              id="exp-category"
              className="select-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group flex-1">
            <label htmlFor="exp-date">Date</label>
            <input
              id="exp-date"
              type="date"
              className="text-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="form-group flex-1">
            <label htmlFor="exp-payer">Paid By *</label>
            <select
              id="exp-payer"
              className="select-input"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              disabled={submitting}
            >
              {participants.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="beneficiaries-section">
          <div className="beneficiaries-header">
            <label>Split Between ({beneficiaryIds.length} selected):</label>
            <div className="beneficiary-actions">
              <button
                type="button"
                className="btn-text-action"
                onClick={selectAllBeneficiaries}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn-text-action"
                onClick={clearAllBeneficiaries}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="beneficiaries-grid">
            {participants.map((p) => {
              const isChecked = beneficiaryIds.includes(p._id);
              return (
                <label
                  key={p._id}
                  className={`beneficiary-checkbox-card ${isChecked ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleBeneficiary(p._id)}
                  />
                  <span className="checkbox-name">{p.name}</span>
                </label>
              );
            })}
          </div>

          {numAmount > 0 && beneficiaryIds.length > 0 && (
            <div className="split-preview-banner">
              💡 ₹{numAmount.toFixed(2)} split equally among {beneficiaryIds.length} person(s) = <strong>₹{splitPerPerson} each</strong>
            </div>
          )}
        </div>

        {error && <div className="error-alert">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting || participants.length === 0}>
            {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : '+ Record Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
