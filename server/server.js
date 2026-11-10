'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { listProviderStatus } = require('./providers');
const { AGENTS, buildSystemPrompt, shouldCritique } = require('./agents');

const ROOT = path.resolve(__dirname, '..');
loadEnv(path.join(__dirname, '.env'));
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !Object.prototype.hasOwnProperty.call(process.env, m[1])) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const PORT = Math.max(1024, Number(process.env.PORT || 8787));
const HOST = '127.0.0.1';
const MAX_BODY = 24 * 1024;
const CLOUD_DAILY_LIMIT = Math.min(30, Math.max(0, Number(process.env.CLOUD_MAX_CALLS_PER_DAY || 10)));
let cloudCalls = 0;
let cloudDay = new Date().toISOString().slice(0, 10);
function resetCloudCounter() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== cloudDay) { cloudDay = today; cloudCalls = 0; }
}
function cloudAllowed() {
  resetCloudCounter();
  return process.env.ENABLE_CLOUD_FALLBACKS === 'true' && cloudCalls < CLOUD_DAILY_LIMIT;
}
function reserveCloudCall() {
  if (!cloudAllowed()) throw new Error('Cloud fallback is disabled or its daily request cap has been reached.');
  cloudCalls += 1;
}
function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}
function allowedOrigin(origin) {
  if (!origin) return true;
  try { const u = new URL(origin); return u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname) && u.port === String(PORT); } catch { return false; }
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (Buffer.byteLength(data) > MAX_BODY) reject(Object.assign(new Error('Request is too large.'), { status: 413 }));
    });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(Object.assign(new Error('Invalid JSON body.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
async function fetchJson(url, options, timeoutMs = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = { error: { message: raw.slice(0, 500) } }; }
    if (!response.ok) throw new Error(data?.error?.message || data?.message || ('Provider returned HTTP ' + response.status));
    return data;
  } finally { clearTimeout(timer); }
}
function modelConfig() {
  return { ollama: process.env.OLLAMA_MODEL || 'llama3.2:1b', gemini: process.env.GEMINI_MODEL || 'gemini-2.0-flash', groq: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', openrouter: process.env.OPENROUTER_MODEL || '' };
}
async function callOllama(messages, system) {
  const model = modelConfig().ollama;
  const host = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const data = await fetchJson(host + '/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: false, messages: [{ role: 'system', content: system }, ...messages], options: { temperature: 0.4 } })
  });
  return { provider: 'Ollama (local)', model, text: data.message?.content || '' };
}
async function callGemini(messages, system) {
  if (!process.env.GEMINI_API_KEY) throw new Error('Gemini key is not configured.');
  reserveCloudCall();
  const model = modelConfig().gemini;
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const data = await fetchJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: 1200, temperature: 0.4 } }) });
  return { provider: 'Gemini (cloud)', model, text: data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '' };
}
async function callCompatible(name, baseUrl, key, model, messages, system) {
  if (!key) throw new Error(name + ' key is not configured.');
  reserveCloudCall();
  const data = await fetchJson(baseUrl.replace(/\/$/, '') + '/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, ...messages], temperature: 0.4, max_tokens: 1200 })
  });
  return { provider: name, model, text: data.choices?.[0]?.message?.content || '' };
}
async function callGroq(messages, system) {
  return callCompatible('Groq (cloud)', 'https://api.groq.com/openai/v1', process.env.GROQ_API_KEY, modelConfig().groq, messages, system);
}
async function callOpenRouter(messages, system) {
  const model = modelConfig().openrouter;
  if (!model || !model.endsWith(':free')) throw new Error('OpenRouter is restricted to a configured :free model ID.');
  return callCompatible('OpenRouter free model', 'https://openrouter.ai/api/v1', process.env.OPENROUTER_API_KEY, model, messages, system);
}
async function localFirst(messages, system) {
  try { return await callOllama(messages, system); }
  catch (localError) {
    if (!cloudAllowed()) throw new Error('Ollama is unavailable and cloud fallbacks are disabled. Start Ollama locally or explicitly enable an optional free-tier fallback. Details: ' + localError.message);
    const options = [
      ['Gemini', !!process.env.GEMINI_API_KEY, () => callGemini(messages, system)],
      ['Groq', !!process.env.GROQ_API_KEY, () => callGroq(messages, system)],
      ['OpenRouter', !!process.env.OPENROUTER_API_KEY, () => callOpenRouter(messages, system)]
    ];
    const errors = [];
    for (const option of options) {
      if (!option[1]) continue;
      try { return await option[2](); } catch (e) { errors.push(option[0] + ': ' + e.message); }
    }
    throw new Error('No configured free-tier fallback succeeded. ' + errors.join(' | '));
  }
}
async function runChat(body) {
  const prompt = String(body.prompt || '').trim();
  if (!prompt || prompt.length > 12000) throw Object.assign(new Error('Enter a prompt of 1–12,000 characters.'), { status: 400 });
  const mode = body.mode === 'compare' ? 'compare' : 'auto';
  const messages = [{ role: 'user', content: prompt }];
  const primary = await localFirst(messages, buildSystemPrompt());
  if (!primary.text) throw new Error('The selected model returned an empty response.');

  // Independent model comparison is selective and user-triggered. It is never
  // launched in Auto mode, and it requires cloud fallbacks to be explicitly enabled.
  const comparisons = [];
  let compareNote = 'Auto mode: one primary model used; no extra model calls.';
  if (mode === 'compare') {
    if (!cloudAllowed()) {
      compareNote = 'Comparison requested, but cloud fallbacks are disabled or capped. Only the primary response was generated.';
    } else {
      const candidates = [
        ['Gemini', !!process.env.GEMINI_API_KEY, () => callGemini(messages, buildSystemPrompt())],
        ['Groq', !!process.env.GROQ_API_KEY, () => callGroq(messages, buildSystemPrompt())],
        ['OpenRouter', !!process.env.OPENROUTER_API_KEY && modelConfig().openrouter.endsWith(':free'), () => callOpenRouter(messages, buildSystemPrompt())]
      ].filter(item => item[1] && !primary.provider.toLowerCase().includes(item[0].toLowerCase())).slice(0, 2);
      const results = await Promise.allSettled(candidates.map(item => item[2]()));
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === 'fulfilled' && result.value.text) comparisons.push(result.value);
      }
      compareNote = comparisons.length
        ? 'Selective comparison completed with ' + comparisons.length + ' additional free-tier provider(s).'
        : 'No additional free-tier provider was available; only the primary response was generated.';
    }
  }

  let synthesisText = '';
  if (comparisons.length && primary.provider.startsWith('Ollama')) {
    try {
      const evidence = [{ provider: primary.provider, model: primary.model, answer: primary.text }, ...comparisons.map(item => ({ provider: item.provider, model: item.model, answer: item.text }))];
      const synthesisPrompt = 'Synthesize these model responses into one accurate, practical answer. Resolve disagreements by reasoning, do not blindly vote, flag uncertainty, and do not invent facts.\n\nQUESTION:\n' + prompt + '\n\nMODEL RESPONSES:\n' + JSON.stringify(evidence);
      const synthesis = await callOllama([{ role: 'user', content: synthesisPrompt }], 'You are the ALL ONE synthesis engine. Compare evidence and produce the strongest supported answer.');
      synthesisText = synthesis.text || '';
    } catch { /* Side-by-side responses remain available if synthesis fails. */ }
  }
  let reviewText = '';
  if (shouldCritique(prompt, mode) && primary.provider.startsWith('Ollama')) {
    try {
      const review = await callOllama([{ role: 'user', content: 'Review this answer for errors and missing caveats. Return only important corrections.\n\nQUESTION:\n' + prompt + '\n\nDRAFT:\n' + (synthesisText || primary.text) }], buildSystemPrompt({ critic: true }));
      reviewText = review.text || '';
    } catch { /* Keep the primary response if the local review pass fails. */ }
  }
  const comparisonText = comparisons.map(item => '\n\n---\n' + item.provider + ' · ' + item.model + '\n' + item.text).join('');
  const answer = (synthesisText ? 'ALL ONE ULTIMATE SYNTHESIS\n' + synthesisText : primary.text) + comparisonText + (reviewText ? '\n\n---\nALL ONE local verification notes\n' + reviewText : '') + '\n\n---\n' + compareNote;
  return {
    answer, provider: primary.provider, model: primary.model,
    agents: AGENTS.map(a => ({ id: a.id, name: a.name, status: 'role-coordinated' })),
    reviewRun: Boolean(reviewText), comparison: compareNote, comparedModels: comparisons.map(item => ({ provider: item.provider, model: item.model })),
    cloud: { enabled: process.env.ENABLE_CLOUD_FALLBACKS === 'true', callsToday: cloudCalls, dailyCap: CLOUD_DAILY_LIMIT }
  };
}
function mime(file) {
  return ({ '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
function serveStatic(pathname, res) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const file = path.resolve(ROOT, '.' + requested);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, { error: 'Not found' });
  res.writeHead(200, { 'Content-Type': mime(file), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (!allowedOrigin(origin)) return send(res, 403, { error: 'Origin not allowed. Use the local ALL ONE page.' });
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const url = new URL(req.url, 'http://127.0.0.1:' + PORT);
  if (url.pathname === '/api/status' && req.method === 'GET') {
    return send(res, 200, {
      app: 'ALL ONE', mode: 'local-first-hybrid',
      local: { provider: 'Ollama', model: modelConfig().ollama, endpoint: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434' },
      providers: listProviderStatus(),
      cloud: { enabled: process.env.ENABLE_CLOUD_FALLBACKS === 'true', callsToday: cloudCalls, dailyCap: CLOUD_DAILY_LIMIT },
      agents: AGENTS.map(a => ({ id: a.id, name: a.name })),
      security: { boundToLoopback: true, secretsSentToBrowser: false, browserAutomation: false }
    });
  }
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    try { return send(res, 200, await runChat(await readBody(req))); }
    catch (error) { return send(res, error.status || 502, { error: error.message || 'Request failed' }); }
  }
  if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'API route not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, { error: 'Method not allowed' });
  return serveStatic(url.pathname, res);
});
server.listen(PORT, HOST, () => {
  process.stdout.write('ALL ONE local server: http://127.0.0.1:' + PORT + '\n');
  process.stdout.write('Ollama default model: ' + modelConfig().ollama + '\n');
  process.stdout.write('Cloud fallbacks: ' + (process.env.ENABLE_CLOUD_FALLBACKS === 'true' ? 'enabled (daily cap ' + CLOUD_DAILY_LIMIT + ')' : 'disabled') + '\n');
});
