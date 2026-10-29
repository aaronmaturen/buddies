# Project Development Log & TODOs

## Tasks

### Current
- [ ] Tune the polygon head shapes in a real browser (corner rounding, face height, eye size on small heads)

### Upcoming
- [ ] More head styles: Inked, Comic halftone, Clay, Fuzzy, Hologram, Paper cutout, Chalk
- [ ] Hands and props don't adapt to Neon yet (white gloves on a neon buddy)
- [ ] Move off Node 20 actions (`actions/checkout@v4`, `cloudflare/wrangler-action@v3`) once Node 24 versions are available
- [ ] Idle emotes picked by personality (twitchy → nervous, aloof → snooze)
- [ ] Optional WebGL renderer with the same spec and mood system

### Done
- [x] Seeded eyes-and-brows characters on an invisible sphere, eyes lead / head follows (2026-10-29)
- [x] 15 head shapes, color palette and shape pickers, cast with unique shapes (2026-10-29)
- [x] Eye expressions as outline shape changes instead of clipping lids (2026-10-29)
- [x] 15 moods (2026-10-29)
- [x] Cast colors spread around the hue wheel, gray capped at one (2026-10-29)
- [x] Repo, docs and Cloudflare deploy workflow (2026-10-29)
- [x] First deploy to https://buddies.aaronmaturen.com (2026-10-29)
- [x] Upside-down egg head; renamed to Build a Buddy (2026-10-29)
- [x] Split the single page into a `buddy/` ES-module library, `app.js` and `styles.css`; verified identical specs for 2,000 seeds (2026-10-29)
- [x] Head styles: Sticker, Sketch, Jelly, Pixel, Neon via a `HEAD_STYLES` table (2026-10-29)
- [x] Bubbles emote: blows bubbles that drift off and pop (2026-10-29)
- [x] Emotes step 3: accessories (sunglasses, party hat, nightcap, mug, gift, magnifier) and cool, party, idea, coffee, gift, inspect emotes; cast moved under the stage (2026-10-29)
- [x] Emotes step 2: floating hands (gloves or mittens by seed) with wave, facepalm, peekaboo, thumbs up, shrug, clap, think and a wagging no (2026-10-29)
- [x] Emotes step 1: 12 emotes with emote-only mouths, symbols and head motions; boop plays Love (2026-10-29)

## Notes

### Development Decisions
- 2D canvas over WebGL: with only eyes, brows and a head, the invisible-sphere projection gives the 3D turn without WebGL's context limits (2026-10-29).
- Expressions reshape the eye outline; only blink (squash) and sleepy/bored/smug (head-colored lid) cover the eye. Clipping lids erased short eyes (2026-10-29).
- Native ES modules with no bundler: Cloudflare serves them as static files and each module stays small (2026-10-29).
- Hosting on Cloudflare Workers static assets with `custom_domain: true`, so the domain is declared in `wrangler.jsonc` instead of set up by hand (2026-10-29).

### Technical Debt
- No automated tests; `makeSpec` deserves a snapshot test now that it's importable on its own.

### Recurring Issues & Solutions
- Local preview served old ES modules from cache after edits (a new file loaded fresh while a changed one didn't) → refetch modules with `fetch(url, { cache: 'reload' })` or hard-reload before judging a change.
- Browser-pane screenshots: when the pane is hidden the browser throttles requestAnimationFrame, so captures freeze; simulate emotes in Node with EmotePlayer instead. The first capture in a batch can also be stale; check canvas pixels or capture twice before assuming a draw failed.
- Cast looked all green/gray → tones were equally weighted and earthy only picked orange/green; fixed with tone weights and `spreadColors()`.
- A Claude Code auto-update rewrote `~/.claude.json` and dropped a just-added MCP server → re-add it with `claude mcp add`.
