<div align="center">

<img src="docs/hero.gif" alt="Pingback" width="100%" />

# Pingback

One link to your resume that tells you if it was really opened.
Link-preview bots and your own clicks don't count.

**[Live demo](https://pingback.air01aditya.workers.dev)** · Cloudflare Workers · D1 · no runtime dependencies

</div>

## Run it yourself

```bash
npm install
cp .dev.vars.example .dev.vars     # paste the output of `npm run secret`
npm run db:migrate:local
npm run dev
```

Open `http://localhost:8787/setup#key=<SETUP_SECRET>` once, then add your resume link at `/app`.

## License

[MIT](LICENSE)
