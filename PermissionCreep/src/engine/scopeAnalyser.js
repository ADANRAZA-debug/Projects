// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3: SCOPE ANALYSER & BLAST RADIUS
// PermissionCreep — Scope taxonomy mapping and blast-radius computation
// ─────────────────────────────────────────────────────────────────────────────

import { SCOPE_KNOWLEDGE_BASE, RESOURCE_CATEGORIES } from './constants.js';
import { extractScopes } from './ruleEngine.js';

/**
 * Analyse scopes from a parsed token.
 * Returns a ScopeGraph data structure for the D3.js renderer.
 */
export function analyzeScopes(parsed) {
  if (!parsed || parsed.opaque || !parsed.payload) {
    return { scopeMap: {}, blastRadius: 0, scopes: [], nodes: [], links: [] };
  }

  const payload = parsed.payload;
  const scopeArr = extractScopes(payload);

  // Initialize scope map
  const scopeMap = {};
  RESOURCE_CATEGORIES.forEach(cat => { scopeMap[cat] = 0; });

  let totalLevel = 0;
  const enrichedScopes = scopeArr.map(s => {
    const known = SCOPE_KNOWLEDGE_BASE[s];
    if (known) {
      scopeMap[known.resource] = Math.max(scopeMap[known.resource] || 0, known.level);
      totalLevel += known.level;
      return { name: s, ...known };
    }
    
    // Heuristic classification for unknown scopes
    let level = 1, resource = "General";
    const lower = s.toLowerCase();
    
    if (lower.includes("admin") || lower.includes("*") || lower.includes("delete") || lower.includes("destroy")) {
      level = 3; resource = "Admin";
    } else if (lower.includes("write") || lower.includes("create") || lower.includes("update") || lower.includes("put") || lower.includes("post")) {
      level = 2; resource = "General";
    } else if (lower.includes("user") || lower.includes("profile") || lower.includes("account")) {
      resource = "Users";
    } else if (lower.includes("file") || lower.includes("upload") || lower.includes("storage") || lower.includes("s3")) {
      resource = "Files";
    } else if (lower.includes("mail") || lower.includes("email") || lower.includes("message") || lower.includes("send")) {
      resource = "Email";
    } else if (lower.includes("code") || lower.includes("repo") || lower.includes("git")) {
      resource = "Code";
    }
    
    scopeMap[resource] = Math.max(scopeMap[resource] || 0, level);
    totalLevel += level;
    return { name: s, resource, level, provider: "Unknown" };
  });

  // Wildcard grants maximum blast radius across all categories
  if (scopeArr.includes("*") || scopeArr.includes("*:*")) {
    RESOURCE_CATEGORIES.forEach(cat => { scopeMap[cat] = 3; });
    totalLevel = RESOURCE_CATEGORIES.length * 3;
  }

  // Compute blast radius percentage
  const maxPossible = RESOURCE_CATEGORIES.length * 3;
  const blastRadius = scopeArr.length === 0 ? 0 : Math.min(100, Math.round((totalLevel / maxPossible) * 100));

  // Build D3 graph data (nodes and links for force-directed layout)
  const nodes = buildGraphNodes(enrichedScopes, scopeMap);
  const links = buildGraphLinks(enrichedScopes, nodes);

  return { scopeMap, blastRadius, scopes: enrichedScopes, nodes, links };
}

/**
 * Build graph nodes for D3 visualization.
 * Center node = Token, category nodes = resources, leaf nodes = individual scopes.
 */
function buildGraphNodes(scopes, scopeMap) {
  const nodes = [];
  
  // Center node (the token itself)
  nodes.push({
    id: "token",
    label: "TOKEN",
    type: "center",
    level: 0,
    radius: 24,
  });
  
  // Resource category nodes (middle ring)
  const activeCategories = RESOURCE_CATEGORIES.filter(cat => scopeMap[cat] > 0);
  activeCategories.forEach(cat => {
    nodes.push({
      id: `cat_${cat}`,
      label: cat,
      type: "category",
      level: scopeMap[cat],
      radius: 16,
    });
  });
  
  // Individual scope nodes (outer ring)
  scopes.forEach((scope, i) => {
    nodes.push({
      id: `scope_${i}`,
      label: scope.name.length > 25 ? scope.name.slice(0, 22) + "..." : scope.name,
      fullName: scope.name,
      type: "scope",
      level: scope.level,
      resource: scope.resource,
      provider: scope.provider,
      radius: 8,
    });
  });
  
  return nodes;
}

/**
 * Build graph links for D3 visualization.
 */
function buildGraphLinks(scopes, nodes) {
  const links = [];
  
  // Link token → categories
  const categories = nodes.filter(n => n.type === "category");
  categories.forEach(cat => {
    links.push({
      source: "token",
      target: cat.id,
      strength: 0.8,
    });
  });
  
  // Link categories → scopes
  scopes.forEach((scope, i) => {
    const catNode = nodes.find(n => n.id === `cat_${scope.resource}`);
    if (catNode) {
      links.push({
        source: catNode.id,
        target: `scope_${i}`,
        strength: 0.5,
      });
    }
  });
  
  return links;
}

/**
 * Compare two scope analyses for diff mode.
 * Returns sets of added, removed, and common scopes.
 */
export function diffScopes(scopeDataA, scopeDataB) {
  const namesA = new Set(scopeDataA.scopes.map(s => s.name));
  const namesB = new Set(scopeDataB.scopes.map(s => s.name));
  
  const added = scopeDataB.scopes.filter(s => !namesA.has(s.name));
  const removed = scopeDataA.scopes.filter(s => !namesB.has(s.name));
  const common = scopeDataA.scopes.filter(s => namesB.has(s.name));
  
  return { added, removed, common };
}
