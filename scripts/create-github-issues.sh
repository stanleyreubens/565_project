#!/usr/bin/env bash
# Creates one GitHub issue per Agile user story (item 4 of the requirements assignment).
# Requires the GitHub CLI: brew install gh && gh auth login
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
gh issue create --repo "$REPO" \
  --title "US-01: Register an account with my name, email, and a password" \
  --label "user story" --label "epic: accounts and access" \
  --body "**As a** hotel owner, **I want to** register an account with my name, email, and a password, **so that** I can keep my hotel's pricing data private to me.\n\n### Acceptance criteria\n\n- [ ] Submitting the form with a valid name, email, and password creates an account and signs me in\n- [ ] My password is stored hashed and is absent from every API response\n- [ ] Registering with an email that already exists is refused with a message telling me to sign in instead\n- [ ] A password shorter than the minimum length is rejected before the form submits\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Accounts and access |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-1, FR-2 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-02"
gh issue create --repo "$REPO" \
  --title "US-02: Sign in with my email and password" \
  --label "user story" --label "epic: accounts and access" \
  --body "**As a** registered user, **I want to** sign in with my email and password, **so that** I can get back to my properties on any machine.\n\n### Acceptance criteria\n\n- [ ] Correct credentials return a signed token and land me on the dashboard\n- [ ] Incorrect credentials are refused without revealing which of the two was wrong\n- [ ] The token is stored by the browser and attached to every later request\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Accounts and access |\n| Story points | 2 |\n| Priority | Must |\n| Requirements | FR-3 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-03"
gh issue create --repo "$REPO" \
  --title "US-03: Be returned to the sign in page when my session is no longer valid" \
  --label "user story" --label "epic: accounts and access" \
  --body "**As a** signed in user, **I want to** be returned to the sign in page when my session is no longer valid, **so that** I am never left looking at a screen that silently fails to load data.\n\n### Acceptance criteria\n\n- [ ] A request carrying an expired or invalid token is refused with 401\n- [ ] The interface clears the stored token and redirects to sign in\n- [ ] Visiting a protected address while signed out redirects rather than rendering an empty page\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Accounts and access |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-4, FR-8 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-04"
gh issue create --repo "$REPO" \
  --title "US-04: Have my account joined to my group automatically when I register with my work email" \
  --label "user story" --label "epic: accounts and access" \
  --body "**As a** member of a hotel group, **I want to** have my account joined to my group automatically when I register with my work email, **so that** I see my colleagues' properties without an administrator setting me up by hand.\n\n### Acceptance criteria\n\n- [ ] Registering with an email whose domain matches an existing organisation joins that organisation\n- [ ] Registering with an unrecognised domain creates a standalone account\n- [ ] The organisation shown on my settings page is the one I was joined to\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Accounts and access |\n| Story points | 5 |\n| Priority | Should |\n| Requirements | FR-5 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-05"
gh issue create --repo "$REPO" \
  --title "US-05: See every property my organisation owns from one place" \
  --label "user story" --label "epic: accounts and access" \
  --body "**As a** organisation administrator, **I want to** see every property my organisation owns from one place, **so that** I can compare the portfolio without signing in as each colleague.\n\n### Acceptance criteria\n\n- [ ] The hotel list returns all hotels belonging to my organisation\n- [ ] A standalone user sees only hotels they created\n- [ ] Requesting a hotel belonging to another organisation by its identifier is refused\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Accounts and access |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-6, FR-7 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-06"
gh issue create --repo "$REPO" \
  --title "US-06: Create a hotel record with its address, star rating, and amenities" \
  --label "user story" --label "epic: property setup" \
  --body "**As a** revenue manager, **I want to** create a hotel record with its address, star rating, and amenities, **so that** the system knows which city and market to price against.\n\n### Acceptance criteria\n\n- [ ] A hotel can be created with at least a name and a city\n- [ ] Star rating accepts half points and rejects values outside 1 to 5\n- [ ] The new hotel appears in my hotel list immediately\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Property setup |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-9 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-07"
