# PermissionCreep - Complete Testing Guide

## How to Test Every Feature (Step by Step with Tokens)

Use this guide to test each functionality in the app and take screenshots for your report.

---

## TEST 1: Basic Token Analysis (ANALYSE Mode)

What to test: Paste a token and verify decoding, risk scoring, and findings.

Token to paste:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

What you should see:
- Risk score gauge showing HIGH (around 70-80)
- Decoded header showing alg:HS256 and typ:JWT
- Decoded payload showing sub, name, iat claims
- Multiple findings: HS256 warning, no exp, no aud, no iss, weak secret detected, no jti

Screenshot to take: Full page showing the risk gauge, decoded claims, and findings list.

---

## TEST 2: Critical Vulnerability Detection (alg:none)

What to test: Token with no signature algorithm (most critical JWT vulnerability).

Token to paste:
```
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiKiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20ifQ.
```

What you should see:
- Risk score showing CRITICAL (80-100)
- Finding: alg:none CRITICAL with CVE-2015-9235
- Finding: Wildcard scope CRITICAL
- Finding: Embedded role claim (admin) MEDIUM
- Red severity badges everywhere

Screenshot to take: The critical risk score and the alg:none finding expanded showing remediation code.

---

## TEST 3: Scope Analysis and Blast Radius

What to test: Token with multiple scopes to see the radar chart and D3 graph.

Token to paste:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyQGdtYWlsLmNvbSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImF1ZCI6IjEyMzQ1Njc4OS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImV4cCI6MTcxMDAwMDAwMCwiaWF0IjoxNzA5OTk2NDAwLCJzY29wZSI6Imh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvZ21haWwgaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vYXV0aC9kcml2ZSBodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL2Nsb3VkLXBsYXRmb3JtIGh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvdXNlcmluZm8ucHJvZmlsZSBodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3VzZXJpbmZvLmVtYWlsIGh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvZ21haWwuc2VuZCIsImp0aSI6Imdvb2dsZS1pZC0xMjMifQ.google-signature
```

What you should see:
- Scope Blast Radius section with radar chart showing Email, Files, Admin, Users categories filled
- Blast radius percentage (should be high, around 60-80%)
- List of Google scopes with READ/WRITE/ADMIN labels
- Finding: Over-privileged (6 scopes) MEDIUM
- Finding: Admin-level scope (cloud-platform) HIGH

Screenshot 1: The radar chart showing blast radius.
Screenshot 2: Click "D3 GRAPH VIEW" button. Take screenshot of the interactive force-directed graph showing token connected to categories connected to scopes.

---

## TEST 4: D3.js Interactive Permission Graph

What to test: The force-directed graph with drag, zoom, and hover.

Steps:
1. Use the same Google token from Test 3 above
2. Scroll down to the Scope Blast Radius section
3. Click the "D3 GRAPH VIEW" button on the right side
4. You see the interactive graph with center node (token), category nodes (coloured), and scope nodes
5. Try dragging a node - it moves and the simulation adjusts
6. Try scrolling to zoom in/out
7. Hover over a node to see the tooltip

Screenshot to take: The D3 graph showing all nodes connected with the legend (READ/WRITE/ADMIN) visible at top right.

---

## TEST 5: Well-Configured Token (No Issues)

What to test: A properly secured token should show green/safe result.

Token to paste:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIn0.eyJzdWIiOiJ1c2VyXzQ1NiIsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwiZXhwIjoxNzEwMDAwMDAwLCJpYXQiOjE3MDk5OTY0MDAsIm5iZiI6MTcwOTk5NjQwMCwic2NvcGUiOiJyZWFkOnByb2ZpbGUgcmVhZDplbWFpbCIsImp0aSI6InVuaXF1ZS1pZC0xMjMifQ.fake-rs256-signature
```

What you should see:
- Low risk score (close to 0 or just INFO level)
- Token expired INFO message (since exp is in the past)
- Green checkmark or minimal findings
- All proper claims present: RS256, kid, iss, aud, exp, iat, nbf, jti, minimal scopes

Screenshot to take: The green/low risk result showing the token passes most checks.

---

## TEST 6: Token Comparison (Dev vs Production)

What to test: Side-by-side comparison showing security regression detection.

