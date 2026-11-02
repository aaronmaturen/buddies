# Project Development Log & TODOs

## Tasks

### Current
- [ ] Tune the polygon head shapes in a real browser (corner rounding, face height, eye size on small heads)

### Upcoming
- [ ] Optional page-wide overlay so morphs can fly beyond their own canvas
- [ ] Sliders for the advanced traits: configs already take brow length/thickness, eye height and resting tilt, but the page has no controls for them
- [ ] Before publishing to npm: add a LICENSE (none yet), confirm the package name and public access
- [ ] Try the library in a real React/Next.js app, including `destroy()` on unmount
- [ ] Pie menu: press, drag and release to pick
- [ ] Decide whether mood cycling comes back after leader mode (it stays off today)
- [ ] Hands and props don't adapt to Neon yet (white gloves on a neon buddy)
- [ ] Idle emotes picked by personality (twitchy → nervous, aloof → snooze)
- [ ] Optional WebGL renderer with the same spec and mood system

### Done
- [x] Audit cleanup: `npm test` with 10 tests, run before deploy; split `Buddy.render` into buddy-render.js and `think`, `drawEye`, `openPieMenu` and `createConfigEditor` into smaller functions; traits.js and copy-text.js moved out of app.js; repeated cancel steps and label helper merged (2026-11-02)
- [x] Fixed leader menu focus returning to the wrong buddy, old page wording, and the product requirements (2026-11-02)
- [x] Deploy workflow moved to current action versions to clear the Node 20 warning (2026-11-02)
- [x] Leader mode: a pie menu on a clicked buddy fires command events that the others follow; Leader, follow and openPieMenu are in the library (2026-11-02)
- [x] Library moved to src/ and built with esbuild as @aaronmaturen/buddies: ES module, script tag build, types; safe to import on a server; Buddy.destroy() (2026-11-02)
- [x] Buddies can turn away from the camera: Look away emote with a peek back, and an occasional idle turn (2026-11-02)
- [x] Stage | Cast switch replaced by a grid icon on the stage; Copy config is now a copy icon (2026-11-02)
- [x] Stage buddy is now one of the 12 cast members, outlined in the Cast view (2026-11-02)
- [x] Accessibility fixes from the audit: focus not hidden under pinned parts, focus kept on cast pick, labelled config editor, Hold still, stage buddy button, main landmark, 3:1 control borders (2026-10-30)
- [x] Tabs replaced by a sticky Stage | Cast viewer and one scrolling column of controls (2026-10-30)
- [x] Disappear / come back: buddies vanish in a puff and stay away until called back (2026-10-30)
- [x] Link preview image (og/twitter tags) and favicon from a rendered buddy (2026-10-30)
- [x] Seeded eyes-and-brows characters on an invisible sphere, eyes lead / head follows (2026-10-29)
- [x] 15 head shapes, color palette and shape pickers, cast with unique shapes (2026-10-29)
- [x] Eye expressions as outline shape changes instead of clipping lids (2026-10-29)
- [x] 15 moods (2026-10-29)
- [x] Cast colors spread around the hue wheel, gray capped at one (2026-10-29)
- [x] Repo, docs and Cloudflare deploy workflow (2026-10-29)
- [x] First deploy to https://buddies.aaronmaturen.com (2026-10-29)
- [x] Obovoid (upside-down egg) head; renamed to Build a Buddy (2026-10-29)
- [x] Six more morphs: balloon, rocket, bouncy ball, ghost, fish, star; morphs can have their own motion, moving outlines and timed symbols (2026-10-29)
- [x] Morphs: the head melts into an object that acts, then melts back; works in every head style (2026-10-29)
- [x] Removed the paper airplane morph (2026-10-29)
- [x] Cat (licks a paw) and dog (wags its tail, pants) morphs; morph events can borrow a mood, details get the head colors (2026-10-29)
- [x] Fish swims in place and turns around instead of following a path (2026-10-29)
- [x] Seven more head styles: Inked, Comic, Clay, Fuzzy, Hologram, Paper, Chalk; all 13 drawn styles are seeded, so every buddy on the page differs (2026-10-29)
- [x] Tunable traits in the Buddy tab: eye shape, eye size, spacing, temper, attention, gaze, blinks, with From seed reset; Copy config saves only changed traits (2026-10-29)
- [x] Controls split into Emotes / Mood / Look / Buddy tabs so the stage stays in view; stage pins to the top on phones (2026-10-29)
- [x] Head picker changes only the stage buddy, like Shape and Color; "From seed" restores its own style (2026-10-29)
- [x] Whistle emote: puckered lips, colored music notes float out (2026-10-29)
- [x] Seeded head style per buddy; cast styles spread so neighbours differ; (2026-10-29)
- [x] Copy config button on the stage; `toConfig`/`fromConfig` round-trip a buddy (2026-10-29)
- [x] Cast grows to 12 so the grid fills evenly (2026-10-29)
- [x] Split the single page into a `buddy/` ES-module library, `app.js` and `styles.css`; verified identical specs for 2,000 seeds (2026-10-29)
- [x] Head styles: Sticker, Sketch, Jelly, Pixel, Neon via a `HEAD_STYLES` table (2026-10-29)
- [x] Load a config is a CodeMirror editor with autocomplete, checking and hover help from a generated JSON Schema; CodeMirror is vendored (2026-10-30)
- [x] Seeds removed: a buddy is a JSON config; random buddies use random configs and names from a list; Name field and Load a config replace the Seed box; no From seed buttons (2026-10-30)
- [x] Bubbles emote: blows bubbles that drift off and pop (2026-10-29)
- [x] Emotes step 3: accessories (sunglasses, party hat, nightcap, mug, gift, magnifier) and cool, party, idea, coffee, gift, inspect emotes; cast moved under the stage (2026-10-29)
- [x] Emotes step 2: floating hands (gloves or mittens by seed) with wave, facepalm, peekaboo, thumbs up, shrug, clap, think and a wagging no (2026-10-29)
- [x] Emotes step 1: 12 emotes with emote-only mouths, symbols and head motions; boop plays Love (2026-10-29)

