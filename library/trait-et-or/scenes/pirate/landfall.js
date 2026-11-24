// Made for the pirate: landfall, in three acts. The picture stays on the
// boat: the sea runs under it, and the harbour comes to it.
//
//   1. Fair sailing. The boat rides high on the swell, sail full; the
//      pirate stands on its masthead as on a quarterdeck, in the best of
//      moods, a hand over the eyes to look ahead, another on the hip.
//   2. The leak. The boat drops all at once and begins to go down, slowly.
//      A look at the water; a shrug. Out comes the compass: turned one way,
//      the other, tapped three times on its glass, peered at; and there is
//      the way.
//   3. Landfall. The quay comes into the picture with its customs officer,
//      as the boat goes down faster: the masthead is level with the planks
//      at the very moment it gets there. A step, as off a stair; the boat
//      goes to the bottom. Up the quay, a coin flipped, the hat lifted, and
//      off into town.
//
// Places are counted from the edge of the quay, once it has come in
// (`data.home` says where the boat is from there). The officer's part, and
// the time and distances both keep, are shared with ../customs-officer/toll.js.

import { easing, moves } from 'figurant';
import { pocketCompass } from '../../props/pocket-compass.js';
import { GOLD, INK, PAPER, goldShape, inkShape, dotShape } from '../../kit.js';

const { easeOut, easeIn, easeInOut, linear } = easing;
/** When each moment starts, in ms, for the pirate and for the officer. */
export const T = { sail: 600, leak: 6200, compass: 7900, point: 13000, quay: 14400, land: 18400, walk: 19500, meet: 21800, coin: 22800, hat: 23800, end: 25100 };
/** How far out of the picture the quay starts, and where the officer stands on it. */
export const SLIDE = 520, KEEPER = 108;
/** The mast above the boat's waterline; the water below the quay; the length of a wave. */
const MAST = 104, WATER = 36, WAVE = 54;

