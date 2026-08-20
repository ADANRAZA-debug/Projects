// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1: INPUT & DECODE
// PermissionCreep — Client-side JWT/OAuth token parser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Decode a base64url-encoded string to a JSON object.
 * Handles URL-safe alphabet and padding normalization.
 */
export function base64urlDecode(str) {
  try {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const decoded = atob(str);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Decode base64url to raw string (for non-JSON segments)
 */
export function base64urlDecodeRaw(str) {
  try {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return atob(str);
  } catch {
    return null;
  }
}

/**
 * Detect the type of token from its raw string format.
 * Supports: JWT, OAuth opaque tokens, API keys, and unknown tokens.
 */
export function detectTokenType(raw) {
  const trimmed = raw.trim();
  
  // Strip Bearer prefix if present
  const token = trimmed.startsWith("Bearer ") ? trimmed.slice(7) : trimmed;
  
  const parts = token.split(".");
  if (parts.length === 3) return { type: "JWT", token };
  if (parts.length === 5) return { type: "JWE", token }; // JSON Web Encryption
  
  // OAuth opaque tokens by prefix
  if (token.startsWith("ya29.")) return { type: "OAUTH_OPAQUE", token, provider: "Google" };
  if (token.startsWith("gho_") || token.startsWith("ghp_") || token.startsWith("ghs_")) return { type: "OAUTH_OPAQUE", token, provider: "GitHub" };
  if (token.startsWith("sk-")) return { type: "API_KEY", token, provider: "OpenAI/Stripe" };
  if (token.startsWith("pk-")) return { type: "API_KEY", token, provider: "Stripe" };
  if (token.startsWith("xoxb-") || token.startsWith("xoxp-")) return { type: "OAUTH_OPAQUE", token, provider: "Slack" };
  if (token.startsWith("AKIA")) return { type: "API_KEY", token, provider: "AWS" };
  
  // Generic token detection
  if (token.length > 20 && /^[A-Za-z0-9_\-\.]+$/.test(token)) return { type: "UNKNOWN_TOKEN", token };
  
  return { type: "INVALID", token };
}

/**
 * Parse a raw token string into a structured TokenObject IR.
 * This is the primary entry point for Layer 1.
 */
export function parseToken(raw) {
  if (!raw || !raw.trim()) {
    return { error: "No token provided", type: null };
  }
  
  const detection = detectTokenType(raw);
  const { type, token } = detection;
  
  if (type === "INVALID") {
    return { error: "Invalid token format — could not be parsed as any known token type", type };
  }
  
  if (type !== "JWT") {
    return {
      type,
      raw: token,
      header: null,
      payload: null,
      signature: null,
      opaque: true,
      provider: detection.provider || null,
    };
  }
  
  const parts = token.split(".");
  const header = base64urlDecode(parts[0]);
  const payload = base64urlDecode(parts[1]);
  
  if (!header) {
    return { error: "Malformed JWT — header is not valid base64url JSON", type };
  }
  if (!payload) {
    return { error: "Malformed JWT — payload is not valid base64url JSON", type };
  }
  
  return {
    type,
    raw: token,
    header,
    payload,
    signature: parts[2] || "",
    parts,
    opaque: false,
  };
}
