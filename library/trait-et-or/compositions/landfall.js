// Landfall: a pirate captain comes into harbour on the masthead of a boat
// that is sinking under him, steps onto the quay as the last of it goes
// down, pays the keeper of the harbour with a flipped coin, lifts his hat
// and walks off into town. The pirate is the stick figure in costume
// (../characters/pirate.js); the keeper is the stick figure as it is.
// Both animations keep the same time: see ../scenes/pirate/landfall.js.

import { T, KEEPER } from '../scenes/pirate/landfall.js';

/** Where the quay begins on the floor, and where the pirate starts from there, out on the water. */
const QUAY = -90, OUT = -230;

export const landfall = {
    title: 'Landfall',
    style: 'trait-et-or',
    width: 760,
    // (It starts again as soon as the pirate has gone: the harbour goes with him.)
    length: 300 + T.end + 7400,
    loop: true,
    cast: [
        { id: 'keeper', character: 'stickman', at: QUAY + KEEPER, dir: -1 },
        { id: 'pirate', character: 'pirate', at: QUAY + OUT },
    ],
    tracks: {
        pirate: [
            { at: 300, play: 'landfall-pirate', with: { home: OUT } },
        ],
        keeper: [{ at: 300, play: 'toll-stickman' }],
    },
};
