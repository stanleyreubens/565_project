#!/usr/bin/env bash
# Creates one GitHub issue per Agile user story (item 4 of the requirements assignment).
# Requires the GitHub CLI: brew install gh && gh auth login
#
# Bodies are passed through heredocs so that blank lines and list markers survive.
set -euo pipefail

REPO="${1:-stanleyreubens/565_project}"

echo "Creating labels in $REPO"
gh label create "epic: accounts and access" --repo "$REPO" --color 0E8A6A --force >/dev/null 2>&1 || true
gh label create "epic: property setup" --repo "$REPO" --color 1F6FB4 --force >/dev/null 2>&1 || true
gh label create "epic: competitor tracking" --repo "$REPO" --color 8A5CF6 --force >/dev/null 2>&1 || true
gh label create "epic: event demand" --repo "$REPO" --color B4552C --force >/dev/null 2>&1 || true
gh label create "epic: pricing recommendations" --repo "$REPO" --color B41F5B --force >/dev/null 2>&1 || true
gh label create "epic: contracted group rates" --repo "$REPO" --color 2F8A0E --force >/dev/null 2>&1 || true
gh label create "epic: reporting" --repo "$REPO" --color 6B7280 --force >/dev/null 2>&1 || true
gh label create "epic: reminders" --repo "$REPO" --color 0EA5A5 --force >/dev/null 2>&1 || true
gh label create "epic: platform administration" --repo "$REPO" --color A16207 --force >/dev/null 2>&1 || true
gh label create "user story" --repo "$REPO" --color 5B21B6 --force >/dev/null 2>&1 || true

echo "Creating 32 issues"

echo "  US-01"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** hotel owner, **I want to** register an account with my name, email, and a password, **so that** I can keep my hotel's pricing data private to me.

### Acceptance criteria

- [ ] Submitting the form with a valid name, email, and password creates an account and signs me in
- [ ] My password is stored hashed and is absent from every API response
- [ ] Registering with an email that already exists is refused with a message telling me to sign in instead
- [ ] A password shorter than the minimum length is rejected before the form submits

### Details

| | |
| --- | --- |
| Epic | Accounts and access |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-1, FR-2 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-01: Register an account with my name, email, and a password" \
  --label "user story" --label "epic: accounts and access" \
  --body "$BODY"

echo "  US-02"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** registered user, **I want to** sign in with my email and password, **so that** I can get back to my properties on any machine.

### Acceptance criteria

- [ ] Correct credentials return a signed token and land me on the dashboard
- [ ] Incorrect credentials are refused without revealing which of the two was wrong
- [ ] The token is stored by the browser and attached to every later request

### Details

| | |
| --- | --- |
| Epic | Accounts and access |
| Story points | 2 |
| Priority | Must |
| Requirements | FR-3 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-02: Sign in with my email and password" \
  --label "user story" --label "epic: accounts and access" \
  --body "$BODY"

echo "  US-03"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** signed in user, **I want to** be returned to the sign in page when my session is no longer valid, **so that** I am never left looking at a screen that silently fails to load data.

### Acceptance criteria

- [ ] A request carrying an expired or invalid token is refused with 401
- [ ] The interface clears the stored token and redirects to sign in
- [ ] Visiting a protected address while signed out redirects rather than rendering an empty page

### Details

| | |
| --- | --- |
| Epic | Accounts and access |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-4, FR-8 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-03: Be returned to the sign in page when my session is no longer valid" \
  --label "user story" --label "epic: accounts and access" \
  --body "$BODY"

echo "  US-04"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** member of a hotel group, **I want to** have my account joined to my group automatically when I register with my work email, **so that** I see my colleagues' properties without an administrator setting me up by hand.

### Acceptance criteria

- [ ] Registering with an email whose domain matches an existing organisation joins that organisation
- [ ] Registering with an unrecognised domain creates a standalone account
- [ ] The organisation shown on my settings page is the one I was joined to

### Details

| | |
| --- | --- |
| Epic | Accounts and access |
| Story points | 5 |
| Priority | Should |
| Requirements | FR-5 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-04: Have my account joined to my group automatically when I register with my work email" \
  --label "user story" --label "epic: accounts and access" \
  --body "$BODY"

