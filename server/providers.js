'use strict';

/**
 * Server-only provider configuration.
 * Reads credentials from process.env. Never import this module into browser
 * code and never return apiKey values to a client.
 *
 * Configuration plumbing only: provider request adapters and authenticated
 * API routes are still required before live model calls can run.
 */
const PROVIDERS = Object.freeze({
  openai: { label: 'OpenAI', keyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL', defaultModel: '', baseUrl: 'https://api.openai.com/v1' },
  gemini: { label: 'Google Gemini', keyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', defaultModel: '', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
  claude: { label: 'Anthropic Claude', keyEnv: 'ANTHROPIC_API_KEY', modelEnv: 'ANTHROPIC_MODEL', defaultModel: '', baseUrl: 'https://api.anthropic.com/v1' },
  grok: { label: 'xAI Grok', keyEnv: 'XAI_API_KEY', modelEnv: 'XAI_MODEL', defaultModel: '', baseUrl: 'https://api.x.ai/v1' },
  deepseek: { label: 'DeepSeek', keyEnv: 'DEEPSEEK_API_KEY', modelEnv: 'DEEPSEEK_MODEL', defaultModel: '', baseUrl: 'https://api.deepseek.com' },
  openrouter: { label: 'OpenRouter', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', defaultModel: '', baseUrl: 'https://openrouter.ai/api/v1' },
});

function listProviderStatus(env = process.env) {
  return Object.entries(PROVIDERS).map(([id, provider]) => ({
    id,
    name: provider.label,
    configured: Boolean(env[provider.keyEnv]),
    modelConfigured: Boolean(env[provider.modelEnv] || provider.defaultModel),
  }));
}

function getProviderCredentials(id, env = process.env) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unknown AI provider');
  const apiKey = env[provider.keyEnv];
  if (!apiKey) throw new Error(provider.label + ' API key is not configured on the server');
  return {
    id,
    name: provider.label,
    apiKey,
    model: env[provider.modelEnv] || provider.defaultModel,
    baseUrl: provider.baseUrl,
  };
}

module.exports = { PROVIDERS, listProviderStatus, getProviderCredentials };
