# ALL ONE — Local-first hybrid setup

## What this build does

- Runs the website and API together on your computer.
- Uses Ollama as the primary model runtime. Local inference does not require a provider API key or per-token API payment.
- Coordinates eight specialist roles using the selected model. They are roles in one orchestration workflow, not eight separately billed agents.
- Uses an optional second local review pass for complex prompts.
- Supports optional Gemini, Groq, and OpenRouter free-tier fallbacks when cloud mode is explicitly enabled.
- Keeps cloud fallback disabled by default and caps cloud requests per day.
- Keeps API keys in server/.env; keys are never returned by the status API or sent to browser JavaScript.
- Binds the server to 127.0.0.1 only. It is not a public multi-user service.

## 1. Install Ollama

1. Install Ollama for Windows from https://ollama.com/download/windows.
2. Open PowerShell and run:

```powershell
ollama pull llama3.2:1b
```

3. Check it is available:

```powershell
ollama run llama3.2:1b
```

For the 8 GB RAM laptop, start with llama3.2:1b. You can test gemma2:2b later. Larger models may leave too little memory for Windows and the browser.

## 2. Start ALL ONE

Install Node.js 18.17 or newer. In PowerShell, open the cloned repository folder and run:

```powershell
npm start
```

Open http://127.0.0.1:8787. Keep Ollama running. Do not open index.html directly; use the local server so the API is same-origin.

## 3. Optional cloud fallback

Local Ollama is the default. Cloud is not needed for local use.

If you want a free-tier fallback:
1. Create a provider key from its official developer dashboard.
2. Confirm the account/project has no paid billing arrangement or spending exposure. Free-tier limits and terms can change.
3. Copy server/.env.example to server/.env.
4. Add only the cloud key(s) you intend to use.
5. Set ENABLE_CLOUD_FALLBACKS=true.
6. Keep CLOUD_MAX_CALLS_PER_DAY=10 or lower.
7. Restart ALL ONE.

Gemini and Groq are optional free-tier integrations. OpenRouter is accepted only when the model ID ends in :free. This is a best-effort guard, not a promise of unlimited service or permanent free availability. To minimize charge risk, leave cloud fallbacks disabled and use Ollama. Do not enable billing on cloud provider accounts if you require a strict no-charge setup.

The app does not call OpenAI, Anthropic, xAI, or paid DeepSeek endpoints in this free-first runtime.

## 4. Eight-agent design

Commander, Researcher, Analyst, Builder, Creative Partner, Security Reviewer, Browser Planner, and Verifier are specialist roles coordinated through prompts. They share one local model by default. Complex prompts can receive a second local review pass. This saves RAM and avoids paying for eight concurrent model calls.

Independent multi-provider comparison is not yet enabled. The current review pass uses the same local model; true comparison across different providers remains a follow-up feature.

## Security and limitations

- Never commit server/.env; it is excluded by .gitignore.
- Never paste API keys into GitHub, frontend code, screenshots, or chat.
- The server listens only on loopback (127.0.0.1).
- Cloud provider keys are read server-side and never included in API status responses.
- Request body size is limited; provider requests have a timeout; cloud requests have a daily process-local cap.
- The browser agent drafts plans only. It does not control websites or submit forms.
- There is no multi-user login, encrypted account vault, remote cloud deployment, persistent audit database, or production browser worker yet.
- Do not deploy this local server as-is to a public host. A public deployment needs authentication, durable rate limiting, a secret manager, CSRF protections, isolation, and per-user authorization.

## Troubleshooting

- If Ollama is unavailable, run Ollama and verify http://127.0.0.1:11434 is responding.
- If the model is missing, run ollama pull llama3.2:1b.
- If chat fails, check the terminal running npm start for the provider error.
- Cloud fallback is disabled by default intentionally.
