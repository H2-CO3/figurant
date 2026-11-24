// The first dance: two dancers in cut paper see each other across the floor,
// meet, step from side to side, she spins under his arm, runs, jumps, and he
// holds her up in the air. A curtsey, a bow.
//
// The score. Each line is a clip: a short animation of one of them, or a
// plain walk. What they do together is written at the same moments on the
// two tracks:
//   the hold      he holds out his hand at 5400, she takes it at 5900; the
//                 steps begin at 6700 and the spin at 11500 for both (each
//                 `together` is told when, from its own start);
//   the lift      she runs to 10; he stands at -34. Her leap starts at
//                 16900; he goes down on his legs at 15700 + 1080 = 16780, a
//                 breath before; both come down at 20300 (her 16900 + 3400,
//                 his 15700 + 4600).

export const firstDance = {
    title: 'The first dance',
    style: 'papier-decoupe',
    width: 460,
    length: 25200,
    loop: true,
    cast: [
        { id: 'him', character: 'paper-dancer-him', at: -130, state: { blush: 0 } },
        { id: 'her', character: 'paper-dancer-her', at: 130, dir: -1, state: { blush: 0, twirl: 0, spin: 0 } },
    ],
    tracks: {
        him: [
            { at: 1200, play: 'smitten-him' },
            { at: 2900, walk: -32 },
            { at: 5400, play: 'together-him', with: { step: 1300, spin: 6100 } },
            { at: 14000, walk: -34, pace: 0.7 },
            { at: 15000, move: 'turn' },
            { at: 15700, play: 'catch-him', with: { catch: 1080, down: 4600 } },
            { at: 21850, play: 'bow-him' },
        ],
        her: [
            { at: 900, play: 'shy-her' },
            { at: 2850, walk: 34, pace: 0.75 },
            { at: 5900, play: 'together-her', with: { step: 800, spin: 5600 } },
            { at: 14000, walk: 120, pace: 0.9 },
            { at: 15450, move: 'turn' },
            { at: 15800, walk: 10, pace: 1.9 },
            { at: 16900, play: 'leap-her', with: { down: 3400 } },
            { at: 21700, play: 'curtsey-her' },
        ],
    },
};
