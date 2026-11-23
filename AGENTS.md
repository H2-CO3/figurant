# Working on Figurant

Read this first if you are an AI coding agent.

Figurant is two things. An **engine** (`src/`): zero-dependency JavaScript
that gives arms and legs to anything (an eye, a teapot, a drawing) and makes
it act, on a web page or in a GIF. And an **atelier** (`cli/`, `atelier/`): a
local page where a person says what they want and you make it. The stick
figure in `src/characters/stickman.js` is only the reference character.

If a person is at the atelier and wants things made, your job is in
`docs/ATELIER.md`: start there. What is planned next is in `docs/ROADMAP.md`.

## Which document for which job

| You want to | Read |
| --- | --- |
| Create a character from a drawing | `docs/CHARACTERS.md` |
| Write an animation (one character) or a scene (several, in time), or place one on a page | `docs/SCENES.md` |
| Draw a character or a prop | the project's `STYLE.md` (the person's choice of style), `docs/DESIGN.md`, then the models in `library/default/cartoon-realiste/characters/` |
| Put a scene, a character or a prop in front of a person and act on their directions | `docs/ATELIER.md` |
| Add characters and scenes to an existing website | `docs/INTEGRATION.md` |
| Put on a website something exported from the atelier (a folder `exports/<name>/`) | that folder's `EXPORT.md`, then its `INTEGRATION.md` |
| See it all working | `examples/page.html` (a page), `library/common/scenes/stickman/notes.js` (a scene with props), `examples/hand-seals.js` (hands and effects) |
| Change the engine | this file |

Only what `src/index.js` exports is public.

## Map of the engine

| Folder | What it holds |
| --- | --- |
| `src/core` | The clock (all time flows through it), easing curves, springs, seeded random. |
| `src/body` | Legs and arms as pure geometry: walking without sliding, sitting, placed hands and feet. No DOM. |
| `src/figure` | One character drawn on a stage: its state (numbers) turned into SVG. |
| `src/heads` | `shapeHead`: a head described as data. |
| `src/actor` | Interruptible sequences (`c.tween`, `c.hands`, `c.feet`, `c.prop`...), stock moves. |
| `src/props` | Objects described as data, held or placed. |
| `src/fx` | Particles and temporary shapes. |
| `src/director` | Reads `data-fig-*` markers, takes characters from place to place, starts scenes when they fit. `scene.js` is the scene format and its checker. |
| `src/stage` | The SVG layer laid over the page. |
| `library` | Characters, props and scenes ready to take into a site, **one folder per style**, all built the same way (`characters/`, `props/`, `scenes/`, `kit.js`, `index.js`); `library/default/` holds earlier work in several styles, each in a sub-folder (its `cartoon-realiste/characters/` are the models to draw from); `library/common/` holds what belongs to every style, `library/emoji/` the emoji figures, a kind apart. Each file imports only `'figurant'` and its neighbours. |
| `cli`, `atelier` | The `figurant` command and the local atelier page (Node's standard library only; never imported by `src/`). |

## Rules

- No runtime dependencies. Browser code is plain ES modules.
- Nothing in `src/` may reference a specific website, page or character.
  Nothing in the body, the actor or the director may require a head to have
  eyes: head numbers (`lid`, `gazeX`...) are optional, and a test pins that.
- All time flows through a `Clock` (`src/core/clock.js`). Never call
  `requestAnimationFrame`, `setTimeout` or `Date.now` from engine or scene
  code: tests step the clock by hand, and code that bypasses it cannot be
  tested.
- The scene format is frozen at version 1 (`docs/SCENES.md`). You may add
  members; removing or renaming one must change `SCENE_FORMAT`, and
  `tests/scene.test.js` will tell you.
- Mistakes a person can make (a marker, a scene field) are reported with
  their fix, never thrown: see `describeProblems`.
- Tests measure facts (a position, a state after an interruption), never
  screenshots. A new test must be seen failing once before it is trusted:
  break the code on purpose, watch the test fail, restore.
- A bug is fixed with a test that reproduces it first.
- Tests prove a character is in the right place and state. They do not prove
  the motion is good: say plainly what a person has not watched yet.
- If a drawing cannot be rigged, or you do not know, say so.

## Commands

- `npm test` runs the test suite (Node's built-in runner, nothing to install).
- `node cli/figurant.js atelier` shows the examples in the atelier (http://localhost:4173/__figurant/); `init <folder>` makes a project; `check` checks characters, scenes and props; `fiches` lists what people are waiting for (`--wait` returns only when someone is); `inspect <drawing.svg>` says what a drawing is made of and whether it can be rigged; `take <files> --to <folder>` copies library files and the engine into a website; `show <section>/<name> "words"` takes the person's page to an item and says what you are doing; `activity` says what the person has been looking at.
- `python3 -m http.server` at the repository root, then open `examples/`.
- `node scripts/vendor.js <folder>` copies the engine into a website as plain
  modules. Never edit that copy: change the engine here and copy again.