Steps:
1. Click "COMPARE" button in the top navigation bar
2. In the LEFT panel (Development Token), paste:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlciIsInJvbGUiOiJhZG1pbiIsInNjb3BlIjoiKiIsImV4cCI6OTk5OTk5OTk5OX0.dev-signature
```

3. In the RIGHT panel (Production Token), paste:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InByb2Qta2V5LTAxIn0.eyJzdWIiOiJwcm9kLXVzZXIiLCJpc3MiOiJodHRwczovL2F1dGgucHJvZC5jb20iLCJhdWQiOiJodHRwczovL2FwaS5wcm9kLmNvbSIsInNjb3BlIjoicmVhZDpwcm9maWxlIiwiZXhwIjoxNzEwMDAwMDAwLCJpYXQiOjE3MDk5OTk5MDAsImp0aSI6InByb2QtaWQtNDU2In0.prod-rs256-signature
```

What you should see:
- Both panels show individual analysis
- Below both panels: ENVIRONMENT SECURITY DELTA section
- Score delta showing production is MORE secure (negative delta, green)
- Claim differences table showing: alg changed (HS256 to RS256), kid added, scope reduced, role removed, iss/aud added
- Security-relevant changes highlighted in red/warning

Screenshot 1: Both panels side by side with their individual scores.
Screenshot 2: The delta section showing claim differences with security highlighting.

---

## TEST 7: Secret Brute-Force Attack

What to test: Real HMAC secret cracking using Web Crypto API.

Steps:
1. Click "ATTACK" button in the top navigation bar (red button)
2. Paste this token (signed with jwt.io default secret):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```
3. In the Attack Workbench grid below, click "SECRET BRUTE-FORCE" button
4. Click "START BRUTE-FORCE" button
5. Watch it crack the secret in real-time (under 200ms)

What you should see:
- "SECRET CRACKED!" message in red
- Secret revealed: your-256-bit-secret
- Number of attempts and time taken
- Message saying you can now forge tokens

Screenshot to take: The cracked secret result showing the revealed password, attempt count, and timing.

---

## TEST 8: Token Forgery

What to test: Modify claims and re-sign with the cracked secret.

Steps:
1. Stay in ATTACK mode with the same HS256 token from Test 7
2. Click "TOKEN FORGERY" button in the attack grid
3. In the SIGNING SECRET field, type: your-256-bit-secret
4. In the CLAIM MODIFICATIONS field, type: {"role":"admin","sub":"admin_user","is_admin":true}
5. Click "FORGE TOKEN" button

What you should see:
- "TOKEN FORGED" success message
- A complete new JWT string with valid signature
- The modifications applied shown below
- Copy button to grab the forged token

Screenshot to take: The forged token output with the modifications visible.

---

## TEST 9: alg:none Bypass Generation

What to test: Generate unsigned token variants for bypass testing.

Steps:
1. Stay in ATTACK mode with any token pasted
2. Click "ALG:NONE BYPASS" button in the attack grid

What you should see:
- 5 generated token variants with different casing: none, None, NONE, nOnE, and no-typ variant
- Each token displayed with copy button
- Python exploit code at the bottom

Screenshot to take: The list of generated variants with copy buttons.

---

## TEST 10: Algorithm Confusion Attack

What to test: RS256 to HS256 confusion exploit generation.

Steps:
1. Stay in ATTACK mode with any token pasted
2. Click "ALG CONFUSION" button in the attack grid

What you should see:
- Attack description referencing CVE-2015-9235
- Step-by-step exploitation instructions
- Complete Python exploit script (using PyJWT library)
- cURL command ready to paste

Screenshot to take: The exploit code block showing the full Python script.

---

## TEST 11: JWKS Spoofing

What to test: Generate JWKS endpoint injection payload.

Steps:
1. Stay in ATTACK mode
2. Click "JWKS SPOOFING" button
3. You can change the attacker URL field to your own domain

What you should see:
- CVE-2018-0114 reference
- Attacker URL input field
- Full Python exploit script for generating RSA keys and JWKS
- The forged header JSON showing jku pointing to attacker URL

Screenshot to take: The exploit code and the forged header with jku URL.

---

## TEST 12: Claim Injection Payloads

What to test: Pre-built privilege escalation payloads.

Steps:
1. Stay in ATTACK mode with any decoded JWT
2. Click "CLAIM INJECTION" button

What you should see:
- 10 different attack payloads listed:
  - Privilege Escalation (admin role)
  - User Impersonation (change sub)
  - Scope Escalation (wildcard)
  - Tenant Escape (change org)
  - Token Lifetime Extension (far future exp)
  - Audience Manipulation
  - Issuer Spoofing
  - SQL Injection in Claims
  - SSTI/Template Injection in Claims
  - Path Traversal in Claims
- Each with copy button for the modified payload

Screenshot to take: The full list showing at least 5-6 injection payloads with their descriptions.

---

## TEST 13: CVE Exploit Matcher

What to test: Automatic matching of token to known CVEs.

Token to paste (has jku header for CVE matching):
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIiwiamt1IjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tLy53ZWxsLWtub3duL2p3a3MuanNvbiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJ1c2VyIiwic2NvcGUiOiJyZWFkOnByb2ZpbGUiLCJhdWQiOlsiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJodHRwczovL2FkbWluLmV4YW1wbGUuY29tIl0sImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImV4cCI6MTcxMDAwMDAwMCwiaWF0IjoxNzA5OTk2NDAwfQ.fake-rs256-sig
```

