import React from 'react';
import { getRiskLevel } from '../engine';

/**
 * Semi-circular gauge component showing the risk score 0-100.
 */
export default function RiskGauge({ score }) {
  const risk = getRiskLevel(score);
  const angle = (score / 100) * 180 - 90;
  const r = 58, cx = 80, cy = 70;
  const toRad = a => (a * Math.PI) / 180;
  
  // Calculate arc endpoint
  const arcX = cx + r * Math.cos(toRad(angle - 90));
  const arcY = cy + r * Math.sin(toRad(angle - 90));
  const largeArc = score > 50 ? 1 : 0;

  return (
    <svg width="160" height="90" viewBox="0 0 160 90" className="flex-shrink-0">
      {/* Background arc */}
      <path
        d={`M${cx - r},${cy} A${r},${r},0,1,1,${cx + r},${cy}`}
        fill="none" stroke="#1E293B" strokeWidth="10" strokeLinecap="round"
      />
      {/* Colored progress arc */}
      {score > 0 && (
        <path
          d={`M${cx - r},${cy} A${r},${r},0,${largeArc},1,${arcX},${arcY}`}
          fill="none" stroke={risk.color} strokeWidth="10" strokeLinecap="round"
          className="transition-all duration-700"
        />
      )}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={cx + 48 * Math.cos(toRad(angle - 90))}
        y2={cy + 48 * Math.sin(toRad(angle - 90))}
        stroke={risk.color} strokeWidth="2" strokeLinecap="round"
        className="transition-all duration-700"
      />
      <circle cx={cx} cy={cy} r="4" fill={risk.color} />
      {/* Score label */}
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="18" fontWeight="700"
        fontFamily="'IBM Plex Mono', monospace" fill={risk.color}>{score}</text>
      {/* Range labels */}
      <text x="14" y={cy + 2} fontSize="7" fill="#475569" fontFamily="'IBM Plex Mono', monospace">SAFE</text>
      <text x="132" y={cy + 2} fontSize="7" fill="#EF4444" fontFamily="'IBM Plex Mono', monospace">CRIT</text>
    </svg>
  );
}
