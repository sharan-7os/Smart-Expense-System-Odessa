import React from 'react';

export default function DashboardSummary({ group, metrics, groups, onSelectGroup, onOpenCreateGroup }) {
  return (
    <div className="dashboard-summary">
      <div className="group-header-bar">
        <div className="group-title-area">
          <div className="group-badge">Active Group</div>
          <h2>{group?.name || 'No Group Selected'}</h2>
          {group?.description && <p className="group-desc">{group.description}</p>}
        </div>

        <div className="group-actions">
          {groups && groups.length > 0 && (
            <div className="group-switch-wrapper">
              <label htmlFor="group-select">Switch Trip:</label>
              <select
                id="group-select"
                className="select-input"
                value={group?._id || ''}
                onChange={(e) => onSelectGroup(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.participantCount || 0} members)
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateGroup}
          >
            + New Group
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon spend-icon">₹</div>
          <div className="metric-content">
            <span className="metric-label">Total Spend</span>
            <span className="metric-value">₹{(metrics?.totalSpend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
            <span className="metric-value">₹{(metrics?.perPersonAverage || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
