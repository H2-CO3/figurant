// Well met: two stick figures walk up to each other, shake hands, jump for
// joy one after the other, and go their ways.

export const wellMet = {
    title: 'Well met',
    style: 'default',
    width: 460,
    length: 12500,
    loop: true,
    cast: [
        { id: 'left', character: 'stickman', at: -170 },
        { id: 'right', character: 'stickman', at: 170, dir: -1 },
    ],
    tracks: {
        left: [
            { at: 200, walk: -30, pace: 0.9 },
            { at: 2700, play: 'shake-hands', with: { reach: 30, height: -2 } },
            { at: 5300, play: 'cheer' },
            { at: 8600, move: 'wave', over: 700 },
            { at: 9900, exit: 'left' },
        ],
        right: [
            { at: 350, walk: 30, pace: 0.9 },
            { at: 2700, play: 'shake-hands', with: { reach: 30, height: -2 } },
            { at: 5650, play: 'cheer' },
            { at: 8900, move: 'wave', over: 700 },
            { at: 10100, exit: 'right' },
        ],
    },
};