Steps:
1. Paste the token above in ATTACK mode
2. Click "CVE MATCHER" button

What you should see:
- CVE-2018-0114: JWKS Endpoint Spoofing (CRITICAL, CVSS 9.1)
- CVE-2017-11424: kid Parameter Injection (HIGH, CVSS 8.1)
- Each with affected versions, description, and exploit code

Screenshot to take: The CVE list with severity badges and exploit code.

---

## TEST 14: Burp/ZAP Intruder Payloads

What to test: Export payloads for proxy tool fuzzing.

Steps:
1. Stay in ATTACK mode with any token
2. Click "INTRUDER PAYLOADS" button

What you should see:
- Algorithm Manipulation category: base64url encoded headers for none, None, HS256
- Subject Manipulation category: admin, root, 1, 0, system, null byte
- Role Escalation category: full modified payload JSONs

Screenshot to take: The payload categories with individual copy buttons.

---

## TEST 15: Mass Token Analyser

What to test: Bulk triage of multiple tokens at once.

Steps:
1. Stay in ATTACK mode
2. Click "MASS ANALYSER" button
3. Paste these 10 tokens (one per line) in the textarea:

```
eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSIsImV4cCI6MTcwMDAwMDAwMH0.abc123
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMiIsImV4cCI6MTcxMDAwMDAwMCwiaXNfYWRtaW4iOnRydWV9.xyz789
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMyJ9.nosig
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyNCIsImV4cCI6MTcxMDAwMDAwMCwic2NvcGUiOiIqIn0.star
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyNSIsImV4cCI6MTcxMDAwMDAwMCwicm9sZSI6InVzZXIifQ.normal
eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJ1c2VyNiIsImV4cCI6MTYwMDAwMDAwMH0.expired
eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyNyIsImV4cCI6MTcxMDAwMDAwMCwicm9sZSI6ImFkbWluIn0.admintoken
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJoYWNrZXIiLCJyb2xlIjoic3VwZXJhZG1pbiJ9.
eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleTEifQ.eyJzdWIiOiJ1c2VyOSIsImV4cCI6MTcxMDAwMDAwMCwiYXVkIjoiYXBpLmV4YW1wbGUuY29tIiwiaXNzIjoiYXV0aC5leGFtcGxlLmNvbSJ9.secure
```

4. Click "ANALYSE ALL" button

What you should see:
- Summary: 10 tokens analysed, X Critical, Y High
- Each token listed with its algorithm, subject, expiry, and issues
- Critical tokens (alg:none) highlighted in red
- High tokens (no expiry, weak alg) highlighted in amber
- Clean tokens shown in default colour

Screenshot to take: The mass analysis results showing colour-coded severity per token.

---

## TEST 16: OAuth Security Analysis

What to test: OAuth-specific vulnerability detection.

