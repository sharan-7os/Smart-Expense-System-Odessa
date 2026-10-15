import React from 'react';

export default function GroupList({
  groups,
  onSelectGroup,
  onOpenCreateGroup,
  onDeleteGroup,
}) {
  return (
    <div className="groups-view-container">
      <div className="groups-view-header">
        <div>
          <h2>📁 Event & Trip Groups</h2>
          <p className="subtitle">
            Manage your groups as separate entities. You can delete a group once all member settlements are completed.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateGroup}
        >
          + Create New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="card empty-card">
          <div className="empty-icon">📁</div>
          <h3>No groups yet</h3>
          <p>Create your first event or trip group to start splitting expenses.</p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={onOpenCreateGroup}
          >
            + Create Group
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((g) => {
            const isSettled = g.isSettled;
            const createdDate = g.createdAt
              ? new Date(g.createdAt).toLocaleDateString()
              : '';

            return (
              <div key={g._id} className="group-card">
                <div className="group-card-top">
                  <div className="group-card-meta">
                    <span className="group-date">{createdDate}</span>
                    {isSettled ? (
                      <span className="badge badge-settled-green">✓ Fully Settled</span>
                    ) : (
                      <span className="badge badge-unsettled-amber">
                        ⚠️ {g.unsettledCount || 1} Pending Debt(s)
                      </span>
                    )}
                  </div>
                  <h3 className="group-card-title">{g.name}</h3>
                  {g.description && (
                    <p className="group-card-desc">{g.description}</p>
                  )}
                </div>

                <div className="group-card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Members</span>
                    <span className="stat-val">{g.participantCount || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Expenses</span>
                    <span className="stat-val">{g.expenseCount || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Spend</span>
                    <span className="stat-val">
                      ₹{(g.totalSpend || 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="group-card-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectGroup(g._id)}
                  >
                    Open Group ➔
                  </button>

                  <div className="delete-btn-wrapper">
                    {isSettled ? (
                      <button
                        type="button"
                        className="btn btn-danger-outline-sm"
                        title="Delete Group"
                        onClick={() => onDeleteGroup(g._id, g.name)}
                      >
                        🗑️ Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-disabled-sm"
                        disabled
                        title="Group can only be deleted when all settlements are completed"
                      >
                        🔒 Settle to Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
