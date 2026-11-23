// The first dance: two dancers in cut paper see each other across the floor,
// meet, step from side to side, she spins under his arm, runs, jumps, and he
// holds her up in the air. A curtsey, a bow. Each plays its own part of one
// dance: both keep the same time and the same places
// (../scenes/paper-dancer-her/dance.js).

export const firstDance = {
    title: 'The first dance',
    style: 'papier-decoupe',
    width: 460,
    length: 25200,
    loop: true,
    cast: [
        { id: 'him', character: 'paper-dancer-him', at: -130 },
        { id: 'her', character: 'paper-dancer-her', at: 130, dir: -1 },
    ],
    tracks: {
        him: [{ at: 400, play: 'first-dance-him', with: { home: -130 } }],
        her: [{ at: 400, play: 'first-dance-her', with: { home: 130 } }],
    },
};
