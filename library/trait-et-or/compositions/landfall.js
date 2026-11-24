// Landfall: a pirate captain comes into harbour in a boat that will not last
// the day. Fair sailing; the boat takes in water, the wind drops; up on the
// boom, round the mast, and the compass, tapped until it agrees; the wind
// again, and the quay, reached with the water at its heels: one stride off
// the masthead as the boat goes under. A coin for the customs officer, the
// hat lifted, and off into town.
//
// Who stands where. The floor is the water. The quay's planks are 48 units
// above it: who walks on them is that high (`fly: 48`). The boat is drawn one
// and a half times its size, so what it is told in its own units is half as
// much again on the floor: `by: 100` carries it 150 units, and the pirate is
// told 150. The pirate stands in the boat, at the foot of its mast (19 units
// ahead of the boat's middle), first in the hull (12 above the water), then
// on the boom (48): it stays that high while the boat goes down under it. A
// boat's `sunk` of 0.71 brings its masthead level with the planks.
// What goes together is written with the same numbers on two tracks: the
// boat's `sail-boat` and what the pirate does meanwhile (`by`, `over`); the
// coin (`pay-pirate` at 25000, landing 1960 later) and the open hand
// (`toll-customs-officer` at 24400: `lands`).

export const landfall = {
    title: 'Landfall',
    style: 'trait-et-or',
    width: 640,
    length: 30000,
    loop: true,
    cast: [
        // (The boat first: its rig is behind the pirate, its hull over it.)
        { id: 'boat', character: 'boat', at: -200, scale: 1.5, state: { sunk: 0, wind: 0.6, swell: 0.15, furl: 0 } },
        { id: 'pirate', character: 'pirate', at: -181 },
        { id: 'officer', character: 'customs-officer', at: 620, dir: -1 },
    ],
    props: [
        { prop: 'harbour-water', at: 0, behind: true },
        { prop: 'harbour-town', at: 292, behind: true },
        { prop: 'quay', at: 150 },
    ],
    tracks: {
        boat: [
            { at: 400, play: 'sail-boat', with: { by: 100, over: 5600 } },
            { at: 6300, play: 'founder-boat', with: { to: 0.42, over: 10500 } },
            { at: 17000, play: 'sail-boat', with: { by: 110, over: 5300, sunk: 0.71 } },
            { at: 22500, play: 'founder-boat', with: { to: 1, over: 3200 } },
        ],
        pirate: [
            { at: 0, fly: 12, over: 1 },
            { at: 400, play: 'aboard-pirate', with: { by: 150, over: 5600 } },
            { at: 6300, play: 'wet-feet-pirate' },
            { at: 8600, fly: 48, over: 450 },
            { at: 9300, play: 'cling-pirate', with: { for: 2900 } },
            { at: 12300, play: 'bearing-pirate', with: { for: 4600 } },
            { at: 17000, play: 'hold-on-pirate', with: { by: 165, over: 5300 } },
            { at: 22500, play: 'leap-pirate', with: { by: 40 } },
            { at: 23900, walk: 196, pace: 0.8 },
            { at: 25000, play: 'pay-pirate', with: { to: 76 } },
            { at: 27900, exit: 'right' },
        ],
        officer: [
            { at: 0, fly: 48, over: 1 },
            { at: 12500, walk: 296, pace: 0.8 },
            { at: 19000, play: 'watch-customs-officer', with: { for: 5200 } },
            { at: 24400, play: 'toll-customs-officer', with: { lands: 2560 } },
            { at: 28500, move: 'look-right', over: 1300 },
        ],
    },
};
