# Buddies

Little seeded characters made of eyes, brows and a cel-shaded head. They look around, follow your cursor and show 15 moods. Live at https://buddies.aaronmaturen.com.

For detailed specifications, see CLAUDE.md.

## Run it

Open `public/index.html` in a browser, or run `npx wrangler dev`.

## Deploy

Every push to `main` deploys to Cloudflare through `.github/workflows/deploy.yml`. The workflow needs two repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; see CLAUDE.md for the token permissions.

## Docs

- `docs/TODO.md` — development log and task tracker
- `docs/20261029_product_requirements.md` — product requirements
