# Scope: giving library events a blurb

Written Aug 20 2026. Decision doc, nothing built yet.

## The problem, in one picture

Two cards on the live site right now. Same calendar, same day view.

**Library event (Aug 25):**

> **Jack and Friends Presents: Suzi Shelton!**  4:00–4:45 PM
> Park Slope · Auditorium
> `Register` `Birth–5`
> More info & register ↗   + Add to calendar

**Regular event (Aug 22):**

> **Fontainhas Family Rave: Under the Sea**  9:00–11:00 AM
> Fontainhas · Dumbo (28 Jay St)
> `RSVP` `All ages`
> A kid-friendly morning rave with an Under the Sea theme. DJ VF spins feel-good music in a Disney princess costume... *more*
> More info & register ↗   + Add to calendar

The library card can't say Suzi plays ukulele, that it's a sing-along, or that it's her last show of the summer. There's nowhere to put it.

This is not a corner case. **107 of the calendar's rows are library rows**, appearing 210 times across July and August. Roughly half the calendar is running with the description turned off.

## Why it happens

Regular events are stored as an object with named fields, including `note`, `cost`, `ages` and `link`.

Library events are stored as a 7-slot list: title, location, time, audience code, registration flag, virtual flag, days. No description. No link. Every library event inherits the same generic Brooklyn Public Library URL.

## What I checked, and the good news

I pulled the library's own event descriptions from their API for all seven branches City Kid covers, every kid and family event through Sept 30. **84 events. Every single one has description text. Zero blanks.**

Length distribution:

| | characters |
|---|---|
| shortest | 40 |
| median | **128** |
| longest | 1011 |
| under 200 chars | 63 of 84 |
| over 400 chars | 11 of 84 |

The card clamps a description to two lines with a more/less toggle. A 128-character median means **most blurbs would need no truncation at all.**

And the copy is already the right register. Straight from the library:

> "Join us for storytime, followed by playtime! Children ages 0-5 and their caregivers are welcome!"

> "Play board, card and tabletop games with us at Windsor Terrace Library. Designed for ages 5-12."

That is usable word for word. Which is the point: this should be a plumbing job that moves the library's sentences onto the card, not a writing job where I invent copy.

## The change

**Two new optional slots on the library row:** a description and a link. Both optional, both appended at the end, so existing rows keep working untouched.

Three things read library rows. All three benefit:

1. **The day card.** Gets the blurb. Gets a link to the actual event page instead of a generic search page.
2. **The Google structured-data markup.** Right now every library event falls back to an auto-generated sentence ("Jack and Friends Presents: Suzi Shelton! at Park Slope · Auditorium (4:00–4:45 PM)..."). Real descriptions on ~107 rows is a meaningful search-visibility gain, since it is close to half the site's events.
3. **The .ics file** parents save to their phone. The description field is currently **empty** for every library event. Someone who saves a storytime to their calendar gets a title and nothing else.

Two scheduled tasks also read these rows, the Instagram carousel builder and the newsletter builder. Neither breaks, since the change is additive, and both gain a source of copy they currently don't have for library events.

## Backfill: smaller than it looks

The library's API only returns **future** events. Past ones vanish. So:

| | rows |
|---|---|
| Still upcoming, fillable straight from the API | **35** |
| Already past, would need hand-writing | 72 |

Those 72 are almost all July. July drops off the calendar when September launches. **Writing blurbs for them is throwaway work and I'd skip it.**

So the real backfill is 35 rows, automated, matched by title plus branch plus time.

## The part that actually matters

The sweep already calls this API twice a week. It already reads the neighbouring fields on the same response. **Capturing the description and the event-page link is one more field each on a call it is already making.**

Do that, and the corpus fills itself. September's library events arrive with blurbs already attached. October's too. This is a pipeline change with a one-time 35-row catch-up, not a content project with an ongoing writing burden.

That distinction is the whole reason I'd say yes to this.

## Two other things I found on the way

**Branch names are inconsistent in the data.** Some rows say "Cortelyou Library", others just "Cortelyou". Same split on Flatbush, Kensington, Windsor Terrace and East Flatbush. Nothing is visibly broken, because the map pins match on the shorter form. But it means automated matching against the API needs a normalisation step, and it's a trip hazard for any future tooling. Worth tidying while the arrays are open.

**Library cards never show a "Free" chip,** although every library event is free and the code already treats them as free behind the scenes. The Google markup even declares them free. Only the visible card stays quiet about it. That is a two-line fix and is independent of everything above.

## Risks

Low, but real:

- The Google structured-data generator depends on the row shape. Appending slots is safe; reordering is not. Whatever happens, the days list must stay in slot 7.
- Long descriptions need a truncation rule. My preference: cut at a sentence boundary and let the more/less toggle carry the rest, never mid-word, never with an invented summary.
- 11 of 84 descriptions run over 400 characters and will need a look rather than a blind cut.
- The sweep and the site must change in the same session, or one will overwrite the other.

## Options

**A. Cheap fixes only.** Free chip on library cards, and point the links at real event pages. No schema change. Fixes the two smallest annoyances, leaves the blank descriptions.

**B. Full change.** New slots, sweep captures both fields going forward, 35 upcoming rows backfilled, branch names normalised, cheap fixes folded in. One build session plus a verification pass.

**C. Full change plus history.** B, plus hand-writing 72 past July blurbs. I would not. July disappears at the September launch.

## Recommendation

**B.** The library's copy already exists, is universally present, is the right length, and is written in plain visitor-facing language. The sweep is already standing at the door where that copy lives. The only reason the calendar looks half-finished is that nobody has carried it across.

Sequence I'd follow: change the schema and the three readers, update the sweep to capture both fields, backfill the 35, normalise branch names, verify with the usual headless pass plus a rendered check of a real card, then publish.

One thing I'd want from you before starting: whether the blurb should ever be shortened at all, or always shown in full behind the more/less toggle. Truncation is where wording gets bent, and bent wording is how bad information gets on the site.
