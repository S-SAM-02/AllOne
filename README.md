# ALL ONE — One Question. Multiple Minds. One Ultimate Answer.

ALL ONE is a unified AI workspace concept: bring several AI providers into one chat, compare their responses, synthesize a stronger answer, and coordinate browser-based tasks with explicit approvals.

## Current build

This repository starts with a responsive, interactive front-end prototype.

- Unified chat workspace with Auto, Single model, Compare 3, Compare 4, and Plan only modes.
- AI Compare workspace and answer-evaluation concepts.
- Provider settings UI for OpenAI, Gemini, Claude, Grok, DeepSeek, and OpenRouter.
- Browser & Actions workspace with task planning, approval queue, site permissions, and emergency-stop concept.
- Projects, research, files, history, integrations, and settings navigation.
- Responsive layouts for desktop and mobile.
- Demo interactions are visibly marked as demos. They do not pretend to call models or control a browser.

## Run locally

No build tools are required for the prototype.

1. Clone this repository.
2. Open `index.html` in a modern browser.

For local server preview:

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Important: live integrations are not connected yet

A static website cannot safely keep provider secrets or perform authenticated browser automation by itself. This first commit intentionally does not save API keys in localStorage, source files, or browser code. The provider and browser panels are setup interfaces, not live connections.

Before enabling real use, add a trusted backend with:
- User authentication and authorization.
- Encrypted server-side secret storage (for example, AES-256-GCM with the encryption key held in deployment secrets).
- Provider adapters and server-side rate limits.
- OAuth integrations where supported.
- Browser automation worker (for example, Playwright) isolated from the web server.
- Per-domain permissions, task logs, audit trail, and a server-enforced emergency stop.
- Approval checks for sending messages, submitting forms, purchases/payments, publishing/deploying, deleting data, and account/security changes.

Never put API keys in frontend JavaScript, localStorage, committed files, or chat transcripts. Use environment variables or a secure secret vault on the server.

## Suggested architecture

```text
Web UI
  └── Authenticated API
        ├── Orchestrator / task planner
        ├── Model gateway
        │     ├── OpenAI adapter
        │     ├── Gemini adapter
        │     ├── Anthropic adapter
        │     ├── xAI adapter
        │     ├── DeepSeek adapter
        │     └── OpenRouter adapter
        ├── Response evaluator + synthesizer
        ├── Browser worker (isolated Playwright sessions)
        ├── Approval + permission service
        ├── Encrypted credential vault
        └── Audit log + task history
```

## Execution policy

ALL ONE is designed for approval-first autonomy:
1. Understand the request and produce a plan.
2. Identify which providers, sites, and permissions are needed.
3. Show the exact external actions before execution.
4. Wait for approval for consequential actions.
5. Execute only within granted permissions.
6. Verify the result and report what happened.

The system must not bypass CAPTCHAs, access controls, authentication safeguards, or website rules. It must not silently escalate permissions.

## Roadmap

- [ ] Add authenticated backend and secure encrypted provider-key vault.
- [ ] Implement model adapters and parallel model calls.
- [ ] Implement response scoring, contradiction detection, and synthesis.
- [ ] Add connected-account OAuth flows.
- [ ] Add isolated cloud/local browser operator.
- [ ] Add approval service, audit trail, and emergency stop.
- [ ] Add tests, deployment configuration, and monitoring.

## License

No license has been selected yet.