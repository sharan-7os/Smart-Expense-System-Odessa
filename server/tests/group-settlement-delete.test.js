const http = require('http');

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('Testing Group Deletion Rules:');

  // Test 1: Empty group can be deleted immediately
  console.log('\n--- Test 1: Empty group deletion ---');
  const g1 = await request('/api/groups', 'POST', { name: 'Test Empty Group' });
  const g1Id = g1.body.data._id;
  console.log('Created empty group:', g1Id);

  const delEmpty = await request(`/api/groups/${g1Id}`, 'DELETE');
  console.log('Delete empty group status:', delEmpty.status, delEmpty.body.message || delEmpty.body.error);
  if (delEmpty.status !== 200) throw new Error('Expected empty group delete to succeed');

  // Test 2: Group with unsettled debt CANNOT be deleted
  console.log('\n--- Test 2: Unsettled group deletion BLOCKED ---');
  const g2 = await request('/api/groups', 'POST', { name: 'Test Unsettled Group' });
  const g2Id = g2.body.data._id;

  const p1 = await request(`/api/groups/${g2Id}/participants`, 'POST', { name: 'Alice' });
  const p2 = await request(`/api/groups/${g2Id}/participants`, 'POST', { name: 'Bob' });
  const p1Id = p1.body.data._id;
  const p2Id = p2.body.data._id;

  await request(`/api/groups/${g2Id}/expenses`, 'POST', {
    description: 'Cab Ride',
    amount: 200,
    payerId: p1Id,
    beneficiaryIds: [p1Id, p2Id],
    category: 'Travel',
  });

  const delUnsettled = await request(`/api/groups/${g2Id}`, 'DELETE');
  console.log('Delete unsettled group status:', delUnsettled.status);
  console.log('Delete blocked error message:', delUnsettled.body.error);
  if (delUnsettled.status !== 400) throw new Error('Expected unsettled group delete to be rejected with 400');

  // Test 3: Settle the debt, then group CAN be deleted
  console.log('\n--- Test 3: Fully settled group CAN be deleted ---');
  const settleRes = await request(`/api/groups/${g2Id}/settlements`, 'POST', {
    fromId: p2Id,
    toId: p1Id,
    amount: 100,
    note: 'Bob paid Alice ₹100 via Cash',
  });
  console.log('Payment recorded:', settleRes.body.data.fromName, 'paid', settleRes.body.data.toName, '₹' + settleRes.body.data.amount);

  const delSettled = await request(`/api/groups/${g2Id}`, 'DELETE');
  console.log('Delete settled group status:', delSettled.status);
  console.log('Delete response message:', delSettled.body.message);
  if (delSettled.status !== 200) throw new Error('Expected settled group delete to succeed');

  console.log('\n✅ ALL GROUP DELETION & SETTLEMENT RULES VERIFIED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
