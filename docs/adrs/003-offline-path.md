# 003 — The offline path is a path, not a mock

**Status:** accepted

## Context

Every step of the studio depends on a model: reading the story, describing the art, drawing a plate, drawing a panel. Without a key the product would be a screen of disabled buttons. A demo that cannot be run is also a demo that cannot be reviewed on a phone in a minute.

## Decision

Two fallbacks ship in the product, behind the same interface as the model calls:

- **The offline analyser** reads the story with rules: repeated capitalised names are characters, a place noun with a capitalised name is a location, a sentence with a change cue next to a name is a variant. It is deterministic and tested.
- **Placeholder plates** are drawn as SVG: an ink frame, a silhouette or a building, the entry's name and its brief, the word PLACEHOLDER, and the style it stands in for. The same name always draws the same plate.

Both write the same rows and the same image files as a model would. The interface says which one ran: the project records its analyser, and every image records its provider.

## Consequences

The four steps can be run end to end with no key, and that is the acceptance test. A placeholder is always visibly a placeholder, so it cannot be mistaken for final art. The analyser is cruder than a model by design; when a key is set, the model replaces it and the fallback stays for failures.
