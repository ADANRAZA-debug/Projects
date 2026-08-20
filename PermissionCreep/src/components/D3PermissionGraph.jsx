import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { RESOURCE_COLORS } from '../engine';

/**
 * D3.js v7 Force-Directed Permission Graph
 * Renders an interactive radial permission graph mapping scopes to resource categories.
 * Features: force simulation, severity colouring, hover tooltips, zoom/pan.
 */
export default function D3PermissionGraph({ nodes, links, blastRadius }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!nodes || nodes.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = 500;
    const height = 400;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    // Color scale for severity levels
    const levelColor = (level) => {
      if (level >= 3) return "#EF4444";
      if (level >= 2) return "#F59E0B";
      return "#10B981";
    };

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(d => {
        if (d.source.type === "center") return 80;
        return 50;
      }).strength(0.6))
      .force("charge", d3.forceManyBody().strength(d => {
        if (d.type === "center") return -200;
        if (d.type === "category") return -100;
        return -40;
      }))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 5))
      .force("radial", d3.forceRadial(d => {
        if (d.type === "center") return 0;
        if (d.type === "category") return 100;
        return 160;
      }, width / 2, height / 2).strength(0.3));

    // Container group for zoom
    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Background glow
    const defs = svg.append("defs");
    
    // Glow filter
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw links
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", d => d.source.type === "center" ? 2 : 1)
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", d => d.source.type === "center" ? "none" : "3,2");

    // Draw nodes
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node circles
    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => {
        if (d.type === "center") return "#4F46E5";
        if (d.type === "category") return RESOURCE_COLORS[d.label] || "#6366F1";
        return levelColor(d.level);
      })
      .attr("stroke", d => {
        if (d.type === "center") return "#818CF8";
        return "#0F172A";
      })
      .attr("stroke-width", d => d.type === "center" ? 3 : 1.5)
      .attr("filter", d => d.type === "center" ? "url(#glow)" : "none")
      .attr("opacity", 0.9);

    // Node labels
    node.append("text")
      .text(d => {
        if (d.type === "center") return "🔐";
        if (d.type === "category") return d.label;
        return d.label;
      })
      .attr("text-anchor", "middle")
      .attr("dy", d => d.type === "scope" ? d.radius + 12 : 4)
      .attr("font-size", d => {
        if (d.type === "center") return "14px";
        if (d.type === "category") return "9px";
        return "7px";
      })
      .attr("font-family", "'IBM Plex Mono', monospace")
      .attr("font-weight", d => d.type === "category" ? "600" : "400")
      .attr("fill", d => {
        if (d.type === "center") return "#F1F5F9";
        if (d.type === "category") return RESOURCE_COLORS[d.label] || "#94A3B8";
        return "#94A3B8";
      });

    // Level indicators for category nodes
    node.filter(d => d.type === "category")
      .append("text")
      .text(d => ["", "●", "●●", "●●●"][d.level] || "")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.radius + 12)
      .attr("font-size", "7px")
      .attr("fill", d => levelColor(d.level));

    // Tooltip on hover
    node.on("mouseenter", function(event, d) {
      d3.select(this).select("circle")
        .transition().duration(200)
        .attr("r", d.radius * 1.3)
        .attr("opacity", 1);
      
      // Show tooltip
      const tooltip = g.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${d.x}, ${d.y - d.radius - 20})`);
      
      const text = d.fullName || d.label;
      const rectWidth = Math.min(text.length * 6 + 16, 200);
      
      tooltip.append("rect")
        .attr("x", -rectWidth / 2)
        .attr("y", -14)
        .attr("width", rectWidth)
        .attr("height", 20)
        .attr("rx", 4)
        .attr("fill", "#1E293B")
        .attr("stroke", "#334155");
      
      tooltip.append("text")
        .text(text)
        .attr("text-anchor", "middle")
        .attr("dy", 0)
        .attr("font-size", "8px")
        .attr("font-family", "'IBM Plex Mono', monospace")
        .attr("fill", "#E2E8F0");
    })
    .on("mouseleave", function(event, d) {
      d3.select(this).select("circle")
        .transition().duration(200)
        .attr("r", d.radius)
        .attr("opacity", 0.9);
      g.selectAll(".tooltip").remove();
    });

    // Simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, blastRadius]);

  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="absolute top-2 left-3 z-10">
        <span className="text-[10px] font-mono text-slate-500 tracking-wider">D3.js PERMISSION GRAPH</span>
      </div>
      <div className="absolute top-2 right-3 z-10 flex gap-2">
        <span className="text-[8px] font-mono text-emerald-500">● READ</span>
        <span className="text-[8px] font-mono text-amber-500">● WRITE</span>
        <span className="text-[8px] font-mono text-red-500">● ADMIN</span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[400px] rounded-lg border border-dark-600 bg-dark-800/50"
        style={{ minHeight: '300px' }}
      />
      <div className="text-center mt-1">
        <span className="text-[9px] font-mono text-slate-600">Drag nodes • Scroll to zoom • Interactive force-directed layout</span>
      </div>
    </div>
  );
}
