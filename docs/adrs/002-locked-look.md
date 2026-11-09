# 002 — The look is locked in config

**Status:** accepted

## Context

Style, resolution and density are the three settings every prompt is built from. Exposed as controls they multiply the states a page can be in: a page drawn at one density and reviewed at another has no single meaning, and a reference plate drawn in a different style from the panel is worse than no plate.

The first version answers one question: does holding a catalog across a story produce a comic that stays the same?

## Decision

`src/lib/config.ts` holds the art style block, the image size, the page width, the panels per page and the density. The interface prints them and cannot change them.

The style block is appended to every prompt, word for word, so a plate and a panel say the same thing about the same character.

## Consequences

A series has one look. Testing a second style means a second checkout or a code change, not a dropdown.

When the settings do become editable, they belong to a project row, not to a global config — a story must keep the look it was drawn in.
