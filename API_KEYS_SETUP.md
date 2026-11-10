# ALL ONE — Safe provider configuration

## Local inference requires no API key

Ollama is the default runtime. Install Ollama and pull the small starter model:

```powershell
ollama pull llama3.2:1b
npm start
```

The website and API run locally at http://127.0.0.1:8787. No cloud key is required.

## Optional cloud fallback

Cloud providers are optional and disabled by default. If you choose to enable them, copy server/.env.example to server/.env and add only the keys you need:

- GEMINI_API_KEY
- GROQ_API_KEY
- OPENROUTER_API_KEY (only used with a model ID ending in :free)

Then set ENABLE_CLOUD_FALLBACKS=true and keep CLOUD_MAX_CALLS_PER_DAY low. Restart ALL ONE after changing the file.

Free-tier quotas and provider billing rules can change. A free-tier key is not a universal guarantee of zero charges if you have enabled billing on that provider account. For the strongest no-charge setup, leave cloud fallbacks disabled and use Ollama locally.

## Secret handling

- Never commit server/.env.
- Never put API keys in index.html, app.js, browser storage, screenshots, issues, or chat.
- The API status endpoint reports only whether a key is configured; it never returns its value.
- If a key is exposed, revoke it in the provider dashboard and create a replacement.

## Supported by this free-first runtime

Ollama is primary. Gemini, Groq, and OpenRouter :free are optional. Paid OpenAI, Anthropic, xAI, and DeepSeek API calls are not wired into this runtime.

See [ALL_ONE_SETUP.md](ALL_ONE_SETUP.md) for full installation and security limitations.