const boat = {
    name: 'skiff',
    shapes: [
        inkShape(`M 0 -6 L 0 ${-MAST}`, 1.3),                                                        // the mast
        inkShape(`M -10 ${-MAST} L 10 ${-MAST} M -10 ${-MAST} L -10 ${-MAST - 5} M 10 ${-MAST} L 10 ${-MAST - 5}`, 1.1), // the masthead
        inkShape(`M -3 ${-MAST + 16} L 36 ${-MAST + 22}`, 1),                                        // the yard
        goldShape(`M 2 ${-MAST + 17} L 35 ${-MAST + 23} Q 40 -58 31 -30 L 2 -24 Q 8 -56 2 ${-MAST + 17} Z`), // the sail, full
        inkShape(`M 15 ${-MAST + 40} l 7 6 m -7 0 l 7 -6 M 10 -44 l 12 -3`, 0.7),                    // its patches
        inkShape('M 0 -24 L 33 -30', 0.9),                                                           // the boom
        goldShape('M -44 -10 L 46 -12 Q 38 12 2 13 Q -32 12 -44 -10 Z'),                             // the hull
        inkShape('M -39 -4 Q 0 0 42 -6 M -33 3 Q 0 6 37 1', 0.7),
        inkShape('M -44 -10 L -52 -16', 1.1),                                                        // the tiller
        dotShape(0, -8), dotShape(-44, -10, 2),
    ],
    points: { masthead: [0, -MAST] },
};
/** One line of swell, wide enough to run past the picture: `at` units under the waterline. */
const swell = (at, weight) => ({
    name: 'swell',
    shapes: [inkShape(Array.from({ length: 22 }, (unused, i) => `M ${-594 + i * WAVE} ${WATER + at} q ${WAVE / 4} -4 ${WAVE / 2} 0 t ${WAVE / 2} 0`).join(' '), weight)],
    points: {},
});
const sea = {
    name: 'harbour-water',
    shapes: [
        // What is under the water is not seen: the paper covers it.
        { tag: 'path', attrs: { d: `M -640 ${WATER} L 640 ${WATER} L 640 ${WATER + 190} L -640 ${WATER + 190} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M -640 ${WATER} L 640 ${WATER}`, 1),
    ],
    points: {},
};
const quay = {
    name: 'quay',
    shapes: [
        // Under the planks, the water is hidden too; then the piles, the planks, a bollard, the lantern of the harbour.
        { tag: 'path', attrs: { d: `M 0 7 L 600 7 L 600 ${WATER + 190} L 0 ${WATER + 190} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M 0 ${WATER} L 600 ${WATER}`, 1),
        ...[6, 96, 186, 276, 366, 456, 546].flatMap(x => [goldShape(`M ${x - 4} 6 L ${x - 4} ${WATER + 60} L ${x + 4} ${WATER + 60} L ${x + 4} 6 Z`), inkShape(`M ${x - 4} ${WATER} q 4 -3 8 0`, 0.7)]),
        goldShape('M 0 0 L 600 0 L 600 7 L 0 7 Z'),
        inkShape([44, 110, 176, 242, 308, 374, 440, 506, 572].map(x => `M ${x} 0 L ${x} 7`).join(' '), 0.7),
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
    room: { left: 120, right: 490, up: 200 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, base = ctx?.data?.home ?? -12, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        /** A place along the quay (from its edge, once it is in) as the figure's own number. */
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.y = ground; s.squint = 0; s.grin = 0.5; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // From the back to the front: the far swell, the boat, the water over what of it is under, the near swell, the quay.
        const far = c.prop(swell(-5, 0.6), { behind: true, state: { draw: 0 } });
        const skiff = c.prop(boat, { behind: true, state: { draw: 0 } });
        const water = c.prop(sea, { behind: true, state: { draw: 0 } });
        const near = c.prop(swell(11, 0.8), { behind: true, state: { draw: 0 } });
        const pier = c.prop(quay, { behind: true, state: { draw: 1 } });
        water.state.x = X(0);
        // The voyage: how fast the sea runs by, how deep the boat has gone, how far out the quay still is.
        const voyage = { way: 1, sunk: 0, out: SLIDE, aboard: true, run: 0, t: 0 };
        c.onLeave(c.clock.onFrame(dt => {
            voyage.t += dt / 1000;
            voyage.run = (voyage.run + voyage.way * 52 * dt / 1000) % WAVE;
            far.state.x = X(0) - voyage.run * 0.6 * k; near.state.x = X(0) - voyage.run * k;
            pier.state.x = X(voyage.out);
            // The boat rides the swell while it still floats: less and less as it fills.
            const afloat = Math.max(0, 1 - voyage.sunk / 30) * voyage.way, heave = Math.sin(voyage.t * 2.1) * 2.6 * afloat, roll = Math.sin(voyage.t * 1.3) * 3.4 * afloat;
            skiff.state.x = X(base); skiff.state.y = (WATER + voyage.sunk + heave) * k; skiff.state.tilt = roll;
            if (voyage.aboard) { s.x = X(base) + Math.sin(roll * Math.PI / 180) * MAST * k; s.y = ground - (MAST - voyage.sunk - heave - WATER) * k; }
        }));
        await c.all(c.animate(far.state, { draw: 1 }, 500), c.animate(skiff.state, { draw: 1 }, 500), c.animate(water.state, { draw: 1 }, 500), c.animate(near.state, { draw: 1 }, 500));

        // ── 1. Fair sailing. ──
        await at(T.sail);
        await c.all(c.hands({ left: { x: -10, y: 10, angle: 30 } }, 400, easeInOut), c.tween({ gazeX: 0.9, squint: 0.5, grin: 1 }, 400));
        await c.wait(900);
        // A hand over the eyes, a long look ahead; satisfied.
        await c.all(c.hands({ right: { x: 9, y: -42, angle: -100 } }, 420, easeInOut), c.tween({ tilt: 5 }, 420, easeInOut));
        await c.wait(1300);
        await c.all(c.hands({ right: { x: 13, y: 6, angle: -20 } }, 420, easeInOut), c.tween({ tilt: 0 }, 420, easeInOut));
        for (let sway = 0; c.clock.now - start < T.leak - 400; sway++) await c.tween({ tilt: sway % 2 ? 5 : -4 }, 640, easeInOut);

        // ── 2. The leak, and the compass. ──
        await at(T.leak);
        await c.animate(voyage, { sunk: 10 }, 220, easeIn);
        c.animate(voyage, { sunk: 44 }, T.quay - T.leak - 220, linear).then(() => c.animate(voyage, { sunk: MAST - WATER }, T.land - T.quay, easeIn)).catch(() => {});
        c.also({ wide: 1, squint: 0, grin: 0.1 }, 120);
        await c.tween({ tilt: 0, gazeX: 0.2, gazeY: 0.9 }, 300, easeOut);
        await c.wait(650);
        // Well. It has known worse.
        await c.tween({ wide: 0, squint: 0.5, grin: 1, gazeX: 0.9, gazeY: 0, tilt: -4 }, 500, easeInOut);
        await at(T.compass);
        const needle = c.give('right', pocketCompass, { tilt: -10, state: { draw: 0 } });
        await c.hands({ right: { x: 5, y: 10 } }, 300, easeInOut);
        await c.all(c.hands({ right: { x: 13, y: -10, angle: -60 } }, 420, easeOut), c.animate(needle.state, { draw: 1 }, 420), c.tween({ gazeX: 0.5, gazeY: 0.7, tilt: 2 }, 420));
        await c.wait(600);
        // It does not say what it should: turned one way, the other; tapped three times on its glass; looked at from very near.
        await c.all(c.tween({ tilt: -8, gazeX: -0.6 }, 420, easeInOut), c.hands({ right: { x: -6, y: -12, angle: -120 } }, 420, easeInOut));
        await c.wait(300);
        await c.all(c.tween({ tilt: 7, gazeX: 0.8 }, 460, easeInOut), c.hands({ right: { x: 15, y: -12, angle: -60 } }, 460, easeInOut));
        for (let tap = 0; tap < 3; tap++) { await c.hands({ left: { x: 9, y: -22 } }, 130, easeOut); await c.hands({ left: { x: 12.5, y: -15 } }, 90, easeIn); await c.wait(110); }
        await c.hands({ left: { x: -10, y: 10, angle: 30 } }, 260, easeInOut);
        await c.all(c.hands({ right: { x: 8, y: -24, angle: -80 } }, 320, easeInOut), c.tween({ gazeX: 0.3, gazeY: -0.2, squint: 1, tilt: 3 }, 320));
        await c.wait(650);
        // A hiccup. And there: that way, obviously.
        c.also({ wide: 1, squint: 0 }, 80);
        await c.tween({ squash: -0.18, crouch: -2 }, 90, easeOut);
        await c.tween({ squash: 0, crouch: 0, wide: 0, squint: 0.5 }, 220, easeOut);
        await at(T.point);
        await c.all(c.hands({ left: { x: 27, y: -16, angle: -15 }, right: { x: 8, y: 4 } }, 360, easeOut), c.tween({ gazeX: 1, gazeY: -0.1, tilt: 8 }, 360, easeOut));
        await c.wait(800);
        await c.all(c.animate(needle.state, { draw: 0 }, 300), c.hands({ left: { x: -10, y: 10, angle: 30 }, right: { x: 13, y: 6, angle: -20 } }, 400, easeInOut), c.tween({ tilt: 0 }, 400));

        // ── 3. Landfall. The quay comes in as the way comes off the boat. ──
        await at(T.quay);
        c.animate(voyage, { out: 0, way: 0 }, T.land - T.quay, easeOut).catch(() => {});
        for (let sway = 0; c.clock.now - start < T.land - 2500; sway++) await c.tween({ tilt: sway % 2 ? -5 : 5 }, 600, easeInOut);
        // A close thing: a look down at the water coming up, up on its toes, a look at the quay, down again.
        await c.tween({ tilt: 0, gazeX: 0.2, gazeY: 0.9, wide: 0.8, grin: 0.1, squint: 0 }, 300, easeOut);
        await c.feet({ left: { x: -3, y: 5, pitch: 60 }, right: { x: 3, y: 5, pitch: 60 } }, 260, easeOut);
        await c.tween({ gazeX: 1, gazeY: 0 }, 260);
        await c.tween({ gazeX: 0.2, gazeY: 0.9 }, 260);
        await c.tween({ gazeX: 1, gazeY: 0, tilt: 5 }, 260);
        // Level with the planks at the very moment it gets there: it steps off, as off a stair.
        await at(T.land);
        voyage.aboard = false;
        s.y = ground;
        c.animate(voyage, { sunk: MAST + 18 }, 2400, easeIn).then(() => {
            if (!fx || !c.alive) return;
            const bubbles = fx.particles({ color: INK, width: 1.4 });
            for (let i = 0; i < 9; i++) bubbles.emit({ x: c.figure.points.centre[0] + (X(base) - s.x) + fx.range(-10, 10) * k, y: c.figure.points.ground + WATER * k, vx: fx.range(-12, 12) * k, vy: -fx.range(20, 60) * k, life: fx.range(0.4, 0.9), trail: 0.02 });
            bubbles.close();
        }, () => {});
        await c.all(c.feet({ right: { x: 15, y: 0 }, left: { x: 0, y: 4, pitch: 50 } }, 220, easeOut), c.tween({ x: X(8), tilt: 5 }, 260, easeOut));
        await c.all(c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240, easeInOut), c.tween({ x: X(16), tilt: 0, wide: 0 }, 280, easeInOut));
        await c.feet({ left: null, right: null }, 1);
        // On dry planks. The back of a hand across the brow; and the smile is back.
        await c.all(c.hands({ right: { x: 8, y: -40, angle: -100 } }, 220, easeOut), c.tween({ grin: 1, squint: 0.5, gazeY: 0 }, 220));
        await c.hands({ right: { x: -4, y: -40, angle: -100 } }, 200, easeInOut);
        await c.hands({ right: null }, 220);

        // Up the quay to the officer. Its walk is its own: it rolls as if the planks were still a deck, wrists loose.
        await at(T.walk);
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
        // The hat lifted, the other arm wide, a bow; and off into town, rolling as it goes.
        await at(T.hat);
        await c.all(c.hands({ right: { x: 9, y: -49 }, left: { x: -22, y: -2, angle: 200 } }, 320, easeInOut), c.tween({ gazeY: 0, tilt: 11, crouch: 3 }, 320, easeInOut));
        await c.wait(380);
        await c.all(c.hands({ left: null, right: null }, 320), c.tween({ tilt: 0, crouch: 0, gazeX: 0.9 }, 320, easeInOut));
        await at(T.end);
        // (The harbour is this animation's: it stays for as long as it is walked through.)
        await swagger(moves.walkTo(c, X(480), 0.9));
        await c.hands({ left: null, right: null }, 200);
        await c.wait(400);
    },
};
