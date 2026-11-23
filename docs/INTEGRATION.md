# Putting characters and scenes on a website

For a coding agent working on **someone's existing site**, whatever it is
built with. Read this whole page before touching the site.

## What you are adding

Three things, and nothing else:

1. A folder of plain ES modules: the engine, and the characters, props and
   scenes chosen. No dependency, no build step, no network request.
2. A few `data-fig-*` attributes on elements the site already has.
3. One small module that starts it, loaded on the pages that use it.

Figurant draws in one SVG laid over the page (`position: absolute`,
`pointer-events: none`, hidden from screen readers). It never changes the
site's own elements, classes or layout, and never blocks a click.

## Steps

### 0. The commands, and where things live

Nothing is installed: the command is this repository's file.

```
node /path/to/figurant/cli/figurant.js <command>
```

Below it is written `figurant <command>`. Characters, props and scenes made
for a site live in a **project** of their own, a folder next to the site
(never inside the folder the site serves):

```
figurant init ../my-site-animation     # makes figurant.config.js and the folders
```

In a project, import the engine by name (`from 'figurant'`): the commands and
the atelier resolve that name to this engine, and `take` rewrites it for the
site. Do not import the engine by path.

### 1. Take what you need

Run from the project folder (the library of this repository is a project too):

```
figurant take characters/brioche.js scenes/brioche/oven.js --to ../my-site/js/animation
```

It copies those files, everything they import, and the engine (in
`figurant/`), with imports rewritten to work from there. The destination
must be a folder the site serves as static files. **Never edit the copies**:
change the originals and take again.

To see what exists before choosing, run `figurant atelier` in the project.

### 2. Mark the places

On the site's templates, add markers to existing elements (see
`docs/SCENES.md` for all of them, and for how the character chooses where to
go):

```html
<h1 data-fig-spot="hero" data-fig-enter="drop" data-fig-at="0.8" data-fig-sit="no">
<h2 data-fig-spot="story" data-fig-scene="oven" data-fig-on="idle">
```

A character stands on the **top edge** of a marked element, so it needs free
space above it, about its own height. Use only `data-fig-*`: never hook onto
the site's classes or ids.

Three things decide what a visitor sees, and none of them gives an error
when it goes wrong:

- **Among the places on screen, the one whose top edge is nearest the middle
  of the screen wins.** Two places visible at once on a tall screen: the
  character may never visit the first. Check on a large and a small screen
  which place it is on when the page loads. There is no priority between
  places yet: if the first one loses, move the second further down the page
  or drop one of them.
- **A place whose scene starts on `attention` or `click` is not on the
  route**: the character goes there only when asked (hover; on a phone, the
  element centred on screen). A place that should simply be visited as the
  page scrolls uses `idle` or `view`, or no scene.
- **A scene that does not fit is not played**, silently: on a phone, a scene
  with a wide `room` may never play. Give it a compact variant, and check at
  360 pixels.

### 3. Start it

One module of the site's own, next to the copied folder:

```js
// js/animation/start.js
import { start } from './figurant/index.js';
import { brioche } from './characters/brioche.js';
import { oven } from './scenes/brioche/oven.js';

const header = document.querySelector('header');   // the site's fixed header, if it has one
const show = start({
    cast: { default: { character: brioche, unit: () => (innerWidth < 600 ? 0.7 : 1), scale: 0.6 } },
    scenes: { oven },
    clearance: () => header?.getBoundingClientRect().height ?? 0,
});
for (const line of show.problems) console.warn('[figurant]', line);
```

```html
<script type="module" src="/js/animation/start.js"></script>
```

The stick figure comes with the engine: `import { start, stickman } from
'./figurant/index.js'`. `start` makes the clock, the drawing layer, the effects and the director. It
returns `{ director, reduced, problems, stop }`. `unit` is pixels per
character unit; a function makes it follow the layout. `clearance` keeps the
character out from under a fixed header; a function follows a header that
changes height. Finding that header is the one place where reading the
site's own markup is expected.

### 4. Give it the site's colours

```css
:root { --fig-ink: #1c1c1c; --fig-paper: #ffffff; --fig-accent: #b8860b; --fig-z: 50; }
```

`--fig-paper` must be the background the character stands in front of, or
its body will show as a patch. `--fig-z` places the stage among the site's
layers: above the content, below menus and dialogs.

## By kind of site

| Site | Where the pieces go |
| --- | --- |
| Static HTML, server templates (PHP, EJS, Django, Rails...) | Files in the public folder; markers in the templates; the `<script type="module">` before `</body>` of the pages that use it. |
| WordPress | Files in the theme (or a small plugin); enqueue `start.js` as a module script; markers through the block's "additional attributes", or in the theme's templates. |
| React, Vue, Svelte (single-page) | Import the same modules from a component that mounts once. Call `start` after the page's elements exist, and `show.stop()` on unmount. Markers are ordinary attributes in the markup. |
| Next, Nuxt, Astro (rendered on the server) | Run it in the browser only (a client component, `onMounted`, a `client:load` island). Nothing of Figurant runs on the server. |
| A site builder with no file access | It needs a place to host the modules and a way to add attributes. If either is missing, say so. |

**Pages that change without reloading.** The director reads the markers once,
when it is created. After a navigation that replaces the content, call
`show.stop()` and call `start` again. There is no automatic rescan.

## Rules for a sound integration

- **Load it only where it is used**, and after the content: it is
  decoration. A dynamic `import()` when the first marked element exists is
  ideal.
- **Reduced motion is honoured by `start`**: with that setting it adds
  nothing to the page, not even an empty layer. Do not work around it.
- **Phones.** There is no hover: scenes set on `attention` play when their
  element is centred. Check at 360 pixels that the character does not cover
  what people read; give it a smaller `unit` there, or fewer places.
- **Content security policy.** Everything is same-origin modules and inline
  SVG attributes set from script: `script-src 'self'` is enough, and no
  `unsafe-inline` or `unsafe-eval` is needed if `start.js` is a file.
- **Do not animate over** forms, payment steps, cookie banners or anything
  the visitor must act on.
- **Errors never break the page**: a scene that throws is stopped and the
  character goes back to waiting. Still, read the console once and fix what
  `describeProblems` reports.

## Before saying it is done

1. No error or warning in the console on every page touched.
2. No horizontal scroll bar at 360, 768 and 1440 pixels wide.
3. Every marked place: the character arrives, and its scene plays when it
   should. From a script: each character and each prop on stage is an SVG
   group with a `data-fig-layer` attribute holding its name; a scene is
   playing when its props are there.
4. With reduced motion on: nothing appears, and the page is unchanged.
5. Tell the person exactly which files you added and which templates you
   changed, and that **only they can say whether the motion looks right**:
   ask them to look, on a phone too.

## What is not there yet

- A single bundled file (`figurant build`). Today the engine is a folder of
  modules.
- Picking places by clicking on the live site. Today markers are written in
  the templates.
- A rescan after the page changes by itself.
