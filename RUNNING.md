# Hotel Revenue Manager: how to run the application

Stanley Ogbumuo\
Bowie State University, Department of Computer Science\
COSC 565/369 Software Engineering 1

This document takes a machine with nothing installed and ends with the
application running in a browser. Every command is given in full. Where a
command differs between the two terminals you will need, the working directory
is stated above it.

---

## 1. What the machine needs first

| Requirement | Version | Check it with | Where to get it |
|---|---|---|---|
| Node.js | 20 or later | `node -v` | https://nodejs.org |
| npm | 10 or later | `npm -v` | ships with Node.js |
| PostgreSQL | 14 or later | `psql --version` | https://www.postgresql.org/download |
| Git | any recent | `git --version` | https://git-scm.com |

Development was done on Node 23.5.0 and npm 10.9.2.

PostgreSQL can be a local install or a hosted database. Any Postgres connection
string will work, so a free hosted instance from Neon, Supabase or Railway is a
valid substitute for installing the server locally.

---

## 2. Get the code

```bash
git clone <repository-url>
cd hotel-revenue-manager
```

The repository holds two applications in one tree:

| Path | What it is | Runs on |
|---|---|---|
| repository root | Express API and the pricing engine | port 5001 |
| `frontend/` | React single page application | port 3000 |

They are installed and started separately. Both must be running.

---

## 3. Create the environment file

Copy the template and fill it in:

```bash
cp .env.example .env
```

Open `.env` and set the values:

| Variable | Required | What it is |
|---|---|---|
| `DATABASE_URL` | **yes** | PostgreSQL connection string, for example `postgresql://postgres:password@localhost:5432/hotel_revenue` |
| `JWT_SECRET` | **yes** | any long random string, used to sign session tokens |
| `COMPETITOR_PRICE_PROVIDER` | no | `booking`, `serpapi` or `hotellens`. Defaults to `booking` |
| `RAPIDAPI_KEY` | only for `booking` or `hotellens` | key from https://rapidapi.com |
| `SERPAPI_KEY` | only for `serpapi` | key from https://serpapi.com |
| `TICKETMASTER_API_KEY` | no | key from https://developer.ticketmaster.com, used to pull local events |
| `PORT` | no | API port, defaults to 5001 |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**The application starts and runs without the three API keys.** Competitor rates
and event listings will simply come back empty, and the pricing engine falls
back to each room type's base price. Every other feature works. Add the keys to
see live market data.

`.env` is listed in `.gitignore` and is never committed. `.env.example`
documents the variable names only and holds no real values.

---

## 4. Create the database schema

With `DATABASE_URL` pointing at an empty database, from the repository root:

```bash
npm install
npx prisma db push
```

`npm install` also runs `prisma generate` automatically through the
`postinstall` script, so the Prisma client is built for you.

`prisma db push` reads `prisma/schema.prisma` and creates all eleven tables.
The project uses the `db push` workflow rather than migration files, so there is
no `prisma/migrations` directory and nothing further to apply.

To confirm the schema landed:

```bash
npx prisma studio
```

That opens a database browser at http://localhost:5555. Close it before
continuing; it is a convenience, not part of the application.

---

## 5. Start the application

You need **two terminals**, both open at the project. Getting the working
directory wrong is the most common setup mistake, so each is stated explicitly.

### Terminal 1: the API

Working directory: **the repository root**

```bash
npm install
npm run dev
```

Expected output:

```
API server running on http://localhost:5001
```

Leave this terminal running.

### Terminal 2: the React frontend

Working directory: **`frontend/`**

```bash
cd frontend
npm install
npm start
```

The first install takes a few minutes. A browser opens at
http://localhost:3000 by itself. If it does not, open that address manually.

`frontend/package.json` sets `"proxy": "http://localhost:5001"`, so the React
development server forwards every `/api/...` request to the API. No additional
configuration is needed and no CORS setup is required in development.

### Confirm both are up

```bash
curl http://localhost:5001/api/health
```

A healthy API returns JSON with a success status.

---

## 6. Create the first account