echo "  US-05"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** organisation administrator, **I want to** see every property my organisation owns from one place, **so that** I can compare the portfolio without signing in as each colleague.

### Acceptance criteria

- [ ] The hotel list returns all hotels belonging to my organisation
- [ ] A standalone user sees only hotels they created
- [ ] Requesting a hotel belonging to another organisation by its identifier is refused

### Details

| | |
| --- | --- |
| Epic | Accounts and access |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-6, FR-7 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-05: See every property my organisation owns from one place" \
  --label "user story" --label "epic: accounts and access" \
  --body "$BODY"

echo "  US-06"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** create a hotel record with its address, star rating, and amenities, **so that** the system knows which city and market to price against.

### Acceptance criteria

- [ ] A hotel can be created with at least a name and a city
- [ ] Star rating accepts half points and rejects values outside 1 to 5
- [ ] The new hotel appears in my hotel list immediately

### Details

| | |
| --- | --- |
| Epic | Property setup |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-9 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-06: Create a hotel record with its address, star rating, and amenities" \
  --label "user story" --label "epic: property setup" \
  --body "$BODY"

echo "  US-07"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** edit a hotel and mark it inactive rather than deleting it, **so that** I keep the pricing history of a property I no longer manage.

### Acceptance criteria

- [ ] Editing updates the record and preserves its identifier
- [ ] An inactive hotel is hidden from the default list but its history remains readable
- [ ] Deleting is offered only where no pricing history exists

### Details

| | |
| --- | --- |
| Epic | Property setup |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-10 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-07: Edit a hotel and mark it inactive rather than deleting it" \
  --label "user story" --label "epic: property setup" \
  --body "$BODY"

echo "  US-08"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** define the room types my hotel sells with a base price and capacity, **so that** recommendations are produced per room type instead of one price for the whole hotel.

### Acceptance criteria

- [ ] A room type requires a name, a base price, and a capacity
- [ ] Several room types can be attached to one hotel
- [ ] A base price of zero or less is rejected

### Details

| | |
| --- | --- |
| Epic | Property setup |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-11 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-08: Define the room types my hotel sells with a base price and capacity" \
  --label "user story" --label "epic: property setup" \
  --body "$BODY"

echo "  US-09"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** search for my property on a travel agency and import it, **so that** I do not have to type twenty room types by hand before the product is useful.

### Acceptance criteria

- [ ] Searching by property name and city returns candidate matches
- [ ] Importing creates the hotel and, where the provider returns them, its room types
- [ ] Imported records can be edited afterwards like any other
- [ ] Importing the same property twice does not create a duplicate

### Details

| | |
| --- | --- |
| Epic | Property setup |
| Story points | 8 |
| Priority | Should |
| Requirements | FR-12 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-09: Search for my property on a travel agency and import it" \
  --label "user story" --label "epic: property setup" \
  --body "$BODY"

echo "  US-10"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** attach competitor properties to my hotel, **so that** recommendations are anchored to the hotels I actually compete with.

### Acceptance criteria

- [ ] Competitors can be searched by name and city and attached to a hotel
- [ ] Each stored competitor keeps its provider identifier, star rating, and distance
- [ ] A competitor can be removed from the set

### Details

| | |
| --- | --- |
| Epic | Competitor tracking |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-13, FR-14 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-10: Attach competitor properties to my hotel" \
  --label "user story" --label "epic: competitor tracking" \
  --body "$BODY"

echo "  US-11"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see what my competitors are charging for a stay window I choose, **so that** I can judge my own rate against the market before I set it.

### Acceptance criteria

- [ ] I can set check in date, check out date, adults, and rooms
- [ ] Rates are retrieved for every competitor attached to the hotel
- [ ] Each rate shows the competitor name, the room described, and the nightly price
- [ ] A competitor returning no availability is shown as unavailable rather than as zero

### Details

| | |
| --- | --- |
| Epic | Competitor tracking |
| Story points | 8 |
| Priority | Must |
| Requirements | FR-15 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-11: See what my competitors are charging for a stay window I choose" \
  --label "user story" --label "epic: competitor tracking" \
  --body "$BODY"

