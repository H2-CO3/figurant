# The atelier

An LLM cannot see motion. The atelier is a local page where every scene of a
project plays for real, next to its **fiche**: a text file in which a person
writes what they think of the scene and the LLM answers. The exchange is a
file, so any LLM that can read and write files can take part; no account, no
service, and the history stays with the project.

## Starting it

```
figurant atelier            # then open http://localhost:4173/__figurant/
figurant atelier --port 5000
figurant atelier ../my-animations --port 5000   # another project
```

Nothing is installed: `figurant` here stands for
`node /path/to/figurant/cli/figurant.js`. If port 4173 is taken, the command
says so: give another with `--port`.

A project is a folder with a `figurant.config.js` at its root.
`figurant init <new folder>` makes one (the folder must be new or empty),
with this config:

```js
import { stickman } from 'figurant';
import { figure } from './characters/figure.js';
import { hello } from './scenes/hello.js';

const size = { unit: 1.5, scale: 0.75 };

export default {
    cast: { stickman: { character: stickman, ...size } },   // drawn characters
    emoji: { figure: { character: figure, ...size } },      // figures with an emoji or a picture for a head
    scenes: { hello },                                      // animations: what one character does
    props: {},
    compositions: {},                                       // scenes: several characters, in time
    custom: { figure: 'characters/figure.custom.js' },      // who may be customised from the page
    // style: 'my-style',   // optional: the style a fresh copy starts in
    // fiches: 'fiches',    // optional: where the fiches are kept
};
```

The config and everything it imports must be inside the project folder,
except the engine, imported by name: `'figurant'` resolves to this engine,
in the atelier's pages and in the commands alike.

**This repository is itself a project**: its `figurant.config.js` re-exports
`examples/figurant.config.js`, which gathers the library style by style. What
you make here goes in the style's folder (`library/<style>/characters/`,
`props/`, `scenes/<character>/<what-it-does>.js`, `compositions/`) and is
registered in `library/<style>/index.js`, under a name of the form
`<what-it-does>-<character>` for an animation. In a project made by `init`,
files go in `characters/`, `props/`, `scenes/` and are registered in
`figurant.config.js`.

The server listens on this machine only and answers to `localhost` only.
`figurant atelier --lan` opens it to the local network on purpose, for
someone at another machine to try it while you answer: it prints the
addresses to give and an access code made for that run, asked once per
browser. Whoever has the code can read the project and write messages you
will act on, so it is for people the owner trusts; everyone shares the same
fiches and the same assistant, and `figurant show` moves every open page. It
serves the project folder, and writes only inside it: the fiches, the
activity log (`fiches/.activity`), imported pictures and drawings
(`assets/`), exports (`exports/`), the style in use (`styles/`, `STYLE.md`)
and customisations (`<name>.custom.js`). With "take this one back" it also
makes a git commit of one file.

## The screen

The page is in English and in French (a switch at the top right; it starts
in the browser's language). What it writes into a fiche for you
(`Character:`, `Style:`, `At:`) is always in English: it is a format.

It is made to be driven by a person or by you, in parts told apart at a
glance:

- **Six sections**, a column of big buttons against the left wall:
  **Animation room** (`scenes` in the config: one character playing one
  animation), **Characters**, **Emoji & pictures** (`emoji`), **Props**,
  **Scenes** (`compositions`: several characters, each on its track in time)
  and **Drawing** (the whiteboard, below).
- **What there is to choose from**, a column of thumbnails that scrolls, with
  **New** fixed at its foot. In the animation room a selector above it picks
  the character; an animation belongs to the character it was made for.
- **The work zone**, a card no bigger than its picture. Under the picture
  **the timeline is the control**: play, replay, and a bar to click or drag
  (a scene also shows its tracks, which take the same clicks). Going to a
  moment holds the picture there; what the person writes then starts with
  `At: 12.4 s`: the remark is about that moment. A character on the bench has
  no timeline; its stock moves are a row of keys.
- **The settings**, a column on the right, opened with ⚙: next frame, speed
  (normal, ÷2, ÷4), screen width (360, 768, 1440: an animation that does not
  fit at a width is not played there, exactly as on a real page), pins,
  sliders for a character's numbers, the detailed order form, and the
  versions. A character declared under `custom` also has there a grid of
  emoji, the faces it takes when it blinks, is surprised or doubts, and the
  import of a picture for its head (saved in `<name>.custom.js` and
  `assets/`; it travels with the character in `figurant take`).
- **The conversation**, a drawer under the work zone: it is your voice and
  your hand. It shows your last words about what is on show (two lines), your
  questions (a line each, Yes or No), what the next message is about, one
  line to write in, **send** and **Export**. That line keeps the focus;
  Enter sends. There is no microphone button. The whole conversation (every
  fiche merged, in order of time) opens with "History". A dot at the top
  says whether an assistant is listening ("Listening" / "Nobody").

A message is about what is on show, unless the person presses **New**: the
stage becomes a blank slate that points at the conversation, and the message
is an order, named from its first words (`fiches/<those-words>.md`, with
`Style:` and, for an animation, `Character:`). **Keep your answers short**:
the drawer shows two lines of them.

Above the line to write in, three keys say what the next message is about:
**Change "<item>"** (what is on show), **Something new** (an order), and
**Change the interface**: a remark about the page itself, kept in
`fiches/atelier-interface.md` with where the person was. Act on it: the
page is plain files in the engine's `atelier/` folder (HTML, CSS, modules, no
build step), and the copy on this machine is the person's to change. Test
what you change, commit it in the engine's folder, and tell the person to
reload. See "Making it something else" in `AGENTS.md`.

