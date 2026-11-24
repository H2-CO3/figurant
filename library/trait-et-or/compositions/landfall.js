// Landfall, in three acts: a pirate captain sails in fair weather on the
// masthead of his boat; the boat springs a leak and begins to go down while
// he finds his way by a compass that will not agree with him; the quay comes
// into the picture with its customs officer, and he steps onto it as the
// last of the boat goes under, pays with a flipped coin, lifts his hat and
// rolls off into town. The picture stays close on the boat: the sea runs
// under it. Pirate and officer are the stick figure in costume; both
// animations keep the same time: see ../scenes/pirate/landfall.js.

import { T, SLIDE, KEEPER } from '../scenes/pirate/landfall.js';

/** Where the edge of the quay is once it has come in, and where the boat is from there. */
const QUAY = -110, BOAT = -12;

export const landfall = {
    title: 'Landfall',
    style: 'trait-et-or',
    width: 620,
    // (It starts again as soon as the pirate has gone: the harbour goes with him.)
    length: 300 + T.end + 6500,
    loop: true,
    cast: [
        // (The officer is out of the picture, on the quay, until the quay comes in.)
        { id: 'officer', character: 'customs-officer', at: QUAY + KEEPER + SLIDE, dir: -1 },
        { id: 'pirate', character: 'pirate', at: QUAY + BOAT },
    ],
    tracks: {
        pirate: [{ at: 300, play: 'landfall-pirate', with: { home: BOAT } }],
        officer: [{ at: 300, play: 'toll-customs-officer', with: { out: SLIDE } }],
    },
};