echo "  US-12"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see which travel agency is quoting which price for the same competitor, **so that** I can tell whether a rival is genuinely cheaper or merely discounting on one channel.

### Acceptance criteria

- [ ] Where the active provider supports it, prices are broken down by agency
- [ ] Where it does not, the interface says the breakdown is unavailable for this provider rather than showing nothing

### Details

| | |
| --- | --- |
| Epic | Competitor tracking |
| Story points | 5 |
| Priority | Should |
| Requirements | FR-16 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-12: See which travel agency is quoting which price for the same competitor" \
  --label "user story" --label "epic: competitor tracking" \
  --body "$BODY"

echo "  US-13"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** be told clearly when competitor data cannot be retrieved, **so that** I do not mistake a failed request for a market with no competition.

### Acceptance criteria

- [ ] A provider error or timeout produces a visible message naming the problem
- [ ] Previously stored figures stay on screen and are marked as the last known values
- [ ] The rest of the application continues to work

### Details

| | |
| --- | --- |
| Epic | Competitor tracking |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-18 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-13: Be told clearly when competitor data cannot be retrieved" \
  --label "user story" --label "epic: competitor tracking" \
  --body "$BODY"

echo "  US-14"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** platform administrator, **I want to** switch the competitor data provider through configuration, **so that** I can move to a more reliable or cheaper source without a code change.

### Acceptance criteria

- [ ] The active provider is chosen by an environment variable
- [ ] An unrecognised value falls back to the default provider rather than failing to start
- [ ] The settings page reports which provider is active

### Details

| | |
| --- | --- |
| Epic | Competitor tracking |
| Story points | 3 |
| Priority | Should |
| Requirements | FR-17, FR-44 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-14: Switch the competitor data provider through configuration" \
  --label "user story" --label "epic: competitor tracking" \
  --body "$BODY"

echo "  US-15"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see the events happening in my city over the dates I am pricing, **so that** I do not underprice the night a festival fills every hotel in town.

### Acceptance criteria

- [ ] Events are retrieved for the hotel's city and the chosen date range
- [ ] Each event shows its name, venue, dates, and impact score
- [ ] A range with no events says so rather than appearing to have failed

### Details

| | |
| --- | --- |
| Epic | Event demand |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-19, FR-20, FR-22 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-15: See the events happening in my city over the dates I am pricing" \
  --label "user story" --label "epic: event demand" \
  --body "$BODY"

echo "  US-16"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** add an event the public listings do not carry, **so that** a large wedding or a local fixture still affects my pricing.

### Acceptance criteria

- [ ] An event can be created with a name, city, start and end dates, and an impact score
- [ ] A manually added event is marked as such and counts towards the demand calculation
- [ ] An end date before the start date is rejected

### Details

| | |
| --- | --- |
| Epic | Event demand |
| Story points | 3 |
| Priority | Must |
| Requirements | FR-21 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-16: Add an event the public listings do not carry" \
  --label "user story" --label "epic: event demand" \
  --body "$BODY"

echo "  US-17"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** change the impact score of an event, **so that** the calculation reflects what I know about my own market.

### Acceptance criteria

- [ ] The score can be set between 1 and 10
- [ ] Changing the score changes the recommendation for the affected dates
- [ ] The original source of the event is preserved

### Details

| | |
| --- | --- |
| Epic | Event demand |
| Story points | 2 |
| Priority | Must |
| Requirements | FR-21 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-17: Change the impact score of an event" \
  --label "user story" --label "epic: event demand" \
  --body "$BODY"

echo "  US-18"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see a recommended nightly rate for each room type on each date, **so that** I have a defensible starting point instead of a guess.

### Acceptance criteria

- [ ] A recommendation is produced for a given hotel, room type, and date
- [ ] The competitor average is used where competitor rates exist
- [ ] The room type's base price is used where none exist
- [ ] The recommendation is rounded to a whole unit of currency

### Details

| | |
| --- | --- |
| Epic | Pricing recommendations |
| Story points | 8 |
| Priority | Must |
| Requirements | FR-23, FR-24 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-18: See a recommended nightly rate for each room type on each date" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "$BODY"

