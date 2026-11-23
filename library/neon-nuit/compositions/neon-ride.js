// The ride without end: the stick figure on a motorbike of light, at night,
// on a grid that never stops running. One character, one animation that goes
// on for as long as it is left to: the scene only puts it in this style.

export const neonRide = {
    title: 'The ride without end',
    style: 'neon-nuit',
    width: 660,
    length: 60000,
    loop: true,
    cast: [{ id: 'rider', character: 'stickman', at: -30 }],
    tracks: { rider: [{ at: 300, play: 'neon-ride-stickman' }] },
};
