// ─────────────────────────────────────────────────────────────────────────────
// SARIF 2.1.0 EXPORT
// PermissionCreep — Static Analysis Results Interchange Format
// Compatible with: GitHub Code Scanning, Azure DevOps, SonarQube
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a SARIF 2.1.0 compliant report from findings.
 * @param {Array} findings - Rule engine findings
 * @param {Object} parsed - Parsed token object
 * @param {Object} scopeData - Scope analysis results
 * @param {number} score - Risk score
 * @returns {Object} SARIF 2.1.0 JSON object
 */
export function generateSARIF(findings, parsed, scopeData, score) {
  const sarifReport = {
    "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "PermissionCreep",
            version: "1.0.0",
            semanticVersion: "1.0.0",
            informationUri: "https://github.com/permissioncreep/permissioncreep",
            rules: generateRuleDescriptors(findings),
            properties: {
              tags: ["security", "jwt", "oauth", "token-analysis"]
            }
          }
        },
        results: generateResults(findings, parsed),
        invocations: [
          {
            executionSuccessful: true,
            endTimeUtc: new Date().toISOString(),
            properties: {
              tokenType: parsed?.type || "unknown",
              algorithm: parsed?.header?.alg || "none",
              riskScore: score,
              blastRadius: scopeData?.blastRadius || 0,
            }
          }
        ],
        properties: {
          overallRiskScore: score,
          blastRadius: scopeData?.blastRadius || 0,
          scopeCount: scopeData?.scopes?.length || 0,
        }
      }
    ]
  };

  return sarifReport;
}

/**
 * Generate SARIF rule descriptors from findings.
 */
function generateRuleDescriptors(findings) {
  const ruleMap = new Map();
  
  findings.forEach(f => {
    if (!ruleMap.has(f.id)) {
      ruleMap.set(f.id, {
        id: f.id,
        name: f.title.replace(/[^a-zA-Z0-9]/g, ""),
        shortDescription: { text: f.title },
        fullDescription: { text: f.description },
        helpUri: f.cve ? `https://cve.mitre.org/cgi-bin/cvename.cgi?name=${f.cve}` : `https://owasp.org/Top10/${f.owasp}/`,
        help: {
          text: f.remediation,
          markdown: `## Remediation\n\n\`\`\`javascript\n${f.remediation}\n\`\`\``
        },
        properties: {
          tags: [
            "security",
            f.owasp,
            f.cwe || "",
            f.cve || "",
          ].filter(Boolean),
          "security-severity": severityToScore(f.severity),
        },
        defaultConfiguration: {
          level: severityToSarifLevel(f.severity)
        }
      });
    }
  });

  return Array.from(ruleMap.values());
}

/**
 * Generate SARIF results from findings.
 */
function generateResults(findings, parsed) {
  return findings.map((f, index) => ({
    ruleId: f.id,
    ruleIndex: index,
    level: severityToSarifLevel(f.severity),
    message: {
      text: f.description,
      markdown: `**${f.title}**\n\n${f.description}\n\n**OWASP:** ${f.owasp}${f.cwe ? ` | **CWE:** ${f.cwe}` : ""}${f.cve ? ` | **CVE:** ${f.cve}` : ""}`
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: "token-input",
            uriBaseId: "CLIENTSIDE"
          },
          region: {
            startLine: 1,
            startColumn: 1
          }
        },
        logicalLocations: [
          {
            name: getLocationForRule(f, parsed),
            kind: "token-claim"
          }
        ]
      }
    ],
    properties: {
      severity: f.severity,
      owasp: f.owasp,
      cwe: f.cwe || null,
      cve: f.cve || null,
      score: f.score,
    },
    fixes: [
      {
        description: { text: f.remediation },
        artifactChanges: []
      }
    ]
  }));
}

/**
 * Map a finding to its logical location in the token.
 */
function getLocationForRule(finding, parsed) {
  const ruleLocations = {
    R01: "header.alg",
    R02: "payload.exp",
    R03: "payload.scope",
    R04: "payload.aud",
    R05: "payload.iss",
    R06: "payload.role",
    R07: "signature",
    R08: "payload",
    R09: "payload.jti",
    R10: "payload.scope",
    R11: "header.kid",
    R12: "payload.iat",
  };
  return ruleLocations[finding.id] || "token";
}

/**
 * Convert severity to SARIF level.
 */
function severityToSarifLevel(severity) {
  const map = {
    CRITICAL: "error",
    HIGH: "error",
    MEDIUM: "warning",
    LOW: "note",
    INFO: "note",
  };
  return map[severity] || "note";
}

/**
 * Convert severity to numeric security-severity score (for GitHub).
 */
function severityToScore(severity) {
  const map = {
    CRITICAL: "9.5",
    HIGH: "7.5",
    MEDIUM: "5.0",
    LOW: "3.0",
    INFO: "1.0",
  };
  return map[severity] || "1.0";
}

/**
 * Download SARIF report as a JSON file.
 */
export function downloadSARIF(findings, parsed, scopeData, score) {
  const sarif = generateSARIF(findings, parsed, scopeData, score);
  const blob = new Blob([JSON.stringify(sarif, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `permissioncreep-${new Date().toISOString().slice(0, 10)}.sarif`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
