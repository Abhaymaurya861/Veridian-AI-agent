const express = require('express');
const cors = require('cors');
const path = require('path');
const store = require('./services/store');
const agentEngine = require('./services/agentEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Employee Personas & Requests
app.get('/api/personas', (req, res) => {
  res.json({ success: true, personas: store.getPersonas() });
});

app.get('/api/requests', (req, res) => {
  res.json({ success: true, requests: store.getEmployeeRequests() });
});

// 2. Chat with Agent (Handles understanding, policy lookup, follow-ups, resolution & escalation)
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { sessionId, message, personaId, followUpResponse } = req.body;

    if (!sessionId || (!message && !followUpResponse)) {
      return res.status(400).json({ success: false, error: 'sessionId and message/followUpResponse required' });
    }

    const activePersonaId = personaId || 'EMP-10492';
    const result = await agentEngine.processUserMessage(sessionId, message || '', activePersonaId, followUpResponse);

    res.json({
      success: true,
      data: result,
      auditTimestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Agent chat error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Structured Tickets Endpoints
app.get('/api/tickets', (req, res) => {
  const { status, priority, search } = req.query;
  const tickets = store.getTickets({ status, priority, search });
  res.json({
    success: true,
    total: tickets.length,
    tickets: tickets
  });
});

app.post('/api/tickets', (req, res) => {
  const newTicket = store.createTicket(req.body);
  store.recordAuditEvent({
    eventType: 'TICKET_CREATED_MANUAL',
    actor: req.body.requester ? req.body.requester.name : 'System_Admin',
    action: `Manual ticket created: ${newTicket.id} - "${newTicket.title}"`,
    riskScore: newTicket.riskScore || 20,
    metadata: { ticketId: newTicket.id, priority: newTicket.priority }
  });
  res.status(201).json({ success: true, ticket: newTicket });
});

app.patch('/api/tickets/:id', (req, res) => {
  const { status, resolutionSummary } = req.body;
  const updated = store.updateTicketStatus(req.params.id, status, resolutionSummary);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Ticket not found' });
  }

  store.recordAuditEvent({
    eventType: 'TICKET_STATUS_UPDATED',
    actor: 'Support_Desk_Lead',
    action: `Ticket ${updated.id} status updated to: "${status}".`,
    riskScore: updated.riskScore || 10,
    metadata: { ticketId: updated.id, status: status }
  });

  res.json({ success: true, ticket: updated });
});

// 4. Corporate Policy Repository & Grounding Sources
app.get('/api/policies', (req, res) => {
  const { search, category } = req.query;
  let policies = store.getPolicies();

  if (category && category !== 'ALL') {
    policies = policies.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    policies = policies.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, total: policies.length, policies });
});

app.get('/api/policies/:id', (req, res) => {
  const policy = store.getPolicyById(req.params.id);
  if (!policy) {
    return res.status(404).json({ success: false, error: 'Policy not found' });
  }
  res.json({ success: true, policy });
});

// 5. Compliance Audit Trail
app.get('/api/audit', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;
  res.json({
    success: true,
    totalLogs: store.getAuditLogs(limit).length,
    logs: store.getAuditLogs(limit)
  });
});

// 6. Self-Service Action Execution
app.post('/api/self-service/execute', (req, res) => {
  const { actionType, ticketId, payload } = req.body;

  let executionResult = {};
  let auditAction = '';

  if (actionType === 'SELF_SERVICE_MFA') {
    executionResult = {
      status: 'SUCCESS',
      message: 'One-time Okta activation QR code successfully generated and paired.',
      tokenExpiresIn: '14m 58s'
    };
    auditAction = `Employee completed self-service Okta token resync for ticket ${ticketId}.`;
  } else if (actionType === 'SELF_SERVICE_VPN_SCRIPT') {
    executionResult = {
      status: 'SUCCESS',
      message: 'DNS cache flushed and PanGPS daemon restarted successfully. Status: CONNECTED (Gateway: us-west-gw1).',
      terminalOutput: [
        "> dscacheutil -flushcache",
        "> killall -HUP mDNSResponder [OK]",
        "> PanGPS service reload: SUCCESS",
        "> IP assigned: 10.240.18.91 via tun0"
      ]
    };
    auditAction = `Automated VPN network flush script executed on client for ticket ${ticketId}.`;
  } else if (actionType === 'SELF_SERVICE_SOFTWARE_DEPLOY') {
    executionResult = {
      status: 'SUCCESS',
      message: `MDM push command acknowledged by device daemon. Package installer scheduled.`,
      estimatedTime: '2 minutes'
    };
    auditAction = `MDM silent software package deployment dispatched for ticket ${ticketId}.`;
  } else {
    executionResult = { status: 'COMPLETED', message: 'Action executed successfully.' };
    auditAction = `Self-service action ${actionType} executed for ticket ${ticketId}.`;
  }

  store.recordAuditEvent({
    eventType: 'ACTION_EXECUTED',
    actor: 'Employee_SelfService_Portal',
    action: auditAction,
    riskScore: 5,
    metadata: { actionType, ticketId, result: executionResult.status }
  });

  res.json({ success: true, executionResult });
});

// 7. Reset System State (Demo Helper)
app.post('/api/reset', (req, res) => {
  store.reset();
  res.json({ success: true, message: 'Demo system state and audit log reset successfully.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 NexaIT Support Agent Server running on http://localhost:${PORT}`);
  console.log(`📋 Policies loaded: ${store.getPolicies().length}`);
  console.log(`🎫 Active tickets: ${store.getTickets().length}`);
  console.log(`====================================================`);
});
