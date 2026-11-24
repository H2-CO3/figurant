// Heaven and earth: a brush lies on the floor by an inkstone, before a
// white sheet on an easel. A master arrives in one leap, takes it up, and
// writes the two characters stroke by stroke, each struck from a stance. A
// red seal; the brush laid back; a salute to the sheet. A frog on a rock
// beside it watches the whole of it without a word.
//
// The score. The sheet and the brush on the floor are in the cast: what is
// written is the sheet's (one clip a stroke: `heaven` 1 to 4, `earth` 1 to
// 6, then the seal), and the brush on the floor goes when it is picked up
// and comes back when it is laid down. The master's `write-ink-master`
// starts at 5600 and is told the same moments, counted from its own start
// (a stroke at 10468 on the sheet's track is `at: 4868` for the master), so
// that the point of its brush is on the paper where the ink runs.
// Where things are: the stone at -106, the brush beside it, the master's
// place at -60, the easel at 40 (112 from the stone side, where the master
// stands to take the brush).

const STROKES = [
    { at: 4868, over: 590 }, { at: 6592, over: 710 }, { at: 8428, over: 740 }, { at: 10552, over: 600 },
    { at: 17380, over: 390 }, { at: 18896, over: 560 }, { at: 20588, over: 440 }, { at: 22488, over: 650 }, { at: 24260, over: 550 }, { at: 25936, over: 930 },
];
const WRITE = 5600;

export const heavenAndEarth = {
    title: 'Heaven and earth',
    style: 'encre-de-chine',
    width: 700,
    length: 39800,
    loop: true,
    cast: [
        { id: 'sheet', character: 'ink-sheet', at: 40, state: { shadow: 0, heaven: 0, earth: 0, seal: 0 } },
        { id: 'brush', character: 'resting-brush', at: -62, state: { shadow: 0, gone: 0 } },
        // (The master waits out of sight.)
        { id: 'master', character: 'ink-master', at: -390 },
        { id: 'frog', character: 'frog', at: -250 },
    ],
    // The rock the frog sits on; the inkstone.
    props: [{ prop: 'ink-rock', at: -246, behind: true }, { prop: 'inkstone', at: -106, flip: -1 }],
    tracks: {
        master: [
            { at: 600, walk: -130, pace: 1.9 },
            { at: 1700, play: 'arrive-ink-master', with: { by: 70 } },
            { at: 5000, walk: -72, pace: 0.8 },
            { at: WRITE, play: 'write-ink-master', with: { easel: 112, strokes: STROKES, lay: 28532 } },
            { at: 35000, walk: -60, pace: 0.7 },
            { at: 35500, play: 'salute-ink-master', with: { look: 2000 } },
        ],
        brush: [
            { at: 6030, set: { gone: 1 }, over: 120 },
            { at: 34130, set: { gone: 0 }, over: 120 },
        ],
        sheet: [
            ...STROKES.map((stroke, i) => ({ at: WRITE + stroke.at, set: i < 4 ? { heaven: i + 1 } : { earth: i - 3 }, over: stroke.over })),
            { at: 33000, set: { seal: 1 }, over: 400 },
        ],
        frog: [
            // Up onto its rock in one hop, and there it stays.
            { at: 0, fly: 26, over: 500 },
            { at: 1200, play: 'watch-frog' },
        ],
    },
};
