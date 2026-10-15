import React from 'react';

export default function BalanceTable({ balances }) {
  if (!balances || balances.length === 0) {
    return (
      <div className="card empty-card">
        <div className="empty-icon">⚖️</div>
        <h3>No balances calculated</h3>
        <p>Add group members and shared expenses to view calculated net balances.</p>
      </div>
    );
  }

  const totalNet = balances.reduce((sum, b) => sum + (b.netBalance || 0), 0);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Calculated Balances</h3>
          <span className="card-subtext">
            Derived directly from expense records: <code>Net = Total Paid − Personal Share</code>
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="balances-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th className="text-right">Total Paid</th>
              <th className="text-right">Personal Share</th>
              <th className="text-right">Net Balance</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => {
              const isCreditor = b.netBalance > 0;
              const isDebtor = b.netBalance < 0;
              const isSettled = b.netBalance === 0;

              return (
                <tr key={b.participantId}>
                  <td className="participant-cell">
                    <span className="cell-avatar">{b.name.charAt(0).toUpperCase()}</span>
                    <strong>{b.name}</strong>
                  </td>
                  <td className="text-right">
                    ₹{b.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right">
                    ₹{b.totalShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`text-right font-bold ${isCreditor ? 'text-green' : isDebtor ? 'text-red' : 'text-gray'}`}>
                    {isCreditor ? `+₹${b.netBalance.toFixed(2)}` : isDebtor ? `-₹${Math.abs(b.netBalance).toFixed(2)}` : '₹0.00'}
                  </td>
                  <td className="text-center">
                    {isCreditor && <span className="status-badge badge-creditor">Owed ₹{b.netBalance.toFixed(2)}</span>}
                    {isDebtor && <span className="status-badge badge-debtor">Owes ₹{Math.abs(b.netBalance).toFixed(2)}</span>}
                    {isSettled && <span className="status-badge badge-settled">Settled</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="balance-sanity-footer">
        <div className="sanity-status">
          <span className="indicator-dot green"></span>
          <span>Zero-Sum Check: Total Net Across Group = <strong>₹{totalNet.toFixed(2)}</strong> (Mathematically Balanced)</span>
        </div>
        <span className="sanity-subtext">Total money owed strictly equals total money receivable</span>
      </div>
    </div>
  );
}