gh issue create --repo "$REPO" \
  --title "US-07: Edit a hotel and mark it inactive rather than deleting it" \
  --label "user story" --label "epic: property setup" \
  --body "**As a** revenue manager, **I want to** edit a hotel and mark it inactive rather than deleting it, **so that** I keep the pricing history of a property I no longer manage.\n\n### Acceptance criteria\n\n- [ ] Editing updates the record and preserves its identifier\n- [ ] An inactive hotel is hidden from the default list but its history remains readable\n- [ ] Deleting is offered only where no pricing history exists\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Property setup |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-10 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-08"
gh issue create --repo "$REPO" \
  --title "US-08: Define the room types my hotel sells with a base price and capacity" \
  --label "user story" --label "epic: property setup" \
  --body "**As a** revenue manager, **I want to** define the room types my hotel sells with a base price and capacity, **so that** recommendations are produced per room type instead of one price for the whole hotel.\n\n### Acceptance criteria\n\n- [ ] A room type requires a name, a base price, and a capacity\n- [ ] Several room types can be attached to one hotel\n- [ ] A base price of zero or less is rejected\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Property setup |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-11 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-09"
gh issue create --repo "$REPO" \
  --title "US-09: Search for my property on a travel agency and import it" \
  --label "user story" --label "epic: property setup" \
  --body "**As a** revenue manager, **I want to** search for my property on a travel agency and import it, **so that** I do not have to type twenty room types by hand before the product is useful.\n\n### Acceptance criteria\n\n- [ ] Searching by property name and city returns candidate matches\n- [ ] Importing creates the hotel and, where the provider returns them, its room types\n- [ ] Imported records can be edited afterwards like any other\n- [ ] Importing the same property twice does not create a duplicate\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Property setup |\n| Story points | 8 |\n| Priority | Should |\n| Requirements | FR-12 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-10"
gh issue create --repo "$REPO" \
  --title "US-10: Attach competitor properties to my hotel" \
  --label "user story" --label "epic: competitor tracking" \
  --body "**As a** revenue manager, **I want to** attach competitor properties to my hotel, **so that** recommendations are anchored to the hotels I actually compete with.\n\n### Acceptance criteria\n\n- [ ] Competitors can be searched by name and city and attached to a hotel\n- [ ] Each stored competitor keeps its provider identifier, star rating, and distance\n- [ ] A competitor can be removed from the set\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Competitor tracking |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-13, FR-14 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-11"
gh issue create --repo "$REPO" \
  --title "US-11: See what my competitors are charging for a stay window I choose" \
  --label "user story" --label "epic: competitor tracking" \
  --body "**As a** revenue manager, **I want to** see what my competitors are charging for a stay window I choose, **so that** I can judge my own rate against the market before I set it.\n\n### Acceptance criteria\n\n- [ ] I can set check in date, check out date, adults, and rooms\n- [ ] Rates are retrieved for every competitor attached to the hotel\n- [ ] Each rate shows the competitor name, the room described, and the nightly price\n- [ ] A competitor returning no availability is shown as unavailable rather than as zero\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Competitor tracking |\n| Story points | 8 |\n| Priority | Must |\n| Requirements | FR-15 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-12"
gh issue create --repo "$REPO" \
  --title "US-12: See which travel agency is quoting which price for the same competitor" \
  --label "user story" --label "epic: competitor tracking" \
  --body "**As a** revenue manager, **I want to** see which travel agency is quoting which price for the same competitor, **so that** I can tell whether a rival is genuinely cheaper or merely discounting on one channel.\n\n### Acceptance criteria\n\n- [ ] Where the active provider supports it, prices are broken down by agency\n- [ ] Where it does not, the interface says the breakdown is unavailable for this provider rather than showing nothing\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Competitor tracking |\n| Story points | 5 |\n| Priority | Should |\n| Requirements | FR-16 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-13"
