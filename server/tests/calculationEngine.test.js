const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  toPaise,
  toRupees,
  validateExpenseInput,
  calculateBalances,
  generateSettlements,
} = require('../src/services/calculationEngine');

describe('CampusSplit Calculation Engine Tests', () => {

  describe('Currency conversion (Paise <-> Rupees)', () => {
    test('converts rupees to paise accurately', () => {
      assert.strictEqual(toPaise(900), 90000);
      assert.strictEqual(toPaise('33.33'), 3333);
      assert.strictEqual(toPaise(0.01), 1);
      assert.strictEqual(toPaise('150.50'), 15050);
    });

    test('converts paise to rupees formatted accurately', () => {
      assert.strictEqual(toRupees(90000), 900.00);
      assert.strictEqual(toRupees(3333), 33.33);
      assert.strictEqual(toRupees(150), 1.50);
      assert.strictEqual(toRupees(0), 0.00);
    });

    test('throws error for invalid currency inputs', () => {
      assert.throws(() => toPaise('abc'));
      assert.throws(() => toPaise(NaN));
      assert.throws(() => toRupees('invalid'));
    });
  });

  describe('Input validation', () => {
    const participants = [
      { id: 'p1', name: 'Asha' },
      { id: 'p2', name: 'Bala' },
    ];

    test('accepts valid expense input', () => {
      const validExpense = {
        description: 'Auto fare',
        amount: 150,
        payerId: 'p1',
        beneficiaryIds: ['p1', 'p2'],
      };
      assert.strictEqual(validateExpenseInput(validExpense, participants), true);
    });

    test('rejects non-positive amounts', () => {
      assert.throws(
        () => validateExpenseInput({ description: 'Cab', amount: 0, payerId: 'p1', beneficiaryIds: ['p1'] }, participants),
        /positive number/
      );
      assert.throws(
        () => validateExpenseInput({ description: 'Cab', amount: -50, payerId: 'p1', beneficiaryIds: ['p1'] }, participants),
        /positive number/
      );
    });

    test('rejects empty description', () => {
      assert.throws(
        () => validateExpenseInput({ description: '   ', amount: 50, payerId: 'p1', beneficiaryIds: ['p1'] }, participants),
        /description is required/
      );
    });

    test('rejects payer not in group', () => {
      assert.throws(
        () => validateExpenseInput({ description: 'Food', amount: 100, payerId: 'p999', beneficiaryIds: ['p1'] }, participants),
        /not a member/
      );
    });

    test('rejects empty beneficiaries list', () => {
      assert.throws(
        () => validateExpenseInput({ description: 'Food', amount: 100, payerId: 'p1', beneficiaryIds: [] }, participants),
        /At least one beneficiary/
      );
    });

    test('rejects beneficiary not in group', () => {
      assert.throws(
        () => validateExpenseInput({ description: 'Food', amount: 100, payerId: 'p1', beneficiaryIds: ['p1', 'p999'] }, participants),
        /not a member/
      );
    });
  });

  describe('Asha, Bala, Charan Reference Scenario', () => {
    const participants = [
      { id: 'p1', name: 'Asha' },
      { id: 'p2', name: 'Bala' },
      { id: 'p3', name: 'Charan' },
    ];

    const expenses = [
      {
        id: 'e1',
        description: 'Hackathon Registration',
        amount: 900,
        payerId: 'p1', // Asha pays 900
        beneficiaryIds: ['p1', 'p2', 'p3'], // Split 3 ways: 300 each
      },
      {
        id: 'e2',
        description: 'Dinner',
        amount: 300,
        payerId: 'p2', // Bala pays 300
        beneficiaryIds: ['p2', 'p3'], // Split 2 ways: 150 each
      },
    ];

    test('calculates correct net balances: Asha +600, Bala -150, Charan -450', () => {
      const balances = calculateBalances(participants, expenses);

      const asha = balances.find(b => b.name === 'Asha');
      const bala = balances.find(b => b.name === 'Bala');
      const charan = balances.find(b => b.name === 'Charan');

      // Asha: Paid 900, Share 300 -> Net +600
      assert.strictEqual(asha.totalPaid, 900);
      assert.strictEqual(asha.totalShare, 300);
      assert.strictEqual(asha.netBalance, 600);
      assert.strictEqual(asha.status, 'creditor');

      // Bala: Paid 300, Share 450 -> Net -150
      assert.strictEqual(bala.totalPaid, 300);
      assert.strictEqual(bala.totalShare, 450);
      assert.strictEqual(bala.netBalance, -150);
      assert.strictEqual(bala.status, 'debtor');

      // Charan: Paid 0, Share 450 -> Net -450
      assert.strictEqual(charan.totalPaid, 0);
      assert.strictEqual(charan.totalShare, 450);
      assert.strictEqual(charan.netBalance, -450);
      assert.strictEqual(charan.status, 'debtor');

      // Invariant: sum of net balances is zero
      const sumPaise = balances.reduce((sum, b) => sum + b.netBalancePaise, 0);
      assert.strictEqual(sumPaise, 0);
    });

    test('generates settlements: Charan -> Asha 450, Bala -> Asha 150', () => {
      const balances = calculateBalances(participants, expenses);
      const settlements = generateSettlements(balances);

      assert.strictEqual(settlements.length, 2);

      // Largest debt settled first
      assert.strictEqual(settlements[0].fromName, 'Charan');
      assert.strictEqual(settlements[0].toName, 'Asha');
      assert.strictEqual(settlements[0].amount, 450);

      // Remaining debt settled
      assert.strictEqual(settlements[1].fromName, 'Bala');
      assert.strictEqual(settlements[1].toName, 'Asha');
      assert.strictEqual(settlements[1].amount, 150);

      // Total settlements must equal total creditor credit (600)
      const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);
      assert.strictEqual(totalSettled, 600);
    });
  });

  describe('Edge Cases & Special Scenarios', () => {
    test('payer is NOT a beneficiary (pays entirely on behalf of others)', () => {
      const participants = [
        { id: 'p1', name: 'Asha' },
        { id: 'p2', name: 'Bala' },
        { id: 'p3', name: 'Charan' },
      ];

      // Asha pays 500 for Bala and Charan only
      const expenses = [
        {
          id: 'e1',
          description: 'Team Snack',
          amount: 500,
          payerId: 'p1',
          beneficiaryIds: ['p2', 'p3'],
        },
      ];

      const balances = calculateBalances(participants, expenses);
      const asha = balances.find(b => b.name === 'Asha');
      const bala = balances.find(b => b.name === 'Bala');
      const charan = balances.find(b => b.name === 'Charan');

      assert.strictEqual(asha.totalPaid, 500);
      assert.strictEqual(asha.totalShare, 0);
      assert.strictEqual(asha.netBalance, 500);

      assert.strictEqual(bala.totalPaid, 0);
      assert.strictEqual(bala.totalShare, 250);
      assert.strictEqual(bala.netBalance, -250);

      assert.strictEqual(charan.totalPaid, 0);
      assert.strictEqual(charan.totalShare, 250);
      assert.strictEqual(charan.netBalance, -250);
    });

    test('expense shared by only one participant (self-expense)', () => {
      const participants = [
        { id: 'p1', name: 'Asha' },
        { id: 'p2', name: 'Bala' },
      ];

      // Asha pays 200 for herself only
      const expenses = [
        {
          id: 'e1',
          description: 'Personal Book',
          amount: 200,
          payerId: 'p1',
          beneficiaryIds: ['p1'],
        },
      ];

      const balances = calculateBalances(participants, expenses);
      const asha = balances.find(b => b.name === 'Asha');
      const bala = balances.find(b => b.name === 'Bala');

      assert.strictEqual(asha.totalPaid, 200);
      assert.strictEqual(asha.totalShare, 200);
      assert.strictEqual(asha.netBalance, 0);

      assert.strictEqual(bala.totalPaid, 0);
      assert.strictEqual(bala.totalShare, 0);
      assert.strictEqual(bala.netBalance, 0);

      const settlements = generateSettlements(balances);
      assert.strictEqual(settlements.length, 0);
    });

    test('indivisible amounts distribute remainder paise fairly without drift', () => {
      const participants = [
        { id: 'p1', name: 'Asha' },
        { id: 'p2', name: 'Bala' },
        { id: 'p3', name: 'Charan' },
      ];

      // ₹100 split 3 ways: 10000 paise / 3 = 3333 with remainder 1
      const expenses = [
        {
          id: 'e1',
          description: 'Shared Taxi',
          amount: 100,
          payerId: 'p1',
          beneficiaryIds: ['p1', 'p2', 'p3'],
        },
      ];

      const balances = calculateBalances(participants, expenses);
      const asha = balances.find(b => b.name === 'Asha');
      const bala = balances.find(b => b.name === 'Bala');
      const charan = balances.find(b => b.name === 'Charan');

      // 10000 paise total. First gets 3334, others get 3333
      // Asha paid 10000, share 3334 -> net +6666 paise (66.66)
      assert.strictEqual(asha.netBalancePaise, 6666);
      assert.strictEqual(bala.netBalancePaise, -3333);
      assert.strictEqual(charan.netBalancePaise, -3333);

      // Sum must strictly be zero
      assert.strictEqual(asha.netBalancePaise + bala.netBalancePaise + charan.netBalancePaise, 0);

      // Settlements must match exactly
      const settlements = generateSettlements(balances);
      const totalSettledPaise = settlements.reduce((sum, s) => sum + s.amountPaise, 0);
      assert.strictEqual(totalSettledPaise, 6666);
    });

    test('participant who paid nothing but benefited is correctly identified as debtor', () => {
      const participants = [
        { id: 'p1', name: 'Asha' },
        { id: 'p2', name: 'Bala' },
      ];

      const expenses = [
        {
          id: 'e1',
          description: 'Movie',
          amount: 500,
          payerId: 'p1',
          beneficiaryIds: ['p1', 'p2'],
        },
      ];

      const balances = calculateBalances(participants, expenses);
      const bala = balances.find(b => b.name === 'Bala');

      assert.strictEqual(bala.totalPaid, 0);
      assert.strictEqual(bala.totalShare, 250);
      assert.strictEqual(bala.netBalance, -250);
      assert.strictEqual(bala.status, 'debtor');
    });

    test('all participants with zero net balance results in zero settlements', () => {
      const participants = [
        { id: 'p1', name: 'Asha' },
        { id: 'p2', name: 'Bala' },
      ];

      // Asha pays 100 for both, Bala pays 100 for both
      const expenses = [
        { id: 'e1', description: 'Tea', amount: 100, payerId: 'p1', beneficiaryIds: ['p1', 'p2'] },
        { id: 'e2', description: 'Snacks', amount: 100, payerId: 'p2', beneficiaryIds: ['p1', 'p2'] },
      ];

      const balances = calculateBalances(participants, expenses);
      assert.strictEqual(balances[0].netBalance, 0);
      assert.strictEqual(balances[1].netBalance, 0);

      const settlements = generateSettlements(balances);
      assert.strictEqual(settlements.length, 0);
    });
  });

});