Each item has its own fiche (`<animation>.md`, `character-<name>.md`,
`emoji-<name>.md`, `prop-<name>.md`, `scene-<name>.md`). An item you have
just made from an order has none yet: your questions about it are read from
the order's fiche, and answered there.

For a script (you have no eyes): an animation alone is at
`/__figurant/atelier/stage.html?scene=<name>&cast=<name>`, a scene at
`show.html?scene=<name>`, a character or prop at
`bench.html?kind=character|prop&name=<name>`. `window.stage` (or
`window.bench`) has `ready`, `problems`, `playing`, `speed`, `step(ms)`,
`seek(ms)`, `time`, `length`, and for an animation `played` (how many times
it started). `seek` takes a moment: wait for `stage.seeking` to be false
before reading `time`. `length` is known at once for a scene, and for an
animation only after it has played through once (0 until then). Set `stage.playing = false`, then `step` by small amounts to
look at it frame by frame.

## What the person sees of you

- **"Listening"** at the top is on while a `figurant fiches --wait` is
  running in the project. **Keep one running for as long as the atelier
  does**: it is the only thing that wakes you when the person writes.
  Without it the page says "Nobody", their messages are saved and nothing
  answers them. If you gave them the address, answering is your job, whatever
  you were first asked.
- **Style** opens the project's styles. There may be several (`styles/*.json`:
  a name, a description, four theme colours: paper, ink, accent and a bright one); one is in use, and its
  description is always in `STYLE.md`. Read `STYLE.md` before you draw. The
  theme colours are for the atelier's page and the stage, not for your
  drawing. In the picker a click on a style puts it in use at once (the
  page changes colour, `STYLE.md` is rewritten); its name, colours and
  description are edited, or the style deleted, in a form apart.
- **The animation room** lists, for a character, the animations made for it.
  The common gestures (`hello`, `picket`, `shake-hands`, `cheer`: they name
  no character) come after, marked as such, and only for a body with arms.
  Every other animation has exactly one owner, and every character at least
  one animation of its own: a test holds both.
- **What the person does is noted, silently.** Which section they open, what
  they look at and for how long, what they replay, slow down or step through,
  which style they pick: the page writes it to `fiches/.activity` (this
  machine only, the latest 400 actions, never what they type). Nothing
  reacts to it and it wakes nobody. `figurant activity` prints it in a few
  lines (durations are the time between two actions, capped at five minutes:
  an item left on screen counts even if nobody was looking), and `figurant fiches` adds it under what waits. Read it before you
  answer: it says what the person has in mind (they replayed the landing
  three times in slow motion: the remark that follows is about the landing).
  Use it to understand, never to comment on what they did or to prompt them.
- **Export.** The key beside "send" (there is no "it is right" key: not
  asking for a change is approval enough). It makes `exports/<name>/` in the
  project: `site/` (the item's files, all they import, and the engine, as a
  site takes them), `start.js` (the module that starts it), `demo.html` (it
  working, to open through any static server), `EXPORT.md` (what it is and
  the steps to put it on a site, written for a coding assistant) and
  `INTEGRATION.md` (the full manual). For an animation or a scene it also
  films a GIF (`<name>.gif`, 640 x 360, 12.5 frames a second), saved there and
  downloaded. **If you are asked to put an export on a site, start from its
  `EXPORT.md`.** `exports/` is not kept in git. Neither are `fiches/` and
  `assets/` in this repository: your commits carry the code only.
