# QA environment: qa1.citykidbk.com

A second copy of the site for testing features before they reach parents. Same repo, same Worker code, different Worker, hostname, and database. Nothing here touches production.

| | Production | QA |
|---|---|---|
| Branch | `main` | `qa` |
| Worker | `hidden-term-82d3` | `citykid-qa` |
| Hostname | citykidbk.com, www | qa1.citykidbk.com (custom domain) |
| D1 | `citykid-inbox` | `citykid-inbox-qa` (`2bd5ea57-7421-4274-b0ff-9429a1c5105a`, same schema, empty) |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy --env qa` |
| `CK_ENV` var | `production` | `qa` |
| Email routing | events@ -> production Worker | none |
| Search engines | indexed | `noindex` via `_headers`, plus Cloudflare Access |

## One-time setup (Cloudflare dashboard, Lani's account)

Done from the repo already: `env.qa` in `wrangler.jsonc`, the `_headers` rule, and the QA D1 database with the production schema.

Still to do in the dashboard (needs an account member or an API token with Workers, D1, DNS and Access permissions):

1. **Workers Builds for QA.** Workers & Pages -> Create -> Import a repository -> `LLSP-85/citykid-site`. Name the Worker `citykid-qa` (must match `env.qa.name`). Production branch: `qa`. Build command: none for now (`npm run build` once Vite lands). Deploy command: `npx wrangler deploy --env qa`. Save. The first build creates the custom domain `qa1.citykidbk.com` and its DNS record automatically, because the route is declared with `custom_domain: true`.
2. **Cloudflare Access in front of qa1.** Zero Trust -> Access -> Applications -> Add -> Self-hosted. Domain `qa1.citykidbk.com`. Policy: Allow, include Emails = Lani's and Michael's addresses. Login method: one-time PIN. Free for up to 50 users. This is what keeps parents and crawlers out; `_headers` is a backstop.
3. Optional: enable **Preview URLs** on the `citykid-qa` Worker so every non-`qa` branch build gets a `<branch>-citykid-qa.<account>.workers.dev` link for PR review. Those previews share the QA database and are not behind Access, so leave it off if that bothers you.

## Branch flow

- Feature branches are cut from `qa` and merged back into `qa` by PR. Merging to `qa` deploys qa1 in about two minutes.
- When qa1 looks right, open a PR from `qa` into `main`. Merging deploys production.
- The sweep commits event data to `main` twice a week. Merge `main` into `qa` regularly (or before each QA test) so QA shows current events. Once the data lives in its own file (`data.js`, roadmap CK-21), those merges stop conflicting with feature work.
- Until the Mac sweep is retired (roadmap CK-13), do not merge anything that changes `index.html` into `main`; the sweep overwrites it. `qa` is safe to change freely.

## Things that must stay QA-only

- Never run the sweep against `qa` or point it at `citykid-inbox-qa`. The runner works on `main` only.
- Never ping IndexNow from a QA build.
- Analytics: GoatCounter will count QA visits until the page gates the script on hostname (`citykidbk.com` / `www.citykidbk.com` only). Do this in the same change that splits the data out, or as a build-time flag once Vite lands.
- The `/submit` and `/subscribe` forms on qa1 write to the QA database, which is the point; nothing from there is ever imported into production.

## Local development

`npx wrangler dev` runs the Worker, the static assets, and a local D1 on localhost via Miniflare, which covers the current single-file site with no Docker required. After the Vite migration, use `@cloudflare/vite-plugin` so `vite dev` runs the same Worker runtime alongside the frontend with hot reload. A Docker container on the home network running `wrangler dev --ip 0.0.0.0 --port 8787` works if you want a LAN-reachable copy, but qa1 behind Access already gives Lani a stable phone-friendly URL, so Docker is for your own loop rather than hers.

## Removing it

Delete the `citykid-qa` Worker and its Workers Builds config, delete the Access application, delete the `citykid-inbox-qa` database, remove `env.qa` from `wrangler.jsonc`. Production is untouched throughout.