echo "  US-19"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** be offered several pricing strategies rather than one number, **so that** I choose a market position rather than accept whatever the system says.

### Acceptance criteria

- [ ] Balanced, Value Leader, and Occupancy Focused are always returned
- [ ] Premium is returned for properties of four stars or more
- [ ] High Demand is returned when the event multiplier is large enough
- [ ] Each strategy shows its price and a short explanation

### Details

| | |
| --- | --- |
| Epic | Pricing recommendations |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-28 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-19: Be offered several pricing strategies rather than one number" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "$BODY"

echo "  US-20"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see the evidence behind a recommendation, **so that** I can trust it enough to act on it, and argue for it to an owner.

### Acceptance criteria

- [ ] The competitor average used is displayed
- [ ] The events counted and their combined impact are displayed
- [ ] The floor applied is named, whether cost based or group rate based

### Details

| | |
| --- | --- |
| Epic | Pricing recommendations |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-29 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-20: See the evidence behind a recommendation" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "$BODY"

echo "  US-21"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** hotel owner, **I want to** never be shown a recommendation below my cost floor, **so that** the system cannot talk me into selling a room at a loss.

### Acceptance criteria

- [ ] The cost floor is the cost per night plus the minimum margin
- [ ] A competitor average below the floor still produces a recommendation at the floor
- [ ] The interface indicates when the floor has overridden the market

### Details

| | |
| --- | --- |
| Epic | Pricing recommendations |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-26 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-21: Never be shown a recommendation below my cost floor" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "$BODY"

echo "  US-22"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** record the rate I actually loaded and the occupancy I achieved, **so that** I can judge over time whether the recommendations are any good.

### Acceptance criteria

- [ ] Actual price and occupancy can be entered against a date
- [ ] Recommended and actual prices are held on the same record
- [ ] Entering a second value for the same date updates the record rather than creating another

### Details

| | |
| --- | --- |
| Epic | Pricing recommendations |
| Story points | 5 |
| Priority | Should |
| Requirements | FR-30, FR-31 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-22: Record the rate I actually loaded and the occupancy I achieved" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "$BODY"

echo "  US-23"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** record a contracted group rate over a date range, **so that** the system prices around business I have already committed.

### Acceptance criteria

- [ ] A rate can be recorded for one room type with a start date, an end date, and a value
- [ ] A group name, segment, and notes can be attached
- [ ] An end date before the start date is rejected
- [ ] The rate can be edited and deleted

### Details

| | |
| --- | --- |
| Epic | Contracted group rates |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-32, FR-33, FR-34 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-23: Record a contracted group rate over a date range" \
  --label "user story" --label "epic: contracted group rates" \
  --body "$BODY"

echo "  US-24"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** have a contracted rate act as the floor for the dates it covers, **so that** I am not recommended a price below a rate I have already signed.

### Acceptance criteria

- [ ] Where a group rate covers the date and exceeds the cost floor, it becomes the floor
- [ ] Where it falls below the cost floor, the cost floor still applies
- [ ] The interface names which floor was used

### Details

| | |
| --- | --- |
| Epic | Contracted group rates |
| Story points | 5 |
| Priority | Must |
| Requirements | FR-27 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-24: Have a contracted rate act as the floor for the dates it covers" \
  --label "user story" --label "epic: contracted group rates" \
  --body "$BODY"

echo "  US-25"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see contracted rates laid out on a calendar, **so that** I can see at a glance which nights are already committed.

### Acceptance criteria

- [ ] Rates for a chosen hotel are shown across a date range
- [ ] Overlapping contracts for different room types are both visible

### Details

| | |
| --- | --- |
| Epic | Contracted group rates |
| Story points | 3 |
| Priority | Should |
| Requirements | FR-35 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-25: See contracted rates laid out on a calendar" \
  --label "user story" --label "epic: contracted group rates" \
  --body "$BODY"

echo "  US-26"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** see my rate position against my competitor set over time, **so that** I can tell whether I am drifting expensive or cheap across a season.

### Acceptance criteria

