// Made for the pirate: landfall. It comes into harbour standing on the
// masthead of a small boat that is going down under it, without a glance at
// the water: the boat sinks at exactly the pace that brings the masthead level
// with the quay as it gets there, and it steps off as one steps off a stair.
// The boat goes on to the bottom. It walks up the quay to the harbour
// keeper, flips a coin, lifts its hat, and walks off into town.
//
// The harbour is the animation's own: the water, the quay on its piles, the
// boat. Places are counted from the foot of the quay's first pile
// (`data.home` says where the pirate starts from there, on the water).

import { easing, moves } from 'figurant';
import { GOLD, INK, PAPER, goldShape, inkShape, dotShape } from '../../kit.js';

const { easeOut, easeIn, easeInOut, linear } = easing;
/** When each moment starts, in ms, for the pirate and for the keeper (see ../stickman/toll.js). */
export const T = { sail: 700, land: 7700, walk: 8600, meet: 10900, coin: 11900, hat: 12900, end: 14200 };
/** The mast above the boat's waterline; the water below the quay; where the keeper stands. */
const MAST = 128, WATER = 36;
export const KEEPER = 108;

const boat = {
    name: 'skiff',
    shapes: [
        inkShape(`M 0 -4 L 0 ${-MAST}`, 1.2),                                            // the mast
        inkShape(`M -9 ${-MAST} L 9 ${-MAST} M -9 ${-MAST} L -9 ${-MAST - 5} M 9 ${-MAST} L 9 ${-MAST - 5}`, 1), // the masthead
        goldShape(`M 3 ${-MAST + 14} L 30 ${-MAST + 26} L 26 -34 L 3 -22 Z`),           // a small sail, much mended
        inkShape(`M 12 ${-MAST + 44} l 6 5 m -6 0 l 6 -5 M 9 -40 l 9 -3`, 0.7),
        goldShape('M -36 -6 Q -30 12 0 12 Q 30 12 38 -8 Z'),                             // the hull
        inkShape('M -30 -1 Q 0 3 33 -3', 0.7),
        dotShape(0, -4),
    ],
    points: { masthead: [0, -MAST] },
};
const wave = (x, y) => `M ${x} ${y} q 9 -4 18 0 t 18 0 t 18 0`;
const water = {
    name: 'harbour-water',
    shapes: [
        // What is under the water is not seen: the paper covers it.
        { tag: 'path', attrs: { d: `M -420 ${WATER} L 70 ${WATER} L 70 ${WATER + 190} L -420 ${WATER + 190} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M -420 ${WATER} L 0 ${WATER}`, 1),
        inkShape([-390, -300, -210, -120, -60].map((x, i) => wave(x, WATER + 9 + (i % 2) * 7)).join(' '), 0.7),
        inkShape([-350, -250, -150].map(x => wave(x, WATER + 24)).join(' '), 0.6),
    ],
    points: {},
};
const quay = {
    name: 'quay',
    shapes: [
        // The piles, down to the water, and the planks on them.
        ...[6, 96, 186, 276, 366, 456].flatMap(x => [goldShape(`M ${x - 4} 6 L ${x - 4} ${WATER + 60} L ${x + 4} ${WATER + 60} L ${x + 4} 6 Z`), inkShape(`M ${x - 4} ${WATER} q 4 -3 8 0`, 0.7)]),
        goldShape('M 0 0 L 490 0 L 490 7 L 0 7 Z'),
        inkShape('M 44 0 L 44 7 M 110 0 L 110 7 M 176 0 L 176 7 M 242 0 L 242 7 M 308 0 L 308 7 M 374 0 L 374 7 M 440 0 L 440 7', 0.7),
        // A bollard, and the lantern of the harbour on its post.
        goldShape('M 16 0 L 16 -9 Q 21 -13 26 -9 L 26 0 Z'),
        inkShape('M 196 0 L 196 -96 M 196 -96 L 210 -96 M 210 -96 L 210 -90', 1.1),
        goldShape('M 204 -90 L 216 -90 L 214 -74 L 206 -74 Z'),
        dotShape(210, -82, 2.2),
    ],
    points: {},
};
const coin = { name: 'coin', shapes: [{ tag: 'circle', attrs: { cx: 0, cy: 0, r: 3.2, fill: GOLD, stroke: INK, 'stroke-width': 0.8 } }], points: {} };

export const landfallPirate = {
    character: 'pirate',
    room: { left: 60, right: 560, up: 150 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, base = ctx?.data?.home ?? -230, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        /** A place along the quay (from the foot of its first pile) as the figure's own number. */
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.y = ground; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // The harbour: the boat first, then the water over what of it is under, then the quay.
        const skiff = c.prop(boat, { behind: true, state: { draw: 0 } });
        const sea = c.prop(water, { behind: true, state: { draw: 0 } });
        const pier = c.prop(quay, { behind: true, state: { draw: 0 } });
        sea.state.x = pier.state.x = X(0);
        // The voyage: where the boat is along the water, and how deep it has gone. While aboard, the pirate is on its masthead.
        const voyage = { x: base, sunk: -9, aboard: true };
        const ride = () => {
            skiff.state.x = X(voyage.x); skiff.state.y = (WATER + voyage.sunk) * k;
            if (voyage.aboard) { s.x = X(voyage.x); s.y = ground - (MAST - voyage.sunk - WATER) * k; }
        };
        ride();
        c.onLeave(c.clock.onFrame(ride));
        await c.all(c.animate(skiff.state, { draw: 1 }, 600), c.animate(sea.state, { draw: 1 }, 600), c.animate(pier.state, { draw: 1 }, 600));

        // In it comes, going down all the way: one hand on the hip, eyes on the town.
        await at(T.sail);
        c.animate(voyage, { x: -10, sunk: MAST - WATER }, T.land - T.sail, linear).catch(() => {});
        // (A hand over the eyes first, to make out the town; then it stands there as if on a quarterdeck.)
        await c.all(c.hands({ left: { x: -10, y: 10, angle: 30 }, right: { x: 9, y: -40, angle: -100 } }, 500, easeInOut), c.tween({ gazeX: 0.9, tilt: 4 }, 500));
        await c.wait(1300);
        await c.hands({ right: { x: 13, y: 6, angle: -20 } }, 500, easeInOut);
        for (let sway = 0; c.clock.now - start < T.land - 2600; sway++) await c.tween({ tilt: sway % 2 ? -5 : 5 }, 760, easeInOut);
        // One look down at the water, where its boat used to be; and up again, untroubled.
        await c.tween({ tilt: 0, gazeX: 0.2, gazeY: 0.9 }, 500, easeInOut);
        await c.wait(700);
        await c.tween({ gazeX: 0.9, gazeY: 0 }, 400, easeInOut);

        // Level with the quay at the very moment it gets there: it steps off, as off a stair.
        await at(T.land);
        voyage.aboard = false;
        s.y = ground;
        c.animate(voyage, { sunk: MAST + 16 }, 2400, easeIn).then(() => {
            if (!fx || !c.alive) return;
            const bubbles = fx.particles({ color: INK, width: 1.4 });
            for (let i = 0; i < 9; i++) bubbles.emit({ x: c.figure.points.centre[0] + (X(voyage.x) - s.x) + fx.range(-10, 10) * k, y: c.figure.points.ground + WATER * k, vx: fx.range(-12, 12) * k, vy: -fx.range(20, 60) * k, life: fx.range(0.4, 0.9), trail: 0.02 });
            bubbles.close();
        }, () => {});
        await c.all(c.feet({ right: { x: 15, y: 0 } }, 280, easeOut), c.tween({ x: X(8), tilt: 5 }, 340, easeOut));
        await c.all(c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 260, easeInOut), c.tween({ x: X(16), tilt: 0 }, 300, easeInOut));
        await c.feet({ left: null, right: null }, 1);

        // Up the quay to the keeper, hands free, in no hurry.
        await at(T.walk);
        // (Its walk is its own: it rolls from side to side as if the quay were still a deck, wrists loose, one hand held up.)
        const swagger = async walk => {
            let there = false;
            walk.then(() => { there = true; }, () => { there = true; });
            for (let roll = 0; !there; roll++) {
                await c.all(c.tween({ tilt: roll % 2 ? -8 : 8 }, 250, easeInOut), c.hands({ left: { x: -15, y: roll % 2 ? -12 : -6, angle: 240 }, right: { x: 12, y: roll % 2 ? 6 : 12, angle: -30 } }, 250, easeInOut));
            }
            await c.tween({ tilt: 0 }, 200, easeInOut);
        };
        await swagger(moves.walkTo(c, X(KEEPER - 54), 0.8));
        // One finger up: a moment. It pats one pocket, then the other.
        await c.all(c.hands({ left: { x: -10, y: 10 }, right: { x: 8, y: -32, angle: -90 } }, 260, easeOut), c.tween({ gazeY: -0.3 }, 260));
        await at(T.meet - 500);
        await c.hands({ left: { x: -7, y: 13 }, right: { x: 7, y: 13 } }, 260, easeInOut);
        await c.all(c.tween({ gazeY: 0.6, tilt: -4 }, 200), c.hands({ left: { x: -5, y: 9 } }, 200));
        await at(T.meet);
        // There it is. The coin: flipped, it turns over in the air and lands in the open palm.
        await c.all(c.hands({ left: { x: -10, y: 10 }, right: { x: 6, y: 12 } }, 380, easeInOut), c.tween({ tilt: 0, gazeY: 0 }, 380));
        await c.hands({ right: { x: 15, y: -8, angle: -30 } }, 320, easeOut);
        await at(T.coin);
        const piece = c.prop(coin, { state: { draw: 1 } });
        const from = [X(KEEPER - 54) + 15 * k, -83 * k], to = [X(KEEPER - 24), -77 * k];
        Object.assign(piece.state, { x: from[0], y: from[1] });
        c.also({ gazeY: -0.6 }, 200);
        await c.all(c.animate(piece.state, { x: (from[0] + to[0]) / 2, y: from[1] - 30 * k, tilt: 540 }, 260, easeOut), c.hands({ right: { x: 17, y: -16, angle: -60 } }, 200, easeOut));
        await c.animate(piece.state, { x: to[0], y: to[1], tilt: 1080 }, 260, easeIn);
        await c.wait(520);
        c.animate(piece.state, { draw: 0 }, 300).catch(() => {});
        // The hat lifted, a small bow; and it is ready to go.
        await at(T.hat);
        await c.all(c.hands({ right: { x: 9, y: -47 }, left: { x: -22, y: -2, angle: 200 } }, 320, easeInOut), c.tween({ gazeY: 0, tilt: 11, crouch: 3 }, 320, easeInOut));
        await c.wait(380);
        await c.all(c.hands({ left: null, right: null }, 320), c.tween({ tilt: 0, crouch: 0, gazeX: 0.9 }, 320, easeInOut));
        await at(T.end);
        // Past the keeper and off into town, rolling as it goes. (The harbour is this animation's: it stays for as long as it is walked through.)
        await swagger(moves.walkTo(c, X(545), 0.9));
        await c.hands({ left: null, right: null }, 200);
        await c.wait(500);
    },
};
