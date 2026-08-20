// ─────────────────────────────────────────────────────────────────────────────
// JSON REPORT EXPORT
// PermissionCreep — Machine-readable JSON report
// ─────────────────────────────────────────────────────────────────────────────

import { getRiskLevel } from '../engine/riskReport.js';

/**
 * Generate and download a JSON analysis report.
 */
export function downloadJSON(findings, parsed, scopeData, score, label = "Token") {
  const report = {
    tool: "PermissionCreep v1.0",
    timestamp: new Date().toISOString(),
    label,
    tokenType: parsed?.type || "unknown",
    algorithm: parsed?.header?.alg || "none",
    riskScore: score,
    riskLevel: getRiskLevel(score).label,
    header: parsed?.header || null,
    payload: parsed?.payload || null,
    findings: findings.map(f => ({
      id: f.id,
      severity: f.severity,
      title: f.title,
      description: f.description,
      owasp: f.owasp,
      cwe: f.cwe || null,
      cve: f.cve || null,
      remediation: f.remediation,
      score: f.score,
    })),
    scopeAnalysis: {
      blastRadius: scopeData?.blastRadius || 0,
      scopeMap: scopeData?.scopeMap || {},
      scopes: scopeData?.scopes || [],
    },
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `permissioncreep-report-${label.toLowerCase()}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
