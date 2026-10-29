# Project Development Log & TODOs

## Tasks

### Current
- [ ] Tune the polygon head shapes in a real browser (corner rounding, face height, eye size on small heads)

### Upcoming
- [ ] Move off Node 20 actions (`actions/checkout@v4`, `cloudflare/wrangler-action@v3`) once Node 24 versions are available
- [ ] Consider splitting `public/index.html` (~900 lines) into `style.css` and `app.js`
- [ ] Optional WebGL renderer with the same spec and mood system

### Done
- [x] Seeded eyes-and-brows characters on an invisible sphere, eyes lead / head follows (2026-10-29)
- [x] 15 head shapes, color palette and shape pickers, cast with unique shapes (2026-10-29)
- [x] Eye expressions as outline shape changes instead of clipping lids (2026-10-29)
- [x] 15 moods (2026-10-29)
- [x] Cast colors spread around the hue wheel, gray capped at one (2026-10-29)
- [x] Repo, docs and Cloudflare deploy workflow (2026-10-29)
- [x] First deploy to https://buddies.aaronmaturen.com (2026-10-29)

## Notes

### Development Decisions
- 2D canvas over WebGL: with only eyes, brows and a head, the invisible-sphere projection gives the 3D turn without WebGL's context limits (2026-10-29).
- Expressions reshape the eye outline; only blink (squash) and sleepy/bored/smug (head-colored lid) cover the eye. Clipping lids erased short eyes (2026-10-29).
- Hosting on Cloudflare Workers static assets with `custom_domain: true`, so the domain is declared in `wrangler.jsonc` instead of set up by hand (2026-10-29).

### Technical Debt
- `public/index.html` is one ~900-line file; over the 300-line guideline.
- No automated tests; seeded generation could get a snapshot test.

### Recurring Issues & Solutions
- Cast looked all green/gray → tones were equally weighted and earthy only picked orange/green; fixed with tone weights and `spreadColors()`.
- A Claude Code auto-update rewrote `~/.claude.json` and dropped a just-added MCP server → re-add it with `claude mcp add`.
