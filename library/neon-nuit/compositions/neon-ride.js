// The race without end: two riders in neon, followed from behind down a
// motorway that runs to the horizon, under a striped sun. One animation,
// played by both; it goes on for as long as it is left to.

export const neonRide = {
    title: 'The race without end',
    style: 'neon-nuit',
    width: 660,
    length: 60000,
    loop: true,
    cast: [
        // (Told where they stand, so that both measure the road from its middle.)
        { id: 'cyan', character: 'neon-rider', at: -60, state: { legs: 0, shadow: 0 } },
        { id: 'magenta', character: 'neon-rider', at: 60, state: { legs: 0, shadow: 0, hue: 1 } },
    ],
    tracks: {
        cyan: [{ at: 200, play: 'race-neon-rider', with: { part: 'first', at: -60 } }],
        magenta: [{ at: 200, play: 'race-neon-rider', with: { part: 'second', at: 60 } }],
    },
};
