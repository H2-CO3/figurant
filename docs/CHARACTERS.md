# Characters

Figurant gives arms and legs to anything: an eye, a teapot, a logo. A
character is a **head** (whatever you draw: it is the whole thing above the
limbs) and a **body** the engine provides: two legs and two arms that walk,
sit, reach and tap by themselves.

```js
export const teapot = {
    name: 'teapot',          // also names its SVG layer
    line: 3,                 // stroke width of the limbs, in character units
    head: shapeHead({ ... }),
    proportions: { thigh: 20, shin: 22, reach: 38 }, // optional, see below
    scaleLine: true,         // false: lines keep their thickness at any size
    arms: 'front',           // draw the arms over the body (default: behind it); 'none': no arms
    sits: false,             // a body that cannot sit on an edge
    limbs: '#4a3b2e',        // the colour of its arms and legs (default: the page's ink)
    style: 'cartoon-realiste', // the style it was drawn in: the atelier lists it under that style
};
```

Read `docs/DESIGN.md` and the project's `STYLE.md` first: the style is the
person's choice. The head contract below lets you draw anything; the
library's characters use their style's own helpers, `library/<style>/kit.js`
(for the realistic cartoon: gradients, shade and eyes).

## The quick way: a head described as data

`shapeHead` takes SVG shapes and four attachment points. Units are yours:
draw the head around (0, 0), y pointing down, about 60 to 170 units wide
(a stick figure's legs and arms are about 40 long: a head 80 wide is a
small character, 150 a big one; size is drawn, there is no per-character
scale in the library).

```js
import { shapeHead } from 'figurant';

head: shapeHead({
    shapes: [
        { tag: 'path', attrs: { d: 'M -40 20 C -52 -30 52 -30 40 20 Z' }, fill: true },
        { tag: 'path', attrs: { d: 'M 40 -6 C 64 -10 66 -30 74 -30' } },   // spout
    ],
    shoulders: [[-40, 0], [40, 0]],   // left, right: where the arms attach
    hips: [[-14, 20], [14, 20]],      // left, right: where the legs attach
    top: [0, -34],                    // where a thread would be tied
    eyes: { at: [[-10, -4], [10, -4]], r: 2.4, travel: 4 },  // optional
}),
```

Shapes are stroked with `--fig-ink` and, with `fill: true`, filled with
`--fig-paper`: set both CSS variables on the page (`--fig-accent` is the
thread it hangs from).

Choosing attachment points:
- **Hips** on the bottom edge of the drawing, a little apart. The legs hang
  from them; the ground is `reach` units below (53 by default).
- **Shoulders** on the left and right edges, at mid height. Arms pass behind
  the head when raised: keep them at the outline.
- Limbs always hang along the screen's vertical, even when the head tilts.

Use `arms: 'front'` when the body is wide: by default arms are drawn behind
the head, and a raised arm would vanish behind a belly.

## The quickest way: an emoji on a stick body

```js
import { emojiHead } from 'figurant';

export const cat = {
    name: 'cat',
    head: emojiHead({ face: '😺', faces: { blink: '😽', wide: '🙀', squint: '😼' } }),
};
```

The face changes with what the character feels: `blink` while its eyes are
shut, `wide` when it is surprised, `squint` when it doubts. Only `face` is
required. An emoji is drawn by each visitor's device, so it looks different
from one to the next and ignores the page's colours: friendly and fast, not
drawn. `emojiHead({ image })` shows a picture instead. Emoji figures are a
kind apart: keep them under `emoji` in the config, not under `cast`
(`library/emoji/person.js`).

## The full way: the head contract

A head that moves (an eyelid, a lid that lifts, a flame) implements three
members:

```js
head: {
    create({ stage, layer, line }) {
        const part = stage.el('path', layer, { fill: 'none', stroke: 'var(--fig-ink)' });
        return {
            state: { lid: 1 },                 // numbers this head adds
            frame: state => ({ hips: [[-14, 20], [14, 20]], shoulders: [[-40, 0], [40, 0]], hipY: 20, top: [0, -34] }),
            draw({ state, P, matrix, k, unit, drag, dt, line }) { /* set SVG attributes */ },
        };
    },
},
```

- `state`: the numbers this head adds to the character's state. Scenes
  animate them with `c.tween`.
- `frame(state)`: the attachment points now, in head units. `hipY` is the
  ordinate of the hips. `soft` (0 to 1) scales how much the head squashes.
- `stage.el(tag, parent, attributes)` creates an SVG element; create them in
  `create`, only set attributes in `draw`.
- `draw(ctx)`: `P(x, y)` maps head units to page pixels (tilt, squash and
  size applied); `matrix` is the same as an SVG matrix for a whole group;
  `k` is pixels per unit now; `drag` is the lag of a part that trails behind,
  in units (use it for hair, lashes, a tail).
- `destroy()` (optional): for a head that drew something outside its own
  layer (the hull of `library/trait-et-or/characters/boat.js`, put over
  whoever stands in it); it takes that away when the figure goes.

