# 005 — Lettering is code

**Status:** accepted

## Context

Image models write text badly. They misspell, they merge words into the art, they place a balloon over a face, and they bake the lettering into the pixels, so changing one line means redrawing the panel. A comic page is art plus type; only one of those needs a model.

## Decision

The model draws the art and, in page mode, the panel grid, borders and gutters. It draws no words. Captions, speaker labels and balloons are laid out by code from the page's lettering script, or by a hand-lettering pass that reads the same script.

Every prompt ends with the style block, which forbids text, letters, balloons and borders in the image.

## Consequences

A line of dialogue can be corrected without redrawing anything. The page is a real HTML page: it reflows to the phone width, and a later export draws the same layout to a canvas or a PDF.

The cost is that composition is constrained to what the layout code can place. Panel shapes the model could have drawn freely are not available in v1.
