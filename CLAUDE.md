# Buddies

Source of truth for this project. README.md summarizes it for humans.

## Project Overview

Buddies (page title "Build a Buddy") is a browser-only toy: seeded characters made of eyes, brows and a cel-shaded head that look around, follow the cursor and show moods. No build step, no dependencies.

- Each seed deterministically sets looks (head shape, color, eye shape, brows) and personality (spring stiffness, blink rate, curiosity, attention).
- Faces sit on an invisible sphere stretched to the head silhouette; turning the sphere slides and foreshortens features to imply a 3D head.
- Eyes lead, head follows: the gaze uses a stiff spring, the head a softer one.
- Hosted on Cloudflare Workers static assets at https://buddies.aaronmaturen.com.

## Directory Structure

Native ES modules, no bundler. Every file stays small and does one thing.

- `public/index.html` — page markup only; loads `styles.css` and `app.js`. Layout: stage and cast on the left, controls on the right in four tabs (Emotes, Mood, Look, Buddy) so the panel stays about stage height; on phones the stage pins to the top while the controls scroll under it.
- `public/styles.css` — page styles and theme tokens.
- `public/app.js` — page wiring: the featured buddy, the cast, and every control.
- `public/buddy/` — the buddy library; import from `buddy/index.js` only.
  - `index.js` — public API (re-exports).
  - `buddy.js` — `Buddy` class: per-frame thinking, spring integration, drawing.
  - `loop.js` — one shared animation loop (`animate`, `stopAnimating`).
  - `spec.js` — seeded generation (`makeSpec`), `describe`, shape/style/color overrides (`setHeadShape`, `setHeadStyle`, `setColor`), tunable traits (`TRAITS`, `setTrait`, `setEyeShape`, `resetTraits`; changes recorded in `spec.traitOverrides`), `toConfig`/`fromConfig` (the JSON the stage's Copy config button produces).
  - `moods.js` — mood presets over `BASE`.
  - `heads.js` — head silhouettes (`HEADS`), `headPath`, `outlinePoints` (points and normals along the edge, for fur and chalk), floor shadow.
  - `styles/` — head styles, one file each (cel/ghost, sticker, sketch, jelly, neon, inked, comic, clay, fuzzy, hologram, paper, chalk); `styles/index.js` is the `HEAD_STYLES` table with labels and face colors. Pixel reuses cel with a whole-buddy pixel pass in `Buddy.draw`.
  - `face.js` — eye shapes, eye and brow drawing.
  - `emotes.js` — emote table (data only): duration, borrowed mood, mouth, head motion, timed events.
  - `emote-player.js` — runs one emote per buddy: head motions, events, symbol lifetimes.
  - `mouth.js` — emote-only mouth presets and drawing.
  - `hands.js` — floating hands: poses, drawing, `HandRig` springs; hands can hold a prop.
  - `wear.js` — worn accessories (`WearRig`): face slot (sunglasses) and top slot (hats).
  - `props.js` — prop drawings: lenses, hats, and held props (mug, gift, magnifier).
  - `symbols.js` — cartoon marks (hearts, !, ?, Z, sweat, anger, sparkles, blush): spawn, motion, drawing.
  - `colors.js` — tones, palette, color names, cel-shading tones.
  - `sphere.js` — rotation and surface frames for the invisible head.
  - `variety.js` — `castShapes`, `spreadColors`, `spreadStyles` for showing many buddies together.
  - `spring.js`, `random.js`, `pointer.js`, `theme.js`, `util.js` — small shared pieces.
- `wrangler.jsonc` — Cloudflare Worker config: serves `public/`, binds the custom domain.
- `.github/workflows/deploy.yml` — deploys on every push to `main`.
- `.claude/launch.json` — local static server for previews.
- `docs/` — TODO log and product requirements.

## Project Documentation Index

- `docs/TODO.md` — development log and task tracker
- `docs/20261029_product_requirements.md` — product requirements

## Code Organization Patterns

- Data tables drive looks: `EYE_SHAPES` (face.js), `HEADS` (heads.js), `TONES` and `PALETTE` (colors.js), `MOODS` (moods.js). Add an entry to extend; pickers and the cast pick it up automatically.
- Every mood value is a spring target over `BASE`, so moods blend.
- Emotes are one-off reactions on top of the mood: `buddy.emote(name)`. To add one, add an entry to `EMOTES`; new head motions go in `MOTIONS` (emote-player.js), new marks in `KINDS`/`DRAW` (symbols.js), new mouths in `MOUTHS`.
- Symbols anchor either to the head surface (turn with it) or float in screen space around it.
- Hands are emote-only and float in screen space; `face: true` pins a hand to the eye line and follows the head's turn. New poses go in `POSES` (hands.js) as a palm plus round-capped finger strokes.
- Accessories are emote-only. Worn items go in `WEARABLES` (wear.js) with a drawing in props.js; held items go in `HELD` (props.js) and are given to a hand with `holds` in an emote's hand event.
- Seeded traits added later are drawn at the end of `makeSpec` (e.g. `handStyle`) so older seeds don't change.
- `makeSpec(seed, forcedShape)` uses FNV hash → mulberry32. The order of `r()` calls is part of the format: reordering or removing one changes every existing seed (there is a retired draw kept on purpose).
- `Buddy` — `think()` once per frame (targets, blinks), `integrate()` at 120 Hz substeps (springs), `draw()` → `render(ctx, px, style)`. Options: `scale`, `headMode` — `"mixed"` (default: each buddy draws its own `spec.headStyle`) or a `HEAD_STYLES` key to force one style; `styleKey` is the style actually drawn.
- `SEEDED_STYLES` (styles/index.js) lists the styles a seed can pick and the cast deals out; all 13 head-drawing styles are in it, so each of the 13 buddies on the page gets a different one. Adding a style there changes which style existing seeds pick (only that).
- To add a head style: write `styles/<name>.js` exporting a head drawing, add an entry to `HEAD_STYLES` with its label and face colors (`eye`, `brow`, `lid`, optional `eyeFill`, `pupil`, `glow`); the Head buttons are generated from the table.
- Drawing functions take `ctx` plus a plain options object and never reach into a `Buddy`.
- The library reads `--fg` and `--surface` from the page for eyes and brows when there's no visible head (theme.js).
- `app.js` never touches springs or drawing; it only creates buddies, sets specs and moods. The Shape, Head, Color and trait controls change only the stage buddy's spec, so a pick travels with that buddy if it's swapped into the cast.

## UI/UX Standards

- Colors are CSS tokens on `:root` with light and dark variants; characters' own colors come from their spec.
- Respect `prefers-reduced-motion` (less noise, no bob, mood cycling off).
- Must work at phone width with a 16px gutter.

## Deployment and Environment

GitHub Actions secrets (repo settings → Secrets → Actions):

- `CLOUDFLARE_API_TOKEN` — needs Account › Workers Scripts: Edit, Zone › Workers Routes: Edit and Zone › DNS: Edit for `aaronmaturen.com`.
- `CLOUDFLARE_ACCOUNT_ID`

`aaronmaturen.com` must be a zone in the same Cloudflare account; wrangler creates the `buddies` DNS record on first deploy.

## Common Commands

- Preview locally: `python3 -m http.server 8790 --directory public` or `npx wrangler dev` (modules don't load from `file://`)
- Deploy manually: `npx wrangler deploy`
