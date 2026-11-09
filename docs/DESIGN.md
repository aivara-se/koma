# Koma: interface

A studio, not a form wizard: dark room, paper-white type, one red mark for the thing to do next.

## Values

- **The page is the hero.** On the chapter screen the manga page is the largest object; controls sit beside it and never over it.
- **State is visible.** Every entry, page and chapter carries a pill — not read, catalog open, catalog locked, planned, drawn, approved. A colour is never the only signal; the word is there too.
- **One accent.** Vermilion marks the next action and nothing else. Green means approved, amber means waiting on a person.
- **Paper, not glass.** Plates and panels sit on a paper ground. Control surfaces stay quiet so the art reads as art.
- **Plain forms.** Every action is an HTML form post. A reload, a second tab or a slow image call never leaves a button that does nothing.

## Type

Headlines and the story itself are serif (Georgia); controls and metadata are the system sans. The story is set at 1.02 rem with 1.75 line height, because it is read, not skimmed. Labels are 0.74 rem, uppercase, letter-spaced — they name a field and never compete with it.

## Layout

- 1120 px shell; 20 px gutters on a desktop, 14 on a phone.
- The home page is two columns: the story goes in on the left, the studio's stories on the right. Under 820 px they stack.
- The catalog is a single column of cards. A card is a plate on the left and its fields on the right; under 720 px the plate sits above the fields.
- A variant is a small card under its parent; under 560 px the thumbnail sits above its fields.
- The chapter page is a card per page: the portrait page on the left, its beat, script and prompt on the right; under 860 px they stack.
- The book is one column of pages, chapter marks between them, centred and narrow enough to read without scrolling sideways.

## The page

A page is one portrait image, 832 × 1248 (1K, 2:3), drawn by the model in one call. It sits in a 2:3 frame on a black ground, as large as the column allows: on a desktop about 400 px wide beside its controls, on a phone the full width above them. The lettering script sits beside the art, not on it — a caption rule and speaker labels, ready for a lettering pass.

## Motion

None beyond colour and border changes on hover. Nothing moves while the user reads.