gh issue create --repo "$REPO" \
  --title "US-13: Be told clearly when competitor data cannot be retrieved" \
  --label "user story" --label "epic: competitor tracking" \
  --body "**As a** revenue manager, **I want to** be told clearly when competitor data cannot be retrieved, **so that** I do not mistake a failed request for a market with no competition.\n\n### Acceptance criteria\n\n- [ ] A provider error or timeout produces a visible message naming the problem\n- [ ] Previously stored figures stay on screen and are marked as the last known values\n- [ ] The rest of the application continues to work\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Competitor tracking |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-18 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-14"
gh issue create --repo "$REPO" \
  --title "US-14: Switch the competitor data provider through configuration" \
  --label "user story" --label "epic: competitor tracking" \
  --body "**As a** platform administrator, **I want to** switch the competitor data provider through configuration, **so that** I can move to a more reliable or cheaper source without a code change.\n\n### Acceptance criteria\n\n- [ ] The active provider is chosen by an environment variable\n- [ ] An unrecognised value falls back to the default provider rather than failing to start\n- [ ] The settings page reports which provider is active\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Competitor tracking |\n| Story points | 3 |\n| Priority | Should |\n| Requirements | FR-17, FR-44 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-15"
gh issue create --repo "$REPO" \
  --title "US-15: See the events happening in my city over the dates I am pricing" \
  --label "user story" --label "epic: event demand" \
  --body "**As a** revenue manager, **I want to** see the events happening in my city over the dates I am pricing, **so that** I do not underprice the night a festival fills every hotel in town.\n\n### Acceptance criteria\n\n- [ ] Events are retrieved for the hotel's city and the chosen date range\n- [ ] Each event shows its name, venue, dates, and impact score\n- [ ] A range with no events says so rather than appearing to have failed\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Event demand |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-19, FR-20, FR-22 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-16"
gh issue create --repo "$REPO" \
  --title "US-16: Add an event the public listings do not carry" \
  --label "user story" --label "epic: event demand" \
  --body "**As a** revenue manager, **I want to** add an event the public listings do not carry, **so that** a large wedding or a local fixture still affects my pricing.\n\n### Acceptance criteria\n\n- [ ] An event can be created with a name, city, start and end dates, and an impact score\n- [ ] A manually added event is marked as such and counts towards the demand calculation\n- [ ] An end date before the start date is rejected\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Event demand |\n| Story points | 3 |\n| Priority | Must |\n| Requirements | FR-21 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-17"
gh issue create --repo "$REPO" \
  --title "US-17: Change the impact score of an event" \
  --label "user story" --label "epic: event demand" \
  --body "**As a** revenue manager, **I want to** change the impact score of an event, **so that** the calculation reflects what I know about my own market.\n\n### Acceptance criteria\n\n- [ ] The score can be set between 1 and 10\n- [ ] Changing the score changes the recommendation for the affected dates\n- [ ] The original source of the event is preserved\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Event demand |\n| Story points | 2 |\n| Priority | Must |\n| Requirements | FR-21 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-18"
gh issue create --repo "$REPO" \
  --title "US-18: See a recommended nightly rate for each room type on each date" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "**As a** revenue manager, **I want to** see a recommended nightly rate for each room type on each date, **so that** I have a defensible starting point instead of a guess.\n\n### Acceptance criteria\n\n- [ ] A recommendation is produced for a given hotel, room type, and date\n- [ ] The competitor average is used where competitor rates exist\n- [ ] The room type's base price is used where none exist\n- [ ] The recommendation is rounded to a whole unit of currency\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Pricing recommendations |\n| Story points | 8 |\n| Priority | Must |\n| Requirements | FR-23, FR-24 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-19"
gh issue create --repo "$REPO" \
  --title "US-19: Be offered several pricing strategies rather than one number" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "**As a** revenue manager, **I want to** be offered several pricing strategies rather than one number, **so that** I choose a market position rather than accept whatever the system says.\n\n### Acceptance criteria\n\n- [ ] Balanced, Value Leader, and Occupancy Focused are always returned\n- [ ] Premium is returned for properties of four stars or more\n- [ ] High Demand is returned when the event multiplier is large enough\n- [ ] Each strategy shows its price and a short explanation\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Pricing recommendations |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-28 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-20"
