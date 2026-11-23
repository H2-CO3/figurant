# Animations and scenes

Two words, kept apart since the atelier was reorganised:

- an **animation** is one character playing one thing (in the config it is
  still listed under `scenes`, and in code it is "a scene": this guide, down
  to "Scenes of several characters", is about animations);
- a **scene** is several characters, each playing animations, laid out in
  time (in the config: `compositions`). See the last section.

An animation is what a character does at one place of the page. This is **scene
format 1** (`SCENE_FORMAT` in `src/director/scene.js`). Members may be added
to it; none will be removed or renamed without changing that number.

## Where the file goes

One file per animation, in a folder named after its character:
`scenes/<character>/<what-it-does>.js`, exporting one object. Register it
under the name `<what-it-does>-<character>` (`stretch-tabby`): in a project,
in `figurant.config.js` under `scenes`; in this repository, in
`library/<style>/index.js`. A scene of several characters goes in
`compositions/` and is registered under `compositions`.

## The format

```js
export const tea = {
    character: 'teapot',
    room: { left: 20, right: 140, up: 110 },
    variants: [{ name: 'compact', room: { left: 20, right: 60, up: 110 } }],
    mood: 'free',
    data: { cups: 2 },
    async play(c, ctx) { /* ... */ },
};
```

| Field | Required | Meaning |
| --- | --- | --- |
| `play(c, ctx)` | yes | The sequence. An async function. |
| `room` | no | Free space the scene needs around the character's feet, in character units: `left`, `right`, `up`. The director measures what is free on screen; a scene that does not fit is **not played**, never cramped. |
| `variants` | no | Smaller versions, tried in order when the full scene does not fit. Each has a `name` and may override any other field. `ctx.variant` says which one plays (`'full'` for the scene itself). |
| `mood` | no | `'free'` (default) plays on ordinary places only. `'solemn'` or `'any'` may play on a place marked `data-fig-mood="solemn"`. |
| `character` | no | The character the scene was made for: a name, or a list. **A scene belongs to its character**: furniture sizes, hand positions and room are fitted to one body. Another character does not play it (the director reports the mismatch); it gets its own adapted copy, named `<scene>-<character>`. Omit the field only for a scene that uses nothing but the body's stock moves. |
| `data` | no | Anything the scene keeps for itself. Unknown fields elsewhere are reported as mistakes, so put your own values here. |

`checkScenes(scenes)` returns every mistake with its fix; the director adds
them to `director.problems`. Print `describeProblems(director.problems)` while
developing.

## Tying a scene to the page

Scenes are given to the director by name, and placed with markers:

```html
<article data-fig-spot="tea" data-fig-scene="tea" data-fig-on="idle" data-fig-at="0.2">
```

