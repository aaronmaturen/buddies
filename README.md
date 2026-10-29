# Buddies

Little seeded characters made of eyes, brows and a cel-shaded head. They look around, follow your cursor and show 15 moods. Live at https://buddies.aaronmaturen.com.

For detailed specifications, see CLAUDE.md.

## Run it

Serve `public/` from any static server, for example `python3 -m http.server 8790 --directory public`, then open http://localhost:8790. Opening the file directly won't work because the page uses ES modules.

The characters live in a small library under `public/buddy/`:

```js
import { Buddy, makeSpec, animate } from "./buddy/index.js";
const buddy = new Buddy(canvas, makeSpec("glance"));
animate(buddy);
buddy.setMood("happy");
buddy.emote("wave");
buddy.morphInto("airplane");
```

The **Copy config** button on the stage copies the featured buddy as JSON (seed, name, head shape, color, head style, mood, and any traits you tuned in the Buddy tab). Rebuild it with:

```js
import { Buddy, fromConfig, animate } from "./buddy/index.js";
const buddy = new Buddy(canvas, fromConfig(config));
buddy.setMood(config.mood);
animate(buddy);
```

## Deploy

Every push to `main` deploys to Cloudflare through `.github/workflows/deploy.yml`. The workflow needs two repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; see CLAUDE.md for the token permissions.

## Docs

- `docs/TODO.md` — development log and task tracker
- `docs/20261029_product_requirements.md` — product requirements
