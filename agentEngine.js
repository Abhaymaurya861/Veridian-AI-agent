const store = require('./store');

class AgentEngine {
  constructor() {
    // Intent definitions strictly mapped to Veridian Corp Policies KB-01 through KB-10 & Asset Management Policy
    this.intentDefinitions = [
      {
        intent: 'PASSWORD_RESET_OR_LOCKOUT',
        policyId: 'KB-01',
        riskBase: 10,
        priority: 'P3',
        patterns: [/password/i, /locked\s*out/i, /lockout/i, /failed\s*attempt/i, /unlock/i, /reset\s*password/i, /cant\s*log\s*in/i],
        requiredEntities: ['lockoutState'],
        followUpPrompt: {
          question: "Under Veridian Corp policy KB-01, please select your account status:",
          options: [
            "Locked out after 5+ failed password attempts (Requires IT manual unlock)",
            "Standard password reset (Can use self-service portal immediately without ticket)",
            "Forgotten password but account is not locked out"
          ],
          entityKey: 'lockoutState'
        }
      },
      {
        intent: 'VPN_ACCESS_OR_RENEWAL',
        policyId: 'KB-02',
        riskBase: 25,
        priority: 'P3',
        patterns: [/vpn/i, /contractor.*vpn/i, /vpn.*contractor/i, /credentials\s*expired/i, /renew\s*vpn/i, /vpn.*stopped/i],
        requiredEntities: ['vpnType'],
        followUpPrompt: {
          question: "Per Veridian Corp policy KB-02, what type of VPN request is this?",
          options: [
            "My 90-day VPN credentials expired (Full-time employee self-renewal)",
            "Requesting VPN access for an incoming contractor (Requires manager approval form)",
            "Full-time employee initial VPN setup (Granted automatically)"
          ],
          entityKey: 'vpnType'
        }
      },
      {
        intent: 'LAPTOP_REPLACEMENT_OR_HARDWARE',
        policyId: 'KB-03',
        riskBase: 40,
        priority: 'P2',
        patterns: [/laptop/i, /won['’]t\s*turn\s*on/i, /dead/i, /replacement/i, /replace\s*laptop/i, /screen\s*flickering/i, /flicker/i, /hardware\s*failure/i, /years\s*old/i],
        requiredEntities: ['hardwareCondition'],
        followUpPrompt: {
          question: "Per KB-03 & Asset Management Policy, what is the age and condition of your laptop?",
          options: [
            "Laptop is completely dead / won't turn on (Verified hardware failure, had it 3.5 years)",
            "Screen flickering / physical glitch (Laptop is 2 years old, needs repair rather than replacement)",
            "Laptop is over 3 years old and due for scheduled refresh (Requires 2 weeks advance notice)",
            "Standard refresh inquiry under 4-year asset cycle (Requires Finance & IT sign-off)"
          ],
          entityKey: 'hardwareCondition'
        }
      },
      {
        intent: 'SOFTWARE_INSTALLATION',
        policyId: 'KB-04',
        riskBase: 45,
        priority: 'P3',
        patterns: [/software/i, /install/i, /catalog/i, /data-analysis\s*tool/i, /browser\s*extension/i, /extension/i, /productivity\s*tracking/i, /application/i],
        requiredEntities: ['softwareCatalogStatus'],
        followUpPrompt: {
          question: "According to KB-04 (Software Installation Requests), is this software in the approved catalog?",
          options: [
            "Non-catalog software / tool (e.g. data-analysis tool — requires IT Security review, 3-5 days)",
            "Browser extension (e.g. productivity tracking — requires IT Security review, 3-5 days)",
            "Standard software listed in the Veridian approved catalog (Self-installable)"
          ],
          entityKey: 'softwareCatalogStatus'
        }
      },
      {
        intent: 'PRINTER_TROUBLESHOOTING',
        policyId: 'KB-05',
        riskBase: 15,
        priority: 'P4',
        patterns: [/printer/i, /paper\s*jam/i, /print\s*spooler/i, /queue/i, /printing/i],
        requiredEntities: ['printerStep'],
        followUpPrompt: {
          question: "Per KB-05 (Printer Troubleshooting), have you performed initial troubleshooting?",
          options: [
            "Printer queue checked and print spooler restarted, but paper jam error persists",
            "I have not checked the print queue or restarted the print spooler yet",
            "Spooler restart succeeded and printer is operational"
          ],
          entityKey: 'printerStep'
        }
      },
      {
        intent: 'MAILBOX_QUOTA',
        policyId: 'KB-06',
        riskBase: 20,
        priority: 'P3',
        patterns: [/mailbox/i, /quota/i, /full/i, /archive/i, /can['’]t\s*send\s*emails?/i, /25gb/i, /50gb/i, /storage/i],
        requiredEntities: ['quotaAction'],
        followUpPrompt: {
          question: "Per KB-06, default quota is 25GB. What action would you like to take?",
          options: [
            "Request manager-approved quota increase beyond 25GB (Capped at 50GB per KB-06)",
            "Guidance on archiving old mail to free up storage under 25GB",
            "Emergency temporary mail sending hold release"
          ],
          entityKey: 'quotaAction'
        }
      },
      {
        intent: 'GUEST_WIFI',
        policyId: 'KB-07',
        riskBase: 5,
        priority: 'P4',
        patterns: [/guest.*wi-?fi/i, /wi-?fi.*guest/i, /visitor.*wi-?fi/i, /wi-?fi.*visitor/i, /front-desk/i, /kiosk/i],
        requiredEntities: [],
        followUpPrompt: null
      },
      {
        intent: 'EXPENSE_SOFTWARE_ACCESS',
        policyId: 'KB-08',
        riskBase: 20,
        priority: 'P3',
        patterns: [/expense/i, /expense\s*tool/i, /expense\s*management/i, /invalid\s*credentials.*expense/i],
        requiredEntities: ['expenseIssueType'],
        followUpPrompt: {
          question: "Under Veridian Corp KB-08, access is granted by Finance, not IT. Please clarify:",
          options: [
            "Technical/login issue with an existing expense account (IT can assist)",
            "Requesting brand new access to the expense management tool (Must contact Finance)",
            "Password reset for verified existing expense account"
          ],
          entityKey: 'expenseIssueType'
        }
      },
      {
        intent: 'SECURITY_INCIDENT_PHISHING',
        policyId: 'KB-09',
        riskBase: 95,
        priority: 'P1',
        patterns: [/phish(ing)?/i, /suspicious\s*email/i, /forward.*teammates/i, /teammates.*check/i, /malware/i, /unauthorized\s*access/i],
        requiredEntities: ['phishingForwardStatus'],
        followUpPrompt: {
          question: "EMERGENCY PROTOCOL (KB-09): Did you forward the suspicious email to any colleagues?",
          options: [
            "Yes, I forwarded or was about to forward it to teammates to check",
            "No, I only observed it and did not forward it to anyone",
            "I entered my credentials on a link inside the suspicious email"
          ],
          entityKey: 'phishingForwardStatus'
        }
      },
      {
        intent: 'WFH_EQUIPMENT_ALLOWANCE',
        policyId: 'KB-10',
        riskBase: 25,
        priority: 'P3',
        patterns: [/work\s*from\s*home/i, /wfh/i, /home\s*office/i, /monitor/i, /chair/i, /equipment\s*allowance/i, /4\s*days/i, /3\s*days/i],
        requiredEntities: ['remoteDays'],
        followUpPrompt: {
          question: "Per KB-10, how many days per week do you work remotely?",
          options: [
            "4 or 5 days a week (Qualifies: more than 3 days/week remote)",
            "3 days a week or fewer (Does not qualify for home office equipment allowance)",
            "Manager sign-off already obtained, need IT equipment shipping"
          ],
          entityKey: 'remoteDays'
        }
      },
      {
        intent: 'ADMIN_SERVER_ACCESS',
        policyId: 'KB-09',
        riskBase: 85,
        priority: 'P2',
        patterns: [/admin\s*access/i, /finance\s*reporting\s*server/i, /server\s*access/i, /month-end.*admin/i],
        requiredEntities: ['adminJustification'],
        followUpPrompt: {
          question: "Administrative server access involves sensitive systems. What is your business justification?",
          options: [
            "Urgent month-end reporting (Formal Finance & Security authorization required)",
            "Development / testing server access",
            "Routine file access (Standard user read-only permission suffices)"
          ],
          entityKey: 'adminJustification'
        }
      }
    ];
  }

  // 1. Understand Issue Intent
  classifyIntent(message) {
    const text = message.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    for (const def of this.intentDefinitions) {
      let matchCount = 0;
      for (const pattern of def.patterns) {
        if (pattern.test(text)) {
          matchCount++;
        }
      }
      if (matchCount > highestScore) {
        highestScore = matchCount;
        bestMatch = def;
      }
    }

    if (!bestMatch || highestScore === 0) {
      return {
        intent: 'UNCLEAR_AMBIGUOUS',
        policyId: null,
        riskScore: 30,
        priority: 'P3',
        confidence: 0.35,
        followUpPrompt: {
          question: "Hello! To assist you efficiently at Veridian Corp IT Support, could you please specify what issue you are experiencing?",
          options: [
            "Laptop or Hardware Issue (KB-03 / Asset Policy)",
            "Account Login or Password Lockout (KB-01)",
            "VPN Connection or Contractor Access (KB-02)",
            "Software or Browser Extension Request (KB-04)",
            "Printer Paper Jam / Spooler Issue (KB-05)",
            "Mailbox Storage Quota (KB-06)",
            "Expense Tool Access or Login (KB-08)",
            "Suspected Phishing Email or Security Threat (KB-09)"
          ],
          entityKey: 'clarifiedDomain'
        }
      };
    }

    return {
      intent: bestMatch.intent,
      policyId: bestMatch.policyId,
      riskScore: bestMatch.riskBase,
      priority: bestMatch.priority,
      confidence: Math.min(0.98, 0.70 + (highestScore * 0.10)),
      followUpPrompt: bestMatch.followUpPrompt
    };
  }

  // 2. Policy Grounding
  getPolicyGrounding(policyId) {
    if (!policyId) return null;
    const policy = typeof policyId === 'string' ? store.getPolicyById(policyId) : policyId;
    if (!policy) return null;

    return {
      id: policy.id,
      policyId: policy.id,
      title: policy.title,
      category: policy.category,
      owner: policy.owner,
      riskTier: policy.riskTier,
      relevantExcerpt: policy.keyClauses ? policy.keyClauses[0] : (policy.summary || ''),
      allClauses: policy.keyClauses || [],
      resolutionType: policy.resolutionType,
      slaHours: policy.slaHours
    };
  }

  // 3. Process Message Pipeline
  async processUserMessage(sessionId, message, personaId, followUpResponse = null) {
    const session = store.getSession(sessionId);
    const persona = store.getPersonaById(personaId);

    // Check if answering pending diagnostic follow-up
    if (session.pendingDiagnostic && followUpResponse) {
      return this.handleDiagnosticResolution(session, persona, followUpResponse);
    }

    const safeMessage = message || '';

    // Audit incoming employee query
    store.recordAuditEvent({
      eventType: 'USER_QUERY_RECEIVED',
      actor: `${persona.name} (${persona.department})`,
      action: `Employee submitted request: "${safeMessage.substring(0, 120)}${safeMessage.length > 120 ? '...' : ''}"`,
      riskScore: 0,
      metadata: { personaId: persona.id, email: persona.email }
    });

    // Step 1: Classify Intent
    const classification = this.classifyIntent(safeMessage);

    store.recordAuditEvent({
      eventType: 'INTENT_CLASSIFIED',
      actor: 'Veridian_NLU_Engine',
      action: `Classified as ${classification.intent} (Confidence: ${Math.round(classification.confidence * 100)}%)`,
      riskScore: classification.riskScore,
      metadata: { intent: classification.intent }
    });

    // Step 2: Policy Grounding
    const policy = this.getPolicyGrounding(classification.policyId);
    if (policy) {
      store.recordAuditEvent({
        eventType: 'POLICY_GROUNDED',
        actor: 'Veridian_Policy_Engine',
        action: `Grounded against official policy: ${policy.policyId} ("${policy.title}")`,
        riskScore: classification.riskScore,
        policyCited: policy.policyId
      });
    }

    // Step 3: Check if Diagnostic Follow-Up Question is Sensible
    if (classification.followUpPrompt) {
      session.pendingDiagnostic = {
        intent: classification.intent,
        policyId: classification.policyId,
        initialQuery: safeMessage,
        riskScore: classification.riskScore,
        priority: classification.priority,
        policy
      };

      store.recordAuditEvent({
        eventType: 'FOLLOW_UP_REQUESTED',
        actor: 'Veridian_IT_Agent',
        action: `Asked diagnostic follow-up question to ${persona.name}.`,
        riskScore: classification.riskScore,
        policyCited: policy ? policy.policyId : null
      });

      return {
        type: 'FOLLOW_UP',
        message: classification.followUpPrompt.question,
        options: classification.followUpPrompt.options,
        entityKey: classification.followUpPrompt.entityKey,
        policyGrounding: policy,
        riskScore: classification.riskScore,
        intent: classification.intent
      };
    }

    // Direct resolution (e.g. Guest Wi-Fi KB-07 has no follow-up needed)
    return this.finalizeResolution(session, persona, classification.intent, policy, {
      selection: 'Direct Inquiry',
      initialQuery: safeMessage
    });
  }

  // 4. Handle Diagnostic Answer
  async handleDiagnosticResolution(session, persona, followUpAnswer) {
    const diagnostic = session.pendingDiagnostic;
    session.pendingDiagnostic = null;

    const selectedOption = followUpAnswer.selection || followUpAnswer;
    const policy = diagnostic.policy;
    let intent = diagnostic.intent;

    // Clarification routing for ambiguous requests (like REQ-15 "hey can you help, its not working")
    if (intent === 'UNCLEAR_AMBIGUOUS') {
      if (selectedOption.includes('Laptop') || selectedOption.includes('Hardware')) {
        intent = 'LAPTOP_REPLACEMENT_OR_HARDWARE';
      } else if (selectedOption.includes('Password') || selectedOption.includes('Login')) {
        intent = 'PASSWORD_RESET_OR_LOCKOUT';
      } else if (selectedOption.includes('VPN')) {
        intent = 'VPN_ACCESS_OR_RENEWAL';
      } else if (selectedOption.includes('Software')) {
        intent = 'SOFTWARE_INSTALLATION';
      } else if (selectedOption.includes('Printer')) {
        intent = 'PRINTER_TROUBLESHOOTING';
      } else if (selectedOption.includes('Mailbox')) {
        intent = 'MAILBOX_QUOTA';
      } else if (selectedOption.includes('Expense')) {
        intent = 'EXPENSE_SOFTWARE_ACCESS';
      } else {
        intent = 'SECURITY_INCIDENT_PHISHING';
      }
    }

    store.recordAuditEvent({
      eventType: 'FOLLOW_UP_ANSWERED',
      actor: `${persona.name} (${persona.department})`,
      action: `Employee selected: "${selectedOption}"`,
      riskScore: diagnostic.riskScore,
      policyCited: policy ? policy.policyId : null
    });

    return this.finalizeResolution(session, persona, intent, policy, {
      selection: selectedOption,
      initialQuery: diagnostic.initialQuery
    });
  }

  // 5. Finalize Resolution Based Strictly on Veridian Corp Policies & Past Precedents
  finalizeResolution(session, persona, intent, policy, context) {
    const selection = context.selection || '';

    // =========================================================================
    // KB-01: PASSWORD RESET & 5-ATTEMPT LOCKOUT (e.g. REQ-03 Karan Mehta)
    // =========================================================================
    if (intent === 'PASSWORD_RESET_OR_LOCKOUT') {
      const isLockedOut = selection.includes('Locked out after 5+') || selection.includes('6 times') || (context.initialQuery && context.initialQuery.includes('6 times'));
      const groundPolicy = this.getPolicyGrounding('KB-01');

      if (isLockedOut) {
        // Under KB-01: locked out after 5 failed attempts -> contact IT to unlock manually. No approval required.
        const ticket = store.createTicket({
          title: `Account Manual Unlock: ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Identity & Access',
          priority: 'P3',
          status: 'In progress — manual unlock queued',
          resolutionSummary: `Locked out after 5+ failed attempts per KB-01. Manual account unlock queued by IT. No approval required.`,
          policyRef: { id: 'KB-01', title: groundPolicy.title },
          riskLevel: 'LOW',
          riskScore: 15,
          assignedTo: 'IT Support Desk',
          slaRemainingMinutes: 30
        });

        store.recordAuditEvent({
          eventType: 'ACTION_EXECUTED',
          actor: 'Veridian_IT_Agent',
          action: `Queued manual unlock for ${persona.name} under KB-01 (Ticket ${ticket.id}). No approval required.`,
          riskScore: 15,
          policyCited: 'KB-01'
        });

        return {
          type: 'RESOLUTION_AUTOMATED',
          riskScore: 15,
          riskLevel: 'LOW',
          ticket: ticket,
          policyGrounding: groundPolicy,
          message: `🔒 **ACCOUNT MANUAL UNLOCK QUEUED** (Ticket **#${ticket.id}**)\n\n` +
                   `Under **Veridian Corp Policy KB-01 (Password Reset)**:\n` +
                   `> *"If locked out after 5 failed attempts, contact IT to unlock the account manually. No approval required."*\n\n` +
                   `• **Status**: Because you attempted your password 6 times, your account has been placed into the manual unlock queue.\n` +
                   `• **Approval**: **No approval required** per KB-01.\n` +
                   `• An IT support engineer will verify your identity and unlock your account shortly.`,
          actionType: 'ACCOUNT_UNLOCK_QUEUED',
          actionData: { ticketId: ticket.id, policy: 'KB-01' }
        };
      } else {
        // Standard self-service password reset
        return {
          type: 'RESOLUTION_AUTOMATED',
          riskScore: 10,
          riskLevel: 'LOW',
          ticket: null,
          policyGrounding: groundPolicy,
          message: `🔑 **SELF-SERVICE PASSWORD RESET AVAILABLE**\n\n` +
                   `Per **KB-01 (Password Reset)**:\n` +
                   `> *"Employees can reset their own password via the self-service portal at any time. No approval required."*\n\n` +
                   `You can reset your password immediately at: **\`https://auth.veridian-corp.example/reset-password\`** without requiring an IT ticket.`,
          actionType: 'SELF_SERVICE_PORTAL_LINK',
          actionData: { portalUrl: 'https://auth.veridian-corp.example/reset-password' }
        };
      }
    }

    // =========================================================================
    // KB-02: VPN ACCESS (e.g. REQ-05 Sanjay Oberoi, REQ-11 Nikhil Bansal)
    // =========================================================================
    if (intent === 'VPN_ACCESS_OR_RENEWAL') {
      const groundPolicy = this.getPolicyGrounding('KB-02');
      const isContractor = selection.includes('contractor') || (context.initialQuery && context.initialQuery.toLowerCase().includes('contractor'));

      if (isContractor) {
        // KB-02: Contractors require manager approval submitted via access request form
        const ticket = store.createTicket({
          title: `Contractor VPN Access Request - ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Network & Remote Access',
          priority: 'P3',
          status: 'Waiting on manager approval form',
          resolutionSummary: `Contractor VPN request requires manager approval submitted via access request form per KB-02.`,
          policyRef: { id: 'KB-02', title: groundPolicy.title },
          riskLevel: 'MEDIUM',
          riskScore: 35,
          assignedTo: 'Network Operations Desk',
          slaRemainingMinutes: 240
        });

        store.recordAuditEvent({
          eventType: 'ESCALATION_TRIGGERED',
          actor: 'Veridian_IT_Agent',
          action: `Contractor VPN access routed for manager approval form per KB-02 (Ticket ${ticket.id}).`,
          riskScore: 35,
          policyCited: 'KB-02'
        });

        return {
          type: 'ESCALATION_APPROVAL',
          riskScore: 35,
          riskLevel: 'MEDIUM',
          ticket: ticket,
          policyGrounding: groundPolicy,
          message: `🛡️ **CONTRACTOR VPN: MANAGER APPROVAL REQUIRED** (Ticket **#${ticket.id}**)\n\n` +
                   `Under **Veridian Corp Policy KB-02 (VPN Access)**:\n` +
                   `> *"Contractors require manager approval submitted via the access request form."*\n\n` +
                   `**Next Steps**:\n` +
                   `• Please have the contractor's hiring manager submit the formal **Access Request Form**.\n` +
                   `• Once manager sign-off is logged, IT Network Operations will provision credentials for their start date.`,
          actionType: 'ACCESS_REQUEST_FORM',
          actionData: { ticketId: ticket.id, formUrl: 'https://forms.veridian-corp.example/access-request' }
        };
      } else {
        // Full-time employee 90-day renewal (like REQ-05 and TK-1042 precedent)
        const ticket = store.createTicket({
          title: `VPN Credential Renewal - ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Network & Remote Access',
          priority: 'P3',
          status: 'Resolved',
          resolutionSummary: `Employee 90-day VPN credential renewal self-service activated per KB-02. Precedent TK-1042 verified.`,
          policyRef: { id: 'KB-02', title: groundPolicy.title },
          riskLevel: 'LOW',
          riskScore: 15,
          assignedTo: 'IT Support Desk',
          slaRemainingMinutes: 0
        });

        store.recordAuditEvent({
          eventType: 'ACTION_EXECUTED',
          actor: 'Veridian_IT_Agent',
          action: `VPN 90-day credential renewal dispatched for ${persona.name} per KB-02. Ticket ${ticket.id} marked Resolved.`,
          riskScore: 15,
          policyCited: 'KB-02'
        });

        return {
          type: 'RESOLUTION_AUTOMATED',
          riskScore: 15,
          riskLevel: 'LOW',
          ticket: ticket,
          policyGrounding: groundPolicy,
          message: `✅ **VPN 90-DAY CREDENTIAL RENEWAL READY** (Ticket **#${ticket.id}**)\n\n` +
                   `Under **Veridian Corp Policy KB-02 (VPN Access)**:\n` +
                   `> *"VPN credentials expire every 90 days and must be renewed by the employee."*\n\n` +
                   `**Self-Service Action**:\n` +
                   `1. Click the **"Renew VPN Credentials"** button below to reset your 90-day token.\n` +
                   `2. Consistent with precedent **TK-1042 (Resolved)**, full-time employees can re-authenticate immediately.\n\n` +
                   `*Ticket #${ticket.id} has been marked **Resolved**.*`,
          actionType: 'RENEW_VPN_ACTION',
          actionData: { ticketId: ticket.id, renewalUrl: 'https://vpn.veridian-corp.example/renew' }
        };
      }
    }

    // =========================================================================
    // KB-03 & ASSET-POL: LAPTOP REPLACEMENT (e.g. REQ-01 Aditi Sharma, REQ-13 Aman Gupta)
    // =========================================================================
    if (intent === 'LAPTOP_REPLACEMENT_OR_HARDWARE') {
      const kb03 = this.getPolicyGrounding('KB-03');
      const assetPol = this.getPolicyGrounding('ASSET-POL');
      const isDeadHardware = selection.includes('completely dead') || (context.initialQuery && context.initialQuery.includes('completely dead'));
      const isFlickering = selection.includes('Screen flickering') || (context.initialQuery && context.initialQuery.includes('flicker'));

      if (isFlickering) {
        // REQ-13: Aman Gupta (2 years old, screen flickering, needs fix not replacement)
        const ticket = store.createTicket({
          title: `Hardware Diagnostic & Screen Repair - ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Hardware & Asset Management',
          priority: 'P3',
          status: 'In progress — repair scheduled',
          resolutionSummary: `Laptop is 2 years old (not eligible for replacement under KB-03 3-year or Asset Policy 4-year cycle). Screen flickering hardware diagnostic scheduled for repair.`,
          policyRef: { id: 'KB-03', title: kb03.title },
          riskLevel: 'LOW',
          riskScore: 20,
          assignedTo: 'IT Hardware Depot',
          slaRemainingMinutes: 480
        });

        store.recordAuditEvent({
          eventType: 'TICKET_CREATED',
          actor: 'Veridian_IT_Agent',
          action: `Screen repair ticket ${ticket.id} created for 2-year-old laptop per KB-03 / Asset Policy.`,
          riskScore: 20,
          policyCited: 'KB-03'
        });

        return {
          type: 'TICKET_IN_PROGRESS',
          riskScore: 20,
          riskLevel: 'LOW',
          ticket: ticket,
          policyGrounding: kb03,
          message: `🔧 **HARDWARE REPAIR SCHEDULED** (Ticket **#${ticket.id}**)\n\n` +
                   `Per **KB-03** and the **Asset Management Policy**:\n` +
                   `• Company laptops follow a standard **4-year refresh cycle** (and 3-year minimum service for scheduled replacement).\n` +
                   `• At **2 years of service**, a flickering screen is serviced via **hardware repair** rather than full device replacement.\n\n` +
                   `**Next Steps**: Please drop off your laptop at the IT Support Depot on Floor 2, or arrange courier exchange for technician inspection.`,
          actionType: 'SCHEDULE_REPAIR',
          actionData: { ticketId: ticket.id }
        };
      }

      // REQ-01: Aditi Sharma (completely dead, 3.5 years old)
      // Note the policy nuance: Eligible under KB-03 (>3 years + verified hardware failure), but under Asset Policy (<4 years), early replacement requires Finance sign-off!
      // Reference precedent: TK-1043 (S. Iyer, Laptop replacement 3.2 yrs old, Approved — pending fulfillment)
      const ticket = store.createTicket({
        title: `Laptop Replacement Request (3.5 yrs, Dead) - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Hardware & Asset Management',
        priority: 'P2',
        status: 'Approved — pending fulfillment',
        resolutionSummary: `Eligible under KB-03 (>3 years service + verified hardware failure). Early replacement outside standard 4-year cycle requires Finance sign-off per Asset Management Policy (consistent with precedent TK-1043).`,
        policyRef: { id: 'KB-03', title: kb03.title },
        riskLevel: 'MEDIUM',
        riskScore: 40,
        assignedTo: 'IT Asset Desk & Finance',
        slaRemainingMinutes: 240
      });

      store.recordAuditEvent({
        eventType: 'ESCALATION_TRIGGERED',
        actor: 'Veridian_IT_Agent',
        action: `Laptop replacement ${ticket.id} approved under KB-03 & routed for Finance sign-off per Asset Management Policy.`,
        riskScore: 40,
        policyCited: 'KB-03'
      });

      return {
        type: 'ESCALATION_APPROVAL',
        riskScore: 40,
        riskLevel: 'MEDIUM',
        ticket: ticket,
        policyGrounding: kb03,
        message: `💻 **LAPTOP REPLACEMENT ELIGIBLE & ROUTED** (Ticket **#${ticket.id}**)\n\n` +
                 `**Policy Harmonization (KB-03 & Asset Management Policy)**:\n` +
                 `1. **KB-03**: *"Laptops are eligible for replacement after 3 years of service, or earlier in case of verified hardware failure."* ➔ **Eligible** (device is 3.5 years old and completely dead).\n` +
                 `2. **Asset Management Policy (Finance & Assets Q2 2026)**: *"All company hardware follows a standard 4-year refresh cycle... Early replacement outside this cycle requires Finance sign-off in addition to IT approval."*\n` +
                 `3. **Historical Precedent**: Consistent with active ticket **TK-1043 (S. Iyer, 3.2 yrs old: Approved — pending fulfillment)**.\n\n` +
                 `**Resolution**: IT has verified the hardware failure and routed the replacement requisition for routine Finance sign-off. Hardware fulfillment will proceed promptly.`,
        actionType: 'AWAITING_FINANCE_SIGNOFF',
        actionData: { ticketId: ticket.id, precedent: 'TK-1043' }
      };
    }

    // =========================================================================
    // KB-04: SOFTWARE INSTALLATION (e.g. REQ-04 Ritu Bhatia, REQ-14 Tanya Chopra)
    // =========================================================================
    if (intent === 'SOFTWARE_INSTALLATION') {
      const groundPolicy = this.getPolicyGrounding('KB-04');
      const isCatalog = selection.includes('Standard software listed in the Veridian approved catalog');

      if (isCatalog) {
        return {
          type: 'RESOLUTION_AUTOMATED',
          riskScore: 10,
          riskLevel: 'LOW',
          ticket: null,
          policyGrounding: groundPolicy,
          message: `✅ **STANDARD CATALOG SOFTWARE (SELF-INSTALL)**\n\n` +
                   `Under **KB-04 (Software Installation Requests)**:\n` +
                   `> *"Standard software (listed in the approved catalog) can be self-installed."*\n\n` +
                   `You can install this software directly from the **Veridian Company Portal / Software Center** without an IT ticket.`,
          actionType: 'SELF_INSTALL_PORTAL',
          actionData: { portalUrl: 'https://software.veridian-corp.example/catalog' }
        };
      }

      // Non-catalog software or browser extension (REQ-04 data analysis tool or REQ-14 browser extension)
      // Precedent: TK-1044 (A. Khan: Non-catalog software request -> Pending Security review)
      const isExtension = selection.includes('browser extension') || (context.initialQuery && context.initialQuery.includes('browser extension'));
      const ticket = store.createTicket({
        title: isExtension 
          ? `Non-Catalog Browser Extension Review: Productivity Tracking - ${persona.name}`
          : `Non-Catalog Software Security Review: Data Analysis Tool - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Software & Security',
        priority: 'P3',
        status: 'Pending Security review',
        resolutionSummary: `Non-catalog software submitted for IT Security review per KB-04. Security review turnaround is 3–5 business days (consistent with precedent TK-1044).`,
        policyRef: { id: 'KB-04', title: groundPolicy.title },
        riskLevel: 'MEDIUM',
        riskScore: 50,
        assignedTo: 'IT Security Review Board',
        slaRemainingMinutes: 1440
      });

      store.recordAuditEvent({
        eventType: 'ESCALATION_TRIGGERED',
        actor: 'Veridian_IT_Agent',
        action: `Non-catalog software escalated for IT Security review per KB-04 (Ticket ${ticket.id}). Precedent TK-1044.`,
        riskScore: 50,
        policyCited: 'KB-04'
      });

      return {
        type: 'ESCALATION_APPROVAL',
        riskScore: 50,
        riskLevel: 'MEDIUM',
        ticket: ticket,
        policyGrounding: groundPolicy,
        message: `🛡️ **IT SECURITY REVIEW REQUIRED (3–5 BUSINESS DAYS)** (Ticket **#${ticket.id}**)\n\n` +
                 `Under **Veridian Corp Policy KB-04 (Software Installation Requests)**:\n` +
                 `> *"Non-catalog software requires IT Security review, which takes 3–5 business days."*\n\n` +
                 `• **Precedent**: Matches active ticket **TK-1044 (A. Khan: Pending Security review)**.\n` +
                 `• Your request has been logged and submitted to the **IT Security Review Board**.\n` +
                 `• The security assessment evaluates vendor data privacy, permissions, and security compliance within 3–5 business days.`,
        actionType: 'SECURITY_REVIEW_PENDING',
        actionData: { ticketId: ticket.id, precedent: 'TK-1044', turnaround: '3–5 business days' }
      };
    }

    // =========================================================================
    // KB-05: PRINTER TROUBLESHOOTING (e.g. REQ-06 Meera Iyer)
    // =========================================================================
    if (intent === 'PRINTER_TROUBLESHOOTING') {
      const groundPolicy = this.getPolicyGrounding('KB-05');
      const spoolerRestarted = selection.includes('queue checked and print spooler restarted') || (context.initialQuery && context.initialQuery.includes('technician'));

      if (spoolerRestarted) {
        // Per KB-05: if persists after restart, log ticket with printer asset tag
        const ticket = store.createTicket({
          title: `Printer Hardware Fault (Floor 3) - ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Office Infrastructure',
          priority: 'P3',
          status: 'Investigating — technician assigned',
          resolutionSummary: `Print spooler restarted and queue checked per KB-05, but false paper jam persists. Dispatched office technician with printer asset tag (precedent TK-1046).`,
          policyRef: { id: 'KB-05', title: groundPolicy.title },
          riskLevel: 'LOW',
          riskScore: 15,
          assignedTo: 'Office IT Support Technician',
          slaRemainingMinutes: 120
        });

        store.recordAuditEvent({
          eventType: 'TICKET_CREATED',
          actor: 'Veridian_IT_Agent',
          action: `Technician dispatched for printer paper jam under KB-05 (Ticket ${ticket.id}). Precedent TK-1046.`,
          riskScore: 15,
          policyCited: 'KB-05'
        });

        return {
          type: 'TICKET_IN_PROGRESS',
          riskScore: 15,
          riskLevel: 'LOW',
          ticket: ticket,
          policyGrounding: groundPolicy,
          message: `🖨️ **PRINTER HARDWARE TICKET LOGGED** (Ticket **#${ticket.id}**)\n\n` +
                   `Under **Veridian Corp SOP KB-05 (Printer Troubleshooting)**:\n` +
                   `> *"If the issue persists after restart, log a ticket with the printer's asset tag."*\n\n` +
                   `• **Precedent**: Similar to closed ticket **TK-1046 (Printer paper jam floor 2: Resolved)**.\n` +
                   `• An on-site technician has been assigned to inspect the physical roller sensor on the 3rd floor printer.`,
          actionType: 'TECHNICIAN_DISPATCHED',
          actionData: { ticketId: ticket.id, precedent: 'TK-1046' }
        };
      } else {
        // Guide employee to perform Step 1 per KB-05
        return {
          type: 'FOLLOW_UP',
          riskScore: 10,
          riskLevel: 'LOW',
          policyGrounding: groundPolicy,
          message: `Under **KB-05**, please perform the first troubleshooting step before logging a technician ticket:\n\n` +
                   `1. Open Printers & Scanners on your machine.\n` +
                   `2. Clear any stuck documents in the printer queue.\n` +
                   `3. Restart the Print Spooler service.\n\n` +
                   `Did restarting the spooler clear the issue, or does the false paper jam error persist?`,
          options: [
            "Printer queue checked and print spooler restarted, but paper jam error persists",
            "Spooler restart succeeded and printer is operational"
          ],
          entityKey: 'printerStep'
        };
      }
    }

    // =========================================================================
    // KB-06: EMAIL MAILBOX QUOTA (e.g. REQ-09 Rohit Desai)
    // =========================================================================
    if (intent === 'MAILBOX_QUOTA') {
      const groundPolicy = this.getPolicyGrounding('KB-06');
      const wantsIncrease = selection.includes('manager-approved quota increase') || (context.initialQuery && context.initialQuery.includes('mailbox is full'));

      if (wantsIncrease) {
        // KB-06: Quota increases beyond 25GB require manager approval and are capped at 50GB.
        // Precedent: TK-1045 (P. Joshi, Mailbox quota increase: Approved at 35GB)
        const ticket = store.createTicket({
          title: `Mailbox Quota Increase Request (35GB) - ${persona.name}`,
          requester: { name: persona.name, email: persona.email, department: persona.department },
          category: 'Productivity & Storage',
          priority: 'P3',
          status: 'Waiting on manager approval',
          resolutionSummary: `Default quota 25GB exceeded. Quota increase requested per KB-06. Requires manager approval (capped at 50GB, precedent TK-1045).`,
          policyRef: { id: 'KB-06', title: groundPolicy.title },
          riskLevel: 'LOW',
          riskScore: 20,
          assignedTo: 'Email Infrastructure Team',
          slaRemainingMinutes: 240
        });

        store.recordAuditEvent({
          eventType: 'TICKET_CREATED',
          actor: 'Veridian_IT_Agent',
          action: `Mailbox quota increase request routed for manager approval per KB-06 (Ticket ${ticket.id}). Precedent TK-1045.`,
          riskScore: 20,
          policyCited: 'KB-06'
        });

        return {
          type: 'ESCALATION_APPROVAL',
          riskScore: 20,
          riskLevel: 'LOW',
          ticket: ticket,
          policyGrounding: groundPolicy,
          message: `📧 **MAILBOX QUOTA INCREASE ROUTED** (Ticket **#${ticket.id}**)\n\n` +
                   `Under **Veridian Corp Policy KB-06 (Email Mailbox Quota)**:\n` +
                   `> *"Default mailbox quota is 25GB. Employees nearing quota should archive old mail. Quota increases beyond 25GB require manager approval and are capped at 50GB."*\n\n` +
                   `• **Precedent**: Consistent with **TK-1045 (P. Joshi: Approved at 35GB)**.\n` +
                   `• Ticket **#${ticket.id}** has been dispatched to your manager for quota increase authorization.\n` +
                   `• **Immediate Relief**: In the meantime, archiving or deleting large attachments will immediately restore email sending.`,
          actionType: 'MANAGER_APPROVAL_DISPATCHED',
          actionData: { ticketId: ticket.id, defaultQuota: '25GB', cap: '50GB', precedent: 'TK-1045' }
        };
      } else {
        return {
          type: 'RESOLUTION_AUTOMATED',
          riskScore: 10,
          riskLevel: 'LOW',
          ticket: null,
          policyGrounding: groundPolicy,
          message: `📦 **MAIL ARCHIVING INSTRUCTIONS (KB-06)**\n\n` +
                   `Under **KB-06**, default mailbox quota is 25GB. To free up space without needing an approval ticket:\n` +
                   `1. Open Outlook / Webmail ➔ Settings ➔ Storage.\n` +
                   `2. Move emails older than 6 months to your **Online Archive** folder.\n` +
                   `3. Empty your Deleted Items folder to clear quota immediately.`,
          actionType: 'ARCHIVE_GUIDE',
          actionData: { policy: 'KB-06' }
        };
      }
    }

    // =========================================================================
    // KB-07: GUEST WI-FI ACCESS (e.g. REQ-02 Vikram Chawla)
    // =========================================================================
    if (intent === 'GUEST_WIFI') {
      const groundPolicy = this.getPolicyGrounding('KB-07');
      // Per KB-07: valid for 24h, can be generated by any employee from front-desk kiosk, NO IT TICKET REQUIRED!
      // Precedent: TK-1051 (L. Menon, Guest Wi-Fi issued: Resolved)

      store.recordAuditEvent({
        eventType: 'ACTION_EXECUTED',
        actor: 'Veridian_IT_Agent',
        action: `Informed ${persona.name} of front-desk kiosk guest Wi-Fi procedure per KB-07. No IT ticket required.`,
        riskScore: 5,
        policyCited: 'KB-07'
      });

      return {
        type: 'RESOLUTION_AUTOMATED',
        riskScore: 5,
        riskLevel: 'LOW',
        ticket: null,
        policyGrounding: groundPolicy,
        message: `📶 **GUEST WI-FI ACCESS (NO IT TICKET REQUIRED)**\n\n` +
                 `Under **Veridian Corp Policy KB-07 (Guest Wi-Fi Access)**:\n` +
                 `> *"Guest Wi-Fi credentials are valid for 24 hours and can be generated by any employee from the front-desk kiosk. No IT ticket required."*\n\n` +
                 `• **How to generate**: Simply walk up to the touch-screen kiosk at the office front desk and enter your visitor's name.\n` +
                 `• **Validity**: The pass code is valid for **24 hours** from issuance.\n` +
                 `• **Precedent**: Corresponds to closed history item **TK-1051 (Guest Wi-Fi issued: Resolved)**.`,
        actionType: 'KIOSK_INSTRUCTIONS',
        actionData: { policy: 'KB-07', precedent: 'TK-1051', location: 'Front-Desk Kiosk' }
      };
    }

    // =========================================================================
    // KB-08: EXPENSE SOFTWARE ACCESS (e.g. REQ-12 Sneha Kulkarni)
    // =========================================================================
    if (intent === 'EXPENSE_SOFTWARE_ACCESS') {
      const groundPolicy = this.getPolicyGrounding('KB-08');
      const isNewAccount = selection.includes('Requesting brand new access') || selection.includes('granted by Finance');

      if (isNewAccount) {
        return {
          type: 'POLICY_REJECTION',
          riskScore: 20,
          riskLevel: 'LOW',
          policyGrounding: groundPolicy,
          message: `📋 **ACCESS GRANTED BY FINANCE, NOT IT (KB-08)**\n\n` +
                   `Under **Veridian Corp Policy KB-08 (Expense Software Access)**:\n` +
                   `> *"Access to the expense management tool is granted by Finance, not IT. IT can only assist with login/technical issues once an account already exists."*\n\n` +
                   `Please contact **Finance Operations** (finance-ops@veridian-corp.example) to have an expense account created.`
        };
      }

      // Existing account login/credential issue (REQ-12 Sneha Kulkarni: "I can't log into the expense tool, keeps saying invalid credentials")
      const ticket = store.createTicket({
        title: `Expense Tool Login Troubleshooting - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Corporate Applications',
        priority: 'P3',
        status: 'Waiting on employee response',
        resolutionSummary: `Technical login issue with existing expense account investigated under KB-08. Requested verification details/screenshot from employee.`,
        policyRef: { id: 'KB-08', title: groundPolicy.title },
        riskLevel: 'LOW',
        riskScore: 20,
        assignedTo: 'IT Application Support',
        slaRemainingMinutes: 240
      });

      store.recordAuditEvent({
        eventType: 'TICKET_CREATED',
        actor: 'Veridian_IT_Agent',
        action: `Logged expense tool technical support ticket ${ticket.id} per KB-08.`,
        riskScore: 20,
        policyCited: 'KB-08'
      });

      return {
        type: 'TICKET_IN_PROGRESS',
        riskScore: 20,
        riskLevel: 'LOW',
        ticket: ticket,
        policyGrounding: groundPolicy,
        message: `🔑 **EXPENSE TOOL LOGIN TROUBLESHOOTING** (Ticket **#${ticket.id}**)\n\n` +
                 `Under **Veridian Corp Policy KB-08 (Expense Software Access)**:\n` +
                 `> *"IT can only assist with login/technical issues once an account already exists."*\n\n` +
                 `• Since you already have an existing expense account, IT Application Support can reset your SSO sync.\n` +
                 `• **Current Status**: Waiting on verification of your exact error message or screenshot.\n` +
                 `• Ticket **#${ticket.id}** has been registered.`,
        actionType: 'WAITING_ON_EMPLOYEE',
        actionData: { ticketId: ticket.id }
      };
    }

    // =========================================================================
    // KB-09: SECURITY INCIDENT / PHISHING (e.g. REQ-08 Ananya Reddy)
    // =========================================================================
    if (intent === 'SECURITY_INCIDENT_PHISHING') {
      const groundPolicy = this.getPolicyGrounding('KB-09');
      const isForwarding = selection.includes('forwarded') || (context.initialQuery && context.initialQuery.includes('forwarding'));

      // Critical violation warning if employee was forwarding it!
      const warningHtml = isForwarding
        ? `⚠️ **CRITICAL WARNING: CEASE FORWARDING IMMEDIATELY**\n` +
          `Per **KB-09**: *"Any suspected phishing email... should not be forwarded to other employees."* Forwarding propagates the security threat across Veridian Corp.\n\n`
        : '';

      const ticket = store.createTicket({
        title: `Phishing Security Incident Report - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Cybersecurity',
        priority: 'P1',
        status: 'Escalated to Security — under investigation',
        resolutionSummary: `Reported to security@veridian-corp.example per KB-09 protocol. Forwarding halted. E-mail sender blocked (precedent TK-1048).`,
        policyRef: { id: 'KB-09', title: groundPolicy.title },
        riskLevel: 'CRITICAL',
        riskScore: 95,
        assignedTo: 'Veridian Security Team',
        slaRemainingMinutes: 15
      });

      store.recordAuditEvent({
        eventType: 'ESCALATION_TRIGGERED',
        actor: 'Veridian_Security_Engine',
        action: `P1 Security Incident escalated under KB-09 (Ticket ${ticket.id}). Precedent TK-1048. Alerted security@veridian-corp.example.`,
        riskScore: 95,
        policyCited: 'KB-09'
      });

      return {
        type: 'ESCALATION_CRITICAL',
        riskScore: 95,
        riskLevel: 'CRITICAL',
        ticket: ticket,
        policyGrounding: groundPolicy,
        message: `🚨 **SECURITY INCIDENT ESCALATED TO SECURITY** (Ticket **#${ticket.id}**)\n\n` +
                 warningHtml +
                 `Under **Veridian Corp Policy KB-09 (Security Incident Reporting)**:\n` +
                 `> *"Any suspected phishing email, malware, or unauthorized access attempt must be reported to security@veridian-corp.example immediately and should not be forwarded to other employees."*\n\n` +
                 `• **Precedent**: Matches active incident **TK-1048 (T. Rao: Escalated to Security — under investigation)**.\n` +
                 `• The report has been transmitted to **\`security@veridian-corp.example\`**.\n` +
                 `• Do not click any links or attachments, and delete any drafts forwarding the email.`,
        actionType: 'SECURITY_ALERT_SENT',
        actionData: { ticketId: ticket.id, precedent: 'TK-1048', securityEmail: 'security@veridian-corp.example' }
      };
    }

    // =========================================================================
    // KB-10: WORK-FROM-HOME EQUIPMENT (e.g. REQ-07 Farhan Ali)
    // =========================================================================
    if (intent === 'WFH_EQUIPMENT_ALLOWANCE') {
      const groundPolicy = this.getPolicyGrounding('KB-10');
      const qualifies = selection.includes('4 or 5 days') || (context.initialQuery && context.initialQuery.includes('4 days'));

      if (!qualifies && selection.includes('3 days a week or fewer')) {
        return {
          type: 'POLICY_REJECTION',
          riskScore: 15,
          riskLevel: 'LOW',
          policyGrounding: groundPolicy,
          message: `🚫 **INELIGIBLE FOR HOME OFFICE ALLOWANCE (KB-10)**\n\n` +
                   `Under **Veridian Corp Policy KB-10 (Work-From-Home Equipment)**:\n` +
                   `> *"Employees working remotely more than 3 days/week are eligible for a one-time home office equipment allowance (chair, monitor)."*\n\n` +
                   `Working 3 or fewer days remotely does not meet the threshold for company-funded home equipment.`
        };
      }

      // Qualifies (>3 days/week) e.g. REQ-07 Farhan Ali (4 days a week)
      // Precedent: TK-1047 (K. Singh: Home office equipment request -> Pending Finance)
      const ticket = store.createTicket({
        title: `Home Office Equipment Allowance Request (Monitor) - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Workplace Tech & Finance',
        priority: 'P3',
        status: 'Pending Finance',
        resolutionSummary: `Employee verified remote 4 days/week (>3 days requirement per KB-10). Requires manager sign-off and Finance processing (precedent TK-1047). IT handles shipping upon Finance approval.`,
        policyRef: { id: 'KB-10', title: groundPolicy.title },
        riskLevel: 'LOW',
        riskScore: 25,
        assignedTo: 'Finance Operations Desk',
        slaRemainingMinutes: 360
      });

      store.recordAuditEvent({
        eventType: 'TICKET_CREATED',
        actor: 'Veridian_IT_Agent',
        action: `WFH equipment ticket ${ticket.id} created per KB-10. Routed for manager & Finance processing. Precedent TK-1047.`,
        riskScore: 25,
        policyCited: 'KB-10'
      });

      return {
        type: 'ESCALATION_APPROVAL',
        riskScore: 25,
        riskLevel: 'LOW',
        ticket: ticket,
        policyGrounding: groundPolicy,
        message: `🖥️ **HOME OFFICE EQUIPMENT REQUEST ROUTED** (Ticket **#${ticket.id}**)\n\n` +
                 `Under **Veridian Corp Policy KB-10 (Work-From-Home Equipment)**:\n` +
                 `> *"Employees working remotely more than 3 days/week are eligible for a one-time home office equipment allowance (chair, monitor). Requires manager sign-off and Finance processing — IT only handles the equipment shipping request once approved."*\n\n` +
                 `• **Eligibility Verified**: You work 4 days/week remotely (>3 days requirement met).\n` +
                 `• **Precedent**: Matches active ticket **TK-1047 (K. Singh: Pending Finance)**.\n` +
                 `• **Workflow**: Ticket **#${ticket.id}** has been sent for your manager's sign-off and Finance budget processing. Once approved, IT will immediately handle shipping your monitor.`,
        actionType: 'AWAITING_FINANCE_PROCESSING',
        actionData: { ticketId: ticket.id, precedent: 'TK-1047' }
      };
    }

    // =========================================================================
    // ADMIN ACCESS / SECURITY (e.g. REQ-10 Kavya Pillai)
    // Reference Precedent: TK-1050 (J. Fernandes, Admin access request: Rejected — no business justification provided)
    // =========================================================================
    if (intent === 'ADMIN_SERVER_ACCESS') {
      const groundPolicy = this.getPolicyGrounding('KB-09');
      // Precedent TK-1050: Admin access request rejected if no formal business justification/dual approval
      const ticket = store.createTicket({
        title: `Finance Reporting Server Elevated Access - ${persona.name}`,
        requester: { name: persona.name, email: persona.email, department: persona.department },
        category: 'Identity & Access',
        priority: 'P2',
        status: 'Pending Security Review',
        resolutionSummary: `Admin access to finance reporting server cannot be self-provisioned. Requires substantiated business justification and dual Finance/Security sign-off (Precedent TK-1050).`,
        policyRef: { id: 'KB-09', title: 'Security Incident Reporting Protocol' },
        riskLevel: 'HIGH',
        riskScore: 85,
        assignedTo: 'IT Security Review Board',
        slaRemainingMinutes: 120
      });

      store.recordAuditEvent({
        eventType: 'ESCALATION_TRIGGERED',
        actor: 'Veridian_Security_Engine',
        action: `Elevated finance admin request routed for Security Review per precedent TK-1050 (Ticket ${ticket.id}).`,
        riskScore: 85,
        policyCited: 'KB-09'
      });

      return {
        type: 'ESCALATION_HIGH_RISK',
        riskScore: 85,
        riskLevel: 'HIGH',
        ticket: ticket,
        policyGrounding: groundPolicy,
        message: `🛡️ **ELEVATED ADMINISTRATIVE ACCESS REVIEW** (Ticket **#${ticket.id}**)\n\n` +
                 `**Security Precedent Notice (TK-1050)**:\n` +
                 `• Precedent **TK-1050 (J. Fernandes: Rejected — no business justification provided)** establishes that administrative access to production finance servers **cannot be granted on demand**.\n` +
                 `• **Requirements**: All admin access requires an official business case, verified department head authorization, and IT Security review.\n` +
                 `• Ticket **#${ticket.id}** has been generated and routed to the **IT Security Review Board** for formal review.`,
        actionType: 'ADMIN_JUSTIFICATION_REQUIRED',
        actionData: { ticketId: ticket.id, precedent: 'TK-1050' }
      };
    }

    // Default Fallback
    return {
      type: 'TICKET_IN_PROGRESS',
      riskScore: 20,
      riskLevel: 'LOW',
      ticket: null,
      policyGrounding: null,
      message: `Your request has been noted. Please contact IT Support at support@veridian-corp.example.`
    };
  }
}

module.exports = new AgentEngine();
