// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2: RULE ENGINE
// PermissionCreep — 10 OWASP-mapped deterministic security rules
// ─────────────────────────────────────────────────────────────────────────────

import { COMMON_SECRETS } from './constants.js';

/**
 * Execute all 10 security rules against a parsed TokenObject.
 * Returns an array of RuleFinding objects.
 * 
 * Rules:
 * R01 — Algorithm Security (alg:none, weak symmetric, algorithm confusion)
 * R02 — Token Expiry (missing exp, expired, excessive TTL)
 * R03 — Wildcard/Admin Scope Detection
 * R04 — Missing Audience Claim
 * R05 — Missing Issuer Claim
 * R06 — Embedded Role/Permission Claims
 * R07 — Weak Secret Detection (for HS* algorithms)
 * R08 — PII Exposure in Payload
 * R09 — Missing JWT ID (jti) for Revocation
 * R10 — Over-Privileged Scope Count
 */
export function runRuleEngine(parsed) {
  if (!parsed || parsed.error || parsed.opaque) return [];
  
  const { header, payload } = parsed;
  const findings = [];
  const now = Math.floor(Date.now() / 1000);

  // ─── R01: Algorithm Security ────────────────────────────────────────────────
  const alg = header?.alg;
  if (!alg || alg.toLowerCase() === "none") {
    findings.push({
      id: "R01",
      severity: "CRITICAL",
      title: "No signature algorithm (alg:none)",
      description: "The token uses alg:none, meaning it has no cryptographic signature. Any attacker can forge arbitrary payloads that will be accepted by vulnerable libraries that don't explicitly reject unsigned tokens.",
      owasp: "A02:2021",
      cwe: "CWE-347",
      cve: "CVE-2015-9235",
      remediation: `// Always enforce algorithm whitelist on verification\njwt.verify(token, secret, { algorithms: ['RS256'] })\n\n// Never allow 'none' in production\nif (decoded.header.alg === 'none') throw new Error('Unsigned tokens rejected');`,
      score: 40
    });
  } else if (["HS256", "HS384", "HS512"].includes(alg)) {
    findings.push({
      id: "R01",
      severity: "HIGH",
      title: `Symmetric algorithm: ${alg}`,
      description: `${alg} uses a shared symmetric secret for both signing and verification. If the secret is weak, guessable, or shared across services, tokens can be forged. Asymmetric algorithms (RS256/ES256) are strongly preferred for production systems.`,
      owasp: "A02:2021",
      cwe: "CWE-327",
      cve: "CVE-2015-9235",
      remediation: `// Migrate to asymmetric signing\njwt.sign(payload, privateKey, { algorithm: 'RS256' })\n\n// If HS256 is required, use a ≥256-bit random secret\nconst secret = crypto.randomBytes(32).toString('base64');`,
      score: 15
    });
  }

  // ─── R02: Token Expiry ──────────────────────────────────────────────────────
  if (!payload.exp && payload.exp !== 0) {
    findings.push({
      id: "R02",
      severity: "HIGH",
      title: "No expiry claim (exp)",
      description: "This token has no exp claim and will never expire. If compromised, it remains valid indefinitely, giving an attacker unlimited time to use it. All access tokens must have a finite lifetime.",
      owasp: "A07:2021",
      cwe: "CWE-613",
      cve: null,
      remediation: `// Set short-lived expiry for access tokens\njwt.sign(payload, secret, { expiresIn: '15m' })\n\n// Use refresh tokens for session continuity\njwt.sign(refreshPayload, secret, { expiresIn: '7d' })`,
      score: 15
    });
  } else if (payload.exp < now) {
    findings.push({
      id: "R02",
      severity: "INFO",
      title: "Token is expired",
      description: `This token expired at ${new Date(payload.exp * 1000).toISOString()}. It should no longer be accepted by any server. If it is still being accepted, the server's exp validation is broken.`,
      owasp: "A07:2021",
      cwe: "CWE-613",
      cve: null,
      remediation: "Request a fresh token from the authorization server. If this expired token is still working, the server has a critical bug in expiry validation.",
      score: 0
    });
  } else {
    // Check excessive TTL
    const iat = payload.iat || now;
    const ttlSeconds = payload.exp - iat;
    const ttlDays = ttlSeconds / 86400;
    
    if (ttlDays > 30) {
      findings.push({
        id: "R02",
        severity: "MEDIUM",
        title: `Excessive token lifetime (${Math.round(ttlDays)} days)`,
        description: `This token has a TTL of ${Math.round(ttlDays)} days. Access tokens with long lifetimes vastly increase the blast radius of credential theft. Industry best practice is 15 minutes to 1 hour for access tokens.`,
        owasp: "A07:2021",
        cwe: "CWE-613",
        cve: null,
        remediation: `// Use short-lived access tokens\njwt.sign(payload, secret, { expiresIn: '15m' })\n\n// Implement refresh token rotation for long sessions`,
        score: 8
      });
    }
  }

  // ─── R03: Wildcard/Admin Scope Detection ────────────────────────────────────
  const scopes = extractScopes(payload);
  
  if (scopes.includes("*") || scopes.includes(".*") || scopes.some(s => s === "*:*")) {
    findings.push({
      id: "R03",
      severity: "CRITICAL",
      title: "Wildcard scope (*) detected",
      description: "This token grants access to ALL resources with ALL permissions. A wildcard scope violates the principle of least privilege. If compromised, the attacker has unrestricted access to the entire system.",
      owasp: "A01:2021",
      cwe: "CWE-250",
      cve: null,
      remediation: `// Request only specific, minimal scopes\nscope: 'read:profile read:email'\n\n// Implement scope validation server-side\nif (token.scope.includes('*')) reject(token);`,
      score: 40
    });
  }
  
  if (scopes.some(s => s.startsWith("admin") || s === "admin:*" || s.endsWith(":*"))) {
    findings.push({
      id: "R03",
      severity: "HIGH",
      title: "Admin-level or wildcard-suffixed scope",
      description: "This token contains administrative scope grants or wildcard-suffixed permissions (e.g., admin:*, iam:*). Admin scopes should be restricted to service accounts and never appear in user-facing tokens.",
      owasp: "A01:2021",
      cwe: "CWE-250",
      cve: null,
      remediation: `// Use role-based access control server-side\n// Never encode admin privileges in client-facing tokens\n// Implement scope downscoping at the authorization server`,
      score: 15
    });
  }

  // ─── R04: Missing Audience ──────────────────────────────────────────────────
  if (!payload.aud) {
    findings.push({
      id: "R04",
      severity: "HIGH",
      title: "Missing audience claim (aud)",
      description: "Without an aud claim, this token can be replayed against any service that trusts the same issuer. This enables confused deputy attacks where a token issued for Service A is used to access Service B.",
      owasp: "A01:2021",
      cwe: "CWE-284",
      cve: null,
      remediation: `// Always set audience during signing\njwt.sign(payload, secret, { audience: 'https://api.yourapp.com' })\n\n// Validate audience during verification\njwt.verify(token, secret, { audience: 'https://api.yourapp.com' })`,
      score: 15
    });
  }

  // ─── R05: Missing Issuer ────────────────────────────────────────────────────
  if (!payload.iss) {
    findings.push({
      id: "R05",
      severity: "MEDIUM",
      title: "Missing issuer claim (iss)",
      description: "The iss claim identifies the token's source. Without it, servers cannot verify which authorization server issued the token, making it easier to inject tokens from rogue issuers.",
      owasp: "A07:2021",
      cwe: "CWE-290",
      cve: null,
      remediation: `// Set issuer during token creation\njwt.sign(payload, secret, { issuer: 'https://auth.yourapp.com' })\n\n// Validate issuer during verification\njwt.verify(token, secret, { issuer: 'https://auth.yourapp.com' })`,
      score: 8
    });
  }

  // ─── R06: Embedded Role/Permission Claims ───────────────────────────────────
  const sensitiveKeys = ["role", "roles", "permission", "permissions", "is_admin", "admin", "superuser", "group", "groups", "authorities"];
  const foundRoleKeys = sensitiveKeys.filter(k => payload[k] !== undefined);
  
  if (foundRoleKeys.length > 0) {
    const roleValues = foundRoleKeys.map(k => `${k}=${JSON.stringify(payload[k])}`).join(", ");
    findings.push({
      id: "R06",
      severity: "MEDIUM",
      title: `Role/permission claims embedded (${foundRoleKeys.join(", ")})`,
      description: `Found: ${roleValues}. Roles embedded in JWTs are trusted as-is by the server. If the signing key is compromised or an old token with elevated role is replayed, the server grants elevated access without database verification.`,
      owasp: "A01:2021",
      cwe: "CWE-269",
      cve: null,
      remediation: `// Look up roles from database on each request\nconst user = await db.users.findById(token.sub);\nconst roles = user.roles; // Fresh from DB, not from token\n\n// If embedding roles is required, use short-lived tokens`,
      score: 8
    });
  }

  // ─── R07: Weak Secret Detection (HS* only) ─────────────────────────────────
  if (alg && alg.startsWith("HS")) {
    // We can't actually verify the signature client-side without the secret,
    // but we can flag if the token matches jwt.io's default secret
    const sigBase64 = parsed.signature;
    // jwt.io default token with "your-256-bit-secret" has this specific signature
    if (sigBase64 === "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c") {
      findings.push({
        id: "R07",
        severity: "CRITICAL",
        title: "Known weak secret detected (jwt.io default)",
        description: "This token's signature matches the jwt.io default secret 'your-256-bit-secret'. This means anyone can forge valid tokens with arbitrary payloads. This is trivially exploitable.",
        owasp: "A02:2021",
        cwe: "CWE-798",
        cve: "CVE-2015-9235",
        remediation: `// Generate a cryptographically random secret ≥256 bits\nconst secret = require('crypto').randomBytes(32).toString('base64');\n\n// Store in environment variable, never in code\nprocess.env.JWT_SECRET`,
        score: 40
      });
    } else {
      // General warning for HS tokens
      findings.push({
        id: "R07",
        severity: "MEDIUM",
        title: "HMAC token — secret strength unknown",
        description: `This HS* token's security depends entirely on the signing secret. Common attack: brute-force the secret using tools like hashcat/jwt-cracker. The top ${COMMON_SECRETS.length} most common JWT secrets are publicly known.`,
        owasp: "A02:2021",
        cwe: "CWE-521",
        cve: null,
        remediation: `// Use hashcat to test your own secret strength\nhashcat -a 0 -m 16500 jwt.txt wordlist.txt\n\n// Ensure secret is ≥256 bits of entropy\nopenssl rand -base64 32`,
        score: 5
      });
    }
  }

  // ─── R08: PII Exposure ──────────────────────────────────────────────────────
  const payloadStr = JSON.stringify(payload);
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/;
  const phoneRegex = /\b(\+?\d[\s\-.]?)(\(?\d{3}\)?[\s\-.]?)(\d{3}[\s\-.]?\d{4})\b/;
  const ccRegex = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  if (ssnRegex.test(payloadStr) || ccRegex.test(payloadStr)) {
    findings.push({
      id: "R08",
      severity: "HIGH",
      title: "Highly sensitive PII in payload (SSN/CC)",
      description: "The token payload contains what appears to be a Social Security Number or credit card number. JWT payloads are only base64-encoded — NOT encrypted. Anyone who intercepts this token can read this sensitive data.",
      owasp: "A02:2021",
      cwe: "CWE-312",
      cve: null,
      remediation: `// NEVER store sensitive PII in JWT payloads\n// Use opaque reference tokens instead\n{ "sub": "user_123" } // Reference only, look up data server-side\n\n// If encryption is needed, use JWE (RFC 7516)`,
      score: 15
    });
  } else if (phoneRegex.test(payloadStr)) {
    findings.push({
      id: "R08",
      severity: "MEDIUM",
      title: "Phone number detected in payload",
      description: "A phone number is present in the token payload. Remember that JWT payloads are readable by anyone holding the token. Minimize PII in tokens.",
      owasp: "A02:2021",
      cwe: "CWE-312",
      cve: null,
      remediation: "Remove phone numbers from token payloads. Store PII server-side and reference by user ID only.",
      score: 8
    });
  } else if (emailRegex.test(payloadStr) && !payload.email) {
    // Only flag if email isn't in the standard 'email' claim (which is normal for OIDC)
    findings.push({
      id: "R08",
      severity: "LOW",
      title: "Email address in payload",
      description: "An email address is present in the token payload. While email in OIDC tokens is standard, remember JWT payloads are visible to anyone with the token.",
      owasp: "A02:2021",
      cwe: "CWE-312",
      cve: null,
      remediation: "Ensure only necessary claims are included. Avoid storing sensitive PII beyond what the protocol requires.",
      score: 2
    });
  }

  // ─── R09: Missing JWT ID (jti) ─────────────────────────────────────────────
  if (!payload.jti) {
    findings.push({
      id: "R09",
      severity: "LOW",
      title: "No JWT ID claim (jti)",
      description: "Without a jti claim, this token cannot be uniquely identified or individually revoked. If you need token blocklisting, logout, or replay protection, a jti is essential.",
      owasp: "A07:2021",
      cwe: "CWE-613",
      cve: null,
      remediation: `// Add a unique identifier for revocation support\nconst payload = {\n  ...claims,\n  jti: crypto.randomUUID()\n};\n\n// Implement a token blocklist keyed by jti`,
      score: 2
    });
  }

  // ─── R10: Over-Privileged Scope Count ───────────────────────────────────────
  if (scopes.length > 5) {
    findings.push({
      id: "R10",
      severity: "MEDIUM",
      title: `Over-privileged: ${scopes.length} scopes granted`,
      description: `This token has ${scopes.length} scope grants. Tokens with many scopes violate the principle of least privilege and increase blast radius. Each additional scope is an additional attack surface if the token is compromised.`,
      owasp: "A01:2021",
      cwe: "CWE-250",
      cve: null,
      remediation: `// Request minimum necessary scopes\n// Bad: scope: 'read write delete admin users files'\n// Good: scope: 'read:profile'\n\n// Implement incremental authorization — request scopes only when needed`,
      score: 8
    });
  }

  // ─── R11: Missing kid for Asymmetric Algorithms ─────────────────────────────
  if (["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "PS256"].includes(alg) && !header.kid) {
    findings.push({
      id: "R11",
      severity: "MEDIUM",
      title: `No key ID (kid) for ${alg} token`,
      description: "Asymmetric tokens should include a kid header to identify which public key to use for verification. Without kid, key rotation becomes error-prone and servers may accept tokens signed with revoked keys.",
      owasp: "A02:2021",
      cwe: "CWE-320",
      cve: null,
      remediation: `// Include kid in JWT header\n{ "alg": "RS256", "kid": "key-2024-01", "typ": "JWT" }\n\n// Implement key rotation with kid-based lookup\nconst key = await jwks.getKey(header.kid);`,
      score: 8
    });
  }

  // ─── R12: Missing nbf/iat temporal claims ───────────────────────────────────
  if (!payload.iat && !payload.nbf) {
    findings.push({
      id: "R12",
      severity: "LOW",
      title: "Missing temporal claims (iat/nbf)",
      description: "The token has no iat (issued at) or nbf (not before) claim. Without these, you cannot determine when the token was issued or enforce a validity window, making token replay harder to detect.",
      owasp: "A07:2021",
      cwe: "CWE-613",
      cve: null,
      remediation: `// Always include iat and optionally nbf\njwt.sign(payload, secret, {\n  expiresIn: '15m',\n  notBefore: '0s' // valid immediately\n})`,
      score: 2
    });
  }

  return findings;
}

/**
 * Extract scope array from payload (supports multiple formats).
 */
export function extractScopes(payload) {
  const rawScopes = payload.scope || payload.scopes || payload.scp || payload.permissions || [];
  if (Array.isArray(rawScopes)) return rawScopes;
  if (typeof rawScopes === "string") return rawScopes.split(/[\s,]+/).filter(Boolean);
  return [];
}
