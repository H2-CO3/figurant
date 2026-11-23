// What belongs to every style: the common gestures, which have no owner (a
// hello, and what a crowd is made of), and the animations of the stick figure
// and of the emoji figure, who have no style.

import { hello } from './scenes/hello.js';
import { takeNotesScene } from './scenes/stickman/notes.js';
import { tapDanceStickman } from './scenes/stickman/tap-dance.js';

import { facesEmoji } from './scenes/emoji/faces.js';
import { picket, shakeHands, cheer } from './scenes/crowd.js';
import { walkTheDog } from './compositions/walk-the-dog.js';

export const scenes = { hello, notes: takeNotesScene, 'tap-dance-stickman': tapDanceStickman, picket, 'shake-hands': shakeHands, cheer, 'faces-emoji': facesEmoji };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'walk-the-dog': walkTheDog };
