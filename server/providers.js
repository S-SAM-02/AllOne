'use strict';

// Server-only metadata for the optional free-tier providers in this build.
// Never return credential values to a browser or log them.
const PROVIDERS = Object.freeze({
  gemini: { label: 'Google Gemini', keyEnv: 'GEMINI_API_KEY', modelEnv: 'GEMINI_MODEL', defaultModel: 'gemini-2.0-flash' },
  groq: { label: 'Groq', keyEnv: 'GROQ_API_KEY', modelEnv: 'GROQ_MODEL', defaultModel: 'llama-3.1-8b-instant' },
  openrouter: { label: 'OpenRouter (free models only)', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', defaultModel: '' }
});
function listProviderStatus(env = process.env) {
  return Object.entries(PROVIDERS).map(([id, provider]) => ({
    id, name: provider.label, configured: Boolean(env[provider.keyEnv]),
    modelConfigured: Boolean(env[provider.modelEnv] || provider.defaultModel)
  }));
}
function getProviderCredentials(id, env = process.env) {
  const provider = PROVIDERS[id];
  if (!provider) throw new Error('Unknown optional cloud provider');
  const apiKey = env[provider.keyEnv];
  if (!apiKey) throw new Error(provider.label + ' API key is not configured on the server');
  return { id, name: provider.label, apiKey, model: env[provider.modelEnv] || provider.defaultModel };
}
module.exports = { PROVIDERS, listProviderStatus, getProviderCredentials };
