# Buddies

Little characters made of eyes, brows and a head you mostly can't see. They look around, follow your cursor and show 15 moods. Live at https://buddies.aaronmaturen.com.

For detailed specifications, see CLAUDE.md.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:8790.

## Use it in your app

```js
import { Buddy, fromConfig, randomConfig, animate } from "@aaronmaturen/buddies";
const buddy = new Buddy(canvas, fromConfig(randomConfig()));
animate(buddy);
buddy.setMood("happy");
buddy.emote("wave");
buddy.morphInto("ghost");
buddy.destroy(); // when the canvas goes away
```

To let one buddy lead the others, open the pie menu and listen for what it fires:

```js
import { Leader, follow } from "@aaronmaturen/buddies";
const leader = new Leader();
leader.addEventListener("command", e => followers.forEach(b => follow(b, e.detail)));
canvas.addEventListener("click", e => leader.open(e.clientX, e.clientY));
```

Commands are plain JSON, like `{ "kind": "emote", "name": "wave" }`, so they can travel anywhere.

Give the canvas a size with CSS. Importing is safe during server-side rendering, but create buddies in the browser. For a page with no build step, `dist/buddies.global.js` works from a plain `<script>` and exposes `window.Buddies`.

The copy button on the stage copies the featured buddy's config as JSON (name, head, eyes, brows, hands, personality). Paste it into **Load a config** in the Buddy section, which has autocomplete for every setting and flags invalid values, or rebuild it in code:

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
