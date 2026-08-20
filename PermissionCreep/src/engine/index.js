// ─────────────────────────────────────────────────────────────────────────────
// ENGINE INDEX — Public API
// ─────────────────────────────────────────────────────────────────────────────

export { parseToken, detectTokenType, base64urlDecode } from './decoder.js';
export { runRuleEngine, extractScopes } from './ruleEngine.js';
export { analyzeScopes, diffScopes } from './scopeAnalyser.js';
export { computeRiskScore, getRiskLevel, getSeverityStyle, generateRiskSummary } from './riskReport.js';
export { SAMPLE_TOKENS, RESOURCE_CATEGORIES, RESOURCE_COLORS, SCOPE_KNOWLEDGE_BASE } from './constants.js';
