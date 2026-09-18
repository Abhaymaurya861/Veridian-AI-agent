# 🏢 Veridian Corp — Enterprise IT Support Agent
### *Grounded Intelligent ITSM Assistant & Automated Resolution Portal*

An enterprise-grade internal IT Support Agent built for **Veridian Corp** to automate employee IT service requests, enforce corporate knowledge base policies (**KB-01 through KB-10** and the **Asset Management Policy**), provide automated self-service resolutions, escalate high-risk security incidents, and maintain a strict compliance audit trail.

---

## 🌟 Key Features

### 1. 🤖 Policy-Grounded Conversational Agent
- **Strict Grounding:** Every resolution is grounded in verified corporate policies (KB-01 to KB-10 and the Asset Management Policy Extract).
- **Verifiable Citations:** Responses display citation cards detailing the policy ID, title, category, SLA, and exact clauses applied.
- **Conflict Reconciliation:** Automatically harmonizes conflicting rules (e.g., resolving the 3-year replacement rule in KB-03 against the 4-year cycle in the Asset Management Policy with Finance sign-off gating).

### 2. 🔄 Multi-Turn Follow-Ups & Disambiguation
- **Intelligent Slot Filling:** Detects missing critical information and generates interactive follow-up choice chips.
- **Ambiguity Triage:** When an employee submits a vague prompt (e.g., *"it's not working"*), the agent presents diagnostic domains (Hardware, VPN/Network, Login/Password, Software, Printer) to guide triage.

### 3. ⚡ Automated Self-Service Execution
- **Instant Fixes:** Where policy permits, users can execute self-service actions with 1-click:
  - **Okta MFA Token Resync:** Generates one-time QR activation pairing.
  - **VPN Network Flush Script:** Flushes DNS cache, restarts PanGPS daemon, and restores tunnel connectivity.
  - **MDM Silent Software Push:** Deploys approved catalog tools directly via device management daemons.

### 4. 🚨 Risk Escalation & Priority Routing
- **Risk Scoring:** Assigns real-time risk scores (0–100) based on action severity and compliance impact.
- **P1 Critical Alerts:** Automatically escalates severe threats (e.g., phishing emails forwarded to colleagues) with immediate warnings, ticketing, and dispatch to `security@veridian-corp.example`.

### 5. 👥 Employee Persona Simulation
- Switch between 10+ realistic Veridian Corp employee personas across **Engineering, HR, Sales, Marketing, Product, and Analytics**.
- Each persona includes department info, device model, operating system, and a pre-loaded list of realistic scenarios from the week of **21–25 September 2026**.

### 6. 🎫 Centralized Ticket Management & Live Queue
- Live ticket board with full lifecycle states (`Open`, `In progress`, `Pending Security review`, `Pending Finance`, `Approved — pending fulfillment`, `Resolved`).
- Real-time search, status filtering, and priority indicators (P1 Critical to P4 Low).

### 7. 🛡️ Immutable Compliance Audit Trail
- Logs every interaction, policy lookup, risk score calculation, manual ticket update, and self-service script execution.
- Live stream feed for IT audit compliance and security monitoring.

---

## 📚 Corporate Knowledge Base Reference

The agent enforces the following policies loaded in `data/policies.json`:

| Policy ID | Title | Category | Risk Tier | SLA | Primary Directive |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **KB-01** | Password Reset Policy | Identity & Access | `LOW` | 1 hr | Self-service password resets; manual IT unlock after 5+ failed attempts without approvals. |
| **KB-02** | VPN Access Policy | Network & Remote Access | `MEDIUM` | 4 hrs | Automatic for full-time staff; manager approval for contractors; 90-day credential renewal. |
| **KB-03** | Laptop Replacement Policy | Hardware & Asset Mgmt | `MEDIUM` | 24 hrs | Eligible after 3 years or verified hardware failure; requires 2 weeks advance notice. |
| **KB-04** | Software Installation Policy | Software & Security | `MEDIUM` | 72 hrs | Catalog tools self-installed; non-catalog/extensions require 3–5 day IT Security review. |
| **KB-05** | Printer Troubleshooting SOP | Office Infrastructure | `LOW` | 4 hrs | Check queue & restart spooler; log ticket with asset tag if error persists. |
| **KB-06** | Email Mailbox Quota Policy | Productivity & Storage | `LOW` | 8 hrs | 25GB default quota; archive older mail; manager approval required for quota increase up to 50GB. |
| **KB-07** | Guest Wi-Fi Access Policy | Network & Visitors | `LOW` | Instant | 24h credentials generated directly via front-desk kiosk; no IT ticket required. |
| **KB-08** | Expense Software Access Policy | Corporate Applications | `LOW` | 4 hrs | Account provisioning handled by Finance; IT only assists with existing login issues. |
| **KB-09** | Security Incident Protocol | Cybersecurity | `CRITICAL` | 30 mins | Report phishing/malware to `security@veridian-corp.example`; **NEVER forward** to colleagues. |
| **KB-10** | Work-From-Home Equipment | Workplace Tech & Finance | `LOW` | 24 hrs | Remote >3 days/wk eligible for allowance; manager & Finance approval required before IT shipping. |
| **ASSET-POL** | Asset Management Policy | Finance & Governance | `MEDIUM` | 24 hrs | 4-year standard refresh cycle; early replacements require additional Finance sign-off. |

---

