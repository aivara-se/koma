# 005 — Lettering is code

**Status:** accepted

## Context

Image models write text badly. They misspell, they merge words into the art, they place a balloon over a face, and they bake the lettering into the pixels, so changing one line means redrawing the panel. A comic page is art plus type; only one of those needs a model.

## Decision

The model draws panel art only. Captions, speaker labels, balloons, panel borders and gutters are laid out by code from the panel's own data: the dialogue rows, the row and column of the panel, and the page frame.

Every prompt ends with the style block, which forbids text, letters, balloons and borders in the image.

## Consequences

A line of dialogue can be corrected without redrawing anything. The page is a real HTML page: it reflows to the phone width, and a later export draws the same layout to a canvas or a PDF.

The cost is that composition is constrained to what the layout code can place. Panel shapes the model could have drawn freely are not available in v1.
