// Pen pals: a highlighter and a ballpoint pen (it has lost its cap) walk up
// to each other, slap hands in the air like a team that has just scored, and
// tap dance side by side, each in its own way: the broad one digs its heels,
// the thin one patters. Each leaves its mark on the floor to finish.

export const penPals = {
    title: 'Pen pals',
    style: 'default',
    width: 520,
    length: 19500,
    loop: true,
    cast: [
        { id: 'highlighter', character: 'highlighter', at: -200 },
        { id: 'ballpoint', character: 'ballpoint', at: 200, dir: -1 },
    ],
    tracks: {
        highlighter: [
            { at: 300, walk: -38, pace: 0.9 },
            { at: 2700, move: 'look-right', over: 500 },
            // (Bodies differ: each is told where its hand must be for the two to meet in the air.)
            { at: 3600, play: 'high-five', with: { reach: 36, height: -58, jump: 30 } },
            { at: 5600, walk: -62, pace: 0.7 },
            { at: 6900, play: 'tap-dance-highlighter' },
            { at: 17600, walk: -200, pace: 1 },
        ],
        ballpoint: [
            { at: 500, walk: 38, pace: 1 },
            { at: 2800, move: 'look-left', over: 500 },
            { at: 3600, play: 'high-five', with: { reach: 36, height: -58, jump: 30 } },
            { at: 5700, walk: 62, pace: 0.7 },
            { at: 7200, play: 'tap-dance-ballpoint' },
            { at: 17600, walk: 200, pace: 1 },
        ],
    },
};
