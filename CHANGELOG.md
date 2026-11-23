# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `figurant atelier --lan`: the atelier opened to the local network on purpose, behind an access code made for each run (asked once per browser, five wrong tries lock an address out for five minutes).

### Fixed
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
