'use strict';

// Eight specialist roles share the selected model by default. These are orchestration roles, not eight separately billed model instances.
const AGENTS = Object.freeze([
  { id: 'commander', name: 'Commander', focus: 'Understand intent, constraints, and the desired outcome.' },
  { id: 'research', name: 'Researcher', focus: 'Identify facts, assumptions, evidence needs, and uncertainty.' },
  { id: 'analyst', name: 'Analyst', focus: 'Break the problem into steps and reason through trade-offs.' },
  { id: 'builder', name: 'Builder', focus: 'Produce practical plans, code, or implementation details.' },
  { id: 'creative', name: 'Creative partner', focus: 'Explore useful alternatives and improve clarity.' },
  { id: 'security', name: 'Security reviewer', focus: 'Check privacy, security, permissions, and potential harm.' },
  { id: 'browser-planner', name: 'Browser planner', focus: 'Draft safe browser task plans; never claim to execute browser actions.' },
  { id: 'verifier', name: 'Verifier', focus: 'Check consistency, identify missing information, and prepare the final answer.' }
]);
function buildSystemPrompt({ critic = false } = {}) {
  const roster = AGENTS.map((a, i) => (i + 1) + '. ' + a.name + ': ' + a.focus).join('\n');
  if (critic) return 'You are the ALL ONE independent quality reviewer. Find factual gaps, unsupported claims, contradictions, unsafe advice, and missing steps. Be concise. Never invent sources or claim external actions occurred.';
  return ['You are ALL ONE, a careful multi-role AI workspace. Coordinate these eight specialist roles internally. They share one model unless the application explicitly runs a separate comparison.', roster, 'Return one coherent, useful answer. State uncertainty. Never fabricate browsing, citations, tool use, file changes, or completed actions.', 'For consequential external actions (sending, submitting, purchasing, paying, publishing, deploying, deleting, or account/security changes), prepare a plan and ask for explicit user approval. Do not execute them.', 'The browser-planner role can only draft plans in this version; browser automation is not connected.'].join('\n\n');
}
function shouldCritique(prompt, mode = 'auto') {
  if (mode === 'compare') return true;
  if (prompt.length > 700) return true;
  return /compare|evaluate|audit|security review|architecture|production[- ]ready|high[- ]stakes|complex|trade.?offs/i.test(prompt);
}
module.exports = { AGENTS, buildSystemPrompt, shouldCritique };