- [ ] A chart plots the hotel's rate and the competitor average across a date range
- [ ] The date range is selectable
- [ ] A range with no data is stated rather than drawn as an empty chart

### Details

| | |
| --- | --- |
| Epic | Reporting |
| Story points | 8 |
| Priority | Should |
| Requirements | FR-36, FR-37 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-26: See my rate position against my competitor set over time" \
  --label "user story" --label "epic: reporting" \
  --body "$BODY"

echo "  US-27"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** review recommended against actual rates and the occupancy that followed, **so that** I can see whether following the recommendations improved anything.

### Acceptance criteria

- [ ] A table lists date, recommended price, actual price, and occupancy
- [ ] Rows where no actual price was recorded are visibly incomplete rather than blank

### Details

| | |
| --- | --- |
| Epic | Reporting |
| Story points | 5 |
| Priority | Could |
| Requirements | FR-38 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-27: Review recommended against actual rates and the occupancy that followed" \
  --label "user story" --label "epic: reporting" \
  --body "$BODY"

echo "  US-28"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** create a reminder with a due date and a priority, **so that** a rate audit or a contract renewal does not slip.

### Acceptance criteria

- [ ] A reminder requires a title and a due date
- [ ] Priority and an optional hotel can be attached
- [ ] It appears in the reminder list on creation

### Details

| | |
| --- | --- |
| Epic | Reminders |
| Story points | 3 |
| Priority | Should |
| Requirements | FR-39 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-28: Create a reminder with a due date and a priority" \
  --label "user story" --label "epic: reminders" \
  --body "$BODY"

echo "  US-29"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** revenue manager, **I want to** mark a reminder complete or dismiss it, **so that** the list reflects what is actually outstanding.

### Acceptance criteria

- [ ] Completing sets the status and removes it from the outstanding list
- [ ] Dismissing is distinguishable from completing
- [ ] Neither action deletes the record

### Details

| | |
| --- | --- |
| Epic | Reminders |
| Story points | 2 |
| Priority | Should |
| Requirements | FR-40 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-29: Mark a reminder complete or dismiss it" \
  --label "user story" --label "epic: reminders" \
  --body "$BODY"

echo "  US-30"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** team member, **I want to** see what is due soon separately from what is already overdue, **so that** I deal with the late items first.

### Acceptance criteria

- [ ] Reminders due within the coming period are listed as upcoming
- [ ] Reminders past their due date and still outstanding are listed as overdue
- [ ] Both lists are limited to my organisation

### Details

| | |
| --- | --- |
| Epic | Reminders |
| Story points | 3 |
| Priority | Should |
| Requirements | FR-41, FR-42 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-30: See what is due soon separately from what is already overdue" \
  --label "user story" --label "epic: reminders" \
  --body "$BODY"

echo "  US-31"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** platform administrator, **I want to** be elevated only by a script run against the database, **so that** nobody can grant themselves administrative access through the interface.

### Acceptance criteria

- [ ] A maintenance script promotes a named account
- [ ] No endpoint accepts a role change from the client
- [ ] Registration always creates a standard user

### Details

| | |
| --- | --- |
| Epic | Platform administration |
| Story points | 2 |
| Priority | Must |
| Requirements | FR-43 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-31: Be elevated only by a script run against the database" \
  --label "user story" --label "epic: platform administration" \
  --body "$BODY"

echo "  US-32"
read -r -d '' BODY <<'BODY_EOF' || true
**As a** platform administrator, **I want to** check that the deployed service is alive, **so that** I can tell a broken deployment from a broken feature.

### Acceptance criteria

- [ ] A health endpoint returns a success status and a timestamp
- [ ] It requires no authentication
- [ ] It does not disclose configuration or version detail

### Details

| | |
| --- | --- |
| Epic | Platform administration |
| Story points | 1 |
| Priority | Should |
| Requirements | FR-45 |

Specified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md).
BODY_EOF
gh issue create --repo "$REPO" \
  --title "US-32: Check that the deployed service is alive" \
  --label "user story" --label "epic: platform administration" \
  --body "$BODY"

echo "Done. View them: gh issue list --repo $REPO --limit 40"