## Notes

### Development Decisions
- CodeMirror is vendored, not loaded from a CDN: esm.sh failed to build the package set (server out of disk) and jsDelivr links each package to different core versions, which breaks CodeMirror. `codemirror-json-schema` was skipped because it pulls in Shiki and a markdown renderer; the schema-aware completion and checks are ~150 lines in config-editor.js (2026-10-30).
- Configs instead of seeds: once Copy config produced full JSON, seeds were a second way to describe a buddy that had to stay byte-stable forever. A buddy is now just its config (2026-10-30).
- No paper airplane morph: a plane needs to bank and loop in three dimensions, and spinning flat on screen read as a cutout. Morphs that naturally move flat (balloon, ball, ghost) work in 2D. The fish also read badly on a path, so it swims in place; turning is a horizontal squash through zero, like a fish seen side-on (2026-10-29).
- 2D canvas over WebGL: with only eyes, brows and a head, the invisible-sphere projection gives the 3D turn without WebGL's context limits (2026-10-29).
- Expressions reshape the eye outline; only blink (squash) and sleepy/bored/smug (head-colored lid) cover the eye. Clipping lids erased short eyes (2026-10-29).
- Native ES modules with no bundler: Cloudflare serves them as static files and each module stays small (2026-10-29). Superseded: esbuild now bundles `src/` so other apps can import the library (2026-11-02).
- The site uses the same bundle as other apps, so anything that breaks the package breaks the site first (2026-11-02).
- Leader commands are plain JSON events and the menu never touches a buddy, so they can drive buddies anywhere (2026-11-02).
- Hosting on Cloudflare Workers static assets with `custom_domain: true`, so the domain is declared in `wrangler.jsonc` instead of set up by hand (2026-10-29).

### Technical Debt
- Code audit done 2026-11-02 (6,631 lines added over the project's history). `npm audit`: 0 vulnerabilities in production packages; every public export is typed; no unused CSS; no debug output left in the library.
- Tests only cover what runs without a browser; drawing, the pie menu and the page are still checked by hand. `public/app.js` sits right at the 300-line limit.

### Recurring Issues & Solutions
- Dark styles vanish on the dark-mode stage: INK (#16181e) is nearly the dark surface (#181b23). Give ink-outlined styles a light rim outside the ink (see inked.js).
- Local preview served old ES modules from cache after edits (a new file loaded fresh while a changed one didn't) → refetch modules with `fetch(url, { cache: 'reload' })` or hard-reload before judging a change.
- Browser-pane screenshots: when the pane is hidden or the Claude window is out of focus (as low as 1 fps) the browser throttles requestAnimationFrame, so captures freeze; simulate emotes in Node with EmotePlayer instead. The first capture in a batch can also be stale; check canvas pixels or capture twice before assuming a draw failed.
- Headless Chrome's `--virtual-time-budget` is unreliable for animation: eyes stuck mid-blink, moods not applied, the frame loop stalling once nothing is drawn. Step `think`/`integrate`/`draw` by hand in a test page, or use stubbed animation frames in Node.
- Cast looked all green/gray → tones were equally weighted and earthy only picked orange/green; fixed with tone weights and `spreadColors()`.
- A Claude Code auto-update rewrote `~/.claude.json` and dropped a just-added MCP server → re-add it with `claude mcp add`.
