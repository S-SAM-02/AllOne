# ALL ONE — Add your AI API keys safely

## Never commit real API keys to GitHub

Do not paste keys into server/providers.js, server/.env.example, index.html, app.js, issues, or pull requests. A public repository can expose committed keys. If a key is accidentally committed, revoke it at the provider dashboard and create a replacement.

## Local development

1. Clone the repository.
2. Copy server/.env.example to server/.env on your computer.
3. Put your own keys only in server/.env.
4. Keep that real .env file private. The root .gitignore excludes .env files.
5. Restart your backend after changing environment variables.

| Provider | API key variable | Optional model variable |
|---|---|---|
| OpenAI | OPENAI_API_KEY | OPENAI_MODEL |
| Gemini | GEMINI_API_KEY | GEMINI_MODEL |
| Claude | ANTHROPIC_API_KEY | ANTHROPIC_MODEL |
| Grok | XAI_API_KEY | XAI_MODEL |
| DeepSeek | DEEPSEEK_API_KEY | DEEPSEEK_MODEL |
| OpenRouter | OPENROUTER_API_KEY | OPENROUTER_MODEL |

## Vercel deployment

After the backend is implemented and deployed:

1. Open your ALL ONE project in Vercel.
2. Open Settings → Environment Variables.
3. Add each variable name and its value separately.
4. Select the environments you use: Production, Preview, and/or Development.
5. Save and redeploy so the server receives the new values.

Do not use NEXT_PUBLIC_, VITE_, or other public/client-side variable prefixes for API keys.

## Current implementation status

- server/.env.example: safe blank template committed to GitHub.
- server/providers.js: server-only configuration helper that reads environment variables and reports connection status without exposing secrets.
- Live provider request adapters, authenticated routes, encrypted per-user vault, and Settings-page connection tests still need to be implemented. The current static prototype does not send API requests yet.

Never share your API key with anyone. Use separate keys for applications and configure provider spending limits where available.