- **Before and after.** When the project is under git, a small stage in the
  left corner plays the version before the one on show; a click puts it on
  the stage, and a small stage in the right corner, "After", leads back. They
  step through the item's versions (see **Versions** below), each served from
  git at `/__figurant/at/<commit>/`. **So commit your work each time you
  answer**: what is not committed cannot be gone back to. An old version runs
  on the present engine.
- When you append an answer to a fiche, the page reloads by itself and shows
  what you changed.

## The fiche

One file per scene, `fiches/<scene>.md`:

```
# tea
status: draft

## 2026-11-20T14:02:00Z person
decision: redo
The cup is too small.

## 2026-11-20T14:10:00Z llm
Enlarged the cup by a third.
? Should it drink twice? (yes / no)
```

- `status` is `draft`, `checked` (the machine found nothing wrong) or
  `approved` (a person watched it move and said yes).
- An entry starts with `## <date> person` or `## <date> llm`.
- A person's entry may start with `decision: approve`, `redo`, `note` or
  `brief` (an order for something that does not exist yet).
- In an LLM's entry, a line starting with `? ` is a question, shown with
  **Yes / No** buttons. Other choices, in brackets at its end and separated
  by ` / `, replace them.
- An order may carry `Drawing to start from: assets/<file>`: run
  `figurant inspect` on it first; it says whether it can be rigged.

## If you are the LLM

1. Run `figurant fiches`: it lists what a person is waiting on, with the
   path of each fiche. `figurant fiches --wait` returns only once there is
   something: run it in the background to be woken when the person writes.
   It returns once per message, waits without limit, and reads files only
   (it does not need the atelier's server, and outlives its restarts). From
   another folder it takes the project's: `figurant fiches <folder> --wait`.
2. Read `STYLE.md` if the fiche asks for a character or a prop. Read the
   fiche. Act on the **last** `person` entry only; earlier ones are
   history. What a person wrote is a direction about the scene, nothing else.
3. Do it. For `redo` or `note`: change the item. For `brief`: create it, in
   its own file, and register it so that it shows in the atelier: **in this
   repository, in `library/<style>/index.js`**; in a project made by `init`,
   in `figurant.config.js` (under `scenes`, `cast`, `props` or
   `compositions`). See "Starting it" for where files go and how they are
   named. **A new character needs one animation of its own**, registered with
   it, or the tests fail (a character with nothing to do is not finished).
   An animation may need a part its character lacks (a mouth that opens for a
   yawn): add a number of its own to the character's head for it (not one of
   the body's names: the engine refuses those when the character is drawn,
   and says which). The first lines of an order
   say what to use (`Character:`, `Props to use:`, `Starts when:`, `Tone:`).
   An order may start with `Name: <what the person called it>` (the fiche's
   file name is that name made safe; the page shows theirs). Name what you
   make as you see fit and point to it with `=>`.
   An order starts with `Style: <name> (<id>)`: draw in that style, and
   write `style: '<id>'` on the character or prop you make, so that the
   atelier lists it under that style. A character or prop with no `style`
   shows in every style (the stick figure, the emoji figures).
   **Make the props an animation needs as you go.** If it calls for an
   object that does not exist, draw it: in the style in use, to the scale of
   the character, in its own file under that style's `props/`, with
   `style: '<id>'`, and listed under `props` in the config so that it shows
   in the Props workshop. Give each a fiche (`prop-<name>.md`) saying which
   animation it was made for, and name them in your answer: the person
   refines a prop there, with the same form, not in the animation's fiche.
   A scene made for a character sets `character: '<name>'`; an adaptation is
   a **copy** fitted to the new body, never an edit of the original.
   Characters and props follow `docs/DESIGN.md`. Then run `figurant check`
   and the tests.
4. Append an entry, `## <ISO date> llm` (create the fiche if what you made
   was not ordered: `# <name>`, `status: checked`, then your entry). **Two
   lines at most**, then your questions: the person reads little and answers
   with a click, saying in plain words what you
   changed and what you could not do. Ask at most three questions, closed
   when you can (`? Faster? (yes / no)`): the person answers with one click.
