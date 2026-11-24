// Made for the pirate: landfall, in three acts. The picture stays on the
// boat: the sea runs under it, and the harbour comes to it.
//
//   1. Fair sailing. The pirate stands in its skiff, at the stern, a hand on
//      the hip, in the best of moods; the skiff rides the swell, sail full.
//      A hand over the eyes to look ahead.
//   2. The leak. The skiff drops all at once and begins to go down. A look
//      at the water round its feet, one foot lifted, then the other: up the
//      mast it goes, hand over hand, to stand on the masthead. There, out
//      comes the compass: turned one way, the other, tapped three times on
//      its glass, peered at; and there is the way.
//   3. Landfall. The quay comes into the picture with its customs officer,
//      as the skiff goes down faster: the masthead is level with the planks
//      at the very moment it gets there. A step, as off a stair; the skiff
//      goes to the bottom. Up the quay, a coin flipped, the hat lifted, and
//      off into town.
//
// The harbour is made of the style's own props (../../props/harbour.js).
// Places are counted from the edge of the quay, once it has come in
// (`data.home` says where the skiff's mast is from there). The officer's
// part, and the time and distances both keep, are shared with
// ../customs-officer/toll.js.

import { easing, moves } from 'figurant';
import { pocketCompass } from '../../props/pocket-compass.js';
import { skiffRig, skiffHull, swell, harbourWater, quay, goldCoin, MAST, FLOOR, WATER, WAVE } from '../../props/harbour.js';
import { INK } from '../../kit.js';

const { easeOut, easeIn, easeInOut, linear } = easing;
/** When each moment starts, in ms, for the pirate and for the officer. */
// (Each leaves the one before it time to end: a part still busy when its next moment comes starts it late, and the
// officer, who keeps this time too, would be on the quay before the quay is there.)
export const T = { sail: 600, leak: 6000, climb: 7600, compass: 10400, point: 15700, quay: 17500, land: 21500, walk: 22800, meet: 25100, coin: 26100, hat: 27300, end: 28600 };
/** How far out of the picture the quay starts (further than the widest picture is wide), and where the officer stands on it. */
export const SLIDE = 820, KEEPER = 108;
/** Where the pirate stands in the skiff at first: at the stern, this far from the mast. */
const STERN = -30;

