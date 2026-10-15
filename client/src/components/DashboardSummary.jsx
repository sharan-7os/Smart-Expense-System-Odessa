import React from 'react';

export default function DashboardSummary({
  group,
  metrics,
  onBackToGroups,
  onOpenCreateGroup,
  onDeleteGroup,
}) {
  const isSettled = metrics?.isSettled;

  return (
    <div className="dashboard-summary">
      <div className="group-header-top-nav">
        <button
          type="button"
          className="btn-back-link"
          onClick={onBackToGroups}
        >
          ← Back to All Groups
        </button>

        <div className="group-header-status-badge">
          {isSettled ? (
            <span className="badge badge-settled-green">✓ Group Fully Settled</span>
          ) : (
            <span className="badge badge-unsettled-amber">⚠️ Debts Pending Settlement</span>
          )}
        </div>
      </div>

      <div className="group-header-bar">
        <div className="group-title-area">
          <div className="group-badge">Active Entity</div>
          <h2>{group?.name || 'No Group Selected'}</h2>
          {group?.description && <p className="group-desc">{group.description}</p>}
        </div>

        <div className="group-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateGroup}
          >
            + New Group
          </button>

          {group && (
            <div className="group-delete-action">
              {isSettled ? (
                <button
                  type="button"
                  className="btn btn-danger-sm"
                  onClick={() => onDeleteGroup(group._id, group.name)}
                >
                  🗑️ Delete Group
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-disabled-sm"
                  disabled
                  title="Every member's debt must be settled before deleting this group."
                >
                  🔒 Settle to Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon spend-icon">₹</div>
          <div className="metric-content">
            <span className="metric-label">Total Spend</span>
            <span className="metric-value">
              ₹{(metrics?.totalSpend || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon members-icon">👥</div>
          <div className="metric-content">
            <span className="metric-label">Participants</span>
            <span className="metric-value">{metrics?.participantCount || 0}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon expenses-icon">🧾</div>
          <div className="metric-content">
            <span className="metric-label">Total Expenses</span>
            <span className="metric-value">{metrics?.expenseCount || 0}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon average-icon">⚖️</div>
          <div className="metric-content">
            <span className="metric-label">Average / Person</span>
            <span className="metric-value">
              ₹{(metrics?.perPersonAverage || 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
