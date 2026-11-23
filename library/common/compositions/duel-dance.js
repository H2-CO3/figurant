// A duel that ends in a dance: two stick figures cross foils, salute, walk
// up to each other and tap dance side by side. Made of two animations of the
// stick figure, each played by both, one a beat after the other.

export const duelDance = {
    title: 'A duel, then a dance',
    width: 420,
    length: 17500,
    loop: true,
    cast: [
        { id: 'left', character: 'stickman', at: -62 },
        { id: 'right', character: 'stickman', at: 62, dir: -1 },
    ],
    tracks: {
        left: [
            { at: 300, play: 'fence-stickman' },
            { at: 6000, walk: -34, pace: 0.8 },
            { at: 7200, play: 'tap-dance-stickman' },
        ],
        right: [
            { at: 760, play: 'fence-stickman' },
            { at: 6300, walk: 34, pace: 0.8 },
            { at: 7400, play: 'tap-dance-stickman' },
        ],
    },
};
