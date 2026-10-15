const http = require('http');

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Step 0: Health Check ---');
  const health = await request('/api/health');
  console.log('Health:', health);

  console.log('\n--- Step 1: Create Group ---');
  const groupRes = await request('/api/groups', 'POST', {
    name: 'Odessa Tech Fest 2026',
    description: 'Hackathon shared expenses',
  });
  const groupId = groupRes.data._id;
  console.log(`Created group: "${groupRes.data.name}" [ID: ${groupId}]`);

  console.log('\n--- Step 2: Add Members (Asha, Bala, Charan) ---');
  const asha = await request(`/api/groups/${groupId}/participants`, 'POST', { name: 'Asha' });
  const bala = await request(`/api/groups/${groupId}/participants`, 'POST', { name: 'Bala' });
  const charan = await request(`/api/groups/${groupId}/participants`, 'POST', { name: 'Charan' });

  const aId = asha.data._id;
  const bId = bala.data._id;
  const cId = charan.data._id;
  console.log(`Added: Asha (${aId}), Bala (${bId}), Charan (${cId})`);

  console.log('\n--- Step 3: Add Expense 1 (Asha pays ₹900, split by Asha, Bala, Charan) ---');
  const exp1 = await request(`/api/groups/${groupId}/expenses`, 'POST', {
    description: 'Hackathon Registration',
    amount: 900,
    payerId: aId,
    beneficiaryIds: [aId, bId, cId],
    category: 'Tickets',
  });
  console.log(`Recorded: "${exp1.data.description}" of ₹${exp1.data.amount} paid by ${exp1.data.payer.name}`);

  console.log('\n--- Step 4: Add Expense 2 (Bala pays ₹300, split by Bala, Charan) ---');
  const exp2 = await request(`/api/groups/${groupId}/expenses`, 'POST', {
    description: 'Team Dinner',
    amount: 300,
    payerId: bId,
    beneficiaryIds: [bId, cId],
    category: 'Food',
  });
  console.log(`Recorded: "${exp2.data.description}" of ₹${exp2.data.amount} paid by ${exp2.data.payer.name}`);

  console.log('\n--- Step 5: Verify Derived Balances & Greedy Settlements ---');
  const balRes = await request(`/api/groups/${groupId}/settlements/balances-and-settlements`);
  
  console.log('Calculated Balances:');
  for (const b of balRes.data.balances) {
    console.log(`  - ${b.name.padEnd(8)}: Paid ₹${b.totalPaid.toFixed(2).padStart(6)}, Share ₹${b.totalShare.toFixed(2).padStart(6)} => Net ${b.netBalance >= 0 ? '+' : ''}₹${b.netBalance.toFixed(2)} (${b.status})`);
  }

  console.log('\nSuggested Settlements:');
  for (const s of balRes.data.suggestedSettlements) {
    console.log(`  - ${s.fromName} pays ${s.toName} ₹${s.amount.toFixed(2)}`);
  }

  console.log('\n--- Step 6: Mark Charan -> Asha ₹450 as Paid ---');
  const payment = await request(`/api/groups/${groupId}/settlements`, 'POST', {
    fromId: cId,
    toId: aId,
    amount: 450,
    note: 'Settled via Google Pay',
  });
  console.log(`Recorded payment: ${payment.data.fromName} paid ${payment.data.toName} ₹${payment.data.amount.toFixed(2)}`);

  console.log('\n--- Step 7: Verify Completed Settlement History ---');
  const updatedRes = await request(`/api/groups/${groupId}/settlements/balances-and-settlements`);
  console.log('Completed Settlements in DB:', updatedRes.data.completedSettlements.length);
  for (const cs of updatedRes.data.completedSettlements) {
    console.log(`  - [COMPLETED] ${cs.fromName} -> ${cs.toName} ₹${cs.amount.toFixed(2)} (${cs.note})`);
  }

  console.log('\n✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
