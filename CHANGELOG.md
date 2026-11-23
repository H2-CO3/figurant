# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Ink wash: the brush writes 天 and 地 on an easel, stroke by stroke in the order they are written, its point on the paper all the way, and a frog on a rock watches (`heaven-and-earth`). The brush is redrawn (three lengths of bamboo, a carved cap, a tassel, a fuller tuft); a new easel and rock. This replaces the pond scene and the single stroke.
- Default style: a ballpoint pen without its cap (`ballpoint`), the common gesture `high-five`, a tap dance for the pen and one for the highlighter, and the scene where they meet (`pen-pals`).
- Neon at night: a runner on a light machine seen from behind (`neon-rider`, low and angular) and the race without end (`race-neon-rider`, scene `neon-ride`): two of them followed down a circuit that is a tunnel of lines, eight-sided, bending and twisting, with frames rushing by, panels on the walls, pulses along the edges, a core at the far end; they ride up the walls, trail a beam each, throw sparks when they brush, and the whole thing kicks forward every few seconds.
- The tug of war is three against three with a referee: both hands on the rope, heaves in time, sweat, the losers hauled over the line.
- The welcome says its example as the game does, in each language ("Simon says", « Jacques a dit »): there only.
- An **Effects** workshop in the atelier: the special effects a project lists under `effects` in its config, each played on the bench, and ordered like anything else. Four new ready-made effects in the engine (`shockwave`, `flash`, `bolt`, `wave`), eight in the library (`library/common/effects.js`).
- The duel is written on one floor and one clock shared by its two parts: they cross the whole stage, eight clashes land where the blades are, and each moment leaves the one before it time to end. Auras when the blades light up, a ring and a star at each clash, lightning for the lift, dust under every landing.
- The stick figure's duel for two (`duel-stickman`): both play it from the same instant, each its part, and one clock keeps them together through clashes with sparks, a jump, a parry, a throw and a lift from afar, and blades locked until they go out. `duel-dance` is now that duel, then the dance.
- A tutorial: a "?" on each part of the page says what it is for when pointed at or touched; one button in the heading turns them on or off, and they are on for a first visit.
- Four more scenes of two stick figures (`tug-of-war`, `copycat`, `for-and-against`, `well-met`) and a common gesture, `haul`. With `duel-dance`, where the foils are now swords of light, one blue, one red (`with: { colour }`), they are the examples that play while something new is asked for.
- The name in the heading goes back to the start: ready to ask for something new, an example playing.
- The stage is never empty while something new is asked for: an example plays on it (the stick figure's animations; on a first visit, two of them in a duel that ends in a dance), with the request that made it.
- The stick figure fences (`fence-stickman`), and a scene of two, `duel-dance`.
- What the library holds can have a name in each language (`item.<name>` in `atelier/i18n.js`); the stick figure's animations have one.
- The stick figure tap dances (`tap-dance-stickman`): shuffles, ball changes, a travelling step, heel digs, a finish.
- Sound on a scene: `sounds: [{ at, src, volume, loop }]` plays sound files in step with the scene's time (paused, slowed down, taken to a moment and looped with it). The atelier shows them as a track on the timeline, an export carries them. Figurant makes no sound: the files are the person's, or made by their assistant with whatever tool they have.
- `figurant atelier --lan`: the atelier opened to the local network on purpose, behind an access code made for each run (asked once per browser, five wrong tries lock an address out for five minutes).
- The lists show a picture of each animation (its most telling moment) and of each scene (a band over its name), with a loader while they are drawn; the character who plays is pictured beside their name.

### Changed
- A fresh copy starts in the default style, which is now the stick figure's own. The button that opens the styles shows the colours of the one in use.
- A first visit opens ready to ask for something: a new animation for the stick figure, the line to write in showing an example of a request.
- The atelier's stylesheet is one file per part of the page (`atelier/css/`: base, buttons, layout, tabs, strip, stage, side, dock, board, dialogs), imported in order by `atelier/atelier.css`, which says what each holds. The rules overridden further down are gone. Nothing looks different.
- The atelier's page script, one file of 1,200 lines, is sixteen modules in `atelier/page/`, one per part of the page; `atelier/atelier.js` starts it and says which is which. Nothing behaves differently.
- The column on the right is two separate blocks: short settings that never scroll, and the versions, which do. Export sits under the questions, away from the button that sends; "Change the interface" is the middle one of the three buttons.
- The atelier's server is split by concern: `cli/server.js` is the table of routes, and `cli/server/` holds the checks (`guard.js`), the access code (`door.js`), the files (`static.js`) and one module per part of the API. Nothing it answers has changed.

### Fixed
- French: one form of address throughout (tu), and a French word for the timeline.
- The server: an `Origin` that is no address is refused (403) and a name that cannot be read is a bad name (400), where both were answered as a breakdown (500); an address the API does not know is 404; a link out of the project is refused before it is read, not after.
- GIFs: a film stepped by 80 ms moved on by 50 ms only, so a GIF played slowed down and a scene was cut before its end.
- GIFs: an animation that needs more room than the film has was filmed standing still for forty seconds; it is now filmed from further away.
- GIFs: each frame brings its own palette, so a colour that comes late into a film rich in tones is no longer replaced by a neighbour.
- The working sign over the stage is taken down as soon as the assistant has answered.

## [0.1.0]

First public version.

### Added
- The engine: a body with arms and legs for any head, a clock all time flows
  through, interruptible sequences, props, effects, a director that places
  characters on a page from `data-fig-*` markers, and scenes of several
  characters on tracks in time (`walk`, `play`, `move`, `set`, `fly`, `exit`).
  Scene format version 1.
- The atelier (`figurant atelier`): a local page to watch, order and correct
  animations by talking to a coding assistant through files; a timeline to
  seek; versions listed from git, with before and after side by side and a
  way back; styles (a brief and four colours); export to a GIF and to a
  folder ready for a website.
- The whiteboard: a drawing is given legs at once, or sent as an order for a
  character.
- A library of 29 characters, 36 animations and 8 scenes in six styles.
- Commands: `init`, `atelier`, `check`, `inspect`, `take`, `show`, `fiches`,
  `activity`.

### Security
- The atelier's server listens on this machine only, answers to `localhost`,
  `127.0.0.1` or `[::1]` only, refuses cross-site writes, never serves hidden
  files or what a link leads to outside the project, and serves imported
  drawings in a sandbox.
- Copying the engine into a folder never deletes one that is not a copy of it.
