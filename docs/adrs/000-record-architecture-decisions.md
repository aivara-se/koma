# 000 — Record the decisions

**Status:** accepted

## Context

A repository changes faster than the memory of why. A later agent reads the code, sees a choice that looks arbitrary, and reverses it — or keeps a bad one because reversing it looks like a regression.

## Decision

Every significant choice gets one file here, numbered, with its context, the decision, and what follows from it. A choice is significant when reversing it costs a migration, a rewrite, or money per page.

The documents hold the shape; an ADR holds the reason. `PRODUCT.md` says what the thing is, `SYSTEMS.md` how it works. Neither argues for a choice.

## Consequences

A change that contradicts an ADR either updates the ADR in the same pull request, or does not merge. A superseded ADR stays, marked superseded, with a link to the one that replaced it.
