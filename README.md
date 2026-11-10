# ALL ONE — One Question. Multiple Minds. One Ultimate Answer.

ALL ONE is a local-first hybrid AI workspace. It coordinates eight specialist agent roles around one model, uses Ollama for genuinely local inference, and can optionally fall back to selected free-tier cloud providers.

## Current build (0.2)

- Responsive ALL ONE workspace UI.
- Eight-role orchestration: Commander, Researcher, Analyst, Builder, Creative Partner, Security Reviewer, Browser Planner, and Verifier.
- Local Ollama model runtime as the default.
- Optional Gemini, Groq, and OpenRouter :free fallbacks, disabled by default.
- Daily cloud request cap and provider request timeouts.
- Server-side environment variables; provider keys are never sent to the browser.
- Loopback-only server binding (127.0.0.1).
- Approval-first design. Browser agent is plan-only; no website actions are executed.

The eight agents are specialist roles sharing a model by default, not eight separately billed model subscriptions. Complex prompts can receive a second local review pass. Compare 3/Compare 4 explicitly requests up to two or three optional cloud models, then uses Ollama for synthesis and review. It runs only when cloud mode is enabled and within the daily cap.

## Run locally

Requirements: Node.js 18.17+ and Ollama for Windows.

```powershell
ollama pull llama3.2:1b
npm start
```

Open http://127.0.0.1:8787. Keep Ollama running. The app does not require API keys for local inference.

For optional cloud fallback configuration, copy server/.env.example to server/.env and follow [ALL_ONE_SETUP.md](ALL_ONE_SETUP.md). Cloud mode is OFF by default. Free-tier quotas and terms can change; leave it off for the strongest no-surprise-charge setup.

## Security

Never commit real API keys. server/.env is ignored by Git. The API status endpoint returns configuration status only, never secrets. The server is intentionally bound to localhost and is not ready for public multi-user deployment.

## Current limitations

- No login/account system or encrypted per-user key vault.
- No public cloud deployment configuration.
- No browser automation worker; browser agent only drafts plans.
- No persistent audit database.
- No independent multi-model comparison yet.

See [ALL_ONE_SETUP.md](ALL_ONE_SETUP.md) for setup, safety notes, and troubleshooting.
