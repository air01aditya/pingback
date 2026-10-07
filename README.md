# Pingback

**Know when a recruiter actually opens your resume.**

When you apply to 50 places, you send the same resume link 50 times and hear back from three.
You never find out whether the other 47 even looked. Pingback gives every application its own
short link, so you can see which company opened your resume, when, and how often.

## The problem with "opened"

Paste any link into LinkedIn, Slack, WhatsApp or most email clients and a bot fetches it right
away to build a preview card, before any person clicks. A plain click counter would say
"opened" for every link you've sent, which makes it useless.

Pingback records every hit but classifies it by user agent. Preview bots are still redirected
and logged, but they're kept out of the "opens" count. The dashboard shows both numbers, so you
can tell "LinkedIn rendered a preview" apart from "someone at the company clicked it".

## Features

- One short link per application, labelled with the company and role
- Redirects with `302` so every visit reaches the server (a `301` would get cached by the browser)
- Separates human opens from link-preview bots
- Shows an activity log for each link: when it was opened and from what browser
- Dashboard shows how many applications have been opened

## Tech stack

| Layer    | Choice                                   |
|----------|------------------------------------------|
| Backend  | Node.js, Express 5                       |
| Database | SQLite (better-sqlite3)                  |
| Frontend | React 19, Vite                           |
| Tests    | Node's built-in test runner + Supertest  |

## Project structure

```
pingback/
├── backend/
│   ├── src/
│   │   ├── index.js            # starts the server
│   │   ├── app.js              # middleware + route mounting
│   │   ├── config/env.js       # all environment config in one place
│   │   ├── db/                 # connection + schema.sql
│   │   ├── routes/             # URL → controller mapping
│   │   ├── controllers/        # request validation + responses
│   │   ├── services/           # database queries
│   │   ├── middleware/         # 404 + central error handler
│   │   └── utils/              # code generator, bot detection, HttpError
│   └── tests/
└── frontend/
    └── src/
        ├── api/                # fetch wrapper for the backend
        ├── components/
        └── utils/
```

Requests flow **route → controller → service → database**. Controllers deal with HTTP
(validating input, choosing status codes) and services deal with data, so the SQL never
touches `req`/`res`.

## Database

```
links                          clicks
─────────────                  ──────────────────────
id          PK                 id          PK
code        UNIQUE             link_id     FK → links.id (ON DELETE CASCADE)
target_url                     clicked_at
label                          user_agent
created_at                     referrer
                               is_bot
```

Clicks are stored as individual rows rather than a counter on `links`, so the activity log
and the human/bot split can both be computed from one table. `clicks.link_id` is indexed
because every dashboard query joins on it.

## API

| Method | Route             | Description                               |
|--------|-------------------|-------------------------------------------|
| GET    | `/api/links`      | All links with open counts                |
| GET    | `/api/links/:id`  | One link plus its latest 100 clicks       |
| POST   | `/api/links`      | Create a link (`{ label, targetUrl }`)    |
| DELETE | `/api/links/:id`  | Delete a link and its click history       |
| GET    | `/:code`          | Record the visit and redirect             |
| GET    | `/api/health`     | Health check                              |

Errors always come back as `{ "error": "message" }` with a matching status code
(`400` for bad input, `404` for missing links, `500` for anything unexpected).

## Running locally

Requires Node.js 22+.

```bash
# backend — runs on http://localhost:4000
cd backend
npm install
npm run dev

# frontend — runs on http://localhost:5173, proxies /api to the backend
cd frontend
npm install
npm run dev
```

Copy `backend/.env.example` to `backend/.env` to change the port, public base URL or
database path.

```bash
cd backend
npm test
```

## Known limitations

- **No accounts yet.** It's single-user, and anyone who can reach the API can see the links.
  Authentication is the next thing to add.
- **Bot detection is user-agent based.** It catches the common previewers, but some corporate
  email scanners pretend to be a normal browser and will still count as an open.
- **SQLite** is fine for one user. Moving to PostgreSQL only means rewriting the services layer.
