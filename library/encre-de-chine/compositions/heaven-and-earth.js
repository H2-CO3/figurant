// Heaven and earth: the brush writes the two characters on a sheet that
// stands on an easel, stroke by stroke, and a frog on a rock beside it
// watches the whole of it without a word. Slow, with long stillness.

export const heavenAndEarth = {
    title: 'Heaven and earth',
    style: 'encre-de-chine',
    width: 620,
    length: 52000,
    loop: true,
    cast: [
        { id: 'brush', character: 'calligraphy-brush', at: -30 },
        { id: 'frog', character: 'frog', at: -218 },
    ],
    // The rock the frog sits on.
    props: [{ prop: 'ink-rock', at: -214, behind: true }],
    tracks: {
        brush: [{ at: 600, play: 'heaven-and-earth-calligraphy-brush' }],
        frog: [
            // Up onto its rock in one hop, and there it stays.
            { at: 0, fly: 26, over: 500 },
            { at: 1200, play: 'watch-frog' },
        ],
    },
};
