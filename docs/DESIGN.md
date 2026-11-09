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
- The chapter page is a page card per page: preview left, prompt and panel list right; under 860 px they stack.

## The page

A page is 1080 px wide with a 1080:1460 frame, seven pixels of gutter and a black ground — the webtoon width, so it reads on a phone without zooming. Rows are one wide panel or a pair; the first row of a page is always one wide panel. Captions and balloons are drawn by code, never by the model: a balloon is a paper-coloured pill with a red speaker label, and there are never more than two per panel.

## Motion

None beyond colour and border changes on hover. Nothing moves while the user reads.
