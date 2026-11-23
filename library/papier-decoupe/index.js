// Everything drawn in the "papier-decoupe" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { paperSun } from './characters/paper-sun.js';
import { paperHouse } from './characters/paper-house.js';
import { paperMoon } from './characters/paper-moon.js';
import { paperHill } from './props/paper-hill.js';
import { paperMailbox, paperLetter } from './props/paper-mailbox.js';
import { sunrisePaperSun } from './scenes/paper-sun/sunrise.js';
import { postPaperHouse } from './scenes/paper-house/post.js';
import { phasesPaperMoon } from './scenes/paper-moon/phases.js';

import { morningPost } from './compositions/morning-post.js';
export const style = 'papier-decoupe';
export const characters = { 'paper-sun': paperSun, 'paper-house': paperHouse, 'paper-moon': paperMoon };
export const props = { 'paper-hill': paperHill, 'paper-mailbox': paperMailbox, 'paper-letter': paperLetter };
export const scenes = { 'sunrise-paper-sun': sunrisePaperSun, 'post-paper-house': postPaperHouse, 'phases-paper-moon': phasesPaperMoon };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'morning-post': morningPost };
