<div align="center">

<img src="docs/hero.gif" alt="Pingback" width="100%" />

# Pingback

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![D1](https://img.shields.io/badge/D1-SQLite-003B57?logo=sqlite&logoColor=white)
![Runtime deps](https://img.shields.io/badge/runtime%20deps-0-DFE104)
![License](https://img.shields.io/badge/license-MIT-blue)

One link to your resume that tells you if it was really opened.

**[Live demo](https://pingback.air01aditya.workers.dev)**

</div>

## Why it's useful

When you paste a link into LinkedIn, WhatsApp or Slack, a bot opens it first to build a preview.
A normal click counter calls that an "open". Pingback doesn't.

- **One permanent link**, `/cv`, that opens your Google Drive resume straight away
- **Counts real people only:** link-preview bots and your own clicks are ignored
- **Private dashboard** with the count, the last open and a 30-day chart
- **No passwords:** each of your devices is set up once with a setup link
- **Free to run** on Cloudflare's free plan, with zero runtime dependencies

## Getting started

Needs Node.js 22.13+.

```bash
git clone https://github.com/air01aditya/pingback.git
cd pingback
npm install
cp .dev.vars.example .dev.vars     # paste the output of `npm run secret`
npm run db:migrate:local
npm run dev                        # http://localhost:8787
```

1. Open `http://localhost:8787/setup#key=<your SETUP_SECRET>` to remember this device.
2. Add your resume link on the dashboard at `/app`.
3. Share `http://localhost:8787/cv`.

Run the tests:

```bash
npm test
```

### Deploy your own

Needs a free Cloudflare account.

```bash
npx wrangler login
npx wrangler d1 create pingback        # put the database_id in wrangler.toml
npm run db:migrate:remote
npx wrangler secret put SETUP_SECRET
npm run deploy
```

## Getting help

Found a bug or have a question? [Open an issue](https://github.com/air01aditya/pingback/issues).

## Maintainer

Built and maintained by [Aditya Chandra Prajapati](https://github.com/air01aditya).
Issues and pull requests are welcome. Released under the [MIT License](LICENSE).
