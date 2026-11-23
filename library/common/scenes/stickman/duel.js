// Made for the stick figure: a duel with swords of light, for two. Both play
// this same animation, started at the same instant, each with its part
// (`data.part`: 'first', on the left, or 'second'), the colour of its blade
// (`data.colour`) and where it stands (`data.home`: units from the middle of
// the floor). The two never drift apart: both follow one clock (every moment
// below is counted from the start) and one floor (every place below is
// measured from its middle), so a blade is where the other blade is.
//
//   far apart, the blades light up; they run at each other
//   four clashes, the first driving the second across the floor
//   a low sweep, somersaulted over; a lunge, parried
//   four more, the second driving the first all the way back
//   the first throws the second across the stage from afar
//   the second walks back and lifts the first off the floor, in lightning
//   a chair appears and is hurled: cut in the air; a couch: somersaulted over
//   they charge from the two ends, lock blades and push, until both go out
//   a look at the dead hilts, a shrug
//
// It plays towards the side the figure faces (`dir`).

import { easing, moves, props, effects } from 'figurant';

const { easeOut, easeIn, easeInOut, linear } = easing;
const { chair, couch } = props;

/**
 * When each moment starts, in ms from the start, for both parts. Each leaves the one before it time to
 * end, with room to spare: a part that is still busy when the next moment comes starts it late, and the
 * two fall out of step.
 */
const T = {
    run: 900, first: [1900, 2600, 3300, 4000], sweep: 4800, lunge: 6500, second: [8000, 8700, 9400, 10100],
    push: 11000, back: 13500, lift: 15300, drop: 18000, chair: 19200, couch: 22000, flip: 25600,
    charge: 27500, lock: 28100, out: 30600, look: 31200, shrug: 32300, end: 33400,
};
/** Where the blades meet at each clash: the middle between the two, in units from the middle of the floor. */
const MEET = { first: [0, 50, 100, 150], second: [110, 40, -40, -120] };
/** Half the distance between two fencers whose blades cross. */
const GAP = 58;

/** A sword of light: a hilt, and a blade that glows in the colour it is given. Origin: the grip. */
const lightSword = colour => ({
    name: 'light-sword',
    shapes: [
        { tag: 'path', attrs: { d: 'M 8 0 L 46 0', stroke: colour, 'stroke-linecap': 'round', opacity: 0.35 }, weight: 4.2 },
        { tag: 'path', attrs: { d: 'M 8 0 L 46 0', stroke: colour, 'stroke-linecap': 'round' }, weight: 2.2 },
        { tag: 'path', attrs: { d: 'M 9 0 L 45 0', stroke: '#ffffff', 'stroke-linecap': 'round' }, weight: 0.6 },
        { tag: 'path', attrs: { d: 'M -1 0 L 7 0' }, weight: 1.7 },
    ],
    points: { grip: [0, 0], tip: [46, 0] },
});

