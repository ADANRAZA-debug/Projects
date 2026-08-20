import React, { useState } from 'react';
import { getRiskLevel, getSeverityStyle, RESOURCE_COLORS } from '../engine';
import RiskGauge from './RiskGauge';
import BlastRadiusChart from './BlastRadiusChart';
import D3PermissionGraph from './D3PermissionGraph';

/**
 * TokenPanel — Main analysis panel showing token input, decoded claims,
 * risk score, findings, blast radius chart, and D3 permission graph.
 */
export default function TokenPanel({ label, token, onChange, parsed, findings, scopeData, score, onClear }) {
  const [expandedFinding, setExpandedFinding] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const risk = getRiskLevel(score);

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Token Input ─────────────────────────────────────────────────────── */}
      <div>
        {label && (
          <div className="flex justify-between items-center mb-2">
            <label className="text-[11px] font-mono text-slate-500 tracking-wider uppercase">
              {label}
            </label>
            {token && (
              <button onClick={onClear}
                className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors">
                CLEAR ×
              </button>
            )}
          </div>
        )}
        <textarea
          value={token}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste JWT, OAuth token, or Authorization header (Bearer ...) here..."
          className="w-full min-h-[96px] bg-dark-700 border border-dark-600 rounded-lg px-3.5 py-3 
                     text-slate-400 text-[11.5px] font-mono resize-y outline-none leading-relaxed
                     focus:border-indigo-500 transition-colors placeholder:text-slate-600"
          spellCheck={false}
        />
      </div>

      {/* ─── Parse Error ─────────────────────────────────────────────────────── */}
      {parsed?.error && (
        <div className="bg-red-950/30 border border-red-900 rounded-lg px-3.5 py-2.5 flex gap-2 items-start">
          <span className="text-red-500 text-sm">⚠</span>
          <div>
            <div className="text-red-400 text-[11px] font-mono font-semibold">Parse Error</div>
            <div className="text-slate-400 text-[11px] mt-0.5">{parsed.error}</div>
          </div>
        </div>
      )}

      {/* ─── Analysis Results (JWT) ──────────────────────────────────────────── */}
      {parsed && !parsed.error && !parsed.opaque && (
        <>
          {/* Risk Score Header */}
          <div className="bg-dark-700 border border-dark-600 rounded-xl p-4 flex items-center gap-4 flex-wrap"
               style={{ borderColor: `${risk.color}20` }}>
            <RiskGauge score={score} />
            <div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">RISK SCORE</div>
              <div className="text-[28px] font-bold font-mono leading-none" style={{ color: risk.color }}>
                {score}<span className="text-[14px] text-slate-500">/100</span>
              </div>
              <div className="text-[10px] font-mono mt-1 tracking-wider" style={{ color: risk.color }}>
                {risk.label}
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] text-slate-500 font-mono mb-0.5">TYPE</div>
              <div className="text-[12px] text-indigo-400 font-mono">{parsed.type}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 mb-0.5">ALGORITHM</div>
              <div className={`text-[12px] font-mono ${parsed.header?.alg === 'none' || !parsed.header?.alg ? 'text-red-400' : 'text-slate-400'}`}>
                {parsed.header?.alg || "none"}
              </div>
            </div>
          </div>

          {/* Decoded Claims */}
          <div className="bg-dark-700 border border-dark-600 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-dark-600 flex gap-4">
              <span className="text-[10px] text-slate-500 font-mono">
                HEADER <span className="text-indigo-400">{Object.keys(parsed.header || {}).length} claims</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                PAYLOAD <span className="text-indigo-400">{Object.keys(parsed.payload || {}).length} claims</span>
              </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto py-1">
              {[
                ...Object.entries(parsed.header || {}).map(([k, v]) => ({ k, v, loc: "header" })),
                ...Object.entries(parsed.payload || {}).map(([k, v]) => ({ k, v, loc: "payload" }))
              ].map(({ k, v, loc }, i) => {
                const isSensitive = ["role", "roles", "admin", "permission", "permissions", "is_admin", "superuser"].includes(k);
                const isTime = ["exp", "iat", "nbf"].includes(k);
                const displayV = isTime && typeof v === 'number'
                  ? `${v} (${new Date(v * 1000).toLocaleString()})`
                  : JSON.stringify(v);

                return (
                  <div key={i} className="flex items-baseline gap-2 px-4 py-1 hover:bg-dark-800/50 transition-colors">
                    <span className="text-[9px] text-slate-600 font-mono w-12 flex-shrink-0">{loc}</span>
                    <span className="text-[11px] text-indigo-400 font-mono w-28 flex-shrink-0">{k}</span>
                    <span className={`text-[11px] font-mono break-all flex-1 ${isSensitive ? 'text-amber-400' : 'text-slate-400'}`}>
                      {displayV}
                    </span>
                    {isSensitive && (
                      <span className="text-[9px] bg-amber-900/30 text-amber-400 px-1.5 py-0.5 rounded flex-shrink-0">
                        sensitive
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blast Radius + D3 Graph */}
          {scopeData.scopes.length > 0 && (
            <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] text-slate-500 font-mono tracking-wider">SCOPE BLAST RADIUS</span>
                <button
                  onClick={() => setShowGraph(!showGraph)}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/30 rounded px-2 py-0.5">
                  {showGraph ? "RADAR VIEW" : "D3 GRAPH VIEW"}
                </button>
              </div>
              
              {!showGraph ? (
                <div className="flex gap-4 items-center flex-wrap">
                  <BlastRadiusChart scopeMap={scopeData.scopeMap} blastRadius={scopeData.blastRadius} size={200} />
                  <div className="flex-1 min-w-[140px]">
                    {scopeData.scopes.map((sc, i) => (
                      <div key={i} className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                             style={{ background: RESOURCE_COLORS[sc.resource] || "#64748B" }} />
                        <span className="text-[10px] text-slate-400 font-mono flex-1 break-all">{sc.name}</span>
                        <span className={`text-[9px] font-mono ${
                          sc.level === 3 ? 'text-red-400' : sc.level === 2 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {["", "READ", "WRITE", "ADMIN"][sc.level]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <D3PermissionGraph nodes={scopeData.nodes} links={scopeData.links} blastRadius={scopeData.blastRadius} />
              )}
            </div>
          )}

          {/* Findings List */}
          {findings.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-2">
                FINDINGS <span className="text-indigo-400">{findings.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {findings.map((f, i) => {
                  const s = getSeverityStyle(f.severity);
                  const isOpen = expandedFinding === i;
                  return (
                    <div key={i} className="border rounded-lg overflow-hidden transition-all"
                         style={{ borderColor: s.border }}>
                      <button
                        onClick={() => setExpandedFinding(isOpen ? null : i)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-dark-700/50 transition-colors"
                        style={{ background: `${s.bg}11` }}>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded flex-shrink-0 tracking-wide"
                              style={{ color: s.color, background: `${s.color}15` }}>
                          {f.severity}
                        </span>
                        <span className="text-[12px] text-slate-300 font-mono flex-1">{f.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono flex-shrink-0">{f.owasp}</span>
                        <span className="text-slate-500 text-[10px]">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-3.5 py-3 bg-dark-900/50 border-t" style={{ borderColor: s.border }}>
                          <p className="text-slate-400 text-[12px] mb-3 leading-relaxed">{f.description}</p>
                          <div className="flex gap-3 mb-3 flex-wrap">
                            {f.owasp && <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">OWASP {f.owasp}</span>}
                            {f.cwe && <span className="text-[9px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{f.cwe}</span>}
                            {f.cve && <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">📎 {f.cve}</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-1.5">REMEDIATION</div>
                          <pre className="bg-dark-700 border border-dark-600 rounded-md px-3 py-2.5 text-[11px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                            {f.remediation}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No findings */}
          {findings.length === 0 && (
            <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl p-5 text-center">
              <div className="text-xl mb-1.5">✓</div>
              <div className="text-emerald-400 font-mono text-[13px] font-semibold">No security issues detected</div>
              <div className="text-emerald-300/70 text-[11px] mt-1">This token passes all security checks</div>
            </div>
          )}
        </>
      )}

      {/* Opaque Token */}
      {parsed?.opaque && (
        <div className="bg-dark-700 border border-dark-600 rounded-xl p-4">
          <div className="text-amber-400 font-mono text-[12px] mb-2 font-semibold">Opaque Token Detected</div>
          <div className="text-slate-500 text-[12px]">
            Type: <span className="text-slate-300">{parsed.type}</span>
            {parsed.provider && <> • Provider: <span className="text-slate-300">{parsed.provider}</span></>}
          </div>
          <div className="text-slate-500 text-[12px] mt-2 leading-relaxed">
            Opaque tokens cannot be decoded client-side. Use RFC 7662 token introspection against your authorization server for analysis.
          </div>
        </div>
      )}
    </div>
  );
}
