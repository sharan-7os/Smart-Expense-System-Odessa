import React from 'react';

const CATEGORY_ICONS = {
  Food: '🍔',
  Travel: '🚕',
  Accommodation: '🏨',
  Tickets: '🎟️',
  Other: '📦',
};

export default function ExpenseList({ expenses, onEditExpense, onDeleteExpense }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="card empty-card">
        <div className="empty-icon">🧾</div>
        <h3>No expenses recorded yet</h3>
        <p>Use the form above to record your group's first shared expense.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Expense History ({expenses.length})</h3>
        <span className="card-subtext">Click Edit or Delete to make adjustments</span>
      </div>

      <div className="expense-list">
        {expenses.map((exp) => {
          const payerName = exp.payer?.name || 'Unknown';
          const beneficiaryNames = (exp.beneficiaries || []).map((b) => b.name || 'Unknown');
          const categoryIcon = CATEGORY_ICONS[exp.category] || '📦';
          const formattedDate = exp.date ? new Date(exp.date).toLocaleDateString() : '';

          return (
            <div key={exp._id} className="expense-item">
              <div className="expense-left">
                <div className="category-avatar" title={exp.category}>
                  {categoryIcon}
                </div>
                <div className="expense-info">
                  <div className="expense-title-row">
                    <span className="expense-title">{exp.description}</span>
                    <span className="badge category-badge">{exp.category}</span>
                  </div>
                  <div className="expense-meta">
                    <span>Paid by <strong>{payerName}</strong></span>
                    <span>•</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="expense-split-tags">
                    <span className="split-label">Split among ({beneficiaryNames.length}):</span>
                    {beneficiaryNames.map((name, i) => (
                      <span key={i} className="mini-tag">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="expense-right">
                <div className="expense-amount">
                  ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="expense-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    title="Edit Expense"
                    onClick={() => onEditExpense(exp)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="btn-icon delete-icon"
                    title="Delete Expense"
                    onClick={() => onDeleteExpense(exp._id, exp.description)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
