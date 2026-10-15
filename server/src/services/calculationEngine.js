/**
 * CampusSplit - Calculation Engine
 * 
 * Core financial calculations:
 * - Currency conversion to integer paise (cents) to avoid IEEE 754 float drift.
 * - Net balance computation per participant with fair remainder distribution.
 * - Greedy debt-simplification settlement generation.
 */

/**
 * Converts a rupee amount (number or numeric string) into integer paise.
 * E.g., 900 -> 90000, 33.33 -> 3333
 * @param {number|string} amountInRupees 
 * @returns {number} Integer paise
 */
function toPaise(amountInRupees) {
  const parsed = typeof amountInRupees === 'string' ? parseFloat(amountInRupees) : amountInRupees;
  if (typeof parsed !== 'number' || isNaN(parsed) || !isFinite(parsed)) {
    throw new Error('Invalid monetary amount');
  }
  return Math.round(parsed * 100);
}

/**
 * Converts integer paise back into rupees with 2 decimal places.
 * E.g., 90000 -> 900.00, 3333 -> 33.33
 * @param {number} paise 
 * @returns {number} Float value in rupees
 */
function toRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    throw new Error('Invalid paise amount');
  }
  return Number((paise / 100).toFixed(2));
}

/**
 * Validates an expense against the group's participant list.
 * @param {Object} expense 
 * @param {Array<Object>} participants 
 */
function validateExpenseInput(expense, participants) {
  if (!expense || typeof expense !== 'object') {
    throw new Error('Expense must be an object');
  }

  const { description, amount, payerId, beneficiaryIds } = expense;

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Expense description is required');
  }

  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof parsedAmount !== 'number' || isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Expense amount must be a positive number');
  }

  if (!payerId) {
    throw new Error('Payer ID is required');
  }

  const validParticipantIds = new Set(participants.map(p => String(p._id || p.id)));

  if (!validParticipantIds.has(String(payerId))) {
    throw new Error(`Payer (${payerId}) is not a member of this group`);
  }

  if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
    throw new Error('At least one beneficiary must be selected');
  }

  const uniqueBeneficiaries = new Set(beneficiaryIds.map(String));
  for (const bId of uniqueBeneficiaries) {
    if (!validParticipantIds.has(bId)) {
      throw new Error(`Beneficiary (${bId}) is not a member of this group`);
    }
  }

  return true;
}

/**
 * Calculates net balances for all participants based on the expense ledger.
 * 
 * Invariant: Sum of all net balances across the group MUST EQUAL ZERO.
 * 
 * @param {Array<Object>} participants - Array of participant objects with id/_id and name
 * @param {Array<Object>} expenses - Array of expense objects
 * @returns {Array<Object>} Calculated balance records for each participant
 */
function calculateBalances(participants, expenses) {
  if (!Array.isArray(participants)) {
    throw new Error('Participants must be an array');
  }

  // Initialize tracking map in integer paise
  // Key: participantId (string) -> { id, name, totalPaidPaise, totalSharePaise }
  const balanceMap = new Map();

  for (const p of participants) {
    const id = String(p._id || p.id);
    balanceMap.set(id, {
      id,
      name: p.name,
      totalPaidPaise: 0,
      totalSharePaise: 0,
    });
  }

  if (Array.isArray(expenses)) {
    for (const exp of expenses) {
      const payerId = String(exp.payerId || exp.payer);
      const beneficiaryIds = (exp.beneficiaryIds || exp.beneficiaries || []).map(String);
      const amountPaise = typeof exp.amountPaise === 'number' 
        ? exp.amountPaise 
        : toPaise(exp.amount);

      // 1. Credit the payer with the entire paid amount
      if (balanceMap.has(payerId)) {
        balanceMap.get(payerId).totalPaidPaise += amountPaise;
      }

      // 2. Split amount equally among beneficiaries with fair remainder distribution
      const count = beneficiaryIds.length;
      if (count > 0) {
        const baseShare = Math.floor(amountPaise / count);
        const remainder = amountPaise % count; // Remainder paise to distribute 1 by 1

        beneficiaryIds.forEach((bId, index) => {
          if (balanceMap.has(bId)) {
            // Give 1 extra paisa to the first 'remainder' beneficiaries
            const share = baseShare + (index < remainder ? 1 : 0);
            balanceMap.get(bId).totalSharePaise += share;
          }
        });
      }
    }
  }

  // Compile final array with net balances in both paise and rupees
  const results = [];
  let totalNetPaise = 0;

  for (const record of balanceMap.values()) {
    const netBalancePaise = record.totalPaidPaise - record.totalSharePaise;
    totalNetPaise += netBalancePaise;

    results.push({
      participantId: record.id,
      name: record.name,
      totalPaid: toRupees(record.totalPaidPaise),
      totalShare: toRupees(record.totalSharePaise),
      netBalance: toRupees(netBalancePaise),
      netBalancePaise,
      status: netBalancePaise > 0 ? 'creditor' : netBalancePaise < 0 ? 'debtor' : 'settled',
    });
  }

  // Sanity check: Total net across group must strictly be zero
  if (totalNetPaise !== 0) {
    throw new Error(`Mathematical invariant violated: sum of net balances is ${totalNetPaise} paise`);
  }

  return results;
}

/**
 * Generates settlement instructions using a Greedy Debt-Matching Algorithm.
 * 
 * Matches the largest debtor with the largest creditor iteratively.
 * Produces at most (N - 1) transactions for N participants.
 * 
 * @param {Array<Object>} balances - Result from calculateBalances
 * @returns {Array<Object>} Settlement instructions: [{ from, to, amount, amountPaise }]
 */
function generateSettlements(balances) {
  if (!Array.isArray(balances)) {
    throw new Error('Balances must be an array');
  }

  // Separate debtors and creditors using paise for exact math
  // Debtors have negative netBalancePaise -> store as positive debt
  const creditors = [];
  const debtors = [];

  for (const b of balances) {
    const paise = b.netBalancePaise !== undefined ? b.netBalancePaise : toPaise(b.netBalance);
    if (paise > 0) {
      creditors.push({ id: b.participantId, name: b.name, creditPaise: paise });
    } else if (paise < 0) {
      debtors.push({ id: b.participantId, name: b.name, debtPaise: Math.abs(paise) });
    }
  }

  // Sort descending by amount to apply greedy strategy
  creditors.sort((a, b) => b.creditPaise - a.creditPaise);
  debtors.sort((a, b) => b.debtPaise - a.debtPaise);

  const settlements = [];
  let cIndex = 0;
  let dIndex = 0;

  while (cIndex < creditors.length && dIndex < debtors.length) {
    const creditor = creditors[cIndex];
    const debtor = debtors[dIndex];

    // Settle the minimum of current debtor's debt and current creditor's credit
    const settleAmountPaise = Math.min(debtor.debtPaise, creditor.creditPaise);

    settlements.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount: toRupees(settleAmountPaise),
      amountPaise: settleAmountPaise,
    });

    debtor.debtPaise -= settleAmountPaise;
    creditor.creditPaise -= settleAmountPaise;

    if (debtor.debtPaise === 0) {
      dIndex++;
    }
    if (creditor.creditPaise === 0) {
      cIndex++;
    }
  }

  return settlements;
}

module.exports = {
  toPaise,
  toRupees,
  validateExpenseInput,
  calculateBalances,
  generateSettlements,
};
