import React, { useState } from 'react';
import {
  parseToken,
  runRuleEngine,
  analyzeScopes,
  computeRiskScore,
  getRiskLevel,
  SAMPLE_TOKENS,
} from './engine';
import TokenPanel from './components/TokenPanel';
import CompareView from './components/CompareView';
import AttackWorkbench from './components/AttackWorkbench';
import { downloadSARIF } from './exports/sarifExport';
import { downloadPDF } from './exports/pdfExport';
import { downloadJSON } from './exports/jsonExport';

/**
 * PermissionCreep — Advanced JWT & OAuth Token Security Analyser
 * Main Application Component
 * 
 * Zero-knowledge architecture: All processing happens client-side.
 * No token data ever leaves the browser.
 */
export default function App() {
  const [mode, setMode] = useState("single"); // "single" | "compare" | "attack"
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");

  // Compute analysis for both tokens
  const parsedA = tokenA.trim() ? parseToken(tokenA) : null;
  const parsedB = tokenB.trim() ? parseToken(tokenB) : null;
  const findingsA = parsedA && !parsedA.error ? runRuleEngine(parsedA) : [];
  const findingsB = parsedB && !parsedB.error ? runRuleEngine(parsedB) : [];
  const scopeA = analyzeScopes(parsedA);
  const scopeB = analyzeScopes(parsedB);
  const scoreA = computeRiskScore(findingsA);
  const scoreB = computeRiskScore(findingsB);

  // Compare mode diff
  const comparison = mode === "compare" && parsedA && parsedB && !parsedA.error && !parsedB.error
    ? computeComparison(parsedA, parsedB, findingsA, findingsB, scoreA, scoreB)
    : null;

  return (
    <div className="min-h-screen bg-dark-900 text-slate-300 font-mono relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none"
           style={{ backgroundImage: "linear-gradient(#1E293B18 1px, transparent 1px), linear-gradient(90deg, #1E293B18 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="fixed -top-48 left-[20%] w-[600px] h-[600px] pointer-events-none z-0"
           style={{ background: "radial-gradient(circle, #4F46E520 0%, transparent 70%)" }} />
      <div className="fixed -bottom-48 right-[10%] w-[500px] h-[500px] pointer-events-none z-0"
           style={{ background: "radial-gradient(circle, #7C3AED18 0%, transparent 70%)" }} />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {/* ─── HEADER ────────────────────────────────────────────────────────── */}
        <header className="py-6 sm:py-8 border-b border-dark-600 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                🔐
              </div>
              <div>
                <div className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">PermissionCreep</div>
                <div className="text-[10px] text-slate-500 tracking-wider">JWT & OAUTH TOKEN SECURITY ANALYSER</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2.5 py-1 rounded-full tracking-wide">
                ● ZERO-KNOWLEDGE — NO DATA LEAVES BROWSER
              </span>
              <div className="flex gap-1 bg-dark-700 border border-dark-600 p-1 rounded-lg">
                <button
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-[11px] font-mono tracking-wide transition-all
                    ${mode === "single" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  onClick={() => setMode("single")}>
                  ANALYSE
                </button>
                <button
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-[11px] font-mono tracking-wide transition-all
                    ${mode === "attack" ? "bg-red-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  onClick={() => setMode("attack")}>
                  ⚔️ ATTACK
                </button>
                <button
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-[11px] font-mono tracking-wide transition-all
                    ${mode === "compare" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  onClick={() => setMode("compare")}>
                  COMPARE
                </button>
              </div>
            </div>
          </div>

          {/* Pipeline Steps */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ["L1", "DECODE", "Parse & normalize"],
              ["L2", "RULE ENGINE", "12 OWASP checks"],
              ["L3", "SCOPE ANALYSIS", "Blast radius map"],
              ["L4", "RISK REPORT", "SARIF + PDF export"],
            ].map(([num, title, sub], i) => (
              <div key={i} className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-indigo-400 font-bold">{num}</span>
                  <span className="text-[10px] sm:text-[11px] text-slate-300 font-semibold">{title}</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-600 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ─── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div className={`grid gap-6 ${mode === "compare" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Attack mode banner */}
          {mode === "attack" && (
            <div className="col-span-full bg-red-950/20 border border-red-900/40 rounded-xl p-3 flex items-center gap-3">
              <span className="text-lg">⚔️</span>
              <div>
                <div className="text-[11px] font-mono text-red-400 font-bold">ATTACK MODE — Offensive Security Toolkit</div>
                <div className="text-[10px] text-slate-500">Paste a target token above, then use the attack tools below to generate exploits</div>
              </div>
            </div>
          )}
          {/* Panel A */}
          <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4 sm:p-6">
            {mode === "compare" && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] text-indigo-400 font-bold tracking-wider">DEVELOPMENT TOKEN</span>
                {parsedA && !parsedA.error && (
                  <ExportButtons findings={findingsA} parsed={parsedA} scopeData={scopeA} score={scoreA} label="DEV" />
                )}
              </div>
            )}
            <TokenPanel
              label={mode === "single" ? "PASTE TOKEN" : mode === "attack" ? "TARGET TOKEN" : ""}
              token={tokenA} onChange={setTokenA}
              parsed={parsedA} findings={findingsA} scopeData={scopeA} score={scoreA}
              onClear={() => setTokenA("")}
            />
            {mode === "single" && parsedA && !parsedA.error && !parsedA.opaque && (
              <div className="mt-4 flex justify-end">
                <ExportButtons findings={findingsA} parsed={parsedA} scopeData={scopeA} score={scoreA} label="Token" />
              </div>
            )}
          </div>

          {/* Panel B (Compare mode) */}
          {mode === "compare" && (
            <div className="bg-dark-800 border border-dark-600 rounded-2xl p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] text-emerald-400 font-bold tracking-wider">PRODUCTION TOKEN</span>
                {parsedB && !parsedB.error && (
                  <ExportButtons findings={findingsB} parsed={parsedB} scopeData={scopeB} score={scoreB} label="PROD" />
                )}
              </div>
              <TokenPanel
                label=""
                token={tokenB} onChange={setTokenB}
                parsed={parsedB} findings={findingsB} scopeData={scopeB} score={scoreB}
                onClear={() => setTokenB("")}
              />
            </div>
          )}
        </div>

        {/* ─── ATTACK WORKBENCH ────────────────────────────────────────────── */}
        {mode === "attack" && parsedA && !parsedA.error && (
          <AttackWorkbench parsed={parsedA} token={tokenA.trim()} />
        )}

        {/* ─── COMPARE DELTA VIEW ────────────────────────────────────────────── */}
        {mode === "compare" && comparison && (
          <CompareView comparison={comparison} scoreA={scoreA} scoreB={scoreB} />
        )}

        {/* ─── EMPTY STATE ───────────────────────────────────────────────────── */}
        {!tokenA.trim() && (
          <div className="mt-8 text-center py-10 sm:py-16">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-[14px] text-slate-500 mb-2">
              Paste a JWT, OAuth access token, or API key above to begin analysis
            </div>
            <div className="text-[11px] text-slate-600 mb-8">
              All analysis happens in your browser. Zero network requests. Zero data exposure.
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                ["⚠ alg:none (Critical)", SAMPLE_TOKENS.algNone],
                ["🔑 Weak HS256 (jwt.io)", SAMPLE_TOKENS.weakHS256],
                ["👑 Over-privileged", SAMPLE_TOKENS.overprivileged],
                ["✓ Well-configured", SAMPLE_TOKENS.secure],
              ].map(([label, val]) => (
                <button key={label} onClick={() => setTokenA(val)}
                  className="bg-dark-700 border border-dark-600 rounded-lg text-indigo-400 text-[11px] font-mono 
                             px-4 py-2 hover:border-indigo-500 hover:bg-dark-700/80 transition-all">
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── PRIVACY FOOTER ────────────────────────────────────────────────── */}
        <div className="mt-8 px-5 py-3.5 bg-dark-800/50 border border-dark-600 rounded-xl flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <div className="text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Privacy guarantee:</strong> PermissionCreep is fully stateless. Token data is parsed entirely in your browser using JavaScript. No tokens, payloads, or findings are transmitted to any server. Safe to use with real production tokens.
          </div>
        </div>

        {/* Credits */}
        <div className="mt-4 text-center">
          <div className="text-[10px] text-slate-600 font-mono">
            PermissionCreep v1.0 — Built by Adan Raza Masoom • Air University, Islamabad • Dept. of Cyber Security
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Export Buttons — SARIF, PDF, and JSON download buttons.
 */
function ExportButtons({ findings, parsed, scopeData, score, label }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => downloadSARIF(findings, parsed, scopeData, score)}
        className="text-[9px] font-mono text-slate-400 border border-dark-600 rounded px-2 py-1 
                   hover:border-indigo-500 hover:text-indigo-400 transition-all"
        title="SARIF 2.1.0 for CI/CD (GitHub, Azure DevOps, SonarQube)">
        ↓ SARIF
      </button>
      <button
        onClick={() => downloadPDF(findings, parsed, scopeData, score, label)}
        className="text-[9px] font-mono text-slate-400 border border-dark-600 rounded px-2 py-1 
                   hover:border-red-500 hover:text-red-400 transition-all"
        title="PDF Audit Report for penetration testing deliverables">
        ↓ PDF
      </button>
      <button
        onClick={() => downloadJSON(findings, parsed, scopeData, score, label)}
        className="text-[9px] font-mono text-slate-400 border border-dark-600 rounded px-2 py-1 
                   hover:border-emerald-500 hover:text-emerald-400 transition-all"
        title="Machine-readable JSON report">
        ↓ JSON
      </button>
    </div>
  );
}

/**
 * Compute comparison between two parsed tokens.
 */
function computeComparison(parsedA, parsedB, findingsA, findingsB, scoreA, scoreB) {
  const pA = parsedA.payload, pB = parsedB.payload;
  const hA = parsedA.header || {}, hB = parsedB.header || {};
  const allKeys = new Set([...Object.keys(pA), ...Object.keys(pB)]);
  const allHdrKeys = new Set([...Object.keys(hA), ...Object.keys(hB)]);
  const diffs = [];

  allHdrKeys.forEach(k => {
    const vA = hA[k], vB = hB[k];
    if (JSON.stringify(vA) !== JSON.stringify(vB)) {
      diffs.push({ key: k, location: "header", valA: vA, valB: vB, isSecurityRelevant: ["alg", "kid", "enc"].includes(k) });
    }
  });

  allKeys.forEach(k => {
    const vA = pA[k], vB = pB[k];
    if (JSON.stringify(vA) !== JSON.stringify(vB)) {
      const isSec = ["exp", "aud", "iss", "scope", "scopes", "scp", "role", "roles", "admin", "permission", "permissions", "nbf", "iat"].includes(k);
      diffs.push({ key: k, location: "payload", valA: vA, valB: vB, isSecurityRelevant: isSec });
    }
  });

  return { diffs, scoreDelta: scoreB - scoreA, scoreA, scoreB };
}
