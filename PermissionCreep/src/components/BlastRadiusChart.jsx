import React from 'react';
import { RESOURCE_CATEGORIES, RESOURCE_COLORS } from '../engine';

/**
 * Radar/radial chart showing blast radius across resource categories.
 * Built with pure SVG (no D3 dependency for this component).
 */
export default function BlastRadiusChart({ scopeMap, blastRadius, size = 220 }) {
  const categories = RESOURCE_CATEGORIES;
  const n = categories.length;
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.36;
  const labelR = size * 0.46;

  const angleFor = i => (i / n) * 2 * Math.PI - Math.PI / 2;
  const pointFor = (i, r) => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  // Grid rings (3 levels)
  const rings = [1, 2, 3].map(l => {
    const r = (l / 3) * maxR;
    return categories.map((_, i) => pointFor(i, r))
      .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
      .join(" ") + " Z";
  });

  // Data polygon
  const dataPoints = categories.map((cat, i) => {
    const level = scopeMap[cat] || 0;
    const r = (level / 3) * maxR;
    return pointFor(i, Math.max(r, 4)); // minimum radius for visibility
  });
  const polygon = dataPoints.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ") + " Z";

  const riskColor = blastRadius > 66 ? "#EF4444" : blastRadius > 33 ? "#F59E0B" : "#10B981";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      {/* Grid rings */}
      {rings.map((d, i) => (
        <path key={`ring-${i}`} d={d} fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.5" />
      ))}
      
      {/* Axis lines */}
      {categories.map((_, i) => {
        const [x, y] = pointFor(i, maxR);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="#334155" strokeWidth="0.5" opacity="0.3" />;
      })}
      
      {/* Data fill polygon */}
      <path d={polygon} fill={riskColor} fillOpacity="0.2" stroke={riskColor} strokeWidth="2" strokeLinejoin="round"
        className="transition-all duration-500" />
      
      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle key={`point-${i}`} cx={x} cy={y} r="3.5"
          fill={RESOURCE_COLORS[categories[i]] || "#6366F1"}
          stroke="#0F172A" strokeWidth="1.5"
          className="transition-all duration-500"
        />
      ))}
      
      {/* Category labels */}
      {categories.map((cat, i) => {
        const [lx, ly] = pointFor(i, labelR);
        const level = scopeMap[cat] || 0;
        return (
          <text key={`label-${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontFamily="'IBM Plex Mono', monospace" fontWeight="600"
            fill={level > 0 ? RESOURCE_COLORS[cat] : "#475569"}
            className="transition-colors duration-300">
            {cat}
          </text>
        );
      })}
      
      {/* Center score */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="20" fontFamily="'IBM Plex Mono', monospace"
        fontWeight="700" fill={riskColor} className="transition-all duration-500">
        {blastRadius}%
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fontFamily="'IBM Plex Mono', monospace"
        fill="#64748B" letterSpacing="1.5">
        BLAST RADIUS
      </text>
    </svg>
  );
}
