# 006 — No accounts, and CSRF trusted everywhere

**Status:** accepted

## Context

v1 runs on one machine for one person. Every route reads or writes that person's story; there is no second user to separate data from, and no session that a forged request could ride.

SvelteKit checks the `Origin` header on form posts against the origin it derives from the request, defaulting to `https`. That breaks a plain `http://127.0.0.1` run and a reverse-proxied run unless the deploy sets `ORIGIN` or a protocol header at every hop.

## Decision

No authentication, and `csrf: { trustedOrigins: ['*'] }` in the Vite config. One build answers on localhost, a tunnel and a private host without a baked-in origin.

## Consequences

A page on another site can post a form to the studio if it can reach it. The worst it can do is what a person at the keyboard can do: create a project, draw a page, approve one. It cannot read the story back, because responses are not CORS-readable.

The moment the studio is shared or hosted with more than one person's work, this ADR is superseded: accounts, per-user rows, and origin checks come back together.
