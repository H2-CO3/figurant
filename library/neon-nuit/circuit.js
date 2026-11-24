// The circuit of the neon race, as numbers: a tunnel with eight sides seen
// from inside, running to a far end. Shared by the circuit that draws it
// (characters/neon-circuit.js) and the runners that ride it
// (characters/neon-rider.js), so that a wheel is on the floor the tunnel
// shows.
//
// One number says how far away anything is: `far`, 1 at the picture's edge
// and growing towards the far end. Where it is, how big and how fast all
// follow from it (divided by `far`): that is what makes a tunnel. A place
// across the tunnel is `lane`: 0 in the middle of the floor, 1 where the
// floor meets a wall, more to ride up the wall.
// Places are in character units from the circuit's own: across from its
// middle, down from the floor where a runner stands at rest (lane 0, far
// REST).

export const SIDES = 8, TURN = Math.PI * 2 / SIDES;
/** How wide and tall the tunnel is at the picture's edge; where a runner rides when nothing is said. */
export const WIDE = 400, TALL = 196, REST = 2.1;
/** Up to there the tunnel runs straight (the runners never go further); beyond, it bends. */
const STRAIGHT = 2.3;
const rise = far => 150 * (far >= 1 ? 1 - 1 / far : far - 1);
/** (So that the floor at lane 0, far REST is the place itself.) */
const LOW = rise(REST) - 0.076 * TALL / REST;
/** How much of the bend a distance has taken: none where the runners are, all of it at the far end. */
const swing = far => Math.max(0, 1 - STRAIGHT / far);

/** The middle of the tunnel at a distance; `bend` (-1 -> 1) swings its far end to one side. */
export const centre = (far, bend = 0) => [bend * 190 * swing(far) * swing(far), LOW - TALL * 0.924 / far - rise(far)];
/** A point of the wall: `angle` round the tunnel (a quarter turn is the middle of the floor), at a distance. It twists as it bends. */
export function wall(angle, far, bend = 0) {
    const [x, y] = centre(far, bend), a = angle + bend * 0.5 * swing(far);
    return [x + Math.cos(a) * WIDE / far, y + Math.sin(a) * TALL / far];
}
/** The corner between two sides. */
export const corner = (side, far, bend = 0) => wall((side + 0.5) * TURN, far, bend);
/** The angle of a lane. */
export const angleOf = lane => Math.PI / 2 - lane * TURN / 2;
/** Where a wheel touches, in a lane at a distance. */
export const spot = (lane, far) => wall(angleOf(lane), far);
