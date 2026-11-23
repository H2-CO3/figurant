// The strike: the demonstration scene. Four workers walk in one after the
// other and picket; the boss (an hourglass: time is money) is startled, comes
// over, shakes hands with their delegate; everyone cheers and goes home.
// It shows a scene of many: staggered entrances, a crowd doing the same thing
// out of step, two characters meeting, and a shared ending.

// Each has room for its placard: the teapot is wide, the others slim.
const WORKERS = [['teapot', -90, 'PAUSE'], ['fork', -215, 'NON'], ['highlighter', -310, 'STOP'], ['cactus', -400, 'PAIX']];

export const strike = {
    title: 'The strike',
    style: 'default',
    width: 1160,
    length: 29500,
    loop: true,
    cast: [
        ...WORKERS.map(([character], i) => ({ id: character, character, at: -700 - i * 90 })),
        { id: 'boss', character: 'hourglass', at: 430, dir: -1, state: { cap: 1 } },
    ],
    tracks: {
        ...Object.fromEntries(WORKERS.map(([character, spot, text], i) => [character, [
            { at: i * 700, walk: spot, pace: 1.1 },
            { at: 5200 + i * 260, play: 'picket', with: { text } },
            ...(character === 'teapot'
                ? [{ at: 16200, walk: 120, pace: 0.9 }, { at: 19200, play: 'shake-hands', with: { reach: 108, height: 13 } }, { at: 22000, play: 'cheer' }]
                : [{ at: 16400 + i * 120, move: 'look-right', over: 5000 }, { at: 22100 + i * 180, play: 'cheer' }]),
            { at: 25400 + i * 200, exit: 'left', pace: 1.1 },
        ]])),
        boss: [
            { at: 6600, set: { wide: 1, tilt: 6 }, over: 200 },
            { at: 7400, set: { wide: 0, tilt: 0 }, over: 500 },
            { at: 8600, move: 'look-left', over: 2600 },
            { at: 11600, move: 'hop' },
            { at: 13200, walk: 292, pace: 0.6 },
            // Their hands meet between them: each reaches as far as its own arm goes.
            { at: 19200, play: 'shake-hands', with: { reach: 64, height: 7 } },
            { at: 22400, move: 'wave', over: 900 },
            { at: 25000, exit: 'right', pace: 0.8 },
        ],
    },
};
