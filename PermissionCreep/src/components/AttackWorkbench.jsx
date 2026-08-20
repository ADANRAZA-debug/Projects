import React, { useState, useCallback } from 'react';
import {
  bruteForceSecret,
  generateAlgConfusionPayload,
  generateAlgNonePayload,
  forgeToken,
  generateJWKSSpoofPayload,
  generateClaimInjections,
  matchCVEs,
  generateIntruderPayloads,
  massAnalyze,
  analyzeOAuthSecurity,
} from '../engine/attacks.js';

/**
 * AttackWorkbench — Offensive security toolkit for JWT/OAuth exploitation.
 * Real tools for bug bounty hunters and penetration testers.
 */
export default function AttackWorkbench({ parsed, token }) {
  const [activeAttack, setActiveAttack] = useState(null);
  const [bruteResult, setBruteResult] = useState(null);
  const [bruteRunning, setBruteRunning] = useState(false);
  const [forgeSecret, setForgeSecret] = useState("");
  const [forgeMods, setForgeMods] = useState("{}");
  const [forgeResult, setForgeResult] = useState(null);
  const [massInput, setMassInput] = useState("");
  const [massResult, setMassResult] = useState(null);
  const [jwksUrl, setJwksUrl] = useState("https://attacker.com/.well-known/jwks.json");
  const [copiedItem, setCopiedItem] = useState(null);

  const copyToClipboard = useCallback((text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    });
  }, []);

  // Run brute force attack
  const runBruteForce = async () => {
    if (!token) return;
    setBruteRunning(true);
    setBruteResult(null);
    const result = await bruteForceSecret(token);
    setBruteResult(result);
    setBruteRunning(false);
  };

  // Run token forgery
  const runForge = async () => {
    if (!token || !forgeSecret) return;
    try {
      const mods = JSON.parse(forgeMods);
      const result = await forgeToken(token, mods, forgeSecret);
      setForgeResult(result);
    } catch (e) {
      setForgeResult({ success: false, error: `JSON parse error: ${e.message}` });
    }
  };

  // Run mass analysis
  const runMassAnalysis = () => {
    const tokens = massInput.split('\n').filter(t => t.trim().length > 10);
    setMassResult(massAnalyze(tokens));
  };

  const attacks = [
    { id: "brute", icon: "🔓", label: "SECRET BRUTE-FORCE", desc: "Crack HMAC secret", color: "red" },
    { id: "confusion", icon: "🔀", label: "ALG CONFUSION", desc: "RS256→HS256 attack", color: "red" },
    { id: "none", icon: "⚡", label: "ALG:NONE BYPASS", desc: "Remove signature", color: "red" },
    { id: "forge", icon: "🛠️", label: "TOKEN FORGERY", desc: "Modify & re-sign", color: "amber" },
    { id: "jwks", icon: "🌐", label: "JWKS SPOOFING", desc: "Fake key server", color: "amber" },
    { id: "inject", icon: "💉", label: "CLAIM INJECTION", desc: "Privesc payloads", color: "purple" },
    { id: "cve", icon: "🐛", label: "CVE MATCHER", desc: "Known exploits", color: "blue" },
    { id: "intruder", icon: "🎯", label: "INTRUDER PAYLOADS", desc: "Burp/ZAP export", color: "blue" },
    { id: "oauth", icon: "🔑", label: "OAUTH ATTACKS", desc: "Flow exploitation", color: "purple" },
    { id: "mass", icon: "📦", label: "MASS ANALYSER", desc: "Bulk token scan", color: "emerald" },
  ];

  const algConfusion = activeAttack === "confusion" && parsed ? generateAlgConfusionPayload(token) : null;
  const algNone = activeAttack === "none" && parsed ? generateAlgNonePayload(token) : null;
  const jwksSpoof = activeAttack === "jwks" ? generateJWKSSpoofPayload(parsed?.payload, jwksUrl) : null;
  const injections = activeAttack === "inject" && parsed?.payload ? generateClaimInjections(parsed.payload) : [];
  const cves = activeAttack === "cve" && parsed ? matchCVEs(parsed) : [];
  const intruderPayloads = activeAttack === "intruder" && parsed ? generateIntruderPayloads(parsed) : [];
  const oauthChecks = activeAttack === "oauth" && parsed ? analyzeOAuthSecurity(parsed) : [];

  return (
    <div className="mt-6">
      {/* Attack Grid */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-mono text-red-500 tracking-wider font-bold">⚔️ ATTACK WORKBENCH</span>
        <span className="text-[9px] font-mono text-slate-600">Real exploit generation for pentesting & bug bounty</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {attacks.map(atk => (
          <button
            key={atk.id}
            onClick={() => setActiveAttack(activeAttack === atk.id ? null : atk.id)}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              activeAttack === atk.id 
                ? `border-${atk.color}-500 bg-${atk.color}-500/10` 
                : 'border-dark-600 bg-dark-700 hover:border-slate-500'
            }`}>
            <div className="text-sm">{atk.icon}</div>
            <div className="text-[9px] font-mono font-bold text-slate-300 mt-1">{atk.label}</div>
            <div className="text-[8px] font-mono text-slate-500">{atk.desc}</div>
          </button>
        ))}
      </div>

      {/* Attack Panels */}
      {activeAttack && (
        <div className="bg-dark-800 border border-red-900/30 rounded-xl p-4 sm:p-5">
          
          {/* ═══ BRUTE FORCE ═══ */}
          {activeAttack === "brute" && (
            <div>
              <h3 className="text-sm font-mono font-bold text-red-400 mb-2">🔓 JWT Secret Brute-Force</h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Tests {100}+ known weak secrets against the HMAC signature using Web Crypto API. 
                If cracked, you can forge any token.
              </p>
              <button
                onClick={runBruteForce}
                disabled={bruteRunning || !token}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white text-[11px] font-mono rounded-lg transition-all mb-4">
                {bruteRunning ? "⏳ CRACKING..." : "🔓 START BRUTE-FORCE"}
              </button>
              {bruteResult && (
                <div className={`p-4 rounded-lg border ${bruteResult.success ? 'bg-red-950/50 border-red-600' : 'bg-dark-700 border-dark-600'}`}>
                  {bruteResult.success ? (
                    <>
                      <div className="text-red-400 font-mono text-sm font-bold mb-2">🎉 SECRET CRACKED!</div>
                      <div className="bg-dark-900 rounded p-3 mb-2">
                        <span className="text-[10px] text-slate-500 font-mono">Secret: </span>
                        <span className="text-emerald-400 font-mono text-sm font-bold">{bruteResult.crackedSecret}</span>
                        <button onClick={() => copyToClipboard(bruteResult.crackedSecret, 'secret')} 
                          className="ml-2 text-[9px] text-indigo-400 hover:text-indigo-300">
                          {copiedItem === 'secret' ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Tested: {bruteResult.testedCount} secrets • Time: {bruteResult.timeMs}ms
                      </div>
                      <div className="mt-3 text-[11px] text-amber-400 font-mono">
                        ⚠ You can now forge ANY token using the Token Forgery tool →
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-slate-400 font-mono text-sm mb-1">Secret not in wordlist</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Tested: {bruteResult.testedCount} secrets • Time: {bruteResult.timeMs}ms
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono mt-2">
                        Try: hashcat -a 0 -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ ALG CONFUSION ═══ */}
          {activeAttack === "confusion" && algConfusion && (
            <div>
              <h3 className="text-sm font-mono font-bold text-red-400 mb-2">🔀 Algorithm Confusion Attack</h3>
              <div className="text-[10px] text-red-300 font-mono mb-3 bg-red-950/30 p-2 rounded">
                CVE-2015-9235 — Switch RS256→HS256, use public key as HMAC secret
              </div>
              <div className="space-y-3">
                {algConfusion.exploitSteps?.map((step, i) => (
                  <div key={i} className="text-[11px] text-slate-400 font-mono">{step}</div>
                ))}
              </div>
              <CodeBlock code={algConfusion.exploitCode} id="algconf" onCopy={copyToClipboard} copied={copiedItem} />
              <CodeBlock code={algConfusion.curlCommand} id="algcurl" onCopy={copyToClipboard} copied={copiedItem} label="cURL Command" />
            </div>
          )}

          {/* ═══ ALG:NONE ═══ */}
          {activeAttack === "none" && algNone && (
            <div>
              <h3 className="text-sm font-mono font-bold text-red-400 mb-2">⚡ alg:none Signature Bypass</h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Generated {algNone.variants?.length} unsigned token variants. Try each against the target.
              </p>
              <div className="space-y-2">
                {algNone.variants?.map((v, i) => (
                  <div key={i} className="bg-dark-900 rounded-lg p-3 border border-dark-600">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-indigo-400 font-mono">alg: "{v.header.alg}"</span>
                      <button onClick={() => copyToClipboard(v.token, `none-${i}`)} 
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-mono">
                        {copiedItem === `none-${i}` ? '✓ Copied!' : '📋 Copy Token'}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono break-all">{v.token}</div>
                  </div>
                ))}
              </div>
              <CodeBlock code={algNone.exploitCode} id="algnone" onCopy={copyToClipboard} copied={copiedItem} />
            </div>
          )}

          {/* ═══ TOKEN FORGERY ═══ */}
          {activeAttack === "forge" && (
            <div>
              <h3 className="text-sm font-mono font-bold text-amber-400 mb-2">🛠️ Token Forgery Workbench</h3>
              <p className="text-[11px] text-slate-400 mb-4">
                Modify claims and re-sign with a known secret. Use after cracking the secret or for alg:none tokens.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 tracking-wider">SIGNING SECRET</label>
                  <input
                    type="text"
                    value={forgeSecret}
                    onChange={e => setForgeSecret(e.target.value)}
                    placeholder="Cracked or known secret..."
                    className="w-full mt-1 bg-dark-900 border border-dark-600 rounded px-3 py-2 text-[11px] font-mono text-slate-300 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-slate-500 tracking-wider">CLAIM MODIFICATIONS (JSON)</label>
                  <input
                    type="text"
                    value={forgeMods}
                    onChange={e => setForgeMods(e.target.value)}
                    placeholder='{"role":"admin","sub":"admin"}'
                    className="w-full mt-1 bg-dark-900 border border-dark-600 rounded px-3 py-2 text-[11px] font-mono text-slate-300 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <button
                onClick={runForge}
                disabled={!token || !forgeSecret}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 text-white text-[11px] font-mono rounded-lg transition-all mb-4">
                🛠️ FORGE TOKEN
              </button>
              {forgeResult && (
                <div className={`p-4 rounded-lg border ${forgeResult.success ? 'bg-amber-950/30 border-amber-600' : 'bg-red-950/30 border-red-600'}`}>
                  {forgeResult.success ? (
                    <>
                      <div className="text-amber-400 font-mono text-sm font-bold mb-2">✓ TOKEN FORGED</div>
                      <div className="bg-dark-900 rounded p-3 mb-2">
                        <div className="text-[10px] text-slate-500 font-mono mb-1">Forged Token:</div>
                        <div className="text-[10px] text-emerald-400 font-mono break-all">{forgeResult.forgedToken}</div>
                        <button onClick={() => copyToClipboard(forgeResult.forgedToken, 'forged')}
                          className="mt-2 text-[9px] text-indigo-400 hover:text-indigo-300 font-mono">
                          {copiedItem === 'forged' ? '✓ Copied!' : '📋 Copy Forged Token'}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Modified: {JSON.stringify(forgeResult.modifications)}
                      </div>
                    </>
                  ) : (
                    <div className="text-red-400 font-mono text-sm">Error: {forgeResult.error}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ JWKS SPOOFING ═══ */}
          {activeAttack === "jwks" && jwksSpoof && (
            <div>
              <h3 className="text-sm font-mono font-bold text-amber-400 mb-2">🌐 JWKS Endpoint Spoofing</h3>
              <div className="text-[10px] text-amber-300 font-mono mb-3 bg-amber-950/30 p-2 rounded">
                CVE-2018-0114 — Inject attacker-controlled JWKS URL via jku header
              </div>
              <div className="mb-3">
                <label className="text-[9px] font-mono text-slate-500">ATTACKER JWKS URL</label>
                <input
                  type="text" value={jwksUrl} onChange={e => setJwksUrl(e.target.value)}
                  className="w-full mt-1 bg-dark-900 border border-dark-600 rounded px-3 py-2 text-[11px] font-mono text-slate-300 outline-none focus:border-amber-500"
                />
              </div>
              <CodeBlock code={jwksSpoof.exploitCode} id="jwks" onCopy={copyToClipboard} copied={copiedItem} />
              <div className="mt-3 bg-dark-900 rounded p-3">
                <div className="text-[9px] text-slate-500 font-mono mb-1">Forged Header:</div>
                <div className="text-[10px] text-red-400 font-mono">{JSON.stringify(jwksSpoof.forgedHeader, null, 2)}</div>
              </div>
            </div>
          )}

          {/* ═══ CLAIM INJECTION ═══ */}
          {activeAttack === "inject" && injections.length > 0 && (
            <div>
              <h3 className="text-sm font-mono font-bold text-purple-400 mb-2">💉 Claim Injection Payloads</h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Pre-built privilege escalation, impersonation, and injection payloads.
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {injections.map((inj, i) => (
                  <div key={i} className="bg-dark-900 border border-dark-600 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] text-purple-400 font-mono font-semibold">{inj.name}</span>
                      <button onClick={() => copyToClipboard(JSON.stringify(inj.forgedPayload), `inj-${i}`)}
                        className="text-[9px] text-emerald-400 hover:text-emerald-300 font-mono flex-shrink-0">
                        {copiedItem === `inj-${i}` ? '✓' : '📋 Copy Payload'}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">{inj.description}</div>
                    <div className="text-[9px] text-amber-400 font-mono bg-dark-800 rounded p-2 break-all">
                      {JSON.stringify(inj.modifications)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ CVE MATCHER ═══ */}
          {activeAttack === "cve" && (
            <div>
              <h3 className="text-sm font-mono font-bold text-blue-400 mb-2">🐛 CVE Exploit Matcher</h3>
              {cves.length === 0 ? (
                <div className="text-slate-500 text-[11px] font-mono">No matching CVEs for this token's characteristics.</div>
              ) : (
                <div className="space-y-3">
                  {cves.map((cve, i) => (
                    <div key={i} className="bg-dark-900 border border-dark-600 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          cve.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 
                          cve.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>{cve.severity}</span>
                        <span className="text-[11px] text-blue-400 font-mono font-bold">{cve.cve}</span>
                        <span className="text-[10px] text-slate-500 font-mono">CVSS: {cve.cvss}</span>
                      </div>
                      <div className="text-[12px] text-slate-300 font-semibold mb-1">{cve.title}</div>
                      <div className="text-[10px] text-slate-500 mb-2">{cve.description}</div>
                      <div className="text-[9px] text-red-300 font-mono mb-2">Affected: {cve.affected}</div>
                      {cve.exploit && <CodeBlock code={cve.exploit} id={`cve-${i}`} onCopy={copyToClipboard} copied={copiedItem} label="Exploit Code" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ INTRUDER PAYLOADS ═══ */}
          {activeAttack === "intruder" && intruderPayloads.length > 0 && (
            <div>
              <h3 className="text-sm font-mono font-bold text-blue-400 mb-2">🎯 Burp/ZAP Intruder Payloads</h3>
              <p className="text-[11px] text-slate-400 mb-3">Copy these into Burp Intruder or ZAP Fuzzer for automated testing.</p>
              <div className="space-y-3">
                {intruderPayloads.map((cat, i) => (
                  <div key={i} className="bg-dark-900 border border-dark-600 rounded-lg p-3">
                    <div className="text-[10px] text-indigo-400 font-mono font-bold mb-2">{cat.category}</div>
                    <div className="space-y-1">
                      {cat.payloads.map((p, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-mono w-32 flex-shrink-0">{p.label}</span>
                          <span className="text-[9px] text-slate-400 font-mono flex-1 truncate">{p.value}</span>
                          <button onClick={() => copyToClipboard(p.value, `int-${i}-${j}`)}
                            className="text-[8px] text-emerald-400 flex-shrink-0">
                            {copiedItem === `int-${i}-${j}` ? '✓' : '📋'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ OAUTH ATTACKS ═══ */}
          {activeAttack === "oauth" && (
            <div>
              <h3 className="text-sm font-mono font-bold text-purple-400 mb-2">🔑 OAuth Security Analysis</h3>
              {(!oauthChecks || oauthChecks.length === 0) ? (
                <div className="text-slate-500 text-[11px] font-mono">No OAuth-specific vulnerabilities detected in this token.</div>
              ) : (
                <div className="space-y-2">
                  {oauthChecks.map((check, i) => (
                    <div key={i} className="bg-dark-900 border border-dark-600 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          check.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>{check.severity}</span>
                        <span className="text-[11px] text-slate-300 font-mono">{check.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{check.description}</div>
                      {check.exploit && <div className="text-[10px] text-red-400 font-mono mt-1">→ {check.exploit}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ MASS ANALYSER ═══ */}
          {activeAttack === "mass" && (
            <div>
              <h3 className="text-sm font-mono font-bold text-emerald-400 mb-2">📦 Mass Token Analyser</h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Paste multiple tokens (one per line) from logs, Burp history, or token dumps. Instant triage.
              </p>
              <textarea
                value={massInput}
                onChange={e => setMassInput(e.target.value)}
                placeholder="Paste tokens here, one per line..."
                className="w-full h-32 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-400 outline-none focus:border-emerald-500 resize-y mb-3"
              />
              <button onClick={runMassAnalysis} disabled={!massInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white text-[11px] font-mono rounded-lg transition-all mb-4">
                📦 ANALYSE ALL
              </button>
              {massResult && (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  <div className="text-[10px] text-slate-500 font-mono mb-2">
                    Analysed: {massResult.length} tokens • 
                    Critical: {massResult.filter(r => r.severity === 'CRITICAL').length} • 
                    High: {massResult.filter(r => r.severity === 'HIGH').length}
                  </div>
                  {massResult.map((r, i) => (
                    <div key={i} className={`text-[9px] font-mono p-2 rounded border ${
                      r.severity === 'CRITICAL' ? 'border-red-800 bg-red-950/20 text-red-400' :
                      r.severity === 'HIGH' ? 'border-amber-800 bg-amber-950/20 text-amber-400' :
                      'border-dark-600 bg-dark-900 text-slate-400'
                    }`}>
                      #{r.index + 1} — {r.error ? `Error: ${r.error}` : `${r.alg} | sub:${r.sub || '?'} | exp:${r.exp} | ${r.issues?.join(', ') || 'clean'}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Reusable code block with copy button */
function CodeBlock({ code, id, onCopy, copied, label = "Exploit Code" }) {
  if (!code) return null;
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-mono text-slate-500 tracking-wider">{label}</span>
        <button onClick={() => onCopy(code, id)} className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300">
          {copied === id ? '✓ Copied!' : '📋 Copy'}
        </button>
      </div>
      <pre className="bg-dark-900 border border-dark-600 rounded-lg p-3 text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
        {code}
      </pre>
    </div>
  );
}
