// Landfall: out at sea a pirate captain stands on the masthead of a boat
// that is sinking under him, in the best of moods, finds his way by a compass
// that will not agree with him, and comes into harbour as the quay and its
// customs officer come into sight. He steps onto the quay as the last of the
// boat goes down, pays with a flipped coin, lifts his hat and rolls off into
// town. Pirate and officer are the stick figure in costume
// (../characters/pirate.js, ../characters/customs-officer.js); both
// animations keep the same time: see ../scenes/pirate/landfall.js.

import { T, KEEPER } from '../scenes/pirate/landfall.js';

/** Where the quay begins on the floor; where the pirate starts from there, out at sea; how far the officer walks to its post. */
const QUAY = -40, OUT = -390, WALK = 520;

export const landfall = {
    title: 'Landfall',
    style: 'trait-et-or',
    width: 900,
    // (It starts again as soon as the pirate has gone: the harbour goes with him.)
    length: 300 + T.end + 7400,
    loop: true,
    cast: [
        // (The officer waits out of sight, up the quay, until the harbour appears.)
        { id: 'officer', character: 'customs-officer', at: QUAY + KEEPER + WALK, dir: -1 },
        { id: 'pirate', character: 'pirate', at: QUAY + OUT },
    ],
    tracks: {
        pirate: [{ at: 300, play: 'landfall-pirate', with: { home: OUT } }],
        officer: [{ at: 300, play: 'toll-customs-officer', with: { walk: WALK } }],
    },
};