| Marker | Values | Meaning |
| --- | --- | --- |
| `data-fig-spot` | a name | A place a character can stand on (the element's top edge). |
| `data-fig-at` | 0 to 1 | Where along the element. Default 0.5. |
| `data-fig-enter` | `walk` `rope` `drop` `none` | How it arrives. `none`: it is simply standing there. |
| `data-fig-scene` | a scene name | The scene of this element. On an element inside a spot, a scene of its own (a card in a row). |
| `data-fig-on` | `attention` `idle` `click` `view` | What starts it. `attention`: the visitor hovers the element (on touch screens: the element is centred). `idle`: the visitor leaves the character alone. `view`: as soon as the character is there; if the visitor interrupts it, it starts again once left alone. |
| `data-fig-mood` | `free` `solemn` | `solemn`: the character stays quiet there and only solemn scenes play. |
| `data-fig-cast` | a character name | Which character this place is for. Default `default`. |
| `data-fig-sit` | `yes` `no` | Whether it may sit on this edge when idle. Default `yes`: its legs then hang over the element, so say `no` on a title or anything people read. |
| `data-fig-home` | a character name | The element a character is born from (a logo, say). Needs a `home` controller in the cast. |

Only `data-fig-*` attributes are read: restyling a site cannot break a scene.

### Where the character goes

- Among the places on screen, it goes to the one whose top edge is nearest
  the middle of the screen, and changes place as the page scrolls.
- A place needs free space above it: the character's height, under any fixed
  header (`clearance`).
- A place whose scene starts on `attention` or `click` is **not on that
  route**: the character comes only when asked.
- On `idle`, the scene plays each time the visitor leaves the character
  alone for a few seconds (every other time it sits instead, if it may).
  On `view`, it plays once per visit of the place.
- A scene that does not fit the free space is not played, and nothing says
  so: look at it in the atelier at each width.

## What `play` receives

### `c`, the sequence context

Every step is awaited. A scene can be interrupted at any moment (the visitor
scrolls away, the pointer comes close): the step being awaited then throws and
the scene unwinds. **Always `await` steps, and never catch that error.**

| Member | What it does |
| --- | --- |
| `c.state` | The character's numbers (see `docs/CHARACTERS.md`). Read them; change them through the steps below. |
| `c.figure` | The figure: `c.figure.k` is pixels per character unit; `c.figure.points` has where the hands, feet, top and ground were last drawn. |
| `await c.tween(to, ms, ease?)` | Animates state numbers: `c.tween({ crouch: 6, tilt: 4 }, 300)`. Numbers the character does not have are ignored. |
| `c.also(to, ms, ease?)` | The same, without waiting: an accent that overlaps the next step. |
| `await c.wait(ms)` | Waits. |
| `await c.all(a, b, ...)` | Runs several steps at once. |
| `await c.hands({ left, right }, ms?, ease?)` | Places hands. A target is `{ x, y, angle? }` in character units from the figure's origin; `null` frees the hand; an omitted side is left alone. `page: true` makes x and y page pixels. |
| `await c.feet({ left, right }, ms?, ease?)` | Places feet, for steps a walk cannot make. A target is `{ x, y, pitch? }`: x from under the hip, y above the ground, pitch 90 on the toe, negative on the heel. `null` gives the foot back to the walk. |
| `c.prop(description, { x, y, behind, state })` | Brings an object on stage, positioned from the character's place, in character units. It leaves with the scene. Returns the prop: animate `prop.state.draw` from 0 to 1 to trace it. |
| `c.give(side, description, { point, tilt, state })` | The same, in a hand. `tilt` may be a function, to turn it. |
| `await c.animate(object, to, ms, ease?)` | Animates any object's numbers (a prop's state, your own). |
| `c.onLeave(fn)` | Something to undo when the scene ends or is interrupted. |
| `c.alive` | False once the scene has been interrupted. |
| `c.clock`, `c.actor` | The clock and the actor, for the rare cases above are not enough. |

Stock moves take `c`: `blink`, `glance(c, gx, gy, hold)`, `walkTo(c, x, pace)`,
`hop`, `land`, `sitOnEdge`, `recover` (`import { moves } from 'figurant'`).

### `ctx`, the scene context

| Member | Meaning |
| --- | --- |
| `ctx.place` | The place: `element`, `name`, `at`, `enter`, `scene`, `on`, `mood`, `cast`, `sit`. |
| `ctx.room` | The free space measured now: `left`, `right`, `up`, in character units. |
| `ctx.variant`, `ctx.scene` | Which version plays, and its fields. |
| `ctx.api` | Effects: `import { effects } from 'figurant'`, then `effects.dust(ctx.api.fx, [x, y], { k: c.figure.k })` or `effects.burst(...)`, with x and y in page pixels (a prop's `point()`, or `c.figure.points`). The page around the character: `pointer.at` (where the visitor's pointer is, or null), `view()` (the visible page, in pixels from the character's anchor, with `toLocal(x, y)`), `random()` (seeded: use it, not `Math.random`), `fx` (effects, when the director was given some), `noHover` (a touch screen), `stage`, `clock`. |

## Rules that keep scenes sound

1. **Units and origins.** Positions of hands, feet and props are in character
   units, so a scene plays the same at any size. Only `state.x` and `state.y`
   are pixels: multiply by `c.figure.k`. Three origins, not one:
   - a **hand** target is measured from the (0, 0) of the head's drawing, y
     down; its `angle` is where the hand points, in degrees from straight
     down (90 right, 180 up, -90 left). The ground is at
     `hipY + reach` in that frame (75 for the stick figure). The target moves
     down with `crouch` and sideways with `state.x`, but is not turned by
     `tilt` nor mirrored by `dir`. An arm reaches `upper + fore` (54 by
     default) from its shoulder: a target further away is not reached, and
     nothing says so;
   - a **foot** target is measured from under its hip, y up from the ground;
   - a **prop** from `c.prop` and a scene's `room` are measured from where
     the character's place is: the ground under its feet, y down (so a point
     above the ground has a negative y).
2. **Time.** Everything goes through `c`: no `setTimeout`, no
   `requestAnimationFrame`, no `Date.now`. Tests step the clock by hand.
3. **Space.** Declare the `room` the scene uses, widest pose included. The
   director compares it with the free space as declared, side for side: a
   scene that needs 150 on the right is refused where the room is on the
   left. To play on either side, add a variant with the room mirrored and
   mirror the scene yourself when that variant is chosen:

   ```js
   room: { left: 30, right: 150, up: 110 },
   variants: [{ name: 'left', room: { left: 150, right: 30, up: 110 } }],
   async play(c, { variant }) { const side = variant === 'left' ? -1 : 1; /* x * side everywhere */ }
   ```