gh issue create --repo "$REPO" \
  --title "US-20: See the evidence behind a recommendation" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "**As a** revenue manager, **I want to** see the evidence behind a recommendation, **so that** I can trust it enough to act on it, and argue for it to an owner.\n\n### Acceptance criteria\n\n- [ ] The competitor average used is displayed\n- [ ] The events counted and their combined impact are displayed\n- [ ] The floor applied is named, whether cost based or group rate based\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Pricing recommendations |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-29 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-21"
gh issue create --repo "$REPO" \
  --title "US-21: Never be shown a recommendation below my cost floor" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "**As a** hotel owner, **I want to** never be shown a recommendation below my cost floor, **so that** the system cannot talk me into selling a room at a loss.\n\n### Acceptance criteria\n\n- [ ] The cost floor is the cost per night plus the minimum margin\n- [ ] A competitor average below the floor still produces a recommendation at the floor\n- [ ] The interface indicates when the floor has overridden the market\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Pricing recommendations |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-26 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-22"
gh issue create --repo "$REPO" \
  --title "US-22: Record the rate I actually loaded and the occupancy I achieved" \
  --label "user story" --label "epic: pricing recommendations" \
  --body "**As a** revenue manager, **I want to** record the rate I actually loaded and the occupancy I achieved, **so that** I can judge over time whether the recommendations are any good.\n\n### Acceptance criteria\n\n- [ ] Actual price and occupancy can be entered against a date\n- [ ] Recommended and actual prices are held on the same record\n- [ ] Entering a second value for the same date updates the record rather than creating another\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Pricing recommendations |\n| Story points | 5 |\n| Priority | Should |\n| Requirements | FR-30, FR-31 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-23"
gh issue create --repo "$REPO" \
  --title "US-23: Record a contracted group rate over a date range" \
  --label "user story" --label "epic: contracted group rates" \
  --body "**As a** revenue manager, **I want to** record a contracted group rate over a date range, **so that** the system prices around business I have already committed.\n\n### Acceptance criteria\n\n- [ ] A rate can be recorded for one room type with a start date, an end date, and a value\n- [ ] A group name, segment, and notes can be attached\n- [ ] An end date before the start date is rejected\n- [ ] The rate can be edited and deleted\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Contracted group rates |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-32, FR-33, FR-34 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-24"
gh issue create --repo "$REPO" \
  --title "US-24: Have a contracted rate act as the floor for the dates it covers" \
  --label "user story" --label "epic: contracted group rates" \
  --body "**As a** revenue manager, **I want to** have a contracted rate act as the floor for the dates it covers, **so that** I am not recommended a price below a rate I have already signed.\n\n### Acceptance criteria\n\n- [ ] Where a group rate covers the date and exceeds the cost floor, it becomes the floor\n- [ ] Where it falls below the cost floor, the cost floor still applies\n- [ ] The interface names which floor was used\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Contracted group rates |\n| Story points | 5 |\n| Priority | Must |\n| Requirements | FR-27 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-25"
gh issue create --repo "$REPO" \
  --title "US-25: See contracted rates laid out on a calendar" \
  --label "user story" --label "epic: contracted group rates" \
  --body "**As a** revenue manager, **I want to** see contracted rates laid out on a calendar, **so that** I can see at a glance which nights are already committed.\n\n### Acceptance criteria\n\n- [ ] Rates for a chosen hotel are shown across a date range\n- [ ] Overlapping contracts for different room types are both visible\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Contracted group rates |\n| Story points | 3 |\n| Priority | Should |\n| Requirements | FR-35 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-26"
gh issue create --repo "$REPO" \
  --title "US-26: See my rate position against my competitor set over time" \
  --label "user story" --label "epic: reporting" \
  --body "**As a** revenue manager, **I want to** see my rate position against my competitor set over time, **so that** I can tell whether I am drifting expensive or cheap across a season.\n\n### Acceptance criteria\n\n- [ ] A chart plots the hotel's rate and the competitor average across a date range\n- [ ] The date range is selectable\n- [ ] A range with no data is stated rather than drawn as an empty chart\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Reporting |\n| Story points | 8 |\n| Priority | Should |\n| Requirements | FR-36, FR-37 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-27"
