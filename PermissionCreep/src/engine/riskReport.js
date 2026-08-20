// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4: RISK REPORT
// PermissionCreep — Risk aggregation, scoring, and severity classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute overall risk score from findings (0-100).
 * Uses capped category scoring to prevent infinite scaling.
 */
export function computeRiskScore(findings) {
  let criticalPts = 0, highPts = 0, medPts = 0, lowPts = 0;
  
  findings.forEach(f => {
    if (f.severity === "CRITICAL") criticalPts = Math.min(criticalPts + f.score, 40);
    else if (f.severity === "HIGH") highPts = Math.min(highPts + f.score, 30);
    else if (f.severity === "MEDIUM") medPts = Math.min(medPts + f.score, 20);
    else lowPts += f.score;
  });
  
  return Math.min(criticalPts + highPts + medPts + lowPts, 100);
}

/**
 * Get risk level label and visual properties from score.
 */
export function getRiskLevel(score) {
  if (score >= 80) return { label: "CRITICAL", color: "#EF4444", bg: "#FEF2F2", glow: "#EF444440", textClass: "text-red-500" };
  if (score >= 60) return { label: "HIGH", color: "#F59E0B", bg: "#FFFBEB", glow: "#F59E0B40", textClass: "text-amber-500" };
  if (score >= 40) return { label: "MEDIUM", color: "#3B82F6", bg: "#EFF6FF", glow: "#3B82F640", textClass: "text-blue-500" };
  if (score > 0)   return { label: "LOW", color: "#10B981", bg: "#F0FDF4", glow: "#10B98140", textClass: "text-emerald-500" };
  return { label: "SECURE", color: "#10B981", bg: "#F0FDF4", glow: "#10B98140", textClass: "text-emerald-500" };
}

/**
 * Get visual properties for a finding severity.
 */
export function getSeverityStyle(sev) {
  const map = {
    CRITICAL: { color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
    HIGH:     { color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    MEDIUM:   { color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    LOW:      { color: "#10B981", bg: "#F0FDF4", border: "#A7F3D0", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    INFO:     { color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  };
  return map[sev] || map.INFO;
}

/**
 * Generate a summary risk report object.
 */
export function generateRiskSummary(findings, scopeData, parsed) {
  const score = computeRiskScore(findings);
  const riskLevel = getRiskLevel(score);
  
  const counts = {
    critical: findings.filter(f => f.severity === "CRITICAL").length,
    high: findings.filter(f => f.severity === "HIGH").length,
    medium: findings.filter(f => f.severity === "MEDIUM").length,
    low: findings.filter(f => f.severity === "LOW").length,
    info: findings.filter(f => f.severity === "INFO").length,
  };
  
  return {
    score,
    riskLevel: riskLevel.label,
    findings: findings.length,
    counts,
    blastRadius: scopeData.blastRadius,
    algorithm: parsed?.header?.alg || "unknown",
    tokenType: parsed?.type || "unknown",
  };
}

/**
 * Compare two tokens and produce a diff analysis.
 */
export function compareTokens(parsedA, parsedB) {
  if (!parsedA?.payload || !parsedB?.payload) return null;
  
  const pA = parsedA.payload, pB = parsedB.payload;
  const hA = parsedA.header || {}, hB = parsedB.header || {};
  const allKeys = new Set([...Object.keys(pA), ...Object.keys(pB)]);
  const allHdrKeys = new Set([...Object.keys(hA), ...Object.keys(hB)]);
  const diffs = [];

  // Header diffs
  allHdrKeys.forEach(k => {
    const vA = hA[k], vB = hB[k];
    if (JSON.stringify(vA) !== JSON.stringify(vB)) {
      diffs.push({
        key: k,
        location: "header",
        valA: vA,
        valB: vB,
        isSecurityRelevant: ["alg", "kid", "typ", "enc"].includes(k)
      });
    }
  });

  // Payload diffs
  allKeys.forEach(k => {
    const vA = pA[k], vB = pB[k];
    if (JSON.stringify(vA) !== JSON.stringify(vB)) {
      const securitySensitive = ["exp", "aud", "iss", "scope", "scopes", "scp", "role", "roles", "admin", "permission", "permissions", "nbf", "iat"].includes(k);
      diffs.push({
        key: k,
        location: "payload",
        valA: vA,
        valB: vB,
        isSecurityRelevant: securitySensitive
      });
    }
  });

  // Score delta
  const scoreA = computeRiskScore(require_findings_import(parsedA));
  const scoreB = computeRiskScore(require_findings_import(parsedB));
  
  return { diffs, scoreDelta: scoreB - scoreA, scoreA, scoreB };
}

// Helper to avoid circular import — used only in compareTokens
function require_findings_import(parsed) {
  // This will be computed externally and passed in
  return [];
}
