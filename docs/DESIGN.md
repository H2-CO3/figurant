# Craft: what makes a character or a prop good

A drawing with arms and legs is not yet a character. This page says what
does not depend on a style, then how styles are chosen. A person judges the
result in the atelier; you cannot see it, so do not call it good yourself.

## The style belongs to the project, not to Figurant

**Before drawing anything, read `STYLE.md` at the root of the project.** It
holds the style in use, written by the person in their own words (from the
atelier: the "Style" button, where a project keeps several styles and
chooses one), and it wins over everything on this page. If it is empty or
missing, ask what style they want; do not pick one silently.

Figurant itself has no house style to impose. The library holds five, each
in its own folder built the same way (`library/<style>/characters`, `props`,
`scenes`, a `kit.js` with the style's helpers, an `index.js`), as examples
of what a finished style looks like:

- **Realistic cartoon** — the style of `library/`. Colour, volume and soft
  light: a dark outline, gradients that turn a shape into a material
  (porcelain, plastic, steel, fur), one patch of light and one of shade,
  eyes with a white, an iris and a glint. `library/cartoon-realiste/kit.js` holds
  the helpers (an earlier set is in `library/default/cartoon-realiste/`); `teapot.js`, `highlighter.js`, `fork.js` and `cat.js` are the
  models. Props use flat colours with a patch of shade and one of light
  (`library/default/cartoon-realiste/props/teapot-study.js`).
- **Line and gold** (`library/trait-et-or`) — a gold contour on a paper
  body, thin ink details, one solid gold shape. Born on one site; it is not a default.
- **Cut paper** (`library/papier-decoupe`) — flat shapes with no outline,
  layered, each casting a small shadow; one warm palette.
- **Ink wash** (`library/encre-de-chine`) — brush strokes that swell and
  thin, grey washes, one touch of red; nothing outlined all the way round.
- **Neon at night** (`library/neon-nuit`) — glowing tubes on a dark
  background; the glow is the volume.

A new style gets a folder of its own, a `kit.js`, and at least two
characters, a prop and a scene before it is shown to anyone.

Whatever the style, two things hold:

- **A high level of finish.** A shape with two dots for eyes is a sketch, not
  a character. Give it a material, light, and the details that make it this
  object and no other.
- **Each character is unique.** Its own silhouette, its own palette, its own
  material, its own way of reacting. Two characters must never look like the
  same drawing with a different outline. A prop made for a character shares
  its style and its scale.

## A character is alive in three ways

- **It looks.** Give it `gazeX`, `gazeY` and `lid` if it has anything like
  eyes: the page then makes it follow the visitor and blink, for free. A
  character with no face looks with something else (the highlighter's tip).
- **It reacts with its own body.** One or two parts that belong to this
  object and no other: a lid that lifts when it is surprised (`wide`), steam
  when it is moved, tines that fan out, a tail that stands up.
- **Something trails.** Use `drag` in `draw()` for a part that lags behind a
  movement: a loose lid, ears, a tail. Without it the head moves like a
  sticker.

## A body that fits

- An object gets arms and legs. **An animal gets an animal's body**, fully
  drawn: four legs, a tail, no arms (`library/default/cartoon-realiste/characters/cat.js`). Never a
  person's body with an animal's head.
- Emoji figures (`library/emoji/`) are a kind apart: a stick figure whose
  head is an emoji or an imported picture. Quick and friendly; never a
  substitute for a drawn character, and never mixed with them.
- Draw the head 60 to 170 units wide, around (0, 0): 80 for a small
  character, 150 for a big one. Hips on the bottom
  edge; shoulders on the outline, where an arm coming out from behind the
  body looks attached (`arms: 'front'` for a wide body).
- The limbs are lines: give them a colour that belongs to the character
  (`limbs`), usually its outline's.
- An asymmetric object (a spout, a handle) keeps its asymmetry.
- Props are made to the size of the character that uses them: a seat wider
  than it is, a table that comes up to its hand.

## Readability

- The silhouette must read at 60 pixels wide: on the bench, set `scale` to
  its minimum and look. Details that turn to noise at that size go.
- One idea per scene, one object at most (what it holds and what it uses
  together count as one: a pot and what rises from it), three beats: a look,
  a gesture, a hold. Durations on a common beat.
- Declare the room a scene uses.
- On a solemn subject, no gag.

## Before showing it to a person

1. `figurant check` reports nothing (it checks characters, scenes and the
   props listed in the config; it cannot check that a drawing is good).
2. On the bench: every stock move plays without a limb crossing the body in
   an ugly way, at scale 1 and at the smallest scale.
3. Attachment points shown: hips and shoulders are on the outline.
4. Write in the fiche what you built and what you could not check by
   yourself. Then wait for the person.

## When to say no

Pixels, a single merged path, hundreds of unnamed strokes, a shape that must
bend to live (a snake, a rope): say that it cannot be rigged as it is, and
what would have to change in the file. An approximate result presented as
done costs the person more than a clear refusal.
