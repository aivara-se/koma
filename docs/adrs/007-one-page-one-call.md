# 007 — One image call per page

**Status:** accepted

## Context

The first version drew one image per panel and composed the page in code. It held identity across panels, but it cost one call for every panel, and the page read as a grid of separate drawings rather than a composed page. The brief asks for whole pages: a comic book is read a page at a time, and page-level composition is the thing an image model does better than a layout algorithm.

A page is also the unit a reader turns.

## Decision

One page, one image call. The prompt asks for a complete page at 1K portrait (832 × 1248), four to six panels, black gutters and borders. The catalog plates travel with the prompt as reference images, and the page's cast and setting are written into it word for word from the locked catalog.

The model composes the page; it does not letter it. The page keeps a lettering script — one caption, up to three spoken lines — outside the image, and the prompt forbids text.

## Consequences

A page costs one call instead of four to six, and the composition is whole rather than assembled.

Identity depends on the reference images and the prompt, not on per-panel conditioning, so it is weaker than panel mode: a face can drift between pages. The answer is the approve-and-redraw loop and, later, a LoRA trained on approved pages. That risk is accepted for this proof of concept and is what the page-by-page review exists to catch.

Lettering is a separate pass, as ADR 005 requires; the script is stored with the page so that pass has everything it needs.