## A body that is not a person's

The engine's body has two legs and two arms. An animal gets an animal's
body, not a person's with another head: `library/default/cartoon-realiste/characters/cat.js` is the
model. It is drawn from the side, keeps the engine's legs as hind legs,
declares `arms: 'none'` and `sits: false`, and draws its own front legs in
`draw()` with the engine's walk:

```js
import { anatomy } from 'figurant';
// in draw({ state, P, k, ground, body }):
const leg = anatomy.legPoints(body, { ...state, phase: state.phase + Math.PI / 2 }, side, P(21 * state.dir, 13), ground, k);
// leg.hip, leg.knee, leg.foot, leg.toe are page points
```

`ground` is the floor under the character, in page pixels; `body` its
proportions. A profile turns round with `state.dir` (1 right, -1 left):
mirror the drawing and move the hips in `frame(state)`. Scenes written for
hands do not suit such a body: give it scenes of its own.

## The state: what scenes animate

Every character has the body's numbers. A scene may use them on any character.

| Number | Meaning |
| --- | --- |
| `x`, `y` | Position from its anchor, in **pixels**. `y` is where the feet stand. |
| `scale` | Size. On screen a character unit measures `unit × scale` pixels (`c.figure.k`). |
| `tilt` | Degrees, clockwise. |
| `squash` | Above 0 flat and wide, below 0 tall and narrow. |
| `crouch` | Body lowered while the feet stay put, in units. |
| `legs`, `arms` | How far the limbs have grown, 0 to 1. |
| `walk`, `phase`, `dir` | Walking (0 to 1), where in the stride, which way it faces. `moves.walkTo` drives them. |
| `sit`, `seat` | Sitting on an edge (legs dangling), on a chair (feet down). |
| `tuck` | In the air: legs folded under the body and turning with its `tilt` (a somersault). |
| `stretch`, `wave` | Both arms up; right arm waving. |
| `breath` | Idle breathing. |
| `handL`, `handR`, `footL`, `footR` | Placed hands and feet: use `c.hands` and `c.feet`. |
| `shadow`, `floor`, `rope`, `ropeTop` | Contact shadow and the thread it hangs from. |

### The optional vocabulary of a head

The director and the stock moves also speak to the head, through names that
come from the first character (an eye). **All are optional**: a number a head
does not have is ignored, so a character with none of them still walks,
jumps and plays scenes. Give your head the ones that make sense for it, with
these names, and it reacts to visitors for free.

| Number | Range | Who drives it | A teapot could use it for |
| --- | --- | --- | --- |
| `gazeX`, `gazeY` | -1 to 1 | The director (follows the pointer, glances around), `moves.glance`. | Where its eyes or spout point. |
| `lid` | 1 open, 0 shut | The director (blinks), `moves.blink`. | Its lid, lifting. |
| `pupil` | around 1 | The director (interest when the pointer is near, fright). | Any sign of attention. |
| `wide` | 0 to 1 | Surprise (`land`, the startle). | Steam, raised brows. |
| `squint` | 0 to 1 | Scenes (focus, doubt). | |
| `open` | 0 to 1 | A `home` controller, for a head that unfolds from a logo. | |

A head may add any other number of its own (`steam`, `flame`): scenes written
for that character animate them the same way. The engine does not know them:
when a scene is interrupted it resets the body and the vocabulary above, not
yours. A scene that raises `steam` adds `c.onLeave(() => { c.state.steam = 0; })`.

`state.clock` is the time the character has lived, in milliseconds: use it in
`draw` for what moves by itself (steam swaying, a flame).

## Proportions

Override any of these in `proportions` (character units):

| Name | Default | Meaning |
| --- | --- | --- |
| `thigh`, `shin` | 28, 30 | Leg segments. |
| `reach` | 53 | Hip to ground when standing (a little less than the leg: knees slightly bent). |
| `foot` | 9 | Foot length. |
| `stride`, `lift` | 28, 10 | Half a step's length; how high a foot rises. |
| `upper`, `fore`, `hand` | 27, 27, 7 | Arm segments and the hand stroke. |

Short legs under a big head read as cute; long legs as elegant. Keep `reach`
below `thigh + shin`: a leg cannot be longer than its two segments, and the
director reports a character whose legs do not reach the ground.

## Putting it on a page

```js
import { createClock, driveWithAnimationFrame, createStage, createDirector, describeProblems } from 'figurant';

const clock = createClock();
driveWithAnimationFrame(clock);
const director = createDirector({
    stage: createStage(),
    clock,
    cast: { default: { character: teapot, unit: 1.2, scale: 0.75 } },
    scenes: { tea },
}).start();
console.warn(describeProblems(director.problems).join('\n'));
```

`unit` is pixels per character unit (a number, or a function for a size that
follows the layout). The page needs at least one `data-fig-spot`.

## When a drawing cannot be rigged

Say so. A drawing with no clear bottom edge for hips, or whose parts must
bend (a snake, a rope), is not a head with limbs. Do not approximate it
silently: tell the person what would have to change in the drawing.
