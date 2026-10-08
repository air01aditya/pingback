# Pingback

**One link to your resume that tells you how many times it was really opened.**

**Live:** [pingback.air01aditya.workers.dev](https://pingback.air01aditya.workers.dev). Try the demo link there and watch the counter go up.

You apply to 50 roles and hear back from 3. The other 47 go silent, and you can't tell whether
your resume was rejected or never even opened.

Pingback gives you one permanent link, `/cv`, that you share everywhere you apply. Whoever opens
it lands on your Google Drive resume, and you see how many times it was opened, and when.

## Why counting clicks isn't enough

Paste a link into LinkedIn, WhatsApp, Slack or most email clients and a bot fetches it right away
to build a preview card, before any person clicks. A plain click counter would say "opened" the
moment you send it. Your own test clicks would count too.

Pingback sorts every visit into one of three kinds and only counts the first:

| Kind    | How it's detected                                   |
|---------|-----------------------------------------------------|
| `human` | everything else                                     |
| `bot`   | known preview and crawler user agents, or `HEAD` requests |
| `owner` | the request carries one of your remembered devices' cookies |

## How it works

```
                 ┌──────── one Cloudflare Worker ────────┐
Anyone ─────────▶  GET /cv   → 302 to your resume          │
                 │             → then record the visit     │
You ────────────▶  /app      → dashboard (your devices)    │
Visitor ────────▶  /         → landing page + demo link    │
                 └───────────────────┬─────────────────────┘
                                     ▼
                       D1 (SQLite): settings · clicks · devices
```

- **Redirect first, record second.** The visit is saved with `ctx.waitUntil` after the response
  has gone out, so a slow or failing database can never delay or break the click.
- **`302`, not `301`.** Browsers cache a `301` and would skip the server on later visits.
- **Only the owner can change anything.** The public can open `/cv` and `/demo`, nothing else, so
  the site can't be used to disguise someone else's links.
- **No passwords.** Each of your devices is set up once with a setup link. It gets a random token
  in an `HttpOnly`, `SameSite=Lax` cookie, and only its SHA-256 hash is stored. Any device can be
  removed from the dashboard.
- **Cross-site requests are rejected.** Any request that changes data must come from the same
  origin.
- **Zero runtime dependencies.** The Worker is plain JavaScript with its own small router. Pages
  are plain HTML, CSS and JS with a strict Content Security Policy.
- **Minimal data about visitors.** Browser type and approximate city and country, from
  Cloudflare. No IP addresses.

## Project structure

```
src/
├── index.js          # entry point: same-origin check, routing, errors
├── router.js         # small method + path router
├── handlers/         # HTTP layer: redirect, setup, stats, resume, devices
├── services/         # data layer: every SQL query lives here
└── lib/              # auth, validation, bot and browser detection, HTTP helpers
public/               # landing page, dashboard, device setup, demo resume
migrations/           # D1 schema
tests/                # node:test against an in-memory SQLite stand-in for D1
```

Handlers deal with HTTP (parsing input, status codes, cookies). Services deal with data. Neither
knows about the other's concerns.

## API

| Method | Route               | Access   | Description                                  |
|--------|---------------------|----------|----------------------------------------------|
| GET    | `/cv`               | public   | Redirect to the resume and record the visit  |
| GET    | `/demo`             | public   | Redirect to the sample resume (own counter)  |
| GET    | `/api/demo-stats`   | public   | Demo open count                              |
| POST   | `/api/setup`        | setup key | Remember this device                        |
| GET    | `/api/me`           | device   | Current device, renews its cookie            |
| GET    | `/api/stats`        | device   | Opens, last open, last 30 days of opens      |
| PUT    | `/api/resume`       | device   | Change where `/cv` points                    |
| GET    | `/api/devices`      | device   | List remembered devices                      |
| DELETE | `/api/devices/:id`  | device   | Remove a device                              |

## Running locally

Requires Node.js 22.13 or later.

```bash
npm install
cp .dev.vars.example .dev.vars    # then put the output of `npm run secret` in it
npm run db:migrate:local
npm run dev                       # http://localhost:8787
```

Open `http://localhost:8787/setup#key=<your SETUP_SECRET>` to remember this device, then add
your resume link on the dashboard at `/app`.

```bash
npm test
```

## Limitations

- **It counts opens, not people.** A recruiter who opens the link twice, or forwards it, adds
  more than one.
- **Bot detection is user-agent based.** A scanner that pretends to be a normal browser will
  count as a human.
- **The free `workers.dev` address** doesn't carry your name. A custom domain fixes that, but
  costs money.

## License

[MIT](LICENSE)
