// Made for the pirate: landfall, in two parts. First it sails, standing on
// the masthead of a small boat, in the best of moods and none too steady. The
// boat springs a leak and begins to go down; it takes out its compass, taps
// on it to make it say where the harbour is, and points the way. Then the
// boat goes down faster, and it is a close thing: the masthead comes level
// with the quay at the very moment it gets there. The harbour comes into
// sight on the way (the quay draws itself in, the customs officer
// walks down it): it steps off as one steps off a stair, and the boat goes on
// to the bottom. It walks up the quay, flips a coin, lifts its hat, and
// rolls off into town.
//
// The harbour is the animation's own: the water, the quay on its piles, the
// boat. Places are counted from the foot of the quay's first pile
// (`data.home` says where the pirate starts from there, out on the water).

import { easing, moves } from 'figurant';
import { pocketCompass } from '../../props/pocket-compass.js';
import { GOLD, INK, PAPER, goldShape, inkShape, dotShape } from '../../kit.js';

const { easeOut, easeIn, easeInOut, linear } = easing;
/** When each moment starts, in ms, for the pirate and for the officer (see ../customs-officer/toll.js). */
export const T = { sail: 700, leak: 3200, compass: 5000, point: 10400, quay: 12200, land: 17200, walk: 18300, meet: 20600, coin: 21600, hat: 22600, end: 23900 };
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
        { tag: 'path', attrs: { d: `M -560 ${WATER} L 70 ${WATER} L 70 ${WATER + 190} L -560 ${WATER + 190} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M -560 ${WATER} L 0 ${WATER}`, 1),
        inkShape([-530, -450, -390, -300, -210, -120, -60].map((x, i) => wave(x, WATER + 9 + (i % 2) * 7)).join(' '), 0.7),
        inkShape([-490, -350, -250, -150].map(x => wave(x, WATER + 24)).join(' '), 0.6),
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
    room: { left: 60, right: 560, up: 160 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, base = ctx?.data?.home ?? -330, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        /** A place along the quay (from the foot of its first pile) as the figure's own number. */
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.y = ground; s.squint = 0; s.grin = 0.5; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

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
        // (Out at sea there is no quay yet: it comes into sight later.)
        await c.all(c.animate(skiff.state, { draw: 1 }, 600), c.animate(sea.state, { draw: 1 }, 600));

        // Under way, going down all the way. In the best of moods: eyes half shut, rocking more than the boat does.
        await at(T.sail);
        c.animate(voyage, { x: -10 }, T.land - T.sail, linear).catch(() => {});
        await c.all(c.hands({ left: { x: -10, y: 10, angle: 30 } }, 400, easeInOut), c.tween({ gazeX: 0.9, squint: 0.4, grin: 1, tilt: 6 }, 400));
        for (let sway = 0; c.clock.now - start < T.leak - 500; sway++) await c.tween({ tilt: sway % 2 ? 6 : -5 }, 620, easeInOut);
        // The leak: the boat drops a hand's breadth all at once, and goes on going down, slowly.
        await at(T.leak);
        await c.animate(voyage, { sunk: 0 }, 180, easeIn);
        c.animate(voyage, { sunk: 38 }, T.quay - T.leak - 180, linear).then(() => c.animate(voyage, { sunk: MAST - WATER }, T.land - T.quay, easeIn)).catch(() => {});
        c.also({ wide: 1, squint: 0, grin: 0.2 }, 120);
        await c.tween({ tilt: 0, gazeX: 0.2, gazeY: 0.9 }, 300, easeOut);
        await c.wait(700);
        // Well. It has known worse.
        await c.tween({ wide: 0, squint: 0.4, grin: 1, gazeX: 0.9, gazeY: 0, tilt: -4 }, 500, easeInOut);
        // The compass: out of the coat, held up, looked at closely.
        await at(T.compass);
        const needle = c.give('right', pocketCompass, { tilt: -10, state: { draw: 0 } });
        await c.hands({ right: { x: 5, y: 10 } }, 300, easeInOut);
        await c.all(c.hands({ right: { x: 13, y: -10, angle: -60 } }, 420, easeOut), c.animate(needle.state, { draw: 1 }, 420), c.tween({ gazeX: 0.5, gazeY: 0.7, tilt: 2 }, 420));
        await c.wait(600);
        // It does not say what it should: turned one way, the other; shaken; looked at again, from very near.
        await c.all(c.tween({ tilt: -8, gazeX: -0.6 }, 420, easeInOut), c.hands({ right: { x: -6, y: -12, angle: -120 } }, 420, easeInOut));
        await c.wait(300);
        await c.all(c.tween({ tilt: 7, gazeX: 0.8 }, 460, easeInOut), c.hands({ right: { x: 15, y: -12, angle: -60 } }, 460, easeInOut));
        // Three taps of a finger on its glass, to wake it up.
        for (let tap = 0; tap < 3; tap++) { await c.hands({ left: { x: 9, y: -22 } }, 130, easeOut); await c.hands({ left: { x: 12.5, y: -15 } }, 90, easeIn); await c.wait(110); }
        await c.hands({ left: { x: -10, y: 10, angle: 30 } }, 260, easeInOut);
        await c.all(c.hands({ right: { x: 8, y: -24, angle: -80 } }, 320, easeInOut), c.tween({ gazeX: 0.3, gazeY: -0.2, squint: 0.9, tilt: 3 }, 320));
        await c.wait(650);
        // A hiccup. And there: that way, obviously.
        c.also({ wide: 1, squint: 0 }, 80);
        await c.tween({ squash: -0.18, crouch: -2 }, 90, easeOut);
        await c.tween({ squash: 0, crouch: 0, wide: 0, squint: 0.5 }, 220, easeOut);
        await at(T.point);
        await c.all(c.hands({ left: { x: 27, y: -16, angle: -15 }, right: { x: 8, y: 4 } }, 360, easeOut), c.tween({ gazeX: 1, gazeY: -0.1, tilt: 8 }, 360, easeOut));
        await c.wait(900);
        await c.all(c.animate(needle.state, { draw: 0 }, 300), c.hands({ left: { x: -10, y: 10, angle: 30 }, right: { x: 13, y: 6, angle: -20 } }, 400, easeInOut), c.tween({ tilt: 0 }, 400));
        // The harbour comes into sight: the quay draws itself in. A hand over the eyes to make it out.
        await at(T.quay);
        c.animate(pier.state, { draw: 1 }, 1500, easeInOut).catch(() => {});
        await c.all(c.hands({ right: { x: 9, y: -40, angle: -100 } }, 400, easeInOut), c.tween({ gazeX: 0.9, tilt: 4 }, 400));
        await c.wait(1100);
        await c.hands({ right: { x: 13, y: 6, angle: -20 } }, 400, easeInOut);
        for (let sway = 0; c.clock.now - start < T.land - 2700; sway++) await c.tween({ tilt: sway % 2 ? -6 : 6 }, 600, easeInOut);
        // A close thing: a look down at the water coming up, up on its toes, a look at the quay, down again.
        await c.tween({ tilt: 0, gazeX: 0.2, gazeY: 0.9, wide: 0.8, grin: 0.1, squint: 0 }, 300, easeOut);
        await c.feet({ left: { x: -3, y: 5, pitch: 60 }, right: { x: 3, y: 5, pitch: 60 } }, 260, easeOut);
        await c.tween({ gazeX: 1, gazeY: 0 }, 260);
        await c.tween({ gazeX: 0.2, gazeY: 0.9 }, 260);
        await c.tween({ gazeX: 1, gazeY: 0, tilt: 5 }, 260);
        await c.wait(300);

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
        await c.all(c.feet({ right: { x: 15, y: 0 }, left: { x: 0, y: 4, pitch: 50 } }, 220, easeOut), c.tween({ x: X(8), tilt: 5 }, 260, easeOut));
        await c.all(c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240, easeInOut), c.tween({ x: X(16), tilt: 0, wide: 0 }, 280, easeInOut));
        await c.feet({ left: null, right: null }, 1);
        // On dry planks. The back of a hand across the brow; and the smile is back.
        await c.all(c.hands({ right: { x: 8, y: -40, angle: -100 } }, 220, easeOut), c.tween({ grin: 1, squint: 0.4, gazeY: 0 }, 220));
        await c.hands({ right: { x: -4, y: -40, angle: -100 } }, 200, easeInOut);
        await c.hands({ right: null }, 220);

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