Open http://localhost:3000 and use **Register**. Provide a name, an email
address and a password of at least eight characters.

Registration does two things worth knowing:

1. The password is hashed with bcrypt at cost 12 before anything is stored. The
   plain password is never written to the database and cannot be recovered.
2. The email domain determines the organisation. Registering as
   `you@yourhotel.com` creates an organisation for `yourhotel.com`, and the next
   person registering with that domain joins the same organisation and sees the
   same properties.

### Promoting an account to super administrator

By design there is no screen that grants elevated access. It is done from the
command line against the database, so no web request can escalate a role:

```bash
node scripts/promote-super-admin.js you@yourhotel.com
```

---

## 7. Using the application

A short path through the main features:

1. **Hotels.** Create a hotel with its address, city and star rating.
2. **Room types.** Add at least one room type with a base price and a capacity.
3. **Competitors.** Attach two or three competing properties to the hotel.
   Without competitors the pricing engine has no market to read and will fall
   back to the base price.
4. **Events.** The events screen pulls what is on in the hotel's city from
   Ticketmaster, and you can add an event by hand and set its impact score from
   1 to 10.
5. **Pricing.** Choose a room type and a date to get a recommended nightly rate,
   the strategies available for that property, and the evidence the figure was
   built from.
6. **Group rates.** Record a contracted rate over a date range. For the nights
   it covers, no recommendation will fall below it.
7. **Reports and reminders.** Compare your rate position against the competitor
   set over time, and keep dated reminders against a property.

The city on the hotel record must match the city on the events for those events
to be found. The match is exact, so `New Carrollton` and `New carrollton` are
treated as different cities.

---

## 8. Running the tests

From the repository root:

```bash
npm test
```

Expected result:

```
ℹ tests 17
ℹ pass 17
ℹ fail 0
```

Seventeen tests run in well under a second. They cover the pricing engine in
`lib/pricing.js`: the competitor average, discarding rates of zero, rounding,
the demand bands, the cost floor required by FR-26, the contracted rate floor
required by FR-27, and the rules deciding which strategies are offered.

The tests need no database, no network and no environment file.
`lib/pricing.js` contains no `require` calls at all; it takes numbers and
returns numbers, which is what makes it testable in isolation.

The runner is Node's built in `node --test`. There is no test framework to
install.

---

## 9. Deploying

The project is built to run both as a normal Express server and as Vercel
serverless functions, from one set of handlers.

Each file under `api/` exports a plain `(req, res)` function. In development
`server.js` mounts those functions as Express routes. On Vercel the same files
are deployed as individual serverless functions, matched by their paths. There
is no second copy of the routing logic.

To deploy, connect the repository to Vercel and set the same environment
variables from section 3 in the Vercel project settings. The build command and
output directory are picked up from the configuration in the repository.

---

## 10. If something goes wrong

**`EADDRINUSE: address already in use :::5001`**

Something is already on port 5001, usually a previous API process that was not
stopped. Find and stop it:

```bash
lsof -ti:5001 | xargs kill
```

This also happens if `npm start` is run in the repository root by mistake. The
root has no `start` script, so npm falls back to `node server.js` and tries to
start a second API. The React application is started from `frontend/`, not from
the root.

**The browser shows the React app but every request fails**

The API in terminal 1 is not running. Check it with
`curl http://localhost:5001/api/health`.

**`Can't reach database server`**

`DATABASE_URL` is wrong, or PostgreSQL is not running. Test the string
directly with `npx prisma db push`, which reports the connection error in full.

**`@prisma/client did not initialize yet`**

The generated client is missing. Run `npx prisma generate` from the repository
root.

**Competitor rates and events are empty**

Either the API keys in `.env` are absent, or no competitors have been attached
to the hotel. The application is designed to continue working rather than fail
when a third party provider is unavailable, so empty results are handled
quietly rather than raised as errors.

**Pricing recommends exactly the base price**

There are no competitor rates for that hotel and date, so there is no market
average to anchor to. Attach competitors and confirm the API keys are set.
