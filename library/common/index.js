// What belongs to every style: the common gestures, which have no owner (a
// hello, and what a crowd is made of), and the animations of the stick figure
// and of the emoji figure, who have no style.

import { hello } from './scenes/hello.js';
import { takeNotesScene } from './scenes/stickman/notes.js';
import { tapDanceStickman } from './scenes/stickman/tap-dance.js';
import { fenceStickman } from './scenes/stickman/fence.js';
import { duelStickman } from './scenes/stickman/duel.js';

import { facesEmoji } from './scenes/emoji/faces.js';
import { picket, shakeHands, cheer, haul } from './scenes/crowd.js';
import { walkTheDog } from './compositions/walk-the-dog.js';
import { duelDance } from './compositions/duel-dance.js';
import { tugOfWar } from './compositions/tug-of-war.js';
import { copycat } from './compositions/copycat.js';
import { forAndAgainst } from './compositions/for-and-against.js';
import { wellMet } from './compositions/well-met.js';

export const scenes = { hello, notes: takeNotesScene, 'tap-dance-stickman': tapDanceStickman, 'fence-stickman': fenceStickman, 'duel-stickman': duelStickman, picket, 'shake-hands': shakeHands, cheer, haul, 'faces-emoji': facesEmoji };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'walk-the-dog': walkTheDog, 'duel-dance': duelDance, 'tug-of-war': tugOfWar, copycat, 'for-and-against': forAndAgainst, 'well-met': wellMet };