export const landfallPirate = {
    character: 'pirate',
    room: { left: 130, right: 490, up: 210 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, base = ctx?.data?.home ?? -12, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        /** A place along the quay (from its edge, once it is in) as the figure's own number. */
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.y = ground; s.squint = 0; s.grin = 0.5; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // From the back to the front: the far swell, the skiff's rig, the pirate, the hull it stands in,
        // the water over what of the skiff is under, the near swell, the quay.
        const far = c.prop(swell(-5, 0.6), { behind: true, state: { draw: 0 } });
        const rig = c.prop(skiffRig, { behind: true, state: { draw: 0 } });
        const hull = c.prop(skiffHull, { state: { draw: 0 } });
        const water = c.prop(harbourWater, { state: { draw: 0 } });
        const near = c.prop(swell(11, 0.8), { state: { draw: 0 } });
        const pier = c.prop(quay, { state: { draw: 1 } });
        water.state.x = X(0);
        // The voyage: how fast the sea runs by, how deep the boat has gone, how far out the quay still is.
        // And the pirate in it: how high its feet are above the skiff's waterline, how far from the mast it stands.
        // (Three things that change each at its own pace, so each has its own numbers: the sea and the quay, the depth, the pirate's perch.)
        const voyage = { way: 1, out: SLIDE, aboard: true, run: 0, t: 0 }, depth = { sunk: 0 }, stand = { perch: FLOOR, off: STERN };
        c.onLeave(c.clock.onFrame(dt => {
            voyage.t += dt / 1000;
            voyage.run = (voyage.run + voyage.way * 52 * dt / 1000) % WAVE;
            far.state.x = X(0) - voyage.run * 0.6 * k; near.state.x = X(0) - voyage.run * k;
            pier.state.x = X(voyage.out);
            // The boat rides the swell while it still floats: less and less as it fills.
            const afloat = Math.max(0, 1 - depth.sunk / 30) * voyage.way, heave = Math.sin(voyage.t * 2.1) * 2.6 * afloat, roll = Math.sin(voyage.t * 1.3) * 3.4 * afloat;
            for (const piece of [rig, hull]) { piece.state.x = X(base); piece.state.y = (WATER + depth.sunk + heave) * k; piece.state.tilt = roll; }
            // (Aboard, it goes where the skiff goes: down with it, up and down on the swell, and the further up the mast, the more it is swung by the roll.)
            if (voyage.aboard) { s.x = X(base + stand.off) + Math.sin(roll * Math.PI / 180) * stand.perch * k; s.y = ground - (stand.perch - depth.sunk - heave - WATER) * k; }
        }));
        await c.all(c.animate(far.state, { draw: 1 }, 500), c.animate(rig.state, { draw: 1 }, 500), c.animate(hull.state, { draw: 1 }, 500), c.animate(water.state, { draw: 1 }, 500), c.animate(near.state, { draw: 1 }, 500));

        // ── 1. Fair sailing. ──
        await at(T.sail);
        await c.all(c.hands({ left: { x: -10, y: 10, angle: 30 } }, 400, easeInOut), c.tween({ gazeX: 0.9, squint: 0.5, grin: 1 }, 400));
        await c.wait(900);
        // A hand over the eyes, a long look ahead; satisfied.
        await c.all(c.hands({ right: { x: 9, y: -42, angle: -100 } }, 420, easeInOut), c.tween({ tilt: 5 }, 420, easeInOut));
        await c.wait(1300);
        await c.all(c.hands({ right: { x: 13, y: 6, angle: -20 } }, 420, easeInOut), c.tween({ tilt: 0 }, 420, easeInOut));
        for (let sway = 0; c.clock.now - start < T.leak - 400; sway++) await c.tween({ tilt: sway % 2 ? 5 : -4 }, 640, easeInOut);

        // ── 2. The leak: up the mast; and the compass. ──
        await at(T.leak);
        await c.animate(depth, { sunk: 12 }, 240, easeIn);
        c.animate(depth, { sunk: 52 }, T.quay - T.leak - 240, linear).then(() => c.animate(depth, { sunk: MAST - WATER }, T.land - T.quay, easeIn)).catch(() => {});
        // Water round its feet: a look down, one foot lifted and shaken, then the other.
        c.also({ wide: 1, squint: 0, grin: 0.1 }, 120);
        await c.all(c.tween({ tilt: 0, gazeX: 0.1, gazeY: 1 }, 260, easeOut), c.hands({ left: { x: -16, y: -6 }, right: { x: 16, y: -6 } }, 260, easeOut));
        await c.feet({ left: { x: -6, y: 12, pitch: 20 } }, 220, easeOut); await c.feet({ left: { x: -3, y: 0 } }, 200, easeIn);
        await c.feet({ right: { x: 6, y: 12, pitch: 20 } }, 220, easeOut); await c.feet({ right: { x: 3, y: 0 } }, 200, easeIn);
        // Up the mast, hand over hand, feet gripping it: four pulls to the masthead.
        await at(T.climb);
        c.also({ wide: 0, squint: 0.3, grin: 0.4, gazeX: 0.4, gazeY: -0.8 }, 300);
        await c.all(c.animate(stand, { off: -5 }, 360, easeInOut), c.hands({ left: { x: 1, y: -30 }, right: { x: 5, y: -18 } }, 360, easeInOut), c.feet({ left: { x: 2, y: 8 }, right: { x: 5, y: 2 } }, 360, easeInOut));
        for (let pull = 0; pull < 4; pull++) {
            const up = pull % 2 ? 'left' : 'right', hold = pull % 2 ? 'right' : 'left';
            await c.all(c.hands({ [up]: { x: 3, y: -36 }, [hold]: { x: 3, y: -12 } }, 190, easeOut), c.tween({ crouch: 5 }, 190, easeOut));
            await c.all(c.animate(stand, { perch: FLOOR + (MAST - FLOOR) * (pull + 1) / 4 }, 300, easeInOut), c.hands({ [up]: { x: 3, y: -14 }, [hold]: { x: 3, y: 6 } }, 300, easeInOut), c.tween({ crouch: 0 }, 300, easeInOut), c.feet({ [up]: { x: 3, y: 12 }, [hold]: { x: 3, y: 2 } }, 300, easeInOut));
        }
        // On the masthead, upright: as if it had meant to be there all along.
        await c.all(c.animate(stand, { off: 0 }, 300, easeInOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 300, easeInOut), c.hands({ left: { x: -10, y: 10, angle: 30 }, right: { x: 13, y: 6, angle: -20 } }, 300, easeInOut), c.tween({ gazeX: 0.9, gazeY: 0, squint: 0.5, grin: 1 }, 300));
        await c.feet({ left: null, right: null }, 1);
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
        c.animate(depth, { sunk: MAST + 22 }, 2400, easeIn).then(() => {
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
        const piece = c.prop(goldCoin, { state: { draw: 1 } });
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
        await swagger(moves.walkTo(c, X(620), 1));
        await c.hands({ left: null, right: null }, 200);
        await c.wait(400);
    },
};
