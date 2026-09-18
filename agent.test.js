const assert = require('assert');
const store = require('../services/store');
const agentEngine = require('../services/agentEngine');

async function runVeridianTests() {
  console.log('🧪 Starting Veridian Corp IT Support Agent Automated Verification (Week of 21-25 Sep 2026)...\n');

  // Test 1: REQ-02 Vikram Chawla - Guest Wi-Fi (KB-07)
  console.log('Test 1: REQ-02 Guest Wi-Fi Access (KB-07)');
  const resGuest = await agentEngine.processUserMessage(
    'test-req-02',
    'Can I get Wi-Fi access for a guest visiting our office tomorrow?',
    'EMP-02'
  );
  assert.strictEqual(resGuest.type, 'RESOLUTION_AUTOMATED');
  assert.strictEqual(resGuest.policyGrounding.policyId, 'KB-07');
  assert(resGuest.message.includes('front-desk kiosk'), 'Must mention front-desk kiosk');
  assert(resGuest.message.includes('No IT ticket required'), 'Must state no ticket required');
  console.log('  ✔ Correctly resolved per KB-07: Front-desk kiosk, 24h validity, no ticket required.\n');

  // Test 2: REQ-03 Karan Mehta - Password lockout after 6 attempts (KB-01)
  console.log('Test 2: REQ-03 Account Lockout 6 Times (KB-01)');
  const resLockoutPrompt = await agentEngine.processUserMessage(
    'test-req-03',
    'I’m locked out of my account, tried my password 6 times.',
    'EMP-03'
  );
  assert.strictEqual(resLockoutPrompt.type, 'FOLLOW_UP');

  const resLockoutResolved = await agentEngine.processUserMessage(
    'test-req-03',
    null,
    'EMP-03',
    { selection: 'Locked out after 5+ failed password attempts (Requires IT manual unlock)' }
  );
  assert.strictEqual(resLockoutResolved.ticket.status, 'In progress — manual unlock queued');
  assert.strictEqual(resLockoutResolved.ticket.policyRef.id, 'KB-01');
  assert(resLockoutResolved.message.includes('No approval required'), 'Must note no approval required per KB-01');
  console.log(`  ✔ Ticket ${resLockoutResolved.ticket.id} queued for manual unlock per KB-01 without approval.\n`);

  // Test 3: REQ-05 Sanjay Oberoi - VPN 90-day credentials expired (KB-02)
  console.log('Test 3: REQ-05 VPN Credential Expiration (KB-02)');
  const resVpnPrompt = await agentEngine.processUserMessage(
    'test-req-05',
    'My VPN stopped working this morning, says credentials expired.',
    'EMP-05'
  );
  const resVpnResolved = await agentEngine.processUserMessage(
    'test-req-05',
    null,
    'EMP-05',
    { selection: 'My 90-day VPN credentials expired (Full-time employee self-renewal)' }
  );
  assert.strictEqual(resVpnResolved.ticket.status, 'Resolved');
  assert.strictEqual(resVpnResolved.ticket.policyRef.id, 'KB-02');
  console.log(`  ✔ Successfully renewed VPN 90-day credentials per KB-02 (Ticket ${resVpnResolved.ticket.id} Resolved).\n`);

  // Test 4: REQ-04 Ritu Bhatia - Non-catalog software review (KB-04)
  console.log('Test 4: REQ-04 Non-Catalog Software Request (KB-04)');
  const resSoftPrompt = await agentEngine.processUserMessage(
    'test-req-04',
    'Need approval to install a data-analysis tool that’s not in the software catalog.',
    'EMP-01'
  );
  const resSoftResolved = await agentEngine.processUserMessage(
    'test-req-04',
    null,
    'EMP-01',
    { selection: 'Non-catalog software / tool (e.g. data-analysis tool — requires IT Security review, 3-5 days)' }
  );
  assert.strictEqual(resSoftResolved.ticket.status, 'Pending Security review');
  assert.strictEqual(resSoftResolved.ticket.policyRef.id, 'KB-04');
  assert(resSoftResolved.message.includes('3–5 business days'), 'Must cite 3-5 business days SLA');
  console.log(`  ✔ Routed to IT Security review per KB-04 (Ticket ${resSoftResolved.ticket.id} Pending Security review, 3-5 days).\n`);

  // Test 5: REQ-08 Ananya Reddy - Phishing email forwarded to teammates (KB-09)
  console.log('Test 5: REQ-08 Phishing Email Forwarding Alert (KB-09)');
  const resPhishPrompt = await agentEngine.processUserMessage(
    'test-req-08',
    'I think I got a phishing email asking for my login — forwarding it to a few teammates to check.',
    'EMP-08'
  );
  const resPhishResolved = await agentEngine.processUserMessage(
    'test-req-08',
    null,
    'EMP-08',
    { selection: 'Yes, I forwarded or was about to forward it to teammates to check' }
  );
  assert.strictEqual(resPhishResolved.type, 'ESCALATION_CRITICAL');
  assert.strictEqual(resPhishResolved.ticket.priority, 'P1');
  assert.strictEqual(resPhishResolved.ticket.policyRef.id, 'KB-09');
  assert(resPhishResolved.message.includes('CEASE FORWARDING IMMEDIATELY'), 'Must warn against forwarding');
  assert(resPhishResolved.message.includes('security@veridian-corp.example'), 'Must report to security@veridian-corp.example');
  console.log(`  ✔ Critical Incident Escalated per KB-09: Forwarding warning issued, reported to security@veridian-corp.example (Ticket ${resPhishResolved.ticket.id}).\n`);

  // Test 6: REQ-07 Farhan Ali - WFH 4 days/week monitor request (KB-10)
  console.log('Test 6: REQ-07 WFH Equipment Allowance (KB-10)');
  const resWfhPrompt = await agentEngine.processUserMessage(
    'test-req-07',
    'I’ve started working from home 4 days a week, how do I get a monitor?',
    'EMP-07'
  );
  const resWfhResolved = await agentEngine.processUserMessage(
    'test-req-07',
    null,
    'EMP-07',
    { selection: '4 or 5 days a week (Qualifies: more than 3 days/week remote)' }
  );
  assert.strictEqual(resWfhResolved.ticket.status, 'Pending Finance');
  assert.strictEqual(resWfhResolved.ticket.policyRef.id, 'KB-10');
  console.log(`  ✔ Verified >3 days remote qualification per KB-10 (Ticket ${resWfhResolved.ticket.id} Pending Finance).\n`);

  // Test 7: REQ-01 Aditi Sharma - Laptop dead 3.5 yrs old (KB-03 & Asset Management Policy)
  console.log('Test 7: REQ-01 Laptop Replacement & Asset Policy Reconciliation');
  const resLapPrompt = await agentEngine.processUserMessage(
    'test-req-01',
    'My laptop won’t turn on at all, it’s completely dead, had it about 3.5 years now.',
    'EMP-01'
  );
  const resLapResolved = await agentEngine.processUserMessage(
    'test-req-01',
    null,
    'EMP-01',
    { selection: 'Laptop is completely dead / won\'t turn on (Verified hardware failure, had it 3.5 years)' }
  );
  assert.strictEqual(resLapResolved.ticket.status, 'Approved — pending fulfillment');
  assert(resLapResolved.message.includes('Asset Management Policy'), 'Must harmonize KB-03 with Asset Management Policy');
  assert(resLapResolved.message.includes('Finance sign-off'), 'Must note Finance sign-off requirement');
  console.log(`  ✔ Reconciled KB-03 with Asset Policy: Ticket ${resLapResolved.ticket.id} Approved — pending fulfillment.\n`);

  // Test 8: REQ-15 Rahul Menon - Ambiguous query ("hey can you help, its not working")
  console.log('Test 8: REQ-15 Ambiguous Request Triage');
  const resAmbiguous = await agentEngine.processUserMessage(
    'test-req-15',
    'hey can you help, its not working',
    'EMP-15'
  );
  assert.strictEqual(resAmbiguous.type, 'FOLLOW_UP');
  assert(resAmbiguous.options.length >= 4, 'Must offer diagnostic domain choices');
  console.log('  ✔ Sensibly prompted user with diagnostic clarification options.\n');

  console.log('🎉 ALL VERIDIAN CORP SCENARIO TESTS PASSED PERFECTLY!\n');
}

runVeridianTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
