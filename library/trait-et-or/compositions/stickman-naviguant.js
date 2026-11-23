// The stick figure at sea: aboard the sailing boat, it crosses the page on the
// water, reading its compass and pointing the way. The sailor rides the boat
// (`on`): it goes where the boat goes and leans as it heels.

/** How much bigger than itself the boat is drawn, to carry somebody. */
const SCALE = 1.7;

export const stickmanNaviguant = {
    title: 'The stick figure at sea',
    style: 'trait-et-or',
    width: 1000,
    length: 21000,
    loop: true,
    cast: [
        { id: 'boat', character: 'boat', at: -330, scale: SCALE, state: { wind: 0.2, swell: 1 } },
        // On deck, abaft the mast: 23 units above the water in the boat's own measure.
        { id: 'sailor', character: 'stickman', on: 'boat', at: -22 * SCALE, up: 23 * SCALE },
    ],
    tracks: {
        boat: [
            { at: 0, set: { wind: 1, gazeX: 1 }, over: 1680 },
            { at: 1700, walk: 300, pace: 0.5 },
            { at: 17600, set: { wind: 0.2, gazeX: 0 }, over: 1680 },
        ],
        sailor: [
            { at: 2500, play: 'navigate-stickman' },
            { at: 16000, move: 'wave', over: 1200 },
        ],
    },
};
