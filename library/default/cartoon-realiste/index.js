// Everything drawn in the "realistic cartoon" style. Each style of the
// library is a folder built the same way: characters/, props/, scenes/, and
// this index, which says what it holds.

import { teapot } from './characters/teapot.js';
import { highlighter } from './characters/highlighter.js';
import { ballpoint } from './characters/ballpoint.js';
import { fork } from './characters/fork.js';
import { cat } from './characters/cat.js';
import { cactus } from './characters/cactus.js';
import { pouffe, desk, quill, divan } from './props/teapot-study.js';
import { lounger } from './props/lounger.js';
import { teaTable, teacup } from './props/tea-table.js';
import { tabouret } from './props/stool.js';
import { notesTeapot } from './scenes/teapot/notes.js';
import { pourTeapot } from './scenes/teapot/pour.js';
import { underlineHighlighter } from './scenes/highlighter/underline.js';
import { breakdanceHighlighter } from './scenes/highlighter/breakdance.js';
import { tapDanceHighlighter } from './scenes/highlighter/tap-dance.js';
import { tapDanceBallpoint } from './scenes/ballpoint/tap-dance.js';
import { stretchCat } from './scenes/cat/stretch.js';
import { bloomCactus } from './scenes/cactus/bloom.js';
import { ringFork } from './scenes/fork/ring.js';

export const style = 'default';
export const characters = { teapot, highlighter, ballpoint, fork, cat, cactus };
export const props = { pouffe, desk, quill, divan, lounger, 'tea-table': teaTable, teacup, tabouret };
export const scenes = {
    'notes-teapot': notesTeapot, 'pour-teapot': pourTeapot,
    'underline-highlighter': underlineHighlighter, 'breakdance-fluo': breakdanceHighlighter, 'tap-dance-highlighter': tapDanceHighlighter, 'tap-dance-ballpoint': tapDanceBallpoint, 'stretch-cat': stretchCat, 'bloom-cactus': bloomCactus, 'ring-fork': ringFork,
};
