// For and against: two stick figures picket with opposite signs, bounce at
// each other, swap sides, and end up agreeing that they do not know.
// The signs carry marks, not words: they read in any language.

export const forAndAgainst = {
    title: 'For and against',
    style: 'default',
    width: 380,
    length: 13000,
    loop: true,
    cast: [
        { id: 'for', character: 'stickman', at: -52 },
        { id: 'against', character: 'stickman', at: 52 },
    ],
    tracks: {
        for: [
            { at: 300, play: 'picket', with: { text: '✓' } },
            { at: 4300, play: 'picket', with: { text: '✗' } },
            { at: 8600, play: 'picket', with: { text: '?' } },
        ],
        against: [
            { at: 520, play: 'picket', with: { text: '✗' } },
            { at: 4700, play: 'picket', with: { text: '✓' } },
            { at: 8600, play: 'picket', with: { text: '?' } },
        ],
    },
};
