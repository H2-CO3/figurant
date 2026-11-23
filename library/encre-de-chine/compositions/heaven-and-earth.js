// Heaven and earth: a brush lies on the floor by an inkstone, before a
// white sheet on an easel. A master arrives in one leap, takes it up, and
// writes the two characters stroke by stroke, each struck from a stance. A
// frog on a rock beside it watches the whole of it without a word.

export const heavenAndEarth = {
    title: 'Heaven and earth',
    style: 'encre-de-chine',
    width: 700,
    length: 39000,
    loop: true,
    cast: [
        // (The master waits out of sight: its place is 330 units to the right of where it starts.)
        { id: 'master', character: 'ink-master', at: -390 },
        { id: 'frog', character: 'frog', at: -250 },
    ],
    // The rock the frog sits on.
    props: [{ prop: 'ink-rock', at: -246, behind: true }],
    tracks: {
        master: [{ at: 600, play: 'heaven-and-earth-ink-master', with: { walk: 330 } }],
        frog: [
            // Up onto its rock in one hop, and there it stays.
            { at: 0, fly: 26, over: 500 },
            { at: 1200, play: 'watch-frog' },
        ],
    },
};
