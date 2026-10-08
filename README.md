# Hotel Revenue Manager

A web application that will recommend a nightly rate for every room type on
every date, priced against live competitor rates, local event demand and the
hotel's own cost floor.

The design is specified in [Requirements.md](Requirements.md), the backlog in
[Product-Backlog.md](Product-Backlog.md) and the models in
[UML-Design.pdf](UML-Design.pdf). The application is being built one user story
at a time, each on its own branch with a pull request.

## Progress

| Story | Title | Status |
| --- | --- | --- |
| [US-01](https://github.com/stanleyreubens/565_project/issues/1) | Register an account | In review |

## Running it locally

Requires Node.js 20 or later and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL and JWT_SECRET
npx prisma db push          # create the tables
npm start                   # http://localhost:5001
```

Open <http://localhost:5001> and the registration form is the landing page.

## Tests

```bash
npm test
```

The suite covers the validation rules and the register handler. It uses a stand
in for Prisma, so no database is needed to run it.

## Layout

```
api/auth/register-handler.js   the handler, with its dependencies passed in
api/auth/register.js           wires the real bcrypt, jsonwebtoken and Prisma
lib/validation.js              registration rules, shared by browser and API
lib/prisma.js                  one shared database client
prisma/schema.prisma           the schema
public/                        the registration page
server.js                      Express wiring
tests/                         unit tests
```

`lib/validation.js` is loaded by Node and served to the browser at
`/shared/validation.js`. Both sides apply the same rules from one file, so the
check the form makes cannot drift from the check the API makes.
