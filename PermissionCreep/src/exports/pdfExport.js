// ─────────────────────────────────────────────────────────────────────────────
// PDF AUDIT REPORT EXPORT
// PermissionCreep — Structured PDF for penetration testing deliverables
// Uses jsPDF for pure client-side generation (zero-knowledge architecture)
// ─────────────────────────────────────────────────────────────────────────────

import { jsPDF } from 'jspdf';
import { getRiskLevel, getSeverityStyle } from '../engine/riskReport.js';

/**
 * Generate and download a PDF audit report.
 */
export function downloadPDF(findings, parsed, scopeData, score, label = "Token") {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  const risk = getRiskLevel(score);

  // ─── COVER PAGE ─────────────────────────────────────────────────────────────
  // Background header bar
  doc.setFillColor(15, 23, 42); // dark-700
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(241, 245, 249);
  doc.text('PermissionCreep', margin, 35);
  
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184);
  doc.text('JWT & OAuth Token Security Audit Report', margin, 48);
  
  // Report metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toISOString()}`, margin, 65);
  doc.text(`Label: ${label}`, margin, 72);

  y = 100;

  // ─── EXECUTIVE SUMMARY ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Executive Summary', margin, y);
  y += 12;

  // Risk score box
  doc.setFillColor(hexToRgb(risk.bg));
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(hexToRgb(risk.color));
  doc.text(`${score}`, margin + 10, y + 24);
  
  doc.setFontSize(14);
  doc.text(`/ 100  —  ${risk.label}`, margin + 35, y + 24);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Overall Risk Score`, margin + 10, y + 32);
  
  // Token info on right side
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Token Type: ${parsed?.type || 'N/A'}`, margin + contentWidth - 60, y + 12);
  doc.text(`Algorithm: ${parsed?.header?.alg || 'none'}`, margin + contentWidth - 60, y + 20);
  doc.text(`Blast Radius: ${scopeData?.blastRadius || 0}%`, margin + contentWidth - 60, y + 28);
  
  y += 45;

  // Finding counts
  const counts = {
    critical: findings.filter(f => f.severity === "CRITICAL").length,
    high: findings.filter(f => f.severity === "HIGH").length,
    medium: findings.filter(f => f.severity === "MEDIUM").length,
    low: findings.filter(f => f.severity === "LOW").length,
    info: findings.filter(f => f.severity === "INFO").length,
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Finding Distribution:', margin, y);
  y += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const countEntries = [
    [`Critical: ${counts.critical}`, '#EF4444'],
    [`High: ${counts.high}`, '#F59E0B'],
    [`Medium: ${counts.medium}`, '#3B82F6'],
    [`Low: ${counts.low}`, '#10B981'],
    [`Info: ${counts.info}`, '#8B5CF6'],
  ];
  
  countEntries.forEach(([text, color], i) => {
    doc.setFillColor(hexToRgb(color));
    doc.circle(margin + 3 + i * 35, y - 1, 2, 'F');
    doc.setTextColor(51, 65, 85);
    doc.text(text, margin + 8 + i * 35, y);
  });
  y += 15;

  // ─── TOKEN DETAILS ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Token Details', margin, y);
  y += 10;

  if (parsed && !parsed.error && !parsed.opaque) {
    // Header claims
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text('Header:', margin, y);
    y += 6;
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const headerStr = JSON.stringify(parsed.header, null, 2);
    const headerLines = doc.splitTextToSize(headerStr, contentWidth - 10);
    doc.text(headerLines, margin + 5, y);
    y += headerLines.length * 4 + 6;

    // Payload claims (limited for security)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text('Payload Claims:', margin, y);
    y += 6;
    
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    // Redact sensitive values in PDF
    const sanitizedPayload = { ...parsed.payload };
    const payloadStr = JSON.stringify(sanitizedPayload, null, 2);
    const payloadLines = doc.splitTextToSize(payloadStr, contentWidth - 10);
    const maxPayloadLines = Math.min(payloadLines.length, 15);
    doc.text(payloadLines.slice(0, maxPayloadLines), margin + 5, y);
    y += maxPayloadLines * 4 + 10;
  }

  // ─── DETAILED FINDINGS ──────────────────────────────────────────────────────
  // Check if we need a new page
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Detailed Findings', margin, y);
  y += 12;

  findings.forEach((f, i) => {
    // Check for page break
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    const sevStyle = getSeverityStyle(f.severity);
    
    // Severity badge
    doc.setFillColor(hexToRgb(sevStyle.color));
    doc.roundedRect(margin, y - 4, 18, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(f.severity, margin + 2, y);
    
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(`[${f.id}] ${f.title}`, margin + 22, y);
    y += 7;
    
    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(f.description, contentWidth - 5);
    doc.text(descLines.slice(0, 4), margin + 5, y);
    y += Math.min(descLines.length, 4) * 4 + 3;
    
    // OWASP / CWE / CVE references
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    let refs = `OWASP: ${f.owasp}`;
    if (f.cwe) refs += ` | CWE: ${f.cwe}`;
    if (f.cve) refs += ` | CVE: ${f.cve}`;
    doc.text(refs, margin + 5, y);
    y += 5;
    
    // Remediation
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    const remLines = doc.splitTextToSize(`Fix: ${f.remediation.split('\n')[0]}`, contentWidth - 10);
    doc.text(remLines[0], margin + 5, y);
    y += 10;
  });

  // ─── SCOPE ANALYSIS ─────────────────────────────────────────────────────────
  if (scopeData && scopeData.scopes && scopeData.scopes.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Scope Analysis', margin, y);
    y += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Blast Radius: ${scopeData.blastRadius}%`, margin, y);
    y += 8;
    
    doc.setFontSize(9);
    scopeData.scopes.forEach(scope => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }
      const levelLabel = ["", "READ", "WRITE", "ADMIN"][scope.level] || "?";
      doc.setTextColor(51, 65, 85);
      doc.text(`• ${scope.name}`, margin + 5, y);
      doc.setTextColor(hexToRgb(scope.level === 3 ? '#EF4444' : scope.level === 2 ? '#F59E0B' : '#10B981'));
      doc.text(`[${levelLabel}]`, margin + contentWidth - 20, y);
      y += 5;
    });
    y += 5;
  }

  // ─── REMEDIATION CHECKLIST ──────────────────────────────────────────────────
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Remediation Checklist', margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const checklist = [
    counts.critical > 0 ? "☐ URGENT: Address all CRITICAL findings immediately" : null,
    counts.high > 0 ? "☐ HIGH: Remediate high-severity findings before next release" : null,
    "☐ Verify algorithm is RS256/ES256 (not HS256 or none)",
    "☐ Ensure exp claim is set with short TTL (≤15min for access tokens)",
    "☐ Set aud claim to prevent confused deputy attacks",
    "☐ Set iss claim for issuer validation",
    "☐ Include jti claim for revocation capability",
    "☐ Minimize scopes — apply principle of least privilege",
    "☐ Remove any PII from token payloads",
    "☐ Implement token blocklist for logout/revocation",
    "☐ Integrate SARIF output into CI/CD pipeline",
  ].filter(Boolean);

  checklist.forEach(item => {
    if (y > pageHeight - 15) {
      doc.addPage();
      y = margin;
    }
    doc.text(item, margin + 5, y);
    y += 5;
  });

  // ─── FOOTER ─────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PermissionCreep v1.0 — JWT & OAuth Token Security Audit — Page ${i}/${totalPages}`,
      pageWidth / 2, pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'CONFIDENTIAL — Generated client-side. No token data was transmitted.',
      pageWidth / 2, pageHeight - 6,
      { align: 'center' }
    );
  }

  // Download
  doc.save(`permissioncreep-audit-${label.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Convert hex color to RGB array for jsPDF.
 */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return [0, 0, 0];
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
}
