# Buddies

Source of truth for this project. README.md summarizes it for humans.

## Project Overview

Buddies (page title "Build a Buddy") is a browser-only toy: seeded characters made of eyes, brows and a cel-shaded head that look around, follow the cursor and show moods. No build step, no dependencies.

- Each seed deterministically sets looks (head shape, color, eye shape, brows) and personality (spring stiffness, blink rate, curiosity, attention).
- Faces sit on an invisible sphere stretched to the head silhouette; turning the sphere slides and foreshortens features to imply a 3D head.
- Eyes lead, head follows: the gaze uses a stiff spring, the head a softer one.
- Hosted on Cloudflare Workers static assets at https://buddies.aaronmaturen.com.

## Directory Structure

- `public/index.html` — the whole app: markup, CSS and one inline script (2D canvas).
- `wrangler.jsonc` — Cloudflare Worker config: serves `public/`, binds the custom domain.
- `.github/workflows/deploy.yml` — deploys on every push to `main`.
- `docs/` — TODO log and product requirements.

## Project Documentation Index

- `docs/TODO.md` — development log and task tracker
- `docs/20261029_product_requirements.md` — product requirements

## Code Organization Patterns

Inside the script in `public/index.html`:

- `SHAPES` (eye shapes), `HEADS` (head silhouettes), `TONES` and `PALETTE` (colors) — data tables; add entries to extend.
- `MOODS` — each mood is a set of target values over `BASE`; every value is spring-smoothed, so moods blend.
- `makeSpec(seed, forcedShape)` — seeded generation (FNV hash → mulberry32). Changing the order of `r()` calls changes every seed's output.
- `Character` — `think()` once per frame (targets, blinks), `integrate()` at 120 Hz substeps (springs), `draw()`.
- `castShapes()` / `spreadColors()` — keep the cast varied: unique shapes, golden-angle hues, at most one gray.

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

- Preview locally: `npx wrangler dev` (or open `public/index.html` directly)
- Deploy manually: `npx wrangler deploy`
