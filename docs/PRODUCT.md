# Koma: product

## Problem

An image model forgets. Ask it for chapter one and chapter nine of the same novel and it returns a different woman with the same name and a different street with the same sign. A comic book costs too much to draw panel by panel: a novel runs to hundreds of pages, and a page drawn from a fresh description drifts from the page before it. What holds a book together is a catalog of its people and places, approved before the first page and read by every page after.

## Scope

**In.** Paste a novel. Read it once into characters and places, with the variants the story shows. Describe, draw, approve or exclude each entry, then lock. Plan a chapter into pages: one image call draws each page, portrait, four to six panels. Review a page, redraw it, approve it. Read the approved pages as a book and download the CBZ.

**Not this version.** Accounts, sharing, importing reference art, choosing style or size, hand-set panels, lettering drawn inside the image.

**Never.** A page that references a person or place outside the locked catalog. Text drawn by the image model. A silent replacement of approved work. A placeholder presented as model art.

## Behaviour

- A novel is read in parts of 90,000 characters and the catalogs are merged, so no story is cut at a model limit.
- Reading replaces the catalog, every chapter and every page; the interface names that cost first.
- The model read runs beside the request and reports its part count on the project page.
- An entry is a character or a place, with a description, a visual brief, a square reference plate, and its variants.
- A variant follows its parent out of the comic when the parent is excluded.
- The catalog locks when every root entry is approved or excluded; planning reads only a locked catalog.
- One page stands for about 200 source words, in order: every sentence of a chapter lands on exactly one page.
- A page draws in one image call at 1K portrait, four to six panels, black gutters, no text.
- The page keeps a lettering script — one caption and up to three spoken lines — for a later lettering pass.
- A page cannot be approved until it has art; a chapter cannot until every page is approved.
- Redrawing a page, or an approved page, takes its approval and its chapter's away.
- The book holds every approved page in reading order; the CBZ holds the same pages as images.

## Autonomy

An agent decides wording, layout, prompt shape and the mechanics behind a rule here. It stops for a new dependency, a change to stored or sent data, or spending money per page.

## Vision

A reader turns from page four to page forty and sees one person in one town, and a finished book at the end.

## Acceptance

The demo story runs every step with no key: catalog locked, chapter one planned, two pages drawn, page and chapter approved, a valid CBZ. With a key, one page comes back as a model-drawn 1K portrait page.
