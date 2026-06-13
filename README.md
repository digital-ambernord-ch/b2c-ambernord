# b2c-ambernord

## AI support chatbot

Self-mounting chat widget (`public/assets/chat-widget.js`, scoped `.ancb-`) → Cloudflare Pages Function `functions/api/chat.js` → Workers AI (`env.AI`, Llama 3.1 8B).

- **Edit what the bot knows:** all facts live in `functions/api/_knowledge.js` (the `KNOWLEDGE` string — brand, FAQ in DE/EN/FR/IT, exact prices). Edit that one file; redeploy. Keep prices exact and never add tracking/stock claims.
- **Add the order-tracking tool later:** uncomment the `get_order_status` schema in `functions/api/_tools.js`, implement its case in `runToolCalls()`, then set `ENABLE_TOOLS = true` in `chat.js`. The model will call the tool and answer from real data.
- **Enable Workers AI (production):** Cloudflare dashboard → your Pages project → **Settings → Functions → Bindings → Add → Workers AI**, variable name **`AI`**, save, then redeploy. (`wrangler.toml` mirrors this binding — set `name` to your real project name.)
- **Local dev:** `npm run build && npx wrangler pages dev dist` (serves Functions + the `AI` binding). Note: Workers AI **consumes neurons even in local dev** — each message is a real billed inference call.
