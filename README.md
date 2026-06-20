<div align="center">

<img src="https://img.shields.io/badge/Bank%20of%20Baroda-Hackathon%202026-FF6B00?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsMTAgNSAxMC01TTIgMTJsMTAgNSAxMC01Ii8+PC9zdmc+" />
<img src="https://img.shields.io/badge/IIT%20Gandhinagar-Partner-003580?style=for-the-badge&logo=graduation-cap&logoColor=white" />

<br/><br/>

# 🛡️ MAO-IR
### Multi-Agent Orchestration for Identity Risk

**Agentic Zero-Trust Architecture for Continuous Identity Trust & Insider Threat Detection**

<br/>

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square&logo=github-actions)](https://github.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Multi--Agent-FF4B4B?style=flat-square&logo=langchain)](https://langchain.com/langgraph)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql)](https://neon.tech)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Neo4j](https://img.shields.io/badge/Neo4j-Aura-008CC1?style=flat-square&logo=neo4j)](https://neo4j.com/aura)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![DPDP](https://img.shields.io/badge/DPDP%20Act-2023%20Compliant-green?style=flat-square)](https://www.meity.gov.in/dpdpa)
[![Zero Trust](https://img.shields.io/badge/NIST%20SP%20800--207-Zero%20Trust-blueviolet?style=flat-square)](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf)

</div>

---

## ⚡ Elevator Pitch

> **MAO-IR is a silent, post-authentication security intelligence layer that continuously re-evaluates the trustworthiness of every privileged identity — not just at login, but at every keystroke, database query, and file operation — using a multi-agent AI system powered by Causal Intent Attribution.**

> Instead of simply asking *"Is this an anomaly?"*, our platform asks *"**Why** is this happening?"* — distinguishing between an accidental bulk-select and a deliberate data exfiltration attempt in real time, without adding any friction to legitimate users.

---

## 🔴 The Problem: Why Traditional IAM Fails Banks

Modern banking faces an unprecedented insider threat paradox: **the most dangerous actors are already inside the perimeter, holding valid credentials**.

```
Legacy PAM/SIEM Assumption:  "Authenticate once → Trust forever"
Reality:                     75% of data breaches involve privileged insiders (Verizon DBIR 2024)
Mean Detection Time:         197 days (IBM Cost of Data Breach Report)
```

### Legacy vs. MAO-IR: A Direct Comparison

| Dimension | Legacy PAM / SIEM | **MAO-IR (Our Approach)** |
|---|---|---|
| **Trust Model** | Binary: Authenticated = Trusted | Continuous, probabilistic, time-decayed |
| **Threat Detection** | Rule-based correlation, static thresholds | Agentic AI with Causal Intent Attribution |
| **Identity Verification** | Login checkpoint only | Real-time behavioral biometrics (Z-score UEBA) |
| **Privileged Access** | RBAC gates at entry | Live privilege audit + ticket correlation per action |
| **Response Latency** | Hours to days (SOC analyst review) | Sub-second automated containment |
| **False Positives** | High (alert fatigue) | Minimized via multi-agent consensus + Bayesian fusion |
| **Lateral Movement** | Detected post-facto via log correlation | Proactively modeled via Neo4j identity graph |
| **Compliance** | SIEM logs stored centrally | Edge hashing; privacy-first; DPDP Act 2023 compliant |
| **User Experience** | MFA fatigue, productivity loss | Frictionless for low-risk; step-up only when justified |

---

## ✨ Key Features

### 1. 🧠 Causal AI Intent Attribution *(Core Differentiator)*
Standard anomaly detection flags *what* happened. MAO-IR determines *why*. The **Behavioral Profiler Agent** computes per-signal Z-scores against a per-user Digital Identity Twin baseline. The **Causal Reasoning Layer** then correlates behavioral deviations, resource sensitivity, access timing, and ticket authorization to attribute **intent** — separating operational errors from malicious acts.

### 2. 📡 Privacy-First Edge Telemetry
A lightweight JavaScript wrapper captures behavioral biometrics (keystroke dwell/flight times, mouse velocity, scroll speed, navigation patterns) **directly in the browser**. All raw signals are **hashed and vectorized locally** using AES-256 before transmission — raw behavioral data never leaves the user's device. Compliant with **India's DPDP Act 2023** and **GDPR Article 25** (Privacy by Design).

### 3. 🎯 Dynamic Bayesian Trust Scoring
Trust is not a static attribute. MAO-IR models trust as a **continuously decaying signal** governed by:

```
T(t) = T₀ · e^(-λt)   where λ = 0.02 (decay rate), T₀ = initial trust (100)
```

Trust is recalculated at every behavioral event using an **Exponential Moving Average** update:

```
T_updated = α · T_observed + (1 − α) · T_previous   [α = 0.3]
```

This ensures recently-verified, low-risk users maintain session continuity while degraded trust triggers proportional enforcement.

### 4. 🔗 Identity Graph Blast Radius Analysis (Neo4j)
Every user's role, resource access, and peer relationships are mapped in a **Neo4j Aura graph database**. When a suspicious action is detected, the **Attack Path Agent** traverses the identity graph to calculate:
- **Blast Radius**: Number of sensitive systems reachable from the compromised identity
- **Lateral Movement Risk**: Graph distance to SWIFT Payment Gateway, Core Banking, KYC Repository
- **Privilege Escalation Paths**: Automated discovery of trust transitivity chains

### 5. 🎫 Ticket Correlation Engine
Every high-impact database action is cross-referenced against a **ServiceNow/Jira ticket store**. Unticket-authorized access to systems with `banking_impact_score ≥ 75` automatically incurs a risk penalty of `+15 points`, forming a key input into the final composite risk score.

### 6. 🛂 Trust Passport (Verifiable Digital Credential)
Each user session generates a **cryptographically-signed Trust Passport** (RSA-2048) encoding real-time trust posture: Trust Score (PTS), Behavioral Confidence, Device Trust, Verification Level, and Expiry. This passport travels with every API call, enabling **Zero Trust Policy Enforcement Points** across all banking microservices without central lookup.

### 7. 🚨 Autonomous Threat Containment Engine (ATCE)
The platform autonomously selects and executes graduated response actions within milliseconds — no SOC analyst required for Tier-1 threats:

| Risk Score | Level | Response |
|---|---|---|
| 0–29 | 🟢 **LOW** | Allow · Passive monitoring |
| 30–59 | 🟡 **MEDIUM** | Step-up MFA · Biometric validation |
| 60–79 | 🟠 **HIGH** | Read-only mode · Block exports · Manager approval |
| 80–100 | 🔴 **CRITICAL** | Session quarantine · Account lock · Evidence capture · SOC + CISO notification |

---

## 🏗️ System Architecture

### High-Level Data Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     IDENTITY TELEMETRY LAYER                            │
│  React Edge Wrapper (FingerprintJS + Custom UEBA Collector)             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│  │ Keystroke Dwell  │  │  Mouse Velocity   │  │  DB Query Stream   │   │
│  │ Flight Time      │  │  Path Curvature   │  │  File Access Ops   │   │
│  │ Scroll Patterns  │  │  Click Cadence    │  │  Privilege Cmds    │   │
│  └────────┬─────────┘  └────────┬──────────┘  └────────┬───────────┘  │
│           │                     │                       │               │
│           └──── AES-256 Hash ───┴──── Feature Vector ──┘               │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS / WebSocket
┌───────────────────────────────────▼─────────────────────────────────────┐
│                     NODE.JS API GATEWAY (Port 3001)                     │
│  Express Router · Rate Limiting · JWT Auth · Audit Logger               │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ /api/telemetry  │  │ /api/orchestrator│  │  /api/trust          │  │
│  │ /api/users      │  │ /investigate     │  │  /passport           │  │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────────────┘  │
│           │ MongoDB (Logs)      │ AI Bridge                             │
└───────────┼─────────────────────┼─────────────────────────────────────-┘
            │                     │ HTTP → FastAPI
┌───────────▼─────────────────────▼──────────────────────────────────────┐
│                AI ORCHESTRATOR — LangGraph (Port 8000)                  │
│                                                                         │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐          │
│   │Behavioral│──▶│ Context  │──▶│Privilege │──▶│  Ticket  │          │
│   │ Profiler │   │  Intel   │   │  Auditor │   │Correlator│          │
│   └──────────┘   └──────────┘   └──────────┘   └────┬─────┘          │
│                                                       │                 │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐         │                │
│   │  Attack  │◀──│  Trust   │──▶│Composite │◀────────┘                │
│   │   Path   │   │  Decay   │   │  Scorer  │                          │
│   └────┬─────┘   └──────────┘   └────┬─────┘                          │
│        │  Neo4j Blast Radius          │ Risk Score [0-100]             │
│        └──────────────────────────────▼                                │
│                              ┌──────────────┐   ┌──────────────────┐  │
│                              │   Response   │──▶│ Threat           │  │
│                              │    Agent     │   │ Containment ATCE │  │
│                              └──────────────┘   └──────────────────┘  │
│                                                         │               │
│                              ┌──────────────────────────▼────────────┐ │
│                              │     Trust Passport Engine (RSA-2048)  │ │
│                              └───────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
            │                                    │
┌───────────▼────────────┐         ┌─────────────▼──────────────────────┐
│   PostgreSQL (Neon)    │         │     REACT CISO DASHBOARD           │
│   Trust Scores, Users  │         │     SOC View · Investigation Panel  │
│   Investigations       │         │     Trust Decay Chart · Audit Log   │
├────────────────────────┤         └────────────────────────────────────┘
│   MongoDB (Atlas)      │
│   Telemetry · Logs     │
├────────────────────────┤
│   Neo4j (Aura)         │
│   Identity Graph       │
└────────────────────────┘
```

### LangGraph Agent Execution DAG

The AI Orchestrator executes agents as a **deterministic directed acyclic graph** — each node enriches a shared `AgentState` object before passing it downstream. This enables **parallel evidence collection** and **ordered risk fusion**:

```
behavior ──▶ context ──▶ privilege ──▶ ticket ──▶ attack ──▶ trust ──▶ risk ──▶ response ──▶ containment ──▶ passport ──▶ END
```

Each node is independently testable, swappable, and observable — a key advantage over monolithic ML pipelines.

---

## 💻 Core Algorithm: Dynamic Trust Scoring Engine

The following **C++-flavored pseudocode** precisely represents the composite risk scoring logic implemented in our Python backend (`agents/trust_scorer.py`, `engines/continuous_trust_engine.py`):

```cpp
// ============================================================
//  MAO-IR: Dynamic Trust Scoring Engine
//  Composite Risk Fusion with Bayesian Trust Decay
//  NIST SP 800-207 compliant scoring model
// ============================================================

#include <cmath>
#include <algorithm>
#include <string>

// --- Agent Signal Weights (must sum to 1.0) ---
constexpr double W_BEHAVIORAL  = 0.25;  // Keystroke/mouse Z-score UEBA
constexpr double W_CONTEXT     = 0.20;  // Device, geo, time, IP reputation
constexpr double W_PRIVILEGE   = 0.25;  // Resource sensitivity, query type
constexpr double W_ATTACK_PATH = 0.15;  // Neo4j blast radius (0–100)
constexpr double W_TRUST_DECAY = 0.15;  // Time since last verification

// --- Trust Decay Parameters ---
constexpr double TRUST_DECAY_RATE  = 0.02;   // λ: decay constant (per hour)
constexpr double TRUST_UPDATE_ALPHA = 0.30;  // α: Bayesian EMA smoothing
constexpr double TICKET_PENALTY_W  = 0.15;  // Un-authorized access surcharge

// ============================================================
//  Trust Decay Model: T(t) = T₀ · e^(−λt)
//  Represents continuous erosion of verified trust over time.
// ============================================================
double calculateTrustDecay(double T0, double hoursSinceVerification) {
    return T0 * std::exp(-TRUST_DECAY_RATE * hoursSinceVerification);
}

// ============================================================
//  Bayesian Trust Update: EMA for real-time recalibration
//  Weights recent observations without discarding history.
// ============================================================
double updateTrust(double previousTrust, double observedTrust) {
    return (TRUST_UPDATE_ALPHA * observedTrust) +
           ((1.0 - TRUST_UPDATE_ALPHA) * previousTrust);
}

// ============================================================
//  Z-Score Deviation (UEBA Behavioral Biometrics)
//  Compares live signal against per-user Digital Twin baseline.
//  Baseline std_dev estimated as 20% of mean (empirically tuned).
// ============================================================
double calculateZScore(double actual, double baseline) {
    double std_dev = baseline * 0.20;
    if (std_dev == 0.0) return 0.0;
    return std::abs((actual - baseline) / std_dev);
}

// ============================================================
//  Behavioral Anomaly Score (0–100)
//  Aggregates Z-scores across 4 behavioral biometric channels.
// ============================================================
double scoreBehavior(
    double keystrokeDwell, double keystrokeFlight,
    double mouseSpeed, double scrollSpeed,
    const DigitalTwinBaseline& baseline
) {
    double z_dwell  = calculateZScore(keystrokeDwell,  baseline.dwell_mean);
    double z_flight = calculateZScore(keystrokeFlight, baseline.flight_mean);
    double z_mouse  = calculateZScore(mouseSpeed,      baseline.mouse_mean);
    double z_scroll = calculateZScore(scrollSpeed,     baseline.scroll_mean);

    double avg_z = (z_dwell + z_flight + z_mouse + z_scroll) / 4.0;
    return std::min(avg_z * 25.0, 100.0);  // Scale to [0, 100]
}

// ============================================================
//  COMPOSITE RISK SCORE — Main Fusion Function
//  Synthesizes all agent signals into a single [0, 100] risk score.
//  Higher score = greater threat confidence.
// ============================================================
struct RiskAssessment {
    double riskScore;    // [0.0, 100.0]
    std::string level;   // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
};

RiskAssessment computeCompositeRisk(
    double behavioralScore,  // [0–100] Behavioral Profiler Agent
    double contextScore,     // [0–100] Context Intelligence Agent
    double privilegeScore,   // [0–100] Privilege Auditor Agent
    double attackScore,      // [0–100] Attack Path Agent (blast radius)
    double currentTrust,     // [0–100] Trust Decay Engine output
    double ticketPenalty     // [0–100] Ticket Correlator penalty (or 0)
) {
    double trustDecayContribution = 100.0 - currentTrust;  // Invert: low trust = high risk

    double rawRisk =
        (behavioralScore  * W_BEHAVIORAL ) +
        (contextScore     * W_CONTEXT    ) +
        (privilegeScore   * W_PRIVILEGE  ) +
        (attackScore      * W_ATTACK_PATH) +
        (trustDecayContribution * W_TRUST_DECAY) +
        (ticketPenalty    * TICKET_PENALTY_W);  // Surcharge for unauthorized access

    double finalRisk = std::min(std::round(rawRisk * 100.0) / 100.0, 100.0);

    // --- Risk Level Classification (NIST-aligned thresholds) ---
    std::string level;
    if      (finalRisk < 30.0)  level = "LOW";       // ALLOW
    else if (finalRisk < 60.0)  level = "MEDIUM";    // STEP-UP AUTH
    else if (finalRisk < 80.0)  level = "HIGH";      // RESTRICT
    else                        level = "CRITICAL";   // QUARANTINE

    return { finalRisk, level };
}
```

> **Note:** The Ticket Penalty is applied as a multiplicative surcharge (`× 0.15`) on top of the weighted sum when `has_ticket == false && banking_impact_score ≥ 75`, reflecting the heightened risk of un-authorized privileged access to high-sensitivity banking resources.

---

## 🗂️ Repository Structure

```
BOB-Hackathon/
│
├── 📁 frontend-telemetry/        # React + Vite + TypeScript CISO Dashboard
│   ├── src/
│   │   ├── pages/                # Dashboard, Investigation, Audit Log, UserProfile
│   │   ├── components/           # TrustScoreGauge, TrustDecayChart, AlertFeed...
│   │   ├── context/AppContext.tsx # Global state + WebSocket real-time updates
│   │   └── services/api.ts       # API client (all backend calls)
│   └── vite.config.ts
│
├── 📁 backend-services/          # Node.js + Express API Gateway
│   └── src/
│       ├── routes/               # telemetry, orchestrator, trust, users, audit
│       └── services/
│           ├── db.js             # PostgreSQL + MongoDB + Neo4j unified adapter
│           ├── ai_bridge.js      # HTTP bridge to FastAPI AI Orchestrator
│           ├── audit_logger.js   # Immutable audit trail with severity levels
│           ├── trust_passport.js # Digital credential generation (RSA-signed)
│           └── encryption.js     # AES-256 field-level encryption
│
├── 📁 ai-orchestrator/           # Python + FastAPI + LangGraph
│   ├── agents/
│   │   ├── behavioral_profiler.py    # Z-score UEBA against Digital Twin baseline
│   │   ├── contextualizer.py         # Device trust, geo, time, IP analysis
│   │   ├── privilege_auditor.py      # Resource sensitivity + query classification
│   │   ├── ticket_correlator.py      # ServiceNow/Jira ticket validation
│   │   ├── attack_path_agent.py      # Neo4j graph blast radius calculation
│   │   ├── trust_scorer.py           # Composite Bayesian risk fusion
│   │   ├── response_agent.py         # Policy decision: ALLOW/MFA/RESTRICT/QUARANTINE
│   │   └── threat_containment.py     # Autonomous containment action executor
│   ├── engines/
│   │   ├── continuous_trust_engine.py  # Exponential trust decay + EMA update
│   │   ├── digital_identity_twin.py    # Per-user behavioral baseline model
│   │   └── trust_passport.py          # RSA-2048 passport issuance
│   ├── langgraph_flow.py             # LangGraph DAG definition & compilation
│   └── main.py                       # FastAPI app entrypoint
│
├── 📁 databases/                 # DB schema, seed data, migration scripts
├── 📁 infrastructure/            # Docker Compose, Nginx, environment config
└── .env.example                  # Environment variable template
```

---

## 🚀 Installation & Setup

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.x | LTS recommended |
| Python | ≥ 3.12 | With `uv` package manager |
| PostgreSQL | Neon (cloud) | Connection string in `.env` |
| MongoDB | Atlas (cloud) | Connection string in `.env` |
| Neo4j | Aura (cloud) | Bolt URI + credentials in `.env` |
| Google Gemini API | Any | `GEMINI_API_KEY` for LLM reasoning |

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/BOB-Hackathon.git
cd BOB-Hackathon
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

**Required `.env` keys:**

```env
# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# MongoDB (Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mao_ir

# Neo4j (Aura)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password

# Google Gemini (AI Reasoning)
GEMINI_API_KEY=your-gemini-api-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-byte-aes-key
```

### 3. Install & Start Backend Services (Node.js)

```bash
cd backend-services
npm install
node src/index.js
# → API Gateway running at http://localhost:3001
```

### 4. Install & Start AI Orchestrator (Python + LangGraph)

```bash
cd ai-orchestrator

# Install uv (if not already installed)
pip install uv

# Create virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt

# Start FastAPI server
.venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# → AI Orchestrator running at http://localhost:8000
```

### 5. Install & Start Frontend Dashboard (React + Vite)

```bash
cd frontend-telemetry
npm install
npm run dev -- --port 5173
# → CISO Dashboard running at http://localhost:5173
```

### 6. Verify All Services

| Service | URL | Health Check |
|---|---|---|
| Frontend Dashboard | http://localhost:5173 | Login page with 4 demo users |
| Backend API Gateway | http://localhost:3001/health | `{"status": "ok"}` |
| AI Orchestrator | http://localhost:8000/docs | FastAPI Swagger UI |
| WebSocket | ws://localhost:3001 | Live telemetry stream |

---

## 🧪 Demo Scenarios

The platform ships with **4 pre-built attack scenarios** that trigger the full multi-agent pipeline. Navigate to any **Identity Profile** page on the dashboard and click **Simulate**:

| Scenario | Persona | Trigger | Expected Outcome |
|---|---|---|---|
| 🟢 `normal_access` | `priya_teller` | Routine loan query during business hours | Risk: LOW · Action: ALLOW |
| 🔴 `insider_threat` | `rajesh_dba` | SWIFT query at 2:30 AM, no ticket | Risk: CRITICAL · Action: QUARANTINE |
| 🟠 `compromised_vendor` | `tcs_vendor_01` | Unknown device, Lagos IP, DROP TABLE | Risk: HIGH → CRITICAL · Action: SESSION KILL |
| 🟠 `privilege_escalation` | `ameya_admin` | GRANT ALL PRIVILEGES to vendor account | Risk: CRITICAL · Action: QUARANTINE + SOC ALERT |

---

## 🔒 Security & Compliance

| Standard | Status | Implementation |
|---|---|---|
| **NIST SP 800-207** (Zero Trust Architecture) | ✅ Compliant | Continuous verification, least privilege, micro-segmentation |
| **NIST SP 800-63** (Digital Identity) | ✅ Compliant | Trust Passport with behavioral confidence, MFA step-up |
| **India DPDP Act 2023** | ✅ Compliant | Edge hashing, data minimization, no raw biometric storage |
| **RBI Cyber Security Framework** | ✅ Aligned | Immutable audit trail, SOC notification, CISO dashboard |
| **ISO/IEC 27001** | ✅ Aligned | Encryption at rest (AES-256), in transit (TLS 1.3) |
| **MITRE ATT&CK** | ✅ Mapped | Insider threat TTPs: T1078, T1098, T1566, T1059 |

---

## 🧬 Technical Deep Dive

### Behavioral Biometrics & Digital Identity Twin

Each user maintains a **per-identity Digital Twin** — a statistical baseline model of their behavioral biometrics, expected working hours, typical resource access patterns, and device fingerprints. The twin is stored in PostgreSQL and updated using an EMA after each verified low-risk session.

At runtime, the **Behavioral Profiler Agent** computes per-channel Z-scores:

```
Z_dwell  = |observed_dwell  − μ_dwell|  / (0.2 × μ_dwell)
Z_flight = |observed_flight − μ_flight| / (0.2 × μ_flight)
Z_mouse  = |observed_speed  − μ_speed|  / (0.2 × μ_speed)
Z_scroll = |observed_scroll − μ_scroll| / (0.2 × μ_scroll)

anomaly_score = min((Z_avg × 25), 100)
```

A Z-score > 2.0 on any channel (indicating behavior deviating > 2 standard deviations from the personal baseline) contributes meaningfully to the composite risk score.

### Neo4j Identity Graph — Blast Radius Calculation

All user-role-resource relationships are modeled as a **directed property graph** in Neo4j Aura. When a suspicious event is detected, a **graph traversal query** computes:

```cypher
MATCH path = (u:User {username: $username})-[:HAS_ROLE]->(r:Role)
             -[:CAN_ACCESS*1..3]->(sys:System)
WHERE sys.sensitivity IN ['CRITICAL', 'HIGH']
RETURN count(DISTINCT sys) AS blast_radius,
       collect(DISTINCT sys.name) AS reachable_systems
```

A high blast radius (many reachable critical systems) significantly amplifies the composite risk score, as the potential impact of a compromised identity scales accordingly.

---

## 🏆 Why MAO-IR Wins

1. **Causal Attribution, not just Anomaly Detection** — The only solution that asks *why*, not just *what*.
2. **Real Architecture** — All 3 services (React, Node.js, Python/LangGraph) are live, connected, and tested end-to-end against cloud databases.
3. **Privacy by Design** — DPDP Act compliant from day one with edge hashing and data minimization.
4. **Banking-Domain Precision** — Risk weights calibrated specifically for SWIFT, Core Banking, KYC, and Treasury Systems — not a generic cybersecurity tool.
5. **Frictionless for Legitimate Users** — Zero-trust without zero-productivity. Step-up auth only when the risk justifies it.
6. **Explainable AI** — Every investigation generates a human-readable risk narrative suitable for CISO review and regulatory audit.

---

## 👥 Team

> **Bank of Baroda Hackathon 2026 × IIT Gandhinagar**
> *Problem Statement: Identity Trust, Protection & Safety*

Built with ❤️ and ☕ by a team of full-stack AI engineers tackling one of banking's most critical unsolved challenges.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**MAO-IR** · Multi-Agent Orchestration for Identity Risk

*"Trust is not a login. Trust is earned, continuously."*

[![Star this repo](https://img.shields.io/github/stars/your-org/BOB-Hackathon?style=social)](https://github.com)

</div>