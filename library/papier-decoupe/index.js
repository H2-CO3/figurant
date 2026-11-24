// Everything drawn in the "papier-decoupe" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { paperSun } from './characters/paper-sun.js';
import { paperHouse } from './characters/paper-house.js';
import { paperMoon } from './characters/paper-moon.js';
import { paperDancerHim } from './characters/paper-dancer-him.js';
import { paperDancerHer } from './characters/paper-dancer-her.js';
import { smittenHim } from './scenes/paper-dancer-him/smitten.js';
import { togetherHim } from './scenes/paper-dancer-him/together.js';
import { catchHim } from './scenes/paper-dancer-him/catch.js';
import { bowHim } from './scenes/paper-dancer-him/bow.js';
import { shyHer } from './scenes/paper-dancer-her/shy.js';
import { togetherHer } from './scenes/paper-dancer-her/together.js';
import { leapHer } from './scenes/paper-dancer-her/leap.js';
import { curtseyHer } from './scenes/paper-dancer-her/curtsey.js';
import { firstDance } from './compositions/first-dance.js';
import { paperHill } from './props/paper-hill.js';
import { paperMailbox, paperLetter } from './props/paper-mailbox.js';
import { sunrisePaperSun } from './scenes/paper-sun/sunrise.js';
import { postPaperHouse } from './scenes/paper-house/post.js';
import { phasesPaperMoon } from './scenes/paper-moon/phases.js';
import { spookPaperMoon } from './scenes/paper-moon/spook.js';

import { morningPost } from './compositions/morning-post.js';
export const style = 'papier-decoupe';
export const characters = { 'paper-sun': paperSun, 'paper-house': paperHouse, 'paper-moon': paperMoon, 'paper-dancer-him': paperDancerHim, 'paper-dancer-her': paperDancerHer };
export const props = { 'paper-hill': paperHill, 'paper-mailbox': paperMailbox, 'paper-letter': paperLetter };
export const scenes = { 'sunrise-paper-sun': sunrisePaperSun, 'post-paper-house': postPaperHouse, 'phases-paper-moon': phasesPaperMoon, 'spook-paper-moon': spookPaperMoon, 'smitten-him': smittenHim, 'together-him': togetherHim, 'catch-him': catchHim, 'bow-him': bowHim, 'shy-her': shyHer, 'together-her': togetherHer, 'leap-her': leapHer, 'curtsey-her': curtseyHer };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'morning-post': morningPost, 'first-dance': firstDance };
