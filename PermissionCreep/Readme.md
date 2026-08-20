# 🔐 PermissionCreep — Advanced JWT & OAuth Token Security Analyser

> **Zero-knowledge architecture** — All analysis happens client-side. No token data ever leaves your browser.

![React](https://img.shields.io/badge/React-18-0052CC?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite)
![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?style=for-the-badge&logo=d3.js)
![Tailwind](https://img.shields.io/badge/Tailwind-v3-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-4CAF50?style=for-the-badge)

## 🎯 Overview

PermissionCreep is a production-ready, client-side JWT and OAuth token security analyser that performs comprehensive security assessments using a deterministic, OWASP-mapped rule engine. It provides instant visual feedback through interactive D3.js permission graphs and generates CI/CD-ready SARIF reports.

**Author:** Adan Raza Masoom  
**Institution:** Air University, Islamabad  
**Department:** Cyber Security  
**Track:** Offensive Security & Vulnerability Assessment  

---

## 🚀 Features

### Layer 1 — Input & Decode
* Accepts raw JWT strings, `Bearer` headers, and OAuth opaque tokens.
* Automatic format detection (JWT, OAuth opaque, API keys).
* Validates structural integrity and decodes header/payload.
* Supports tokens from Google, GitHub, AWS, Azure, Slack, Stripe, etc.

### Layer 2 — Rule Engine (12 OWASP-Mapped Security Checks)
| Rule | Check | OWASP | Severity |
| :--- | :--- | :--- | :--- |
| **R01** | Algorithm security (alg:none, HS256, confusion) | A02:2021 | CRITICAL/HIGH |
| **R02** | Token expiry (missing/excessive TTL) | A07:2021 | HIGH/MEDIUM |
| **R03** | Wildcard/Admin scope detection | A01:2021 | CRITICAL/HIGH |
| **R04** | Missing audience claim (aud) | A01:2021 | HIGH |
| **R05** | Missing issuer claim (iss) | A07:2021 | MEDIUM |
| **R06** | Embedded role/permission claims | A01:2021 | MEDIUM |
| **R07** | Weak secret detection (HS* brute-force) | A02:2021 | CRITICAL/MEDIUM |
| **R08** | PII exposure in payload (SSN/CC/phone/email) | A02:2021 | HIGH/MEDIUM/LOW |
| **R09** | Missing JWT ID for revocation (jti) | A07:2021 | LOW |
| **R10** | Over-privileged scope count (>5 scopes) | A01:2021 | MEDIUM |
| **R11** | Missing key ID (kid) for asymmetric tokens | A02:2021 | MEDIUM |
| **R12** | Missing temporal claims (iat/nbf) | A07:2021 | LOW |

### Layer 3 — Scope Analyser & Blast Radius
* Maps scopes to resource categories (Users, Files, Email, Admin, Code, etc.).
* Computes blast-radius percentage score.
* Interactive D3.js v7 force-directed permission graph.
* Radar chart visualization with severity colouring.

### Layer 4 — Risk Report & Export
* **SARIF 2.1.0** — CI/CD integration (GitHub Code Scanning, Azure DevOps, SonarQube).
* **PDF Audit Report** — Cover page, executive summary, findings, remediation checklist.
* **JSON Report** — Machine-readable structured analysis.
* Overall risk scoring (0-100) with capped category weighting.

### Token Comparison (Dev vs Production)
* Side-by-side environment comparison.
* Scope delta analysis (added/removed permissions).
* Algorithm downgrade detection.
* Security regression scoring.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Concurrent rendering, sub-second HMR |
| **Styling** | Tailwind CSS v3 | Utility-first responsive design |
| **Visualisation** | D3.js v7 | Force-directed permission graph |
| **PDF Export** | jsPDF | Client-side PDF generation |
| **Report Format**| SARIF 2.1.0 | CI/CD pipeline integration |
| **Deployment** | Vercel | Static hosting with global CDN |

---

## 📦 Installation & Running

### Prerequisites
* **Node.js** ≥ 18.x
* **npm** ≥ 9.x

### Quick Start

```bash
# 1. Clone the project
git clone [https://github.com/ADANRAZA-debug/PermissionCreep.git](https://github.com/ADANRAZA-debug/PermissionCreep.git)

# 2. Navigate to the directory
cd PermissionCreep

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev

# 5. Open in browser at http://localhost:5173