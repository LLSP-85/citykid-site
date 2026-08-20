# Paste into the citykid-source-sweep SKILL.md

Add this to the step that builds library rows from the Brooklyn Public Library API. It replaces the old 7-slot row format. Shipped to the site Aug 20 2026, so the sweep must match it or it will strip the blurbs back out.

---

## Library rows now carry a blurb and their own link

The library row format gained **two optional slots on the end**:

```
[title, location, time, audienceCode, reg, virt, days, blurb, link]
                                                        ^^^^^  ^^^^
                                                        new    new
```

Both are optional. A row with only seven slots still works. **Never reorder the first seven** — the Google structured-data generator reads them by position and expects the days list to stay in slot 7 (`r[6]`).

### Where the two new values come from

You are already calling `https://discover.bklynlibrary.org/api/search/index.php` for the branch census. Both new values come off the response you already have:

- **Slot 8, the blurb** — `ts_body`. It is HTML. Strip the tags, decode the entities, collapse the whitespace, and **use the result verbatim.**
- **Slot 9, the link** — parse `ss_node_json`, read `data.attributes.path.alias`, and prefix `https://www.bklynlibrary.org`. If there is no alias, **omit slot 9 entirely.** The site falls back to the generic library page on its own. Do not invent a URL.

### The verbatim rule is not a style preference

Do not rewrite, summarise, punch up or "make consistent" the library's wording. LL's instruction, Aug 20 2026: paraphrasing has produced both factual errors and generic filler. The library already writes in plain, parent-facing language. Move their sentence across and stop.

Trim only from the ends, and only these:
- Trailing whitespace and stray full stops (a few entries end " .").
- Contact details for a partner organisation, if they run long. Keep the organisation's name.
- Nothing else. If it looks too long, that is not your call. See below.

### Length

The card clamps to two lines and adds a more/less toggle, so **any length renders correctly.** Length is never a technical problem.

Median blurb is around 130 characters and most need nothing done. If one runs over roughly 400 characters, **put it in verbatim anyway and list it in your report to LL under a heading like "Long blurbs, your call."** She decides whether it gets trimmed. Do not shorten one on your own initiative.

Some long ones deserve to stay long. The Aug 25 Suzi Shelton entry runs past 1000 characters, but the tail carries registration opening 24 hours ahead, one registration per family, and a hard 10-minute late-entry cutoff set by the fire marshal. Cutting that to hit a character count would have removed the most useful part.

### Two things to keep an eye on

**Titles drift between the site and the API.** Three of 34 rows failed an exact-title match on the first pass: "Magic Alive! Family Magic Show..." against the API's "Magic Alive! Kids and Family Magic Show...", "Maker Girls (Extreme Kids & Crew)" against "Maker Girls Presented by Extreme Kids & Crew", and "Grab and Go" against "Grab & Go". Match on branch plus date first, then title, and fall back to a substring comparison. Report anything you cannot match rather than guessing.

**Branch naming is inconsistent in the existing data.** Some rows say "Cortelyou Library", others just "Cortelyou". Same for Flatbush, Kensington, Windsor Terrace and East Flatbush. Normalise when matching against the API. **Do not rewrite the location strings in existing rows** — the event id is derived from the location, so changing it silently breaks anyone's saved hearts and any shared `#my=` link. New rows should use the full "X Library" form.

### Backfilling history is not worth doing

The API only returns future events, so past rows cannot be filled from it. Do not hand-write blurbs for events that have already happened. They roll off the calendar at the next month launch.
