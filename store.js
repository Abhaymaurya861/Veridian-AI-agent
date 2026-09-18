const fs = require('fs');
const path = require('path');

class DataStore {
  constructor() {
    this.policies = [];
    this.personas = [];
    this.tickets = [];
    this.employeeRequests = [];
    this.auditLogs = [];
    this.sessions = new Map(); // sessionId -> { messages, state, currentPolicy, followUpStep }
    this.init();
  }

  init() {
    try {
      const policiesPath = path.join(__dirname, '..', 'data', 'policies.json');
      const personasPath = path.join(__dirname, '..', 'data', 'personas.json');
      const seedTicketsPath = path.join(__dirname, '..', 'data', 'seedTickets.json');
      const requestsPath = path.join(__dirname, '..', 'data', 'employeeRequests.json');

      if (fs.existsSync(policiesPath)) {
        this.policies = JSON.parse(fs.readFileSync(policiesPath, 'utf8'));
      }
      if (fs.existsSync(personasPath)) {
        this.personas = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
      }
      if (fs.existsSync(seedTicketsPath)) {
        this.tickets = JSON.parse(fs.readFileSync(seedTicketsPath, 'utf8'));
      }
      if (fs.existsSync(requestsPath)) {
        this.employeeRequests = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
      }

      // Seed initial audit trail for Veridian Corp
      this.recordAuditEvent({
        eventType: 'SYSTEM_BOOT',
        actor: 'SYSTEM',
        action: 'Veridian Corp IT Support Agent initialized. Timeframe: Monday, 21 September 2026 – Friday, 25 September 2026. Grounded in KB-01 through KB-10 and Asset Management Policy.',
        riskScore: 0,
        policyCited: null,
        metadata: { policiesLoaded: this.policies.length, initialTickets: this.tickets.length, employeeRequests: this.employeeRequests.length }
      });
    } catch (err) {
      console.error('Error initializing DataStore:', err);
    }
  }

  getPolicies() {
    return this.policies;
  }

  getPolicyById(id) {
    return this.policies.find(p => p.id.toLowerCase() === id.toLowerCase());
  }

  getPersonas() {
    return this.personas;
  }

  getPersonaById(id) {
    return this.personas.find(p => p.id === id) || this.personas[0];
  }

  getEmployeeRequests() {
    return this.employeeRequests;
  }

  getTickets(filter = {}) {
    let result = [...this.tickets];
    if (filter.status && filter.status !== 'ALL') {
      result = result.filter(t => t.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.priority && filter.priority !== 'ALL') {
      result = result.filter(t => t.priority.toLowerCase() === filter.priority.toLowerCase());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.requester && t.requester.name.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  createTicket(ticketData) {
    const nextNum = 1052 + (this.tickets.length - 10);
    const ticketId = `TK-${nextNum}`;
    const newTicket = {
      id: ticketId,
      title: ticketData.title || 'IT Support Ticket',
      requester: ticketData.requester,
      category: ticketData.category || 'General IT',
      priority: ticketData.priority || 'P3',
      status: ticketData.status || 'In Progress',
      isClosed: ticketData.status === 'Resolved' || ticketData.status.includes('Closed'),
      resolutionSummary: ticketData.resolutionSummary || null,
      policyRef: ticketData.policyRef || null,
      riskLevel: ticketData.riskLevel || 'LOW',
      riskScore: ticketData.riskScore || 0,
      assignedTo: ticketData.assignedTo || 'Veridian IT Support Desk',
      createdAt: new Date().toISOString(),
      resolvedAt: ticketData.status === 'Resolved' ? new Date().toISOString() : null,
      slaRemainingMinutes: ticketData.slaRemainingMinutes || 120,
      slaBreached: false,
      auditEventCount: ticketData.auditEventCount || 1,
      diagnosticNotes: ticketData.diagnosticNotes || []
    };

    this.tickets.unshift(newTicket);
    return newTicket;
  }

  updateTicketStatus(ticketId, status, resolutionSummary = null) {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      if (resolutionSummary) ticket.resolutionSummary = resolutionSummary;
      if (status === 'Resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date().toISOString();
        ticket.slaRemainingMinutes = 0;
        ticket.isClosed = true;
      }
      return ticket;
    }
    return null;
  }

  recordAuditEvent(event) {
    const eventId = `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    
    // Create an integrity verification hash
    const payloadStr = `${eventId}|${timestamp}|${event.eventType}|${event.actor}|${event.riskScore}`;
    const mockSha256 = Buffer.from(payloadStr).toString('base64').substring(0, 24);

    const logEntry = {
      eventId,
      timestamp,
      eventType: event.eventType,
      actor: event.actor || 'Veridian_IT_Agent',
      action: event.action,
      riskScore: typeof event.riskScore === 'number' ? event.riskScore : 0,
      riskLevel: event.riskLevel || (event.riskScore >= 75 ? 'HIGH' : event.riskScore >= 40 ? 'MEDIUM' : 'LOW'),
      policyCited: event.policyCited || null,
      verificationHash: `0x${mockSha256}`,
      metadata: event.metadata || {}
    };

    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
    return logEntry;
  }

  getAuditLogs(limit = 100) {
    return this.auditLogs.slice(0, limit);
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        pendingDiagnostic: null,
        createdTicketId: null,
        context: {}
      });
    }
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    Object.assign(session, updates);
    return session;
  }

  reset() {
    this.tickets = [];
    this.auditLogs = [];
    this.sessions.clear();
    this.init();
  }
}

module.exports = new DataStore();
