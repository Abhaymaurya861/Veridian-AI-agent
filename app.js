/**
 * Veridian Corp IT Support Agent — Client Application
 * Exercise Week: Monday, 21 September 2026 – Friday, 25 September 2026
 * Grounded strictly in KB-01 through KB-10 and Asset Management Policy Extract
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    personas: [],
    activePersona: null,
    sessionId: 'veridian-session-' + Date.now().toString(36),
    messages: [],
    tickets: [],
    requests: [],
    policies: [],
    auditLogs: [],
    pendingFollowUp: null,
    theme: localStorage.getItem('veridian-theme') || 'dark',
    auditPollInterval: null
  };

  // DOM Elements Cache
  const elements = {
    // Navigation
    navTabs: document.querySelectorAll('.nav-tab'),
    viewPanels: document.querySelectorAll('.view-panel'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    btnResetDemo: document.getElementById('btn-reset-demo'),
    ticketCountBadge: document.getElementById('ticket-count-badge'),
    requestsCountBadge: document.getElementById('requests-count-badge'),

    // Persona
    personaTrigger: document.getElementById('persona-dropdown-trigger'),
    personaMenu: document.getElementById('persona-menu'),
    personaOptionsList: document.getElementById('persona-options-list'),
    currentUserAvatar: document.getElementById('current-user-avatar'),
    currentUserName: document.getElementById('current-user-name'),
    currentUserRole: document.getElementById('current-user-role'),
    sidebarAvatar: document.getElementById('sidebar-avatar'),
    sidebarName: document.getElementById('sidebar-name'),
    sidebarRole: document.getElementById('sidebar-role'),
    sidebarDept: document.getElementById('sidebar-dept'),
    sidebarMachine: document.getElementById('sidebar-machine'),
    sidebarOs: document.getElementById('sidebar-os'),

    // Chat
    chatMessagesBox: document.getElementById('chat-messages-box'),
    chatSubmitForm: document.getElementById('chat-submit-form'),
    chatTextarea: document.getElementById('chat-textarea'),
    btnClearChat: document.getElementById('btn-clear-chat'),
    followupTray: document.getElementById('followup-options-tray'),
    followupTrayTitle: document.getElementById('followup-tray-title'),
    followupChipsContainer: document.getElementById('followup-chips-container'),
    quickScenariosList: document.getElementById('quick-scenarios-list'),

    // Citations & Mini Ticket
    citationEmptyState: document.getElementById('citation-empty-state'),
    citationActiveContent: document.getElementById('citation-active-content'),
    citationStatusPill: document.getElementById('citation-status-pill'),
    miniTicketContent: document.getElementById('mini-ticket-content'),

    // Requests View
    employeeRequestsTbody: document.getElementById('employee-requests-tbody'),

    // Ticket Center
    ticketsTableBody: document.getElementById('tickets-table-body'),
    ticketsSearchInput: document.getElementById('tickets-search-input'),
    ticketsStatusFilter: document.getElementById('tickets-status-filter'),
    ticketsPriorityFilter: document.getElementById('tickets-priority-filter'),
    btnRefreshTickets: document.getElementById('btn-refresh-tickets'),
    statResolvedCount: document.getElementById('stat-resolved-count'),
    statEscalatedCount: document.getElementById('stat-escalated-count'),
    statCriticalCount: document.getElementById('stat-critical-count'),

    // Policies
    policiesGridContainer: document.getElementById('policies-grid-container'),
    policySearchInput: document.getElementById('policy-search-input'),

    // Audit Trail
    auditLogsList: document.getElementById('audit-logs-list'),
    btnExportAuditJson: document.getElementById('btn-export-audit-json'),

    // Modals
    ticketModal: document.getElementById('ticket-modal'),
    modalTicketId: document.getElementById('modal-ticket-id'),
    modalTicketTitle: document.getElementById('modal-ticket-title'),
    modalTicketBody: document.getElementById('modal-ticket-body'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCloseFooterBtn: document.getElementById('modal-close-footer-btn'),
    modalCopyTicketBtn: document.getElementById('modal-copy-ticket-btn'),

    policyModal: document.getElementById('policy-modal'),
    modalPolicyCode: document.getElementById('modal-policy-code'),
    modalPolicyTitle: document.getElementById('modal-policy-title'),
    modalPolicyBody: document.getElementById('modal-policy-body'),
    modalPolicyCloseBtn: document.getElementById('modal-policy-close-btn')
  };

  // ==========================================================================
  // Initialization
  // ==========================================================================

  async function init() {
    setupTheme();
    setupEventListeners();
    await fetchPersonas();
    await fetchRequests();
    await fetchPolicies();
    await fetchTickets();
    await fetchAuditLogs();
    startAuditPolling();

    renderWelcomeMessage();
  }

  // ==========================================================================
  // Theme Toggle
  // ==========================================================================

  function setupTheme() {
    if (state.theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  }

  function toggleTheme() {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      state.theme = 'light';
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      state.theme = 'dark';
    }
    localStorage.setItem('veridian-theme', state.theme);
  }

  // ==========================================================================
  // Navigation
  // ==========================================================================

  function switchView(targetViewId) {
    elements.navTabs.forEach(tab => {
      if (tab.getAttribute('data-view') === targetViewId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    elements.viewPanels.forEach(panel => {
      if (panel.id === targetViewId) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (targetViewId === 'tickets-view') fetchTickets();
    if (targetViewId === 'audit-view') fetchAuditLogs();
    if (targetViewId === 'requests-view') renderEmployeeRequestsTable();
  }

  // ==========================================================================
  // Personas Management
  // ==========================================================================

  async function fetchPersonas() {
    try {
      const res = await fetch('/api/personas');
      const data = await res.json();
      if (data.success && data.personas.length > 0) {
        state.personas = data.personas;
        setPersona(state.personas[0]);
        renderPersonaMenu();
      }
    } catch (err) {
      console.error('Failed to load personas:', err);
    }
  }

  function setPersona(persona) {
    state.activePersona = persona;
    elements.currentUserAvatar.textContent = persona.avatar;
    elements.currentUserName.textContent = persona.name;
    elements.currentUserRole.textContent = `${persona.role.split(' ')[0]} • ${persona.department}`;

    elements.sidebarAvatar.textContent = persona.avatar;
    elements.sidebarName.textContent = persona.name;
    elements.sidebarRole.textContent = persona.role;
    elements.sidebarDept.textContent = persona.department;
    elements.sidebarMachine.textContent = persona.machineId;
    elements.sidebarOs.textContent = persona.os;

    state.sessionId = 'veridian-session-' + persona.id + '-' + Date.now().toString(36);
  }

  function renderPersonaMenu() {
    elements.personaOptionsList.innerHTML = '';
    state.personas.forEach(p => {
      const item = document.createElement('div');
      item.className = `persona-option-item ${p.id === state.activePersona?.id ? 'active' : ''}`;
      item.innerHTML = `
        <div class="persona-avatar">${p.avatar}</div>
        <div class="persona-info">
          <div class="persona-name">${p.name}</div>
          <div class="persona-role">${p.role} — ${p.department}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        setPersona(p);
        elements.personaMenu.classList.add('hidden');
        renderPersonaMenu();
        clearChat();
      });
      elements.personaOptionsList.appendChild(item);
    });
  }

  // ==========================================================================
  // Section 2: Employee Requests Management
  // ==========================================================================

  async function fetchRequests() {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success) {
        state.requests = data.requests;
        renderQuickScenariosSidebar();
        renderEmployeeRequestsTable();
        elements.requestsCountBadge.textContent = state.requests.length;
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  }

  function renderQuickScenariosSidebar() {
    elements.quickScenariosList.innerHTML = '';
    state.requests.forEach(req => {
      const btn = document.createElement('button');
      btn.className = 'scenario-btn';
      
      let badgeColor = 'badge-green';
      if (req.id === 'REQ-08') badgeColor = 'badge-purple';
      else if (req.id === 'REQ-10' || req.id === 'REQ-01') badgeColor = 'badge-red';
      else if (req.id === 'REQ-04' || req.id === 'REQ-14') badgeColor = 'badge-blue';
      else if (req.id === 'REQ-15') badgeColor = 'badge-gray';

      btn.innerHTML = `
        <div class="scenario-icon">📄</div>
        <div class="scenario-text">
          <div class="scenario-title"><strong>${req.id}</strong>: ${req.employee}</div>
          <div class="scenario-badge ${badgeColor}">${req.dateOpened} • ${req.relevantPolicy}</div>
          <div class="text-xs text-muted" style="margin-top:2px; font-style:italic;">"${truncate(req.request, 45)}"</div>
        </div>
      `;
      btn.addEventListener('click', () => {
        // Switch persona if matching persona exists
        const matched = state.personas.find(p => p.name.toLowerCase() === req.employee.toLowerCase());
        if (matched) setPersona(matched);
        
        elements.chatTextarea.value = req.request;
        handleUserSubmit(req.request);
      });
      elements.quickScenariosList.appendChild(btn);
    });
  }

  function renderEmployeeRequestsTable() {
    elements.employeeRequestsTbody.innerHTML = '';
    state.requests.forEach(req => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="ticket-id-tag">${req.id}</strong></td>
        <td><span class="font-mono text-xs">${req.dateOpened}</span></td>
        <td>
          <div><strong>${req.employee}</strong></div>
          <div class="text-xs text-muted">${req.email}</div>
        </td>
        <td>${req.department}</td>
        <td style="max-width:280px;"><em>"${escapeHtml(req.request)}"</em></td>
        <td><span class="scenario-badge badge-gray">${req.initialActionTaken}</span></td>
        <td><span class="font-mono text-xs" style="color:var(--primary-500);">${req.relevantPolicy}</span></td>
        <td>
          <button class="btn-primary-sm" onclick="window.VeridianApp.runRequest('${req.id}')">
            Test in Agent
          </button>
        </td>
      `;
      elements.employeeRequestsTbody.appendChild(tr);
    });
  }

  function runRequest(reqId) {
    const req = state.requests.find(r => r.id === reqId);
    if (!req) return;

    // Switch view to chat
    switchView('chat-view');

    // Switch persona if matching
    const matched = state.personas.find(p => p.name.toLowerCase() === req.employee.toLowerCase());
    if (matched) setPersona(matched);

    elements.chatTextarea.value = req.request;
    handleUserSubmit(req.request);
  }

  // ==========================================================================
  // Chat & AI Decision Engine
  // ==========================================================================

  function renderWelcomeMessage() {
    const welcomeHtml = `
      <div class="msg-text-content">
        <p>👋 Welcome <strong>${state.activePersona?.name || 'Veridian Employee'}</strong> to the <strong>Veridian Corp IT Support Desk</strong>.</p>
        <p>This agent is currently serving employees during the week of <strong>Monday, 21 September 2026 – Friday, 25 September 2026</strong>.</p>
        <p>All resolutions, follow-ups, and escalations are strictly grounded in <strong>KB-01 through KB-10</strong> and the <strong>Finance Asset Management Policy</strong>.</p>
        <p><em>Click any employee request on the left (REQ-01 to REQ-15) or type your query below!</em></p>
      </div>
    `;
    appendChatMessage('agent', welcomeHtml, { isWelcome: true });
  }

  function clearChat() {
    elements.chatMessagesBox.innerHTML = '';
    elements.followupTray.classList.add('hidden');
    state.pendingFollowUp = null;
    clearCitations();
    renderWelcomeMessage();
  }

  function appendChatMessage(sender, contentHtml, meta = {}) {
    const row = document.createElement('div');
    row.className = `chat-message-row ${sender === 'user' ? 'user-row' : 'agent-row'}`;

    const avatar = sender === 'user' 
      ? (state.activePersona ? state.activePersona.avatar : 'ME') 
      : '🤖';

    let metaBadgeHtml = '';
    if (meta.riskScore !== undefined) {
      if (meta.riskScore >= 90) {
        metaBadgeHtml = `<div class="agent-meta-badge risk-critical">🚨 P1 CRITICAL SECURITY ALERT (${meta.riskScore}/100)</div>`;
      } else if (meta.riskScore >= 75) {
        metaBadgeHtml = `<div class="agent-meta-badge risk-high">🛡️ HIGH RISK ESCALATION (${meta.riskScore}/100)</div>`;
      } else if (meta.type === 'FOLLOW_UP') {
        metaBadgeHtml = `<div class="agent-meta-badge risk-followup">💡 SENSING POLICY DIAGNOSTIC FOLLOW-UP</div>`;
      } else {
        metaBadgeHtml = `<div class="agent-meta-badge risk-low">⚡ ZERO-TOUCH VERIDIAN IT RESOLUTION</div>`;
      }
    }

    row.innerHTML = `
      <div class="chat-msg-avatar">${avatar}</div>
      <div class="chat-msg-bubble">
        ${metaBadgeHtml}
        ${contentHtml}
      </div>
    `;

    elements.chatMessagesBox.appendChild(row);
    elements.chatMessagesBox.scrollTop = elements.chatMessagesBox.scrollHeight;
  }

  function showTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'chat-message-row agent-row';
    row.id = 'typing-indicator-row';
    row.innerHTML = `
      <div class="chat-msg-avatar">🤖</div>
      <div class="chat-msg-bubble" style="color: var(--text-muted); font-style: italic;">
        <span class="status-dot" style="display:inline-block; margin-right:6px;"></span>
        Evaluating Veridian Corp policies (KB-01..10) &amp; historical ticket precedents...
      </div>
    `;
    elements.chatMessagesBox.appendChild(row);
    elements.chatMessagesBox.scrollTop = elements.chatMessagesBox.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator-row');
    if (indicator) indicator.remove();
  }

  async function handleUserSubmit(messageText, followUpAnswer = null) {
    if (!messageText && !followUpAnswer) return;

    if (messageText) {
      appendChatMessage('user', `<div class="msg-text-content"><p>${escapeHtml(messageText)}</p></div>`);
      elements.chatTextarea.value = '';
    }

    elements.followupTray.classList.add('hidden');
    showTypingIndicator();

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          message: messageText || null,
          personaId: state.activePersona?.id,
          followUpResponse: followUpAnswer
        })
      });

      const data = await response.json();
      removeTypingIndicator();

      if (!data.success) {
        appendChatMessage('agent', `<div class="msg-text-content"><p>⚠️ Error: ${data.error}</p></div>`);
        return;
      }

      processAgentResponse(data.data);
    } catch (err) {
      removeTypingIndicator();
      console.error('Chat error:', err);
      appendChatMessage('agent', `<div class="msg-text-content"><p>⚠️ Failed to contact Veridian Support Desk.</p></div>`);
    }
  }

  function processAgentResponse(result) {
    const formattedHtml = formatAgentMarkdown(result.message);

    let actionCardHtml = '';
    if (result.actionType === 'RENEW_VPN_ACTION') {
      actionCardHtml = `
        <div class="chat-action-card">
          <div class="action-card-header">
            <span>🌐 90-Day VPN Renewal Self-Service</span>
            <span class="badge-green">KB-02 Direct</span>
          </div>
          <p class="text-xs text-muted">Click below to re-validate credentials against the Veridian LDAP server (Precedent TK-1042):</p>
          <button class="btn-primary-sm" onclick="window.VeridianApp.executeAction('RENEW_VPN', '${result.ticket?.id}')">
            Re-Authenticate &amp; Extend 90 Days
          </button>
        </div>
      `;
    } else if (result.actionType === 'SELF_SERVICE_PORTAL_LINK') {
      actionCardHtml = `
        <div class="chat-action-card">
          <div class="action-card-header">
            <span>🔑 Veridian Self-Service Password Portal</span>
            <span class="badge-green">KB-01 No Approval</span>
          </div>
          <p class="text-xs text-muted">Portal URL: <strong>https://auth.veridian-corp.example/reset-password</strong></p>
        </div>
      `;
    } else if (result.actionType === 'KIOSK_INSTRUCTIONS') {
      actionCardHtml = `
        <div class="chat-action-card">
          <div class="action-card-header">
            <span>📶 Front-Desk Kiosk Pass Generator</span>
            <span class="badge-green">KB-07 24-Hour Pass</span>
          </div>
          <p class="text-xs text-muted">No ticket required. Walk to the receptionist touch-screen kiosk to print credentials.</p>
        </div>
      `;
    } else if (result.actionType === 'SECURITY_ALERT_SENT') {
      actionCardHtml = `
        <div class="chat-action-card" style="border-color: rgba(168, 85, 247, 0.4);">
          <div class="action-card-header">
            <span style="color: var(--color-emergency);">🚨 Incident Alert Dispatched</span>
            <span class="badge-purple">KB-09 CSIRT</span>
          </div>
          <p class="text-xs text-muted">Dispatched to: <strong>security@veridian-corp.example</strong> (Precedent TK-1048)</p>
          <button class="btn-outline-sm" onclick="window.VeridianApp.viewTicketDetail('${result.ticket?.id}')">
            Inspect Ticket #${result.ticket?.id}
          </button>
        </div>
      `;
    }

    const fullContentHtml = `
      <div class="msg-text-content">
        ${formattedHtml}
      </div>
      ${actionCardHtml}
    `;

    appendChatMessage('agent', fullContentHtml, {
      riskScore: result.riskScore,
      type: result.type
    });

    if (result.type === 'FOLLOW_UP' && result.options && result.options.length > 0) {
      showFollowUpTray(result.message, result.options);
    } else {
      elements.followupTray.classList.add('hidden');
    }

    if (result.policyGrounding) {
      updateCitationCard(result.policyGrounding, result.riskScore);
    }

    if (result.ticket) {
      updateMiniTicketCard(result.ticket);
      fetchTickets();
    }

    fetchAuditLogs();
  }

  function showFollowUpTray(title, options) {
    elements.followupTrayTitle.textContent = "Veridian IT Diagnostic Question:";
    elements.followupChipsContainer.innerHTML = '';

    options.forEach(opt => {
      const chip = document.createElement('button');
      chip.className = 'followup-chip';
      chip.textContent = opt;
      chip.addEventListener('click', () => {
        handleUserSubmit(null, { selection: opt });
      });
      elements.followupChipsContainer.appendChild(chip);
    });

    elements.followupTray.classList.remove('hidden');
  }

  // ==========================================================================
  // Citations & Mini Ticket Sidebar
  // ==========================================================================

  function clearCitations() {
    elements.citationEmptyState.classList.remove('hidden');
    elements.citationActiveContent.classList.add('hidden');
    elements.citationStatusPill.textContent = 'Awaiting Query';
    elements.citationStatusPill.className = 'badge-status-pill';
    elements.miniTicketContent.innerHTML = `<p class="text-muted text-sm">No ticket logged in this conversation yet.</p>`;
  }

  function updateCitationCard(policy, riskScore) {
    elements.citationEmptyState.classList.add('hidden');
    elements.citationActiveContent.classList.remove('hidden');

    const polCode = policy.policyId || policy.id;
    elements.citationStatusPill.textContent = `Grounded (${polCode})`;
    elements.citationStatusPill.className = 'badge-status-pill badge-green';

    elements.citationActiveContent.innerHTML = `
      <div class="citation-active-card">
        <div class="citation-code-badge">${polCode} • Veridian IT</div>
        <div class="citation-title">${policy.title}</div>
        <div class="citation-meta-grid">
          <div><span class="text-muted">Owner:</span> <strong>${policy.owner}</strong></div>
          <div><span class="text-muted">Risk Tier:</span> <strong>${policy.riskTier}</strong></div>
          <div><span class="text-muted">Target SLA:</span> <strong>${policy.slaHours}h</strong></div>
          <div><span class="text-muted">Category:</span> <strong>${policy.category}</strong></div>
        </div>
        <div>
          <span class="text-xs text-muted" style="font-weight:600; text-transform:uppercase;">Grounded Policy Excerpt:</span>
          <div class="citation-clause-quote">"${policy.relevantExcerpt || (policy.allClauses ? policy.allClauses[0] : '')}"</div>
        </div>
        <button class="btn-outline-sm" onclick="window.VeridianApp.viewPolicyDetail('${polCode}')" style="width:100%; justify-content:center; margin-top:0.4rem;">
          View Full Policy in KB
        </button>
      </div>
    `;
  }

  function updateMiniTicketCard(ticket) {
    const statusClass = ticket.status.includes('Resolved') || ticket.status.includes('Approved') 
      ? 'status-resolved' 
      : (ticket.priority === 'P1' ? 'status-csirt' : 'status-escalated');

    elements.miniTicketContent.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="ticket-id-tag">${ticket.id}</span>
          <span class="priority-pill p-${ticket.priority.toLowerCase()}">${ticket.priority}</span>
        </div>
        <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(ticket.title)}</div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
          <span class="text-muted">Status:</span>
          <span class="status-badge-cell ${statusClass}">${ticket.status}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
          <span class="text-muted">Assigned:</span>
          <span>${ticket.assignedTo}</span>
        </div>
        <button class="btn-outline-sm" onclick="window.VeridianApp.viewTicketDetail('${ticket.id}')" style="width:100%; justify-content:center; margin-top:0.2rem;">
          Inspect Ticket
        </button>
      </div>
    `;
  }

  async function executeAction(actionType, ticketId) {
    appendChatMessage('agent', `
      <div class="msg-text-content">
        <p>⚡ <strong>Action Executed Successfully</strong> (Ticket <strong>#${ticketId}</strong>)</p>
        <p>VPN credentials renewed for an additional 90 days per KB-02 policy.</p>
      </div>
    `, { riskScore: 5, type: 'RESOLUTION_AUTOMATED' });
  }

  // ==========================================================================
  // Section 3: Ticket Queue View (TK-1042..TK-1051 + New)
  // ==========================================================================

  async function fetchTickets() {
    try {
      const status = elements.ticketsStatusFilter.value;
      const priority = elements.ticketsPriorityFilter.value;
      const search = elements.ticketsSearchInput.value.trim();

      const params = new URLSearchParams();
      if (status !== 'ALL') {
        if (status === 'Active') {
          params.append('status', 'Active');
        } else {
          params.append('status', status);
        }
      }
      if (priority !== 'ALL') params.append('priority', priority);
      if (search) params.append('search', search);

      const res = await fetch(`/api/tickets?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        state.tickets = data.tickets;
        renderTicketsTable();
        updateTicketStats();
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  }

  function renderTicketsTable() {
    elements.ticketsTableBody.innerHTML = '';

    state.tickets.forEach(t => {
      const tr = document.createElement('tr');

      const isClosed = t.isClosed || t.status.toLowerCase().includes('closed') || t.status === 'Resolved';
      const statusClass = isClosed ? 'status-resolved' : (t.priority === 'P1' ? 'status-csirt' : 'status-escalated');
      const priorityClass = `p-${t.priority.toLowerCase()}`;
      const policyCode = t.policyRef ? (t.policyRef.id || t.policyRef.policyId) : 'N/A';

      tr.innerHTML = `
        <td><span class="ticket-id-tag">${t.id}</span></td>
        <td><span class="priority-pill ${priorityClass}">${t.priority}</span></td>
        <td style="max-width: 260px; font-weight: 500;">${escapeHtml(t.title)}</td>
        <td>
          <div>${escapeHtml(t.requester ? t.requester.name : 'Unknown')}</div>
          <div class="text-xs text-muted">${escapeHtml(t.requester && t.requester.department ? t.requester.department : '')}</div>
        </td>
        <td>
          <span class="font-mono text-xs" style="color:var(--primary-500); cursor:pointer;" onclick="window.VeridianApp.viewPolicyDetail('${policyCode}')">
            ${policyCode}
          </span>
        </td>
        <td><span class="status-badge-cell ${statusClass}">${t.status}</span></td>
        <td>
          <span class="scenario-badge ${isClosed ? 'badge-gray' : 'badge-amber'}">
            ${isClosed ? 'Closed Precedent' : 'Active Case'}
          </span>
        </td>
        <td class="text-xs">${t.assignedTo}</td>
        <td>
          <button class="btn-ghost-sm" onclick="window.VeridianApp.viewTicketDetail('${t.id}')">Inspect</button>
        </td>
      `;

      elements.ticketsTableBody.appendChild(tr);
    });
  }

  function updateTicketStats() {
    const closed = state.tickets.filter(t => t.isClosed || t.status.toLowerCase().includes('closed') || t.status === 'Resolved').length;
    const active = state.tickets.filter(t => !t.isClosed && !t.status.toLowerCase().includes('closed') && t.status !== 'Resolved').length;
    const critical = state.tickets.filter(t => t.priority === 'P1').length;

    elements.statResolvedCount.textContent = closed;
    elements.statEscalatedCount.textContent = active;
    elements.statCriticalCount.textContent = critical;
    elements.ticketCountBadge.textContent = state.tickets.length;
  }

  function viewTicketDetail(ticketId) {
    const ticket = state.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    elements.modalTicketId.textContent = ticket.id;
    elements.modalTicketTitle.textContent = ticket.title;

    elements.modalTicketBody.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:var(--bg-surface-elevated); padding:0.85rem; border-radius:var(--radius-md);">
        <div><span class="text-muted text-xs">Employee:</span> <strong>${ticket.requester ? ticket.requester.name : 'N/A'}</strong></div>
        <div><span class="text-muted text-xs">Department:</span> <strong>${ticket.requester ? ticket.requester.department : 'N/A'}</strong></div>
        <div><span class="text-muted text-xs">Priority:</span> <strong>${ticket.priority}</strong> (Risk: ${ticket.riskScore}/100)</div>
        <div><span class="text-muted text-xs">Status:</span> <strong>${ticket.status}</strong></div>
        <div><span class="text-muted text-xs">Assigned Desk:</span> <strong>${ticket.assignedTo}</strong></div>
        <div><span class="text-muted text-xs">Policy Grounded:</span> <strong>${ticket.policyRef ? ticket.policyRef.id : 'N/A'}</strong></div>
      </div>

      <div>
        <div class="text-xs text-muted" style="font-weight:600; margin-bottom:0.3rem;">RESOLUTION / PRECEDENT NOTES:</div>
        <div style="background:var(--bg-surface-elevated); padding:0.75rem; border-radius:var(--radius-sm); font-size:0.82rem; line-height:1.5;">
          ${ticket.resolutionSummary || 'Under active triage and review.'}
        </div>
      </div>

      <div class="text-xs text-muted" style="display:flex; justify-content:space-between; padding-top:0.5rem; border-top:1px solid var(--border-subtle);">
        <span>Date Logged: ${new Date(ticket.createdAt).toLocaleString()}</span>
        <span>${ticket.resolvedAt ? 'Closed: ' + new Date(ticket.resolvedAt).toLocaleString() : 'Active Queue'}</span>
      </div>
    `;

    elements.ticketModal.classList.remove('hidden');
  }

  // ==========================================================================
  // Section 1: Policies View (KB-01..KB-10 + Asset Policy)
  // ==========================================================================

  async function fetchPolicies() {
    try {
      const res = await fetch('/api/policies');
      const data = await res.json();
      if (data.success) {
        state.policies = data.policies;
        renderPoliciesGrid(state.policies);
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
    }
  }

  function renderPoliciesGrid(policies) {
    elements.policiesGridContainer.innerHTML = '';

    policies.forEach(p => {
      const card = document.createElement('div');
      card.className = 'policy-card';
      card.onclick = () => viewPolicyDetail(p.id);

      const riskBadgeClass = p.riskTier === 'CRITICAL' ? 'badge-purple' : (p.riskTier === 'HIGH' ? 'badge-red' : (p.riskTier === 'MEDIUM' ? 'badge-amber' : 'badge-green'));

      card.innerHTML = `
        <div>
          <div class="policy-card-header">
            <span class="policy-code">${p.id}</span>
            <span class="scenario-badge ${riskBadgeClass}">${p.riskTier} TIER</span>
          </div>
          <div class="policy-card-title">${p.title}</div>
          <div class="policy-card-summary" style="margin-top:0.4rem;">${p.summary}</div>
        </div>
        <div>
          <div class="policy-clauses-preview">
            <strong>Key Clause:</strong> "${p.keyClauses ? p.keyClauses[0] : ''}"
          </div>
          <div class="policy-card-footer">
            <span>Owner: ${p.owner}</span>
            <span>Veridian Corp</span>
          </div>
        </div>
      `;

      elements.policiesGridContainer.appendChild(card);
    });
  }

  function viewPolicyDetail(policyId) {
    const policy = state.policies.find(p => p.id.toLowerCase() === policyId.toLowerCase());
    if (!policy) return;

    elements.modalPolicyCode.textContent = policy.id;
    elements.modalPolicyTitle.textContent = policy.title;

    const clausesList = policy.keyClauses.map((c, i) => `
      <li style="margin-bottom: 0.5rem; padding-left: 0.5rem;">
        <strong>Clause ${i + 1}:</strong> ${escapeHtml(c)}
      </li>
    `).join('');

    elements.modalPolicyBody.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:var(--bg-surface-elevated); padding:0.85rem; border-radius:var(--radius-md);">
        <div><span class="text-muted text-xs">Policy Owner:</span> <strong>${policy.owner}</strong></div>
        <div><span class="text-muted text-xs">Category:</span> <strong>${policy.category}</strong></div>
        <div><span class="text-muted text-xs">Resolution Model:</span> <strong>${policy.resolutionType}</strong></div>
        <div><span class="text-muted text-xs">Target SLA:</span> <strong>${policy.slaHours} hours</strong></div>
      </div>

      <div>
        <div class="text-xs text-muted" style="font-weight:600; margin-bottom:0.3rem;">OFFICIAL TEXT / SUMMARY:</div>
        <p style="font-size:0.85rem; color:var(--text-secondary);">${policy.summary}</p>
      </div>

      <div>
        <div class="text-xs text-muted" style="font-weight:600; margin-bottom:0.4rem;">ENFORCEABLE RULES:</div>
        <ol style="padding-left:1.25rem; font-size:0.82rem; line-height:1.6; color:var(--text-primary);">
          ${clausesList}
        </ol>
      </div>
    `;

    elements.policyModal.classList.remove('hidden');
  }

  // ==========================================================================
  // Audit Trail View
  // ==========================================================================

  async function fetchAuditLogs() {
    try {
      const res = await fetch('/api/audit?limit=60');
      const data = await res.json();
      if (data.success) {
        state.auditLogs = data.logs;
        renderAuditLogs();
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }

  function renderAuditLogs() {
    elements.auditLogsList.innerHTML = '';

    state.auditLogs.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'audit-entry-row';

      let eventBadgeClass = 'event-query';
      if (entry.eventType.includes('INTENT')) eventBadgeClass = 'event-intent';
      if (entry.eventType.includes('POLICY')) eventBadgeClass = 'event-policy';
      if (entry.eventType.includes('ACTION')) eventBadgeClass = 'event-action';
      if (entry.eventType.includes('ESCALATION')) eventBadgeClass = 'event-escalation';

      const timeStr = new Date(entry.timestamp).toLocaleTimeString();

      row.innerHTML = `
        <div class="audit-time">${timeStr}</div>
        <div>
          <span class="audit-event-type ${eventBadgeClass}">${entry.eventType}</span>
          <div class="text-xs text-muted font-mono" style="margin-top:2px;">${entry.actor.split(' ')[0]}</div>
        </div>
        <div class="audit-action-text">${escapeHtml(entry.action)}</div>
        <div class="audit-hash" title="HMAC Sha-256 integrity hash">${entry.verificationHash}</div>
      `;

      elements.auditLogsList.appendChild(row);
    });
  }

  function startAuditPolling() {
    if (state.auditPollInterval) clearInterval(state.auditPollInterval);
    state.auditPollInterval = setInterval(fetchAuditLogs, 4000);
  }

  function exportAuditJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `veridian-corp-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // ==========================================================================
  // Event Listeners Setup
  // ==========================================================================

  function setupEventListeners() {
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        switchView(view);
      });
    });

    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    elements.personaTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.personaMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      elements.personaMenu.classList.add('hidden');
    });

    elements.btnResetDemo.addEventListener('click', async () => {
      if (confirm('Reset tickets and audit trail to initial Veridian Corp state?')) {
        await fetch('/api/reset', { method: 'POST' });
        clearChat();
        await fetchTickets();
        await fetchAuditLogs();
      }
    });

    elements.chatSubmitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = elements.chatTextarea.value.trim();
      if (val) handleUserSubmit(val);
    });

    elements.chatTextarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = elements.chatTextarea.value.trim();
        if (val) handleUserSubmit(val);
      }
    });

    elements.btnClearChat.addEventListener('click', clearChat);

    elements.ticketsSearchInput.addEventListener('input', debounce(fetchTickets, 300));
    elements.ticketsStatusFilter.addEventListener('change', fetchTickets);
    elements.ticketsPriorityFilter.addEventListener('change', fetchTickets);
    elements.btnRefreshTickets.addEventListener('click', fetchTickets);

    elements.policySearchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderPoliciesGrid(state.policies);
        return;
      }
      const filtered = state.policies.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.keywords.some(k => k.toLowerCase().includes(q))
      );
      renderPoliciesGrid(filtered);
    });

    elements.btnExportAuditJson.addEventListener('click', exportAuditJson);

    elements.modalCloseBtn.addEventListener('click', () => elements.ticketModal.classList.add('hidden'));
    elements.modalCloseFooterBtn.addEventListener('click', () => elements.ticketModal.classList.add('hidden'));
    elements.modalPolicyCloseBtn.addEventListener('click', () => elements.policyModal.classList.add('hidden'));

    elements.ticketModal.addEventListener('click', (e) => {
      if (e.target === elements.ticketModal) elements.ticketModal.classList.add('hidden');
    });
    elements.policyModal.addEventListener('click', (e) => {
      if (e.target === elements.policyModal) elements.policyModal.classList.add('hidden');
    });

    elements.modalCopyTicketBtn.addEventListener('click', () => {
      const summaryText = elements.modalTicketBody.innerText;
      navigator.clipboard.writeText(summaryText).then(() => {
        elements.modalCopyTicketBtn.textContent = 'Copied to Clipboard!';
        setTimeout(() => elements.modalCopyTicketBtn.textContent = 'Copy Ticket Summary', 2000);
      });
    });
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function formatAgentMarkdown(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/(?:^|\n)[•\*\-]\s+(.+)/g, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    html = html.split('\n\n').map(p => {
      if (p.startsWith('<ul>') || p.startsWith('<blockquote>') || p.startsWith('<ol>')) return p;
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  window.VeridianApp = {
    viewTicketDetail,
    viewPolicyDetail,
    executeAction,
    runRequest
  };

  init();
});