## 🏗️ Architecture & Technology Stack

```
Internal Service support/
├── data/                         # Pre-seeded JSON data fixtures
│   ├── employeeRequests.json     # 15 realistic employee requests (21-25 Sep 2026)
│   ├── personas.json             # Employee personas across departments
│   ├── policies.json             # Corporate policies (KB-01 to KB-10 & Asset Policy)
│   └── seedTickets.json          # Initial ticket queue state
├── public/                       # Frontend web application
│   ├── css/
│   │   └── styles.css            # Dark/light glassmorphic UI stylesheet
│   ├── js/
│   │   └── app.js                # Frontend controller & UI state manager
│   └── index.html                # Single-page application markup
├── services/                     # Backend business logic
│   ├── agentEngine.js            # Policy grounding, intent recognition & slot-filling
│   └── store.js                  # In-memory store & audit logging service
├── test/
│   └── agent.test.js             # Automated verification test suite
├── package.json                  # Dependencies and scripts
├── server.js                     # Express server & API endpoints
└── README.md                     # Project documentation
```

### Stack Highlights
- **Backend:** Node.js, Express.js, CORS.
- **Frontend:** Pure Vanilla HTML5, CSS3 (Modern dark glassmorphism, responsive CSS grid/flexbox, Outfit & Inter typography), and Vanilla ES6 JavaScript.
- **State Management:** In-memory reactive store with JSON seeding and atomic reset functionality.
- **Testing:** Node.js native assert test runner.

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16.x or higher)
- npm (version 8.x or higher)

### 1. Clone & Install Dependencies
Open a terminal in the project directory:
```bash
npm install
```

### 2. Start the Server
Run the application server:
```bash
node server.js
```
*Or using npm script:*
```bash
npm start
```

The server will launch at:
👉 **`http://localhost:3000`**

Open this URL in any modern web browser to access the Support Agent portal.

---

## 🧪 Running Automated Tests

The repository includes an automated test suite verifying 8 critical real-world support scenarios:

```bash
node test/agent.test.js
```

*(Note: On Windows PowerShell with strict execution policies, running `node test/agent.test.js` directly avoids PowerShell script execution restrictions).*

### Tested Scenarios:
1. **REQ-02 (Vikram Chawla):** Guest Wi-Fi kiosk referral under KB-07 without creating an unnecessary ticket.
2. **REQ-03 (Karan Mehta):** Password lockout after 6 attempts queued for manual unlock per KB-01.
3. **REQ-05 (Sanjay Oberoi):** Full-time employee 90-day VPN credential self-service renewal under KB-02.
4. **REQ-04 (Ritu Bhatia):** Non-catalog software request routed to IT Security review (3–5 day SLA) under KB-04.
5. **REQ-08 (Ananya Reddy):** Phishing email forwarding detection; triggers P1 critical escalation, cease-forwarding directive, and security desk notification per KB-09.
6. **REQ-07 (Farhan Ali):** WFH equipment allowance qualification (>3 remote days) and routing to Finance under KB-10.
7. **REQ-01 (Aditi Sharma):** Laptop dead at 3.5 years; reconciles KB-03 hardware failure with Asset Management Policy requiring Finance sign-off.
8. **REQ-15 (Rahul Menon):** Ambiguous query handling (*"its not working"*) prompting user with diagnostic clarification choices.

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/personas` | Retrieve all employee personas |
| `GET` | `/api/requests` | Retrieve the 15 simulated employee requests |
| `POST` | `/api/agent/chat` | Send a message or follow-up selection to the agent |
| `GET` | `/api/tickets` | Query tickets (supports `status`, `priority`, and `search` filters) |
| `POST` | `/api/tickets` | Create a new ticket manually |
| `PATCH` | `/api/tickets/:id` | Update ticket status and resolution summary |
| `GET` | `/api/policies` | Retrieve all policies or filter by category / keyword |
| `GET` | `/api/policies/:id` | Get details for a single policy |
| `GET` | `/api/audit` | Fetch recent compliance audit logs |
| `POST` | `/api/self-service/execute` | Execute an automated self-service script (MFA, VPN, Software) |
| `POST` | `/api/reset` | Reset demo state (tickets, chat, and audit logs) back to initial fixtures |

---

## 💡 How to Use the Web Portal

1. **Select an Employee Persona:**
   - Use the top-right persona selector to switch employees (e.g., *Aditi Sharma*, *Vikram Chawla*, *Ananya Reddy*).
2. **Try Pre-Loaded Scenarios:**
   - In the left sidebar of the **Support Desk** view, click any of the **Quick Test Scenarios** to populate and run common requests.
   - Alternatively, navigate to the **Employee Requests** tab and click **"Test in Agent"** on any of the 15 recorded requests.
3. **Interact with Follow-Ups:**
   - If a request has multiple paths, clickable option chips will appear above the chat input. Click an option to proceed with structured resolution.
4. **Inspect Policy Citations:**
   - The right-hand panel displays the exact grounded policy, owner, SLA, and relevant clauses in real time.
5. **Review Tickets & Audit Logs:**
   - Switch to the **Ticket Queue** tab to view generated or updated tickets.
   - Switch to the **Audit Trail** tab to view immutable compliance events.
6. **Reset State:**
   - Click the **Reset** button in the header at any time to restore default demo state.

---

## 📄 License
Internal Corporate Tool — Veridian Corp IT Operations. All rights reserved.
