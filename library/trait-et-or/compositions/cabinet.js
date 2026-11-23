// The cabinet of instruments: the compass takes a bearing, and the scales
// weigh what it found. Measured and unhurried, one after the other; while
// one works, the other looks on.

export const cabinet = {
    title: 'The cabinet of instruments',
    style: 'trait-et-or',
    width: 860,
    length: 30240,
    loop: true,
    cast: [
        { id: 'compass', character: 'compass', at: -250 },
        { id: 'scales', character: 'balance', at: 250, dir: -1 },
    ],
    tracks: {
        compass: [
            { at: 0, play: 'bearing-compass' },
            { at: 13860, move: 'look-right', over: 13000 },
        ],
        scales: [
            { at: 420, move: 'look-left', over: 12600 },
            { at: 14280, play: 'weigh-balance' },
            { at: 28560, move: 'blink' },
        ],
    },
};
