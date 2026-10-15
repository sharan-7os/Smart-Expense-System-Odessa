import React, { useState } from 'react';

export default function SettlementList({
  suggestedSettlements,
  completedSettlements,
  onMarkPaid,
  onDeleteSettlement,
}) {
  const [payingIndex, setPayingIndex] = useState(null);

  const handlePay = async (settlement, index) => {
    setPayingIndex(index);
    try {
      await onMarkPaid({
        fromId: settlement.fromId,
        toId: settlement.toId,
        amount: settlement.amount,
        note: `Settled payment: ${settlement.fromName} paid ${settlement.toName}`,
      });
    } finally {
      setPayingIndex(null);
    }
  };

  return (
    <div className="settlements-container">
      {/* Suggested Settlements Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>💡 Suggested Settlements</h3>
            <span className="card-subtext">
              Calculated using the Greedy Debt-Matching Algorithm (max N - 1 transactions)
            </span>
          </div>
        </div>

        {suggestedSettlements.length === 0 ? (
          <div className="empty-state-inline success">
            🎉 All participants are settled! No repayments are needed.
          </div>
        ) : (
          <div className="settlement-cards-grid">
            {suggestedSettlements.map((s, index) => {
              // Check if there is already a completed settlement matching this pair and amount
              const alreadyCompleted = completedSettlements.some(
                (c) =>
                  String(c.fromId) === String(s.fromId) &&
                  String(c.toId) === String(s.toId) &&
                  c.amount === s.amount
              );

              return (
                <div key={index} className={`settlement-card ${alreadyCompleted ? 'completed-card' : ''}`}>
                  <div className="settlement-parties">
                    <div className="party debtor">
                      <span className="party-avatar debtor-avatar">
                        {s.fromName.charAt(0).toUpperCase()}
                      </span>
                      <span className="party-name">{s.fromName}</span>
                      <span className="party-role">Owes</span>
                    </div>

                    <div className="settlement-arrow-area">
                      <span className="settlement-amount">
                        ₹{s.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <div className="arrow-line">
                        <span>➔</span>
                      </div>
                    </div>

                    <div className="party creditor">
                      <span className="party-avatar creditor-avatar">
                        {s.toName.charAt(0).toUpperCase()}
                      </span>
                      <span className="party-name">{s.toName}</span>
                      <span className="party-role">Receives</span>
                    </div>
                  </div>

                  <div className="settlement-card-footer">
                    {alreadyCompleted ? (
                      <span className="badge-paid">✓ Marked as Paid</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-success-sm"
                        disabled={payingIndex === index}
                        onClick={() => handlePay(s, index)}
                      >
                        {payingIndex === index ? 'Recording...' : '✓ Mark as Paid'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="algorithm-callout">
          <strong>🎓 Algorithm Design Decision (For Interviews):</strong>
          <p>
            Finding the absolute fewest possible transactions across arbitrary subsets is equivalent to the NP-complete <em>Subset Sum</em> problem. 
            CampusSplit uses a <strong>Greedy Matching Algorithm</strong>: sorting debtors and creditors and matching the largest balances iteratively. This runs in <code>O(N log N)</code> time and guarantees that all debts are resolved in at most <code>N - 1</code> transactions without computational bottleneck.
          </p>
        </div>
      </div>

      {/* Completed Payments History Section */}
      {completedSettlements.length > 0 && (
        <div className="card completed-payments-card">
          <div className="card-header">
            <h3>Completed Payments History ({completedSettlements.length})</h3>
            <span className="card-subtext">Record of verified transfers</span>
          </div>

          <div className="table-responsive">
            <table className="balances-table">
              <thead>
                <tr>
                  <th>Sender (From)</th>
                  <th>Receiver (To)</th>
                  <th className="text-right">Amount</th>
                  <th>Date & Time</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {completedSettlements.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.fromName}</strong>
                    </td>
                    <td>
                      <strong>{c.toName}</strong>
                    </td>
                    <td className="text-right font-bold text-green">
                      ₹{c.amount.toFixed(2)}
                    </td>
                    <td>{new Date(c.settledAt).toLocaleString()}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn-text-danger"
                        title="Remove settlement record"
                        onClick={() => onDeleteSettlement(c._id)}
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