export const duelStickman = {
    character: 'stickman',
    room: { left: 300, right: 300, up: 220 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, way = s.dir || 1, home = s.x, ground = s.y;
        const first = (ctx?.data?.part ?? 'first') === 'first';
        const colour = ctx?.data?.colour ?? (first ? '#2f7df6' : '#e5383b');
        const other = ctx?.data?.rival ?? (first ? '#e5383b' : '#2f7df6');
        /** Where it stands at the start, on the floor both share. */
        const base = ctx?.data?.home ?? -way * 150;
        const fx = ctx?.api?.fx ?? null;
        const sword = way > 0 ? 'right' : 'left', free = way > 0 ? 'left' : 'right';
        const start = c.clock.now;
        /** Waits for a moment of the duel: this is what keeps the two parts together in time. */
        const at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { s.y = ground; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // ── Places. Everything is said in units from the middle of the floor. ──
        /** Where the figure is now. */
        const here = () => base + (s.x - home) / k;
        /** Goes to a place on the floor (and sets other numbers on the way). */
        const to = (place, ms, ease = easeInOut, more = {}) => c.tween({ x: home + (place - base) * k, ...more }, ms, ease);
        /** A place on the floor, and a height above it, as a point of the page. */
        const page = (place, up = 0) => [c.figure.points.centre[0] + (place - here()) * k, c.figure.points.ground - up * k];
        /** Its own side of a meeting point: the first stands to the left of it. */
        const mine = (meet, gap = GAP) => meet + (first ? -gap : gap);

        // ── The body. ──
        // The blade: `swing.up` is its angle above the horizontal, pointing the way the figure faces.
        const swing = { up: 8 };
        const blade = c.give(sword, lightSword(colour), { tilt: () => (way > 0 ? -swing.up : 180 + swing.up), state: { draw: 0 } });
        const cut = (up, ms, ease = easeInOut) => c.animate(swing, { up }, ms, ease);
        /** The sword hand `reach` in front and `lift` high (negative: up); the other hand behind, or where it is told. */
        const arms = (reach, lift, ms, ease = easeInOut, rest = { x: -way * 20, y: -22 }) => c.hands({ [sword]: { x: way * reach, y: lift }, [free]: rest }, ms, ease);
        const stance = (front, ms, ease = easeOut) => c.feet({ [sword]: { x: way * front, y: 0 }, [free]: { x: -way * 7, y: 0 } }, ms, ease);
        const guard = ms => c.all(cut(12, ms), arms(22, -8, ms), c.tween({ tilt: 0, crouch: 5 }, ms), stance(9, ms));
        const hand = side => c.figure.points[side === 'right' ? 'armR' : 'armL']?.tip ?? c.figure.points.centre;

        // ── What is seen besides the two of them. Only the first draws what the two share. ──
        /** Blades meeting at a place and a height: a ring, a star, sparks in both colours. */
        const impact = (place, up, big = 1) => {
            if (!fx || !first) return;
            const point = page(place, up);
            effects.shockwave(fx, point, { k, size: 34 * big, life: 360, color: '#ffffff', width: 3 });
            effects.shockwave(fx, point, { k, size: 22 * big, life: 280, color: colour });
            effects.flash(fx, point, { k, size: 20 * big, color: other });
            effects.burst(fx, point, { k, count: Math.round(8 * big), speed: 210, color: colour });
            effects.burst(fx, point, { k, count: Math.round(8 * big), speed: 180, color: other });
        };
        const dust = (count = 10) => { if (fx) effects.dust(fx, page(here()), { k, count }); };
        /** A somersault: `turn` degrees round (negative: backwards), `height` units up, landing at `land` if given. */
        const somersault = async (turn, height = 62, ms = 660, land) => {
            await c.feet({ left: null, right: null }, 1);
            await c.tween({ crouch: 9, squash: 0.4 }, 150, easeInOut);
            dust(8);
            c.also({ crouch: 0, squash: -0.3, tuck: 1 }, 100, easeOut);
            const spin = c.tween({ tilt: turn }, ms, linear), travel = land === undefined ? null : to(land, ms, linear);
            await c.tween({ y: ground - height * k }, ms / 2, easeOut);
            c.also({ tuck: 0 }, 200, easeIn);
            await c.tween({ y: ground }, ms / 2, easeIn);
            await spin; await travel;
            s.tilt = 0;
            c.also({ squash: 0 }, 180);
            dust(12);
            if (fx) effects.shockwave(fx, page(here()), { k, size: 30, flat: 0.25, life: 380 });
            await moves.land(c, 8);
            await c.all(c.tween({ crouch: 5 }, 160), stance(9, 160));
        };
        /**
         * A piece of furniture made to appear in front of the figure, raised without a touch, and hurled:
         * it draws itself in, lifts in a glow, flies to `far` (a place on the floor) at `low` units up, and is
         * gone when it gets there.
         */
        const hurl = async (thing, { rise, far, low, spin, flight, sliced }) => {
            const from = here() + way * 46;
            const flying = c.prop(thing, { x: (from - base), y: 0, state: { draw: 0, flip: way } });
            flying.state.x = home + (from - base) * k;
            await c.animate(flying.state, { draw: 1 }, 460, easeOut);
            if (fx) effects.shockwave(fx, page(from), { k, size: 36, flat: 0.3, life: 500, color: colour });
            await c.animate(flying.state, { y: -rise * k, tilt: way * 12 }, 520, easeOut);
            await c.animate(flying.state, { y: -(rise + 6) * k, tilt: -way * 8 }, 320, easeInOut);
            await c.animate(flying.state, { x: home + (far - base) * k, y: -low * k, tilt: way * spin }, flight, sliced ? easeIn : linear);
            await c.animate(flying.state, { draw: 0 }, sliced ? 80 : 220);
        };
        /** One clash at a meeting point: wound up while getting there, struck, sprung back from. */
        const clash = async (when, meet, high, advancing) => {
            await at(when - 280);
            await c.all(cut(high ? 82 : -42, 200), arms(14, high ? -32 : 0, 200), to(mine(meet, GAP + 10), 220, easeInOut, { tilt: way * (advancing ? 4 : -7), crouch: 7 }), stance(advancing ? 12 : 6, 200));
            await at(when);
            await c.all(cut(high ? 36 : -14, 70, easeIn), arms(32, high ? -24 : -4, 70, easeIn), to(mine(meet), 70, easeIn, { tilt: way * 8 }));
            impact(meet, high ? 44 : 22);
            if (!advancing) dust(5);
            await c.wait(90);
            await c.all(cut(14, 130), arms(22, -8, 130), c.tween({ tilt: 0 }, 130));
        };

        // Far apart, the blades light up, each in its own glow.
        const glow = fx ? effects.aura(fx, c.figure, { color: colour }) : null;
        c.onLeave(() => glow?.stop());
        if (glow) c.animate(glow, { level: 0.9 }, 500).catch(() => {});
        await c.all(c.animate(blade.state, { draw: 1 }, 520, easeOut), arms(22, -6, 420), c.tween({ crouch: 5, gazeX: way * 0.8 }, 420, easeOut), stance(9, 420));
        if (fx) effects.flash(fx, hand(sword), { k, size: 22, color: colour });
        if (glow) c.animate(glow, { level: 0 }, 500).catch(() => {});

        // They run at each other.
        await at(T.run);
        dust(8);
        await to(mine(MEET.first[0], GAP + 12), 520, easeIn, { tilt: way * 12, crouch: 8 });

        // Four clashes: high, low, high, high. The first drives the second across the floor.
        for (const [i, when] of T.first.entries()) await clash(when, MEET.first[i], i !== 1, first);

        // A low sweep by the second; the first somersaults over it.
        await at(T.sweep);
        if (first) { await c.wait(60); await somersault(way * 360, 60, 620); await guard(160); }
        else {
            await c.all(cut(-38, 140), arms(16, 6, 140), c.tween({ crouch: 13 }, 140));
            await c.all(cut(-16, 240, easeOut), arms(40, 10, 240, easeOut), to(mine(MEET.first[3], GAP - 12), 240, easeOut));
            await c.wait(200);
            await c.all(guard(260), to(mine(MEET.first[3]), 260));
        }

        // A lunge by the second; the first parries, blade upright, giving ground.
        await at(T.lunge);
        if (first) {
            await c.wait(110);
            await c.all(cut(86, 150, easeOut), arms(20, -14, 150, easeOut), to(mine(MEET.first[3], GAP + 14), 200, easeOut, { tilt: -way * 7 }));
            impact(MEET.first[3] - 8, 38, 0.8);
            await c.wait(380);
            await guard(240);
        } else {
            await c.all(c.feet({ [sword]: { x: way * 24, y: 0, pitch: -20 } }, 170, easeOut), cut(4, 170, easeOut), arms(38, -8, 170, easeOut), to(mine(MEET.first[3], GAP - 18), 170, easeOut, { tilt: way * 9, crouch: 9 }));
            await c.wait(400);
            await c.all(guard(260), to(mine(MEET.first[3]), 260));
        }

        // Four more, and now the second drives the first all the way back.
        for (const [i, when] of T.second.entries()) await clash(when, MEET.second[i], i % 2 === 1, !first);

        // The first holds out an open hand: the second is thrown across the stage, heels dragging.
        await at(T.push);
        if (first) {
            await c.all(arms(10, -4, 280, easeInOut, { x: way * 12, y: -20 }), cut(-30, 280), c.tween({ tilt: -way * 5, crouch: 8 }, 280));
            if (glow) c.animate(glow, { level: 1 }, 200).catch(() => {});
            await c.all(arms(8, -2, 120, easeOut, { x: way * 34, y: -19 }), c.tween({ tilt: way * 8, wide: 0.6, crouch: 4 }, 120, easeOut));
            if (fx) { effects.shockwave(fx, hand(free), { k, size: 60, life: 520, color: colour, width: 3 }); effects.wave(fx, () => hand(free), way > 0 ? 0 : Math.PI, { k, count: 6, reach: 150, life: 700, color: colour }); }
            await c.wait(1000);
            if (glow) c.animate(glow, { level: 0 }, 400).catch(() => {});
            await guard(320);
        } else {
            await c.wait(430);
            c.also({ wide: 1, stretch: 0.8 }, 110, easeOut);
            const slide = to(170, 900, easeOut, { tilt: -way * 24, crouch: 3 });
            await c.all(c.feet({ left: { x: way * 5, y: 0, pitch: -28 }, right: { x: way * 11, y: 0, pitch: -28 } }, 120, easeOut), cut(70, 160));
            for (let puff = 0; puff < 5; puff++) { dust(6); await c.wait(150); }
            await slide;
            await c.all(c.tween({ tilt: -way * 32, stretch: 1 }, 170));
            await c.all(c.tween({ tilt: way * 6, stretch: 0, wide: 0, crouch: 6 }, 280, easeInOut), stance(9, 280, easeInOut));
            await c.tween({ tilt: 0 }, 160);
        }

        // The second walks back, cross.
        await at(T.back);
        if (!first) { await c.all(cut(24, 300), arms(22, -6, 300)); await to(20, 1000, easeInOut, { crouch: 3 }); await guard(180); }

        // In turn: the second raises a hand, lightning runs to the first, who leaves the floor, legs dangling, until let drop.
        await at(T.lift);
        if (first) {
            await c.wait(400);
            c.also({ wide: 1 }, 160);
            await c.feet({ left: null, right: null }, 120);
            await c.all(c.tween({ y: ground - 78 * k, crouch: 0, tuck: 0.25 }, 700, easeOut), cut(-70, 500), arms(12, 8, 500, easeInOut, { x: -way * 26, y: -30 }));
            for (let wobble = 0; c.clock.now - start < T.drop - 420; wobble++) {
                await c.all(c.tween({ tilt: (wobble % 2 ? -1 : 1) * 10, y: ground - (78 + (wobble % 2 ? 6 : -5)) * k }, 330, easeInOut), arms(12, wobble % 2 ? 2 : 10, 330, easeInOut, { x: -way * 26, y: wobble % 2 ? -36 : -24 }));
            }
            await at(T.drop);
            await c.all(c.tween({ y: ground, tilt: 0, tuck: 0 }, 280, easeIn), cut(30, 280));
            dust(16);
            if (fx) effects.shockwave(fx, page(here()), { k, size: 44, flat: 0.25, life: 460 });
            await c.tween({ squash: 0.6, crouch: 13, wide: 0 }, 110, easeOut);
            await c.all(c.tween({ squash: 0 }, 380, easeOut), guard(380));
        } else {
            await c.all(arms(10, -2, 300, easeInOut, { x: way * 24, y: -34 }), cut(-25, 300), c.tween({ gazeY: -0.6 }, 300));
            if (glow) c.animate(glow, { level: 1 }, 300).catch(() => {});
            // The lightning ends where the first is: on the floor both share, at its height.
            const lifted = { up: 20 };
            c.animate(lifted, { up: 100 }, 1000, easeOut).catch(() => {});
            if (fx) effects.bolt(fx, () => hand(free), () => page(mine(MEET.second[3]) - GAP * 2, lifted.up), { k, life: T.drop - T.lift - 500, color: colour, width: 2.4, forks: 1 });
            for (let tremble = 0; c.clock.now - start < T.drop - 120; tremble++) await c.hands({ [free]: { x: way * 24, y: tremble % 2 ? -44 : -40 } }, 240, easeInOut);
            await at(T.drop);
            if (glow) c.animate(glow, { level: 0 }, 400).catch(() => {});
            await c.all(guard(260), c.tween({ gazeY: 0 }, 260));
        }

        // The first makes a chair appear, lifts it with an open hand and hurls it: the second cuts it in the air.
        await at(T.chair);
        if (first) {
            await c.all(arms(10, -2, 280, easeInOut, { x: way * 26, y: -12 }), cut(-28, 280), c.tween({ gazeX: way * 0.5, gazeY: 0.3 }, 280));
            const thrown = hurl(chair, { rise: 52, far: 4, low: 34, spin: 720, flight: 520, sliced: true });
            await c.wait(460);
            await c.hands({ [free]: { x: way * 28, y: -38 } }, 520, easeOut);
            await c.wait(320);
            await c.all(c.hands({ [free]: { x: way * 36, y: -20 } }, 140, easeOut), c.tween({ tilt: way * 9 }, 140, easeOut));
            if (fx) effects.wave(fx, () => hand(free), way > 0 ? 0 : Math.PI, { k, count: 3, reach: 90, color: colour });
            await thrown;
            await c.all(guard(300), c.tween({ gazeX: way * 0.8, gazeY: 0 }, 300));
        } else {
            await c.wait(1000);
            c.also({ wide: 0.8 }, 140);
            await c.all(cut(84, 460), arms(16, -30, 460), c.tween({ tilt: -way * 6 }, 460));
            // (280 to turn to it, 1300 to appear and rise, 520 in the air: it arrives 2100 after the first began.)
            await at(T.chair + 2030);
            await c.all(cut(-36, 100, easeIn), arms(34, -2, 100, easeIn), c.tween({ tilt: way * 9, wide: 0 }, 100, easeIn));
            if (fx) { const point = page(here() + way * 18, 34); effects.flash(fx, point, { k, size: 34, color: '#ffffff', rays: 10 }); effects.shockwave(fx, point, { k, size: 40, color: colour }); effects.burst(fx, point, { k, count: 16, speed: 240, color: colour }); effects.burst(fx, point, { k, count: 10, speed: 160 }); }
            await c.wait(300);
            await guard(260);
        }

        // The second answers with a couch, low and fast, the length of the stage: the first somersaults over it, backwards.
        await at(T.couch);
        if (first) {
            await c.tween({ wide: 1 }, 200);
            // (It is thrown 1580 after the second began, and is under the first some 480 later: the first is then at the top of its leap.)
            await at(T.couch + 1640);
            c.also({ wide: 0 }, 300);
            await somersault(-way * 360, 84, 780);
            await guard(200);
        } else {
            await c.all(arms(10, -2, 280, easeInOut, { x: way * 26, y: -12 }), cut(-28, 280), c.tween({ gazeY: 0.3 }, 280));
            const thrown = hurl(couch, { rise: 44, far: -360, low: 3, spin: 0, flight: 1100 });
            await c.wait(460);
            await c.hands({ [free]: { x: way * 28, y: -40 } }, 520, easeOut);
            await c.wait(320);
            await c.all(c.hands({ [free]: { x: way * 38, y: -16 } }, 140, easeOut), c.tween({ tilt: way * 10 }, 140, easeOut));
            if (fx) effects.wave(fx, () => hand(free), way > 0 ? 0 : Math.PI, { k, count: 5, reach: 130, life: 650, color: colour });
            await thrown;
            await c.all(guard(300), c.tween({ gazeY: 0 }, 300));
        }

        // Not to be outdone, the second turns a somersault of its own, backwards and away.
        await at(T.flip);
        if (!first) { await somersault(-way * 360, 70, 700, 120); await guard(200); }
        else { await c.tween({ gazeY: -0.5 }, 300); await c.wait(600); await c.tween({ gazeY: 0 }, 300); }

        // From the two ends of the stage they charge, lock blades and push, each in turn, sparks all the while.
        await at(T.charge);
        dust(10);
        await c.all(to(mine(0, 34), 560, easeIn, { tilt: way * 13, crouch: 8 }), cut(40, 560), arms(30, -24, 560));
        impact(0, 46, 1.6);
        if (glow) c.animate(glow, { level: 1 }, 300).catch(() => {});
        for (let heave = 0; c.clock.now - start < T.out - 320; heave++) {
            // (Both move the same way on the floor: who pushes steps forward, the other is pushed back.)
            await to(mine(heave % 2 ? -14 : 14, 34), 300, easeInOut, { tilt: way * (heave % 2 === (first ? 1 : 0) ? 13 : 5) });
            impact(heave % 2 ? -14 : 14, 46, 0.5);
        }

        // Both blades go out. A look at the hilt, a shake of it, a look at the other, a shrug.
        await at(T.out);
        if (glow) c.animate(glow, { level: 0 }, 200).catch(() => {});
        await c.animate(blade.state, { draw: 0.25 }, 90); await c.animate(blade.state, { draw: 0.85 }, 120); await c.animate(blade.state, { draw: 0 }, 180);
        await c.all(to(mine(0, 44), 320, easeOut, { tilt: 0, crouch: 0 }), stance(3, 300));
        await at(T.look);
        await c.all(arms(14, -24, 260), cut(60, 260), c.tween({ gazeX: way * 0.3, gazeY: 0.5, squint: 0.6 }, 260));
        for (let shake = 0; shake < 4; shake++) { await c.hands({ [sword]: { x: way * 14, y: -28 } }, 90, easeOut); await c.hands({ [sword]: { x: way * 14, y: -21 } }, 90, easeIn); }
        await c.tween({ gazeX: way * 0.9, gazeY: 0, squint: 0 }, 220);
        await at(T.shrug);
        await c.all(c.hands({ [sword]: { x: way * 26, y: -14 }, [free]: { x: -way * 26, y: -14 } }, 260, easeOut), c.tween({ crouch: -2, wide: 0.5 }, 260, easeOut));
        await c.wait(480);
        await c.all(c.hands({ left: null, right: null }, 280), c.tween({ crouch: 0, wide: 0, gazeX: 0 }, 280), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 280));
        await c.feet({ left: null, right: null }, 1);
        await at(T.end);
    },
};
