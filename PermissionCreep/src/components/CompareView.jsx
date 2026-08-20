import React from 'react';
import { getRiskLevel } from '../engine';

/**
 * CompareView — Side-by-side token comparison results.
 * Shows score delta, security regression detection, and claim differences.
 */
export default function CompareView({ comparison, scoreA, scoreB }) {
  if (!comparison) return null;
  
  const { diffs, scoreDelta } = comparison;
  const deltaColor = scoreDelta > 0 ? "#EF4444" : scoreDelta < 0 ? "#10B981" : "#64748B";
  const deltaSign = scoreDelta > 0 ? "+" : "";
  const riskA = getRiskLevel(scoreA);
  const riskB = getRiskLevel(scoreB);

  return (
    <div className="mt-6">
      <div className="bg-dark-700 border border-dark-600 rounded-xl overflow-hidden">
        {/* Score Delta Banner */}
        <div className={`px-5 py-4 border-b border-dark-600 flex items-center gap-4 flex-wrap
          ${scoreDelta > 10 ? 'bg-red-950/20' : scoreDelta < -10 ? 'bg-emerald-950/20' : 'bg-dark-700'}`}>
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-1">
              ENVIRONMENT SECURITY DELTA
            </div>
            <div className="text-[12px] text-slate-300">
              {scoreDelta > 10 
                ? "⚠ Production token is LESS secure than development — critical security regression" 
                : scoreDelta < -10 
                  ? "✓ Production token is more secure than development — good practice"
                  : "Tokens have similar security posture"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-mono mb-0.5">SCORE DELTA</div>
            <div className="text-[28px] font-bold font-mono" style={{ color: deltaColor }}>
              {deltaSign}{scoreDelta}
            </div>
          </div>
        </div>

        {/* Score Comparison Row */}
        <div className="grid grid-cols-3 border-b border-dark-600">
          {/* Dev score */}
          <div className="p-4 text-left border-r border-dark-600">
            <div className="text-[10px] text-slate-500 font-mono mb-1">DEV TOKEN</div>
            <div className="text-[24px] font-bold font-mono" style={{ color: riskA.color }}>
              {scoreA}<span className="text-[12px] text-slate-500">/100</span>
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: riskA.color }}>{riskA.label}</div>
          </div>
          
          {/* Arrow */}
          <div className="flex items-center justify-center border-r border-dark-600">
            <div className="text-[20px] text-slate-600">→</div>
          </div>
          
          {/* Prod score */}
          <div className="p-4 text-right">
            <div className="text-[10px] text-slate-500 font-mono mb-1">PROD TOKEN</div>
            <div className="text-[24px] font-bold font-mono" style={{ color: riskB.color }}>
              {scoreB}<span className="text-[12px] text-slate-500">/100</span>
            </div>
            <div className="text-[10px] font-mono mt-0.5" style={{ color: riskB.color }}>{riskB.label}</div>
          </div>
        </div>

        {/* Diff Table */}
        <div className="p-4">
          <div className="text-[10px] text-slate-500 font-mono tracking-wider mb-3">
            CLAIM DIFFERENCES <span className="text-indigo-400">{diffs.length}</span>
          </div>
          
          {diffs.length === 0 ? (
            <div className="text-slate-500 text-[12px] text-center py-5">
              No differences found — tokens are identical in structure
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {diffs.map((d, i) => (
                <div key={i} className={`grid grid-cols-[60px_120px_1fr_1fr] gap-2 p-2.5 rounded-md items-start
                  ${d.isSecurityRelevant 
                    ? 'bg-red-950/20 border border-red-900/30' 
                    : 'bg-dark-800 border border-dark-600'}`}>
                  <span className="text-[9px] text-slate-500 font-mono">{d.location}</span>
                  <span className={`text-[11px] font-mono font-semibold ${
                    d.isSecurityRelevant ? 'text-red-400' : 'text-indigo-400'
                  }`}>
                    {d.key} {d.isSecurityRelevant && "⚠"}
                  </span>
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono mb-0.5">DEV</div>
                    <div className="text-[10px] text-slate-400 font-mono break-all">
                      {d.valA === undefined ? <span className="text-slate-600">— absent</span> : JSON.stringify(d.valA)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-mono mb-0.5">PROD</div>
                    <div className={`text-[10px] font-mono break-all ${
                      d.isSecurityRelevant ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {d.valB === undefined ? <span className="text-slate-600">— absent</span> : JSON.stringify(d.valB)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
