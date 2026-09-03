# Hotel Revenue Manager

*Project One-Pager*

**A proposed web application that will tell a hotel what to charge for each room type on each date, priced against live competitor rates, local event demand, and the hotel's own cost floor.**

- **Type:** Multi-tenant web application (SaaS)
- **Stack:** React, Node.js with Express, PostgreSQL
- **Deployment:** Vercel (static build plus serverless functions)

## What the software will do

Small and independent hotels set their nightly rates by hand, usually from a spreadsheet and a guess about what the hotel down the road is charging. Hotel Revenue Manager will replace that guess with data. A revenue manager will register their property, define its room types and base rates, and pick a competitor set. The system will then pull three signals: what competitors are actually selling for on the online travel agencies, what events are happening in the city on those dates, and the hotel's own cost floor and pre-negotiated group rates. From those signals it will produce a recommended nightly rate for every room type and date.

Rather than issuing a single number, the pricing engine will return a set of named strategies (Balanced, Value Leader, Premium, High Demand, and Occupancy Focused) so that the manager keeps control of the decision. It will never recommend a rate below the cost floor, which is the cost per night plus a minimum margin, and never below a negotiated group rate already on the books for those dates.

**Planned capabilities**

- **Competitor rate tracking.** The system will import competitor properties and their live room rates for a given stay window, with an optional breakdown by travel agency so that the manager can see who is undercutting them and where.
- **Event-driven demand.** It will match concerts, conferences, and sports fixtures in the hotel's city to the dates being priced, score their likely impact, and raise the recommendation when demand is expected to spike.
- **Rate recommendations.** The engine will blend the competitor average with the event demand multiplier, then clamp the result to the cost floor before returning the five strategy options.
- **SMERF group rates.** Contracted Social, Military, Educational, Religious, and Fraternal rates will be stored by date range and room type, so that blocked-out group business is respected as a pricing floor.
- **Market and STAR reporting.** The application will chart the hotel's rate position against its competitor set over time, and keep a history of recommended against actual price and occupancy for review.
- **Team reminders.** Dated, prioritised tasks such as rate audits, contract renewals, and seasonal reviews will be shared across the organisation and tracked as pending, completed, or dismissed.

## Who will use it

Access will be organisation-scoped. A user who belongs to an organisation will see every hotel that organisation owns, while an independent user will see only the hotels they created. Roles will be stored on the user record and issued in the JWT at sign-in.

| Role | User | Responsibilities |
| --- | --- | --- |
| `USER` | Revenue manager | The primary user. Will register hotels, define room types and base rates, build the competitor set, review daily rate recommendations, maintain the SMERF calendar, and record the rate actually loaded into the booking system. |
| `ADMIN` | Hotel group administrator | Runs a portfolio for a small group or management company. Will see every property in the organisation from one dashboard, compare performance across them, and assign reminders to the team. |
| `SUPER_ADMIN` | Platform administrator | Operates the service itself. Will have visibility across all organisations for support, onboarding, and data integrity work. Will be promoted out of band by a maintenance script, never through the sign-up form. |

Organisation membership will be keyed on a unique email domain, so that a user signing up with a work address is joined to their group's tenant automatically rather than starting an isolated account.

## Technology

The following stack has been selected for the build.

| Layer | Technologies |
| --- | --- |
| User interface | React 18.2, React Router 6, MUI 5, Recharts 2, Axios, date-fns 3, Create React App with CRACO |
| API | Node.js 20, Express 4, JSON Web Tokens (`jsonwebtoken`), bcrypt, CORS, dotenv |
| Data | PostgreSQL, Prisma ORM 5, Prisma Migrate |
| External data | Booking.com via RapidAPI, Google Hotels via SerpApi, HotelLens via RapidAPI, Ticketmaster Discovery API v2 |
| Hosting | Vercel, serving the static front-end build alongside serverless functions, with Express for local development |

The same handler files will serve both environments. In production, each route folder under `api/` will be deployed as a Vercel serverless function. Locally, `server.js` will mount those identical handlers on an Express router, so that development and production run the same code path.

Competitor pricing will be fetched behind a provider interface, selected at runtime by the `COMPETITOR_PRICE_PROVIDER` environment variable. Swapping the data source between Booking.com, SerpApi, and HotelLens will then be a configuration change rather than a code change.

**How a request will flow**

1. **Browser.** The React single-page application will attach the stored JWT to every call through an Axios interceptor.
2. **API route.** An Express route in development, a Vercel function in production. It will verify the token and load the user together with their organisation.
3. **Services.** The pricing engine, plus the competitor and events providers that call the third-party APIs.
4. **PostgreSQL.** Reached only through the shared Prisma client. Every query will be filtered by organisation or owner.

## The user interface

The front end will be a single-page React application. A public landing page, sign-in, and registration will sit outside the session. Everything else will be wrapped in a protected route that redirects to sign-in when no valid token is present, and rendered inside a persistent layout with a sidebar and header.

| Screen | Purpose |
| --- | --- |
| `/dashboard` | Portfolio summary: properties, current recommendations, and upcoming demand. |
| `/hotels` | Every property the user can access, with its room types and competitor count. |
| `/hotels/:id` | One property in detail: rooms, rates, competitors, and history. |
| `/hotels/new`, `/hotels/:id/edit` | Create or amend a property, either by hand or by importing it from a travel agency listing. |
| `/competitors` | Live competitor rates for a stay window, broken down by travel agency. |
| `/events` | Calendar of local events with their impact scores for the dates being priced. |
| `/pricing` | Recommended rate and the five strategy options, per room type and date. |
| `/star-report` | Rate position against the competitor set, charted over time. |
| `/smerf` | Contracted group rates laid out by date range and room type. |
| `/reminders` | Team tasks by due date, priority, and status. |
| `/settings` | Account details, organisation, and the active competitor data source. |
| `/login`, `/register` | Credential sign-in and sign-up, issuing the session token. |

## Database connection

The application will store everything in a **PostgreSQL** database, reached through the **Prisma ORM**. The connection string will be supplied by the `DATABASE_URL` environment variable and will never be committed to source control. The typed client will be generated from the schema on install, and the schema itself will act as the single source of truth for the tables, relations, and indexes. One shared client instance will be reused across requests, cached on the global object in development so that hot reloads do not open a new connection pool each time.

The proposed schema is built around eleven models and four enums. The core of it:

| Model | Will hold |
| --- | --- |
| `Organization` | The tenant. Unique email domain, owning users, hotels, and reminders. |
| `User` | Credentials, hashed password, role, and organisation membership. |
| `Hotel` | The property: address, star rating, amenities, owner, and organisation. |
| `RoomType` | A sellable room category with its base price, capacity, and features. |
| `Competitor` | A rival property tracked against a hotel, with distance and star rating. |
| `Event` | A local event with dates, venue, expected attendance, and impact score. |
| `PricingHistory` | One room type on one date: recommended price, actual price, occupancy. |
| `CompetitorPrice` | A competitor's observed rate, attached to the pricing record it informed. |
| `SmerfRate` | A contracted group rate over a date range for one room type. |
| `Reminder` | A dated task with priority and status, scoped to an organisation. |

**Integrity and performance.** A unique constraint on hotel, room type, and date will keep the pricing history to one row per priced night. Events will be indexed by city and date range, SMERF rates by hotel, room type, and date range, and reminders by organisation with due date and status. Those are the three lookups the application will perform on every page load.
