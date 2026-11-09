# Koma: product

## Problem

An image model forgets. Chapter nine returns a different woman with the same name and a different street with the same sign, and a redrawn page no longer matches its neighbours. A comic holds together on decisions made before the first panel: who these people are, what they wear, how the story changes them, and what each place looks like.

## Scope

**In.** Paste a story. Read it once into characters and places, with the variants the story shows. Describe, draw, approve or exclude every entry, then lock the catalog. Plan a chapter into pages of panels with prompts and references. Draw, review and approve a page. Approve a chapter and go on.

**Not this version.** Accounts, sharing, importing reference art, choosing style, resolution or density, hand-set panels, PDF or CBZ export.

**Never.** A page that references something the locked catalog does not hold. Text drawn by the image model. A silent replacement of approved work. A placeholder presented as model art.

## Behaviour

- Reading replaces the catalog, every chapter and every page, and the interface names that cost before it runs.
- An entry is a character or a place, with a description, a visual brief, a plate, and its variants.
- A variant follows its parent out of the comic when the parent is excluded.
- The catalog locks when every root entry is approved or excluded; planning reads only a locked catalog.
- A page holds at most five panels: one establishing shot, then wide, medium and close in turn.
- Every panel has a shot, an action, up to two spoken lines and the catalog references it must hold.
- A page cannot be approved until every panel has art; a chapter cannot until every page is approved.
- A note changes one page's prompt and nothing else; the prompt stays editable text.
- The style, the image size, the page width and the density are fixed in code and shown, not offered.

## Autonomy

An agent decides wording, layout, prompt shape and the mechanics behind a rule here. It stops for a new dependency, a change to stored or sent data, or spending money per page.

## Vision

A reader cannot tell panel forty from panel four, and still knows it is the same person in the same room.

## Acceptance

The demo story runs every step with no key: catalog locked, chapter one planned, every panel drawn, page and chapter approved. With a key, the same run returns model-written entries and model-drawn plates.
