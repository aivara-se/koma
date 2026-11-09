# 004 — The catalog gate

**Status:** accepted

## Context

Consistency is the product. A page drawn from a description the user has not approved is a page built on a guess; a catalog that can change after the first page is a catalog that makes every page provisional.

## Decision

Two gates, and neither is advisory:

- **The catalog locks** when every root entry is approved or excluded. Planning reads only the locked catalog.
- **A page is approved** only when every panel has art. **A chapter is approved** only when every page in it is.

Excluding a parent excludes its variants. Approving a variant after the parent is excluded is not offered.

## Consequences

The user cannot skip the review and get a comic; the gate is the workflow. Re-reading the story clears the lock, the catalog and every page — the interface names what it destroys before it runs.

A locked catalog is read-only and v1 has no separate unlock: the lock holds until the story is read again, which clears it and every page with it.