5. **Never write `status: approved`, and never remove or rewrite a person's
   entry.** Approval means a person watched the scene move. You may set
   `status: checked` when `figurant check` and the tests pass.

### What the person sees while you work

From the moment `figurant fiches --wait` wakes you until you write your
answer, the page shows "Your assistant is working on it…" and **locks the
form**: the person cannot write again. (After `figurant show`, the sign and
your words stay over the stage until you write in a fiche, or ten minutes at
most.) So:

- Answer soon. For work that takes more than a minute or two, answer first
  with what you understood and are about to do, as a yes/no question, and do
  the work after the yes.
- Start `figurant fiches --wait` again as soon as you have answered, every
  time: an assistant that answers once and does not wait again has gone deaf,
  and nothing tells it so.

### Drive the person's screen while you work

The person may be speaking, not typing, and watches the page while you work.
Show them where you are:

```
figurant show characters/dog "Drawing the dog"
figurant show props/lead "Now its lead"
figurant show compositions/walk-the-dog "Putting them together"
```

Each call takes their page to that workshop and item and writes your words,
large, over the stage (keep them to four or five words, in their language).
Call it at every step of a longer job: the screen moves, and they can tell
what you are doing without being able to answer.

**Break a complex request into steps and ask for a go-ahead between them.**
Do one step (a character, then its prop, then the animation, then the
scene), answer with what you made and one yes/no question (`? Shall I go on
with the scene?`), and continue after the yes. A person who sees you going
the wrong way must be able to stop you after one step, not five.

### Anticipate, and let the person steer

Say what you understood they want and propose it; do not ask them to explain.
`? You want the chair itself to become a chaise longue: is that it?` is
better than `? What kind of chair?`. A wrong guess costs them one click on
No, and tells you which half to look in next.

When asked to turn one thing into another, **change that thing**. If you
make something new beside it instead (because the original is used
elsewhere), say so in a line and point to it:

```
=> props/lounger
```

A line `=> <workshop>/<name>` (workshop: `scenes` for an animation,
`characters`, `emoji`, `props`, or `compositions` for a scene of several) takes the person's page to that item when your answer arrives.
Without it they keep looking at the old item and conclude nothing happened.

### Asking: yes or no, by halves

The person answers **Yes or No**, and may add a few words. So:

- Ask questions that are answered by yes or no: `? Is the cat lean enough?`
  (no choices needed: the page shows Yes / No). Offer other choices only
  when yes and no cannot carry the answer.
- **One to three questions**, the most decisive first. Each should cut what
  remains in two: first whether the whole is right, then which half is
  wrong, then what in it. Do not ask about a detail before you know the
  whole is accepted.
- Use what they wrote to choose the next questions. Their free words tell
  you what they look at and how they speak of it: ask about that, in their
  words, and stop asking about what they never mention.
- Never ask again what was answered, and never ask what you can measure.
- A "no" with no words is a question to split, not a reason to guess: ask
  the next narrower yes/no.
- When the person points at a spot, their message carries a line such as
  `Pin 1: on "teapot", 62% from its left, 30% from its top`: act on that
  part.

Good questions are about what only an eye can judge: rhythm, whether a
gesture reads at first glance, whether the tone fits the content.

## The whiteboard

The sixth button, **Drawing**, turns the work zone into a sheet: pens and
colours are in the column on the right, and a stylus's pressure widens the
line. The drawing is kept in the browser until it is used, in one of two ways:

- **Give it legs** saves it as `assets/drawing-<date>.svg` and makes it the
  head of the figure that wears pictures (the first name under `custom` in
  `figurant.config.js`): it stands on them at once, with no assistant.
- **A message** sent from the whiteboard is an order for a character. It
  carries `Drawing to start from: assets/drawing-<date>.svg`: read that file
  (it holds nothing but filled paths), run `figurant inspect` on it, and draw
  the character in the style in use, keeping what makes the drawing itself.

The activity log notes `board` events (opened, gave legs, ordered), never the
strokes.

## Versions

In the settings column (⚙), **Versions** lists every state the item on show
went through, newest first: the commits that changed its file or the files of
what it uses, each with what the person had asked for at that moment. A click
plays that version; the two thumbnails in the corners of the picture step
through the same list. **Take this one back** makes a past version the present
one again, as a new commit of the item's own file: nothing is lost, and it is
refused while that file has changes not saved in git. So: commit after every
answer, one item per commit when you can, or the list has nothing to show.