4. **Leave the stage clean.** Props from `c.prop` and `c.give` leave by
   themselves. Anything else you create is removed in `c.onLeave`.
5. **A scene may loop** (`for (;;) { ... }`): the director interrupts it when
   needed. A scene that ends hands the character back to the page.
6. **Planted feet do not slide.** When the body moves while a foot is placed,
   move the foot target the other way by the same amount, with the same
   duration and easing.

## Props

A prop is data, in the same units as its character:

```js
export const loaf = {
    name: 'loaf',                 // names its drawing layer
    shapes: [
        { tag: 'path', attrs: { d: 'M -20 0 Q 0 -14 20 0 Z' }, accent: true, fill: true, weight: 1.6 },
        { tag: 'path', attrs: { d: 'M -8 -4 L -4 -8' }, weight: 0.7 },
        { tag: 'circle', attrs: { cx: 0, cy: 0, r: 2.6, fill: 'var(--fig-ink)', stroke: 'none' } },
        { tag: 'text', text: 'PAIN', attrs: { x: 0, y: 10, 'font-size': 8, 'text-anchor': 'middle' } },
    ],
    points: { grip: [0, 0], top: [0, -14] },
};
```

- `accent: true` strokes the shape in the accent colour (otherwise ink);
  `fill: true` fills it with the paper colour; `weight` is its stroke as a
  share of the character's line. See `docs/DESIGN.md` for which to use where.
- The origin (0, 0) is the prop's reference point: the spot on the floor for
  furniture, where the hand holds it for something held.
- `points` are named places on it: `prop.point('top')` gives one in page
  pixels; `c.give(side, prop)` puts its `grip` in the hand.
- A prop's `state` has `draw` (0 to 1: it traces itself), `tilt` (degrees),
  `flip` (1, or -1 to mirror it), `scale`, and `x`, `y`. Beware: `x` and `y`
  in `c.prop(..., { x, y })` are character units, but `state.x` and
  `state.y` are **pixels** (multiply by `c.figure.k`); `scale` starts at the
  character's own scale, not at 1; and the stroke keeps its thickness when
  you change `scale`, so do not grow a small prop by scaling it.
- Props are stacked in the order they are created; `behind: true` means
  behind the character.
- A prop in a hand stays upright whatever the hand's `angle`: its `tilt` is
  absolute.
- A rich prop may be several `layers` (each `{ name, shapes }`) sharing one
  `points`.

`figurant check` checks the props listed under `props` in the config.

## A complete scene

```js
import { moves, easing } from 'figurant';

const cup = {
    name: 'cup',
    shapes: [{ tag: 'path', attrs: { d: 'M -8 -10 L -6 4 L 6 4 L 8 -10 Z' }, fill: true }],
    points: { grip: [0, 0] },
};

export const tea = {
    room: { left: 30, right: 60, up: 110 },
    async play(c, { api }) {
        const mug = c.give('right', cup, { state: { draw: 0 } });
        await c.all(c.hands({ right: { x: 34, y: 2, angle: 90 } }, 300), c.animate(mug.state, { draw: 1 }, 400));
        await c.tween({ tilt: -6 }, 300, easing.easeOut);   // it drinks
        await c.wait(900);
        await c.tween({ tilt: 0 }, 300, easing.easeOutBack);
        await moves.blink(c);
        await c.hands({ right: null }, 250);
    },
};
```

## Scenes of several characters

A scene is **data**: who is in it, where each stands, and for each a track
of clips with their start times. The atelier shows it as a timeline, one
track per character.

```js
export const walkTheDog = {
    title: 'Walking the dog',
    style: 'cartoon-realiste',   // optional: the atelier lists it under that style
    width: 640,                  // the floor it needs, in character units
    length: 13500, loop: true,   // optional
    cast: [
        { id: 'owner', character: 'stickman', at: -250 },        // character: a name of the cast
        { id: 'dog', character: 'dog', at: -185, dir: 1 },       // at: units from the middle of the floor
    ],
    props: [{ prop: 'lounger', at: 200 }],                       // optional scenery
    ties: [{ from: 'owner:handR', to: 'dog:top', slack: 0.18 }], // optional: a line between two points (a lead)
    tracks: {
        dog: [{ at: 0, walk: 80, pace: 0.8 }, { at: 3600, play: 'sniff-dog' }, { at: 8200, exit: 'right' }],
        owner: [{ at: 300, walk: 10 }, { at: 4300, move: 'look-right', over: 1400 }, { at: 8600, exit: 'right' }],
    },
};
```