Token to paste (has multi-audience):
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI0LTAxIiwiamt1IjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tLy53ZWxsLWtub3duL2p3a3MuanNvbiJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJ1c2VyIiwic2NvcGUiOiJyZWFkOnByb2ZpbGUiLCJhdWQiOlsiaHR0cHM6Ly9hcGkuZXhhbXBsZS5jb20iLCJodHRwczovL2FkbWluLmV4YW1wbGUuY29tIl0sImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImV4cCI6MTcxMDAwMDAwMCwiaWF0IjoxNzA5OTk2NDAwfQ.fake-rs256-sig
```

Steps:
1. ATTACK mode, paste token above
2. Click "OAUTH ATTACKS" button

What you should see:
- Missing nonce: CSRF vulnerability in OAuth flow
- Multi-audience token: Confused deputy risk (2 audiences listed)
- Missing at_hash: Token substitution possible

Screenshot to take: The OAuth findings list.

---

## TEST 17: SARIF Export

What to test: Download SARIF 2.1.0 report for CI/CD.

Steps:
1. Go back to ANALYSE mode
2. Paste any token that has findings (use Token 1 from Test 1)
3. Look for the export buttons (bottom right of the panel or top of compare panel)
4. Click "SARIF" download button
5. A .sarif file downloads to your computer
6. Open it in any text editor - it is JSON format

What you should see in the file:
- Schema reference to SARIF 2.1.0
- Tool section with PermissionCreep name and version
- Rules array with rule descriptors
- Results array with findings mapped to rules
- Each result has severity, message, location, and fix

Screenshot to take: The downloaded file opened in a text editor showing the SARIF structure.

---

## TEST 18: PDF Export

What to test: Download PDF audit report.

Steps:
1. ANALYSE mode with a token that has multiple findings
2. Click "PDF" download button
3. A PDF file downloads
4. Open it

What you should see in the PDF:
- Cover page with PermissionCreep branding
- Executive summary with risk score and finding counts
- Token details (decoded header and payload)
- Detailed findings with severity badges and remediation
- Scope analysis section
- Remediation checklist

Screenshot to take: The PDF opened showing the cover page or executive summary page.

---

## TEST 19: JSON Export

What to test: Download machine-readable JSON report.

Steps:
1. ANALYSE mode with any token
2. Click "JSON" download button
3. Open the downloaded .json file

What you should see:
- Structured JSON with tool version, timestamp, risk score
- All findings with severity, OWASP, CWE, remediation
- Scope analysis data
- Token metadata

Screenshot to take: The JSON file opened showing structured data.

---

## TEST 20: Opaque Token Detection

What to test: Non-JWT token handling.

Token to paste (GitHub personal access token format):
```
ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
```

What you should see:
- "Opaque Token Detected" message
- Token type identified as OAUTH_OPAQUE
- Provider identified as GitHub
- Message explaining opaque tokens cannot be decoded client-side
- Suggestion to use RFC 7662 token introspection

Screenshot to take: The opaque token detection message.

---

## TEST 21: Invalid Token Handling

What to test: Error handling for bad input.

Text to paste:
```
this is not a token at all just random text
```

What you should see:
- Parse Error message in red
- "Invalid token format" explanation
- No crash, no blank screen

Screenshot to take: The error message display.

---

## TEST 22: Responsive Design

What to test: App works on different screen sizes.

Steps:
1. Open browser developer tools (F12)
2. Click the device toggle (phone/tablet icon) or press Ctrl+Shift+M
3. Select iPhone or any mobile device
4. Verify the app adapts properly: single column layout, readable text, functioning buttons

Screenshot to take: The app in mobile viewport showing it adapts properly.

---

## SCREENSHOT CHECKLIST FOR YOUR REPORT

Take these screenshots and number them:

1. Homepage empty state with sample token buttons visible
2. Token analysed: Risk gauge + decoded claims
3. Token analysed: Findings list expanded
4. Blast radius radar chart
5. D3.js permission graph (interactive view)
6. Compare mode: Both panels with different tokens
7. Compare mode: Delta section showing differences
8. Attack mode: Attack tool grid
9. Brute-force: Cracked secret result
10. Token forgery: Forged token output
11. alg:none: Generated unsigned variants
12. Algorithm confusion: Python exploit code
13. JWKS spoofing: Exploit with attacker URL
14. Claim injection: List of payloads
15. CVE matcher: Matched CVEs with severity
16. Mass analyser: Bulk results table
17. SARIF file: Opened in text editor
18. PDF report: Opened showing audit content
19. Opaque token: Detection message
20. Mobile responsive: App on phone viewport
