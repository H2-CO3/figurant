// Made for the stick figure: a duel with swords of light, for two. Both play
// this same animation, started at the same instant, each with its part
// (`data.part`: 'first' or 'second') and the colour of its blade
// (`data.colour`). The parts answer each other because both follow one
// clock: every moment below is counted from the start.
//
//   the blades light up, on guard
//   three clashes: high, low, high, sparks flying
//   a low sweep, somersaulted over; a lunge, parried
//   the first throws the second back from afar, an open hand held out
//   the second, in turn, lifts the first off the floor and lets it drop
//   the first makes a chair appear and hurls it: the second cuts it in the air
//   the second answers with a couch: the first somersaults over it
//   a somersault by the second too, for show
//   they charge, lock blades and push, until both blades go out
//   a look at the dead hilts, a shrug
//
// It plays towards the side the figure faces (`dir`).

import { easing, moves, props } from 'figurant';

const { easeOut, easeIn, easeInOut, linear } = easing;
const { chair, couch } = props;

/** When each moment starts, in ms from the start, for both parts. */
const T = { guard: 500, clash: [1500, 2150, 2800], sweep: 3600, lunge: 4700, push: 6000, back: 7700, lift: 8900, drop: 11400, chair: 12800, couch: 14900, flip: 17500, charge: 18800, lock: 19300, out: 21500, look: 22100, shrug: 23200, end: 24300 };

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
    room: { left: 130, right: 130, up: 180 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, way = s.dir || 1, home = s.x, ground = s.y;
        const first = (ctx?.data?.part ?? 'first') === 'first';
        const colour = ctx?.data?.colour ?? (first ? '#2f7df6' : '#e5383b');
        const fx = ctx?.api?.fx ?? null;
        const sword = way > 0 ? 'right' : 'left', free = way > 0 ? 'left' : 'right';
        const start = c.clock.now;
        /** Waits for a moment of the duel: this is what keeps the two parts together. */
        const at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { s.y = ground; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // The blade: `swing.up` is its angle above the horizontal, pointing the way the figure faces.
        const swing = { up: 8 };
        const blade = c.give(sword, lightSword(colour), { tilt: () => (way > 0 ? -swing.up : 180 + swing.up), state: { draw: 0 } });
        const cut = (up, ms, ease = easeInOut) => c.animate(swing, { up }, ms, ease);
        /** The sword hand `reach` in front and `lift` high (negative: up); the other hand behind, or where it is told. */
        const arms = (reach, lift, ms, ease = easeInOut, other = { x: -way * 20, y: -22 }) => c.hands({ [sword]: { x: way * reach, y: lift }, [free]: other }, ms, ease);
        const stance = (front, ms, ease = easeOut) => c.feet({ [sword]: { x: way * front, y: 0 }, [free]: { x: -way * 7, y: 0 } }, ms, ease);
        const to = (x, ms, ease = easeInOut, more = {}) => c.tween({ x: home + way * x * k, ...more }, ms, ease);
        /** Where the tip of the blade is on the page. */
        const tip = () => {
            const hand = c.figure.points[sword === 'right' ? 'armR' : 'armL']?.tip ?? c.figure.points.centre;
            const angle = (way > 0 ? -swing.up : 180 + swing.up) * Math.PI / 180;
            return [hand[0] + Math.cos(angle) * 40 * k, hand[1] + Math.sin(angle) * 40 * k];
        };
        /** Sparks where the blades meet. */
        const sparks = (n = 9) => {
            if (!fx) return;
            const [x, y] = tip(), system = fx.particles({ color: colour, width: 2 });
            for (let i = 0; i < n; i++) { const a = fx.random() * Math.PI * 2, v = 90 + fx.random() * 160; system.emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, ay: 380, life: 0.28 + fx.random() * 0.25, trail: 0.05 }); }
            system.close();
        };
        /** Rings leaving an open hand, towards (dx, dy): what is done from afar is seen. */
        const waves = (dx, dy, ms) => {
            if (!fx) return;
            const from = c.figure.points[free === 'right' ? 'armR' : 'armL']?.tip ?? c.figure.points.centre, turn = Math.atan2(dy, dx) * 180 / Math.PI;
            for (let ring = 0; ring < 4; ring++) c.clock.wait(ring * ms / 5).then(() => {
                if (!c.alive) return;
                fx.shape({ life: ms / 2, attrs: { stroke: colour, 'stroke-width': 2.2 }, update(el, p) {
                    const far = (10 + p * 70) * k, wide = (7 + p * 16) * k;
                    el.setAttribute('d', `M ${-wide * 0.35} ${-wide} Q ${wide * 0.5} 0 ${-wide * 0.35} ${wide}`);
                    el.setAttribute('transform', `translate(${from[0] + Math.cos(turn * Math.PI / 180) * far} ${from[1] + Math.sin(turn * Math.PI / 180) * far}) rotate(${turn})`);
                    el.setAttribute('opacity', String(0.9 * (1 - p)));
                } });
            });
        };

        /** A somersault on the spot: `turn` degrees round (negative: backwards), `height` units up. */
        const somersault = async (turn, height = 62, ms = 660) => {
            await c.feet({ left: null, right: null }, 1);
            await c.tween({ crouch: 8, squash: 0.4 }, 150, easeInOut);
            c.also({ crouch: 0, squash: -0.3, tuck: 1 }, 100, easeOut);
            const spin = c.tween({ tilt: turn }, ms, linear);
            await c.tween({ y: ground - height * k }, ms / 2, easeOut);
            c.also({ tuck: 0 }, 200, easeIn);
            await c.tween({ y: ground }, ms / 2, easeIn);
            await spin;
            s.tilt = 0;
            c.also({ squash: 0 }, 180);
            await moves.land(c, 8);
            await c.all(c.tween({ crouch: 5 }, 160), stance(9, 160));
        };
        /**
         * A piece of furniture made to appear beside the figure, raised without a touch, and hurled at the other:
         * it draws itself in, lifts, flies `far` units spinning, and is gone when it gets there (cut, or out of sight).
         */
        const hurl = async (thing, { rise, far, low = rise, spin, flight, cut: sliced }) => {
            const flying = c.prop(thing, { x: way * 34, y: 0, state: { draw: 0, flip: way } });
            await c.animate(flying.state, { draw: 1 }, 420, easeOut);
            await c.animate(flying.state, { y: -rise * k, tilt: way * 12 }, 480, easeOut);
            await c.animate(flying.state, { y: -(rise + 5) * k, tilt: -way * 8 }, 300, easeInOut);
            await c.animate(flying.state, { x: way * far * k, y: -low * k, tilt: way * spin }, flight, sliced ? easeIn : linear);
            await c.animate(flying.state, { draw: 0 }, sliced ? 90 : 200);
        };

        // The blades light up; on guard.
        await c.all(c.animate(blade.state, { draw: 1 }, 420, easeOut), arms(22, -6, 420), c.tween({ crouch: 5, gazeX: way * 0.8 }, 420, easeOut), stance(9, 420));
        await at(T.guard + 500);

        // Three clashes: high, low, high. Each is wound up, struck, and sprung back from.
        for (const [i, when] of T.clash.entries()) {
            const high = i !== 1;
            await at(when - 260);
            await c.all(cut(high ? 78 : -40, 200), arms(14, high ? -30 : -2, 200), to(-3, 200, easeInOut, { tilt: -way * 5 }));
            await at(when);
            await c.all(cut(high ? 34 : -12, 90, easeIn), arms(32, high ? -24 : -6, 90, easeIn), to(7, 90, easeIn, { tilt: way * 7 }));
            sparks(10);
            await c.wait(150);
            await c.all(cut(12, 200), arms(22, -8, 200), to(0, 200, easeOut, { tilt: 0 }));
        }

        // A low sweep by the second; the first jumps over it.
        await at(T.sweep);
        if (first) { await c.wait(60); await somersault(way * 360, 54, 600); await c.all(arms(22, -6, 160), cut(12, 160)); }
        else {
            await c.all(cut(-38, 140), arms(16, 6, 140), c.tween({ crouch: 12 }, 140));
            await c.all(cut(-18, 220, easeOut), arms(38, 10, 220, easeOut), to(10, 220, easeOut));
            await c.wait(180);
            await c.all(cut(10, 240), arms(22, -6, 240), to(0, 240), c.tween({ crouch: 5 }, 240));
        }

        // A lunge by the second; the first parries, blade upright, giving ground.
        await at(T.lunge);
        if (first) {
            await c.wait(120);
            await c.all(cut(84, 150, easeOut), arms(20, -14, 150, easeOut), to(-10, 220, easeOut, { tilt: -way * 6 }));
            sparks(7);
            await c.wait(420);
            await c.all(cut(12, 240), arms(22, -6, 240), to(-4, 240, easeInOut, { tilt: 0 }));
        } else {
            await c.all(c.feet({ [sword]: { x: way * 24, y: 0, pitch: -20 } }, 170, easeOut), cut(4, 170, easeOut), arms(38, -8, 170, easeOut), to(18, 170, easeOut, { tilt: way * 9, crouch: 9 }));
            await c.wait(420);
            await c.all(stance(9, 260, easeInOut), arms(22, -6, 260), to(4, 260, easeInOut, { tilt: 0, crouch: 5 }));
        }

        // The first holds out an open hand: the second is thrown back, heels dragging.
        await at(T.push);
        if (first) {
            await c.all(arms(10, -4, 260, easeInOut, { x: way * 12, y: -20 }), cut(-30, 260), c.tween({ tilt: -way * 4 }, 260));
            await c.all(arms(8, -2, 140, easeOut, { x: way * 33, y: -19 }), c.tween({ tilt: way * 7, wide: 0.6 }, 140, easeOut));
            waves(way, 0, 900);
            await c.wait(1000);
            await c.all(arms(22, -6, 300), cut(12, 300), c.tween({ tilt: 0, wide: 0 }, 300));
        } else {
            await c.wait(420);
            c.also({ wide: 1, stretch: 0.7 }, 120, easeOut);
            await c.all(c.feet({ left: { x: way * 5, y: 0, pitch: -28 }, right: { x: way * 11, y: 0, pitch: -28 } }, 120, easeOut), cut(70, 160), to(-46, 760, easeOut, { tilt: -way * 22, crouch: 3 }));
            await c.all(c.tween({ tilt: -way * 30 }, 160), c.tween({ stretch: 1 }, 160));
            await c.all(c.tween({ tilt: way * 6, stretch: 0, wide: 0, crouch: 6 }, 260, easeInOut), stance(9, 260, easeInOut));
            await c.tween({ tilt: 0 }, 160);
        }

        // The second comes back, cross.
        await at(T.back);
        if (!first) { await c.all(cut(20, 300), arms(22, -6, 300)); await to(-14, 760, easeInOut); }

        // In turn: the second raises a hand, and the first leaves the floor, legs dangling, until it is let drop.
        await at(T.lift);
        if (first) {
            await c.wait(380);
            c.also({ wide: 1 }, 160);
            await c.feet({ left: null, right: null }, 120);
            await c.all(c.tween({ y: ground - 44 * k, crouch: 0, tuck: 0.25 }, 620, easeOut), cut(-70, 500), arms(12, 8, 500, easeInOut, { x: -way * 26, y: -30 }));
            for (let wobble = 0; c.clock.now - start < T.drop - 420; wobble++) {
                await c.all(c.tween({ tilt: (wobble % 2 ? -1 : 1) * 9, y: ground - (44 + (wobble % 2 ? 4 : -3)) * k }, 330, easeInOut), arms(12, wobble % 2 ? 2 : 10, 330, easeInOut, { x: -way * 26, y: wobble % 2 ? -36 : -24 }));
            }
            await at(T.drop);
            await c.all(c.tween({ y: ground, tilt: 0, tuck: 0 }, 250, easeIn), cut(30, 250));
            await c.tween({ squash: 0.55, crouch: 12, wide: 0 }, 110, easeOut);
            await c.all(c.tween({ squash: 0, crouch: 5 }, 380, easeOut), stance(9, 380), arms(22, -6, 380), cut(12, 380));
        } else {
            await c.all(arms(10, -2, 300, easeInOut, { x: way * 24, y: -34 }), cut(-25, 300), c.tween({ gazeY: -0.6 }, 300));
            waves(way * 0.75, -0.66, 1300);
            for (let tremble = 0; c.clock.now - start < T.drop - 120; tremble++) {
                await c.hands({ [free]: { x: way * 24, y: tremble % 2 ? -44 : -40 } }, 240, easeInOut);
                if (tremble === 4) waves(way * 0.75, -0.66, 1100);
            }
            await at(T.drop);
            await c.all(arms(22, -6, 260, easeIn), cut(12, 260), c.tween({ gazeY: 0 }, 260));
        }

        // The first makes a chair appear, lifts it with an open hand and hurls it: the second cuts it in the air.
        await at(T.chair);
        if (first) {
            await c.all(arms(10, -2, 280, easeInOut, { x: way * 26, y: -12 }), cut(-28, 280), c.tween({ gazeX: way * 0.5, gazeY: 0.3 }, 280));
            const thrown = hurl(chair, { rise: 46, far: 112, low: 30, spin: 540, flight: 430, cut: true });
            await c.wait(420);
            await c.hands({ [free]: { x: way * 28, y: -36 } }, 480, easeOut);
            waves(0.4 * way, -0.9, 500);
            await c.wait(300);
            await c.all(c.hands({ [free]: { x: way * 34, y: -20 } }, 140, easeOut), c.tween({ tilt: way * 8 }, 140, easeOut));
            await thrown;
            await c.all(arms(22, -6, 300), cut(12, 300), c.tween({ tilt: 0, gazeX: way * 0.8, gazeY: 0 }, 300));
        } else {
            await c.wait(900);
            c.also({ wide: 0.8 }, 140);
            await c.all(cut(82, 420), arms(16, -30, 420), c.tween({ tilt: -way * 5 }, 420));
            await at(T.chair + 1560);
            await c.all(cut(-34, 110, easeIn), arms(34, -2, 110, easeIn), c.tween({ tilt: way * 8, wide: 0 }, 110, easeIn));
            sparks(14);
            await c.wait(260);
            await c.all(cut(12, 260), arms(22, -6, 260), c.tween({ tilt: 0 }, 260));
        }

        // The second answers with a couch, low and fast: the first somersaults over it.
        await at(T.couch);
        if (first) {
            await c.tween({ wide: 1 }, 200);
            await at(T.couch + 1340);
            c.also({ wide: 0 }, 300);
            await somersault(-way * 360, 74, 720);
            await c.all(arms(22, -6, 200), cut(12, 200));
        } else {
            await c.all(arms(10, -2, 280, easeInOut, { x: way * 26, y: -12 }), cut(-28, 280), c.tween({ gazeY: 0.3 }, 280));
            const thrown = hurl(couch, { rise: 40, far: 330, low: 2, spin: 0, flight: 900 });
            await c.wait(420);
            await c.hands({ [free]: { x: way * 28, y: -38 } }, 480, easeOut);
            waves(0.4 * way, -0.9, 500);
            await c.wait(300);
            await c.all(c.hands({ [free]: { x: way * 36, y: -16 } }, 140, easeOut), c.tween({ tilt: way * 9 }, 140, easeOut));
            await thrown;
            await c.all(arms(22, -6, 300), cut(12, 300), c.tween({ tilt: 0, gazeY: 0 }, 300));
        }

        // Not to be outdone, the second turns a somersault of its own, backwards.
        await at(T.flip);
        if (!first) { await somersault(-way * 360, 60, 640); await c.all(arms(22, -6, 200), cut(12, 200)); }
        else { await c.tween({ gazeY: -0.5 }, 300); await c.wait(500); await c.tween({ gazeY: 0 }, 300); }

        // They charge and lock blades, each pushing in turn, sparks all the while.
        await at(T.charge);
        const middle = first ? 16 : 30;
        await c.all(to(middle, 320, easeIn, { tilt: way * 8, crouch: 8 }), cut(40, 320), arms(30, -24, 320));
        sparks(12);
        const push = first ? way : -way;
        for (let heave = 0; c.clock.now - start < T.out - 300; heave++) {
            await c.tween({ x: home + (way * middle + push * (heave % 2 ? -5 : 5)) * k, tilt: way * (heave % 2 === (first ? 1 : 0) ? 12 : 5) }, 280, easeInOut);
            sparks(4);
        }

        // Both blades go out. A look at the hilt, a shake of it, a look at the other, a shrug.
        await at(T.out);
        await c.animate(blade.state, { draw: 0.25 }, 90); await c.animate(blade.state, { draw: 0.85 }, 120); await c.animate(blade.state, { draw: 0 }, 180);
        await c.all(to(middle - 8, 300, easeOut, { tilt: 0, crouch: 0 }), stance(3, 300));
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