A cast member may **ride** another: `{ id: 'sailor', character: 'stickman',
on: 'boat', at: -37, up: 39 }` stands `at` units from the middle of its
carrier and `up` units above the floor, and goes where the carrier goes. A
rider does not walk or exit (the checker says so): move the carrier, and give
the rider `play`, `move` or `set` clips. `state: { ... }` on a cast member
sets numbers of its own before the scene starts. See
`library/trait-et-or/compositions/stickman-naviguant.js`.

A clip starts at `at` (milliseconds from the beginning), **replaces** what
its character was doing, and does one thing:

| Clip | Does |
| --- | --- |
| `walk: x`, `pace?` | Walks to x. |
| `play: 'animation'`, `with?: {…}` | Plays an animation of that character (or one any body can play). `with` reaches it as `ctx.data` (the word on a placard). A looping animation goes on until the next clip. |
| `move: 'hop' \| 'blink' \| 'wave' \| 'look-left' \| 'look-right' \| 'look-front' \| 'turn'`, `over?` | A stock move. |
| `set: { … }`, `over: ms` | Animates numbers of its state (`tilt`, `wide`, its own ones). |
| `fly: height`, `over: ms` | Rises to that height above the floor (character units) and stays there for the clips that follow; `fly: 0` comes back down. For a sun, a bird, a balloon; not for a rider. |
| `exit: 'left' \| 'right'` | Walks off the floor. |

An animation is written around the spot where its character stands when it
starts (its steps, its props). In a scene it is played from there, wherever
the character is on the floor; `walk` and `exit` are measured from the middle
of the floor.

Tie points are `<id>:handL`, `handR`, `top` or `centre`.

`checkComposition(name, scene, { characters, animations, props })` reports
every mistake with its fix (`figurant check` runs it); `playComposition`
plays one on a page:

```js
import { playComposition, createClock, driveWithAnimationFrame, createStage } from './figurant/index.js';
const clock = createClock(); driveWithAnimationFrame(clock);
const floor = document.querySelector('[data-scene-floor]');   // any element: the cast stands on its top edge
const show = playComposition({
    stage: createStage(), clock, composition: walkTheDog, characters, animations, props,
    origin: () => { const box = floor.getBoundingClientRect(); return [box.left + scrollX + box.width / 2, box.top + scrollY]; },
    unit: Math.min(1.4, floor.clientWidth / walkTheDog.width),
});
// show.stop() removes everything.
```

### Sound

A scene may play sound files, each at its time:

```js
sounds: [
    { at: 0, src: 'assets/morning-birds.ogg', volume: 0.4, loop: true },
    { at: 4200, src: 'assets/hello.mp3' },
],
```

`src` is a path from the project's folder (mp3, wav, ogg, m4a, flac or
webm); `volume` goes from 0 to 1; `loop` goes round until the scene ends.
Figurant makes no sound: it plays the file mechanically, in step with the
scene, so that pausing, slowing down, going to a moment on the timeline or
looping does the same to what is heard. Where the file comes from is not its
business: the person provides it, or you make it with whatever sound tool
they have (a text-to-speech or music service, a local program) and save it
under `assets/`. Never name a file that does not exist: `figurant check`
reports it; in the page, a missing file is simply silent.

- The atelier shows the sounds as a track marked ♪ on the timeline. An
  export carries them in its folder; a GIF has no sound.
- A browser plays no sound before the visitor's first click on the page. In
  the atelier that click has always happened; on a website, do not rely on
  sound for the first seconds.
- You cannot hear. Say so, and ask the person whether the sound falls where
  it should: give them the times you chose.
- A page that holds or slows its clock tells the scene: `show.sound({
  playing: false })`, `show.sound({ speed: 0.5 })`. `sound: false` in
  `playComposition` plays none.
- Sound is for scenes. A single animation has none yet.

Writing a good one:

- **Stagger.** Nobody starts, arrives or reacts at the same millisecond:
  offset the same clip by 150 to 300 ms from one character to the next.
- **One thing to look at at a time.** While two characters meet, the others
  hold (a look, a loop).
- **Give it an end**, and let it loop: on a web page it plays while someone
  scrolls past, more than once.
- Keep it short (10 to 30 s) and declare the `width` it really uses.
- `library/common/compositions/walk-the-dog.js` is the small model,
  `library/default/compositions/strike.js` the large one.

## Not in the format yet

- An animation's steps are code; a scene of several characters is data
  (above). The atelier's timeline shows a scene but does not edit it yet.
- A scene is not yet tied to a page by a marker: play it with
  `playComposition`.
- Input, collisions and rules (for games) are planned as an optional layer on
  top of actors. Nothing in a scene assumes there is no such layer.
