// The copycat: whatever the first stick figure does, the second does half a
// second later. The first turns round to catch it; the second looks away.
// Data only: the moves every body has.

const act = [[500, 'hop'], [1900, 'wave'], [3600, 'look-left'], [4800, 'look-right'], [6000, 'hop'], [7000, 'hop']];

export const copycat = {
    title: 'The copycat',
    style: 'default',
    width: 360,
    length: 12000,
    loop: true,
    cast: [
        { id: 'first', character: 'stickman', at: -46 },
        { id: 'second', character: 'stickman', at: 46 },
    ],
    tracks: {
        first: [...act.map(([at, move]) => ({ at, move })), { at: 8300, move: 'look-right', over: 1600 }, { at: 10300, move: 'look-front' }],
        second: [...act.map(([at, move]) => ({ at: at + 520, move })), { at: 8350, move: 'look-right', over: 1500 }, { at: 10200, move: 'wave', over: 700 }],
    },
};