gh issue create --repo "$REPO" \
  --title "US-27: Review recommended against actual rates and the occupancy that followed" \
  --label "user story" --label "epic: reporting" \
  --body "**As a** revenue manager, **I want to** review recommended against actual rates and the occupancy that followed, **so that** I can see whether following the recommendations improved anything.\n\n### Acceptance criteria\n\n- [ ] A table lists date, recommended price, actual price, and occupancy\n- [ ] Rows where no actual price was recorded are visibly incomplete rather than blank\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Reporting |\n| Story points | 5 |\n| Priority | Could |\n| Requirements | FR-38 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-28"
gh issue create --repo "$REPO" \
  --title "US-28: Create a reminder with a due date and a priority" \
  --label "user story" --label "epic: reminders" \
  --body "**As a** revenue manager, **I want to** create a reminder with a due date and a priority, **so that** a rate audit or a contract renewal does not slip.\n\n### Acceptance criteria\n\n- [ ] A reminder requires a title and a due date\n- [ ] Priority and an optional hotel can be attached\n- [ ] It appears in the reminder list on creation\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Reminders |\n| Story points | 3 |\n| Priority | Should |\n| Requirements | FR-39 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-29"
gh issue create --repo "$REPO" \
  --title "US-29: Mark a reminder complete or dismiss it" \
  --label "user story" --label "epic: reminders" \
  --body "**As a** revenue manager, **I want to** mark a reminder complete or dismiss it, **so that** the list reflects what is actually outstanding.\n\n### Acceptance criteria\n\n- [ ] Completing sets the status and removes it from the outstanding list\n- [ ] Dismissing is distinguishable from completing\n- [ ] Neither action deletes the record\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Reminders |\n| Story points | 2 |\n| Priority | Should |\n| Requirements | FR-40 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-30"
gh issue create --repo "$REPO" \
  --title "US-30: See what is due soon separately from what is already overdue" \
  --label "user story" --label "epic: reminders" \
  --body "**As a** team member, **I want to** see what is due soon separately from what is already overdue, **so that** I deal with the late items first.\n\n### Acceptance criteria\n\n- [ ] Reminders due within the coming period are listed as upcoming\n- [ ] Reminders past their due date and still outstanding are listed as overdue\n- [ ] Both lists are limited to my organisation\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Reminders |\n| Story points | 3 |\n| Priority | Should |\n| Requirements | FR-41, FR-42 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-31"
gh issue create --repo "$REPO" \
  --title "US-31: Be elevated only by a script run against the database" \
  --label "user story" --label "epic: platform administration" \
  --body "**As a** platform administrator, **I want to** be elevated only by a script run against the database, **so that** nobody can grant themselves administrative access through the interface.\n\n### Acceptance criteria\n\n- [ ] A maintenance script promotes a named account\n- [ ] No endpoint accepts a role change from the client\n- [ ] Registration always creates a standard user\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Platform administration |\n| Story points | 2 |\n| Priority | Must |\n| Requirements | FR-43 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "  US-32"
gh issue create --repo "$REPO" \
  --title "US-32: Check that the deployed service is alive" \
  --label "user story" --label "epic: platform administration" \
  --body "**As a** platform administrator, **I want to** check that the deployed service is alive, **so that** I can tell a broken deployment from a broken feature.\n\n### Acceptance criteria\n\n- [ ] A health endpoint returns a success status and a timestamp\n- [ ] It requires no authentication\n- [ ] It does not disclose configuration or version detail\n\n### Details\n\n| | |\n| --- | --- |\n| Epic | Platform administration |\n| Story points | 1 |\n| Priority | Should |\n| Requirements | FR-45 |\n\nSpecified in [Requirements.md](https://github.com/stanleyreubens/565_project/blob/main/Requirements.md)."

echo "Done. View them: gh issue list --repo $REPO --limit 40"
