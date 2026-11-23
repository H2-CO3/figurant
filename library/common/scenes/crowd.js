// Five animations for a crowd, playable by any body that has arms: picketing
// with a placard, shaking hands, slapping hands in the air, cheering, hauling on a rope. They are what scenes with several
// characters are made of (see ../compositions).

import { easing, moves } from 'figurant';
import { placard } from '../props/placard.js';

const { easeOut, easeIn, easeInOut, easeOutBack } = easing;

/** It holds a placard up and bounces with it, for as long as it is left to. `data.text`: the word on the board. */
export const picket = {
    room: { left: 50, right: 50, up: 170 },
    async play(c, ctx) {
        const sign = c.give('right', placard(ctx?.data?.text ?? '!'), { state: { draw: 0 } });
        await c.all(c.hands({ right: { x: 30, y: -34, angle: 170 } }, 300, easeOut), c.animate(sign.state, { draw: 1 }, 360));
        for (let beat = 0; ; beat++) {
            c.hands({ right: { x: 30, y: -44, angle: 170 } }, 180, easeOut).catch(() => {});
            await c.tween({ crouch: 0, tilt: beat % 2 ? 4 : -4 }, 180, easeOut);
            c.hands({ right: { x: 30, y: -34, angle: 170 } }, 240, easeIn).catch(() => {});
            await c.tween({ crouch: 5 }, 240, easeIn);
            if (beat % 4 === 3) await moves.blink(c);
        }
    },
};

/**
 * It holds a hand out in front of it and shakes: two of them, face to face, shake hands.
 * Bodies differ, so a scene says where each one's hand goes for the two to meet:
 * `data.reach` (how far in front of its middle) and `data.height` (y from its
 * origin, down positive), in character units.
 */
export const shakeHands = {
    room: { left: 60, right: 60, up: 110 },
    async play(c, ctx) {
        const dir = c.state.dir || 1, hand = dir > 0 ? 'right' : 'left';
        const x = dir * (ctx?.data?.reach ?? 40), y = ctx?.data?.height ?? -4;
        c.also({ gazeX: dir, tilt: dir * 4 }, 300);
        await c.hands({ [hand]: { x, y, angle: dir * 90 } }, 420, easeInOut);
        for (let i = 0; i < 4; i++) {
            await c.hands({ [hand]: { x, y: y - 6, angle: dir * 90 } }, 150, easeOut);
            await c.hands({ [hand]: { x, y: y + 4, angle: dir * 90 } }, 150, easeIn);
        }
        await moves.blink(c);
        await c.all(c.hands({ [hand]: null }, 300), c.tween({ tilt: 0, gazeX: 0 }, 300));
    },
};

/**
 * It jumps and slaps a hand held high: two of them, face to face and jumping together, slap hands in
 * the air, the way a team does. Bodies differ, so a scene says where each one's hand goes for the two
 * to meet: `data.reach` (how far in front of its middle) and `data.height` (y from its origin, up
 * negative), in character units; `data.jump`: how high it leaves the floor.
 */
export const highFive = {
    room: { left: 60, right: 60, up: 170 },
    async play(c, ctx) {
        const s = c.state, dir = s.dir || 1, hand = dir > 0 ? 'right' : 'left', other = dir > 0 ? 'left' : 'right', ground = s.y;
        const x = dir * (ctx?.data?.reach ?? 30), y = ctx?.data?.height ?? -52, up = (ctx?.data?.jump ?? 34) * c.figure.k;
        c.onLeave(() => { s.y = ground; c.hands({ left: null, right: null }, 1).catch(() => {}); });
        // The wind-up: down on its legs, the arm drawn back.
        c.also({ gazeX: dir, wide: 0.5 }, 200);
        await c.all(c.tween({ crouch: 9, squash: 0.3, tilt: -dir * 5 }, 260, easeInOut), c.hands({ [hand]: { x: -dir * 12, y: -8, angle: dir * 60 }, [other]: { x: -dir * 14, y: 6 } }, 260, easeInOut));
        // Up, and the slap at the top.
        c.also({ crouch: 0, squash: -0.25, tilt: dir * 6 }, 120, easeOut);
        await c.all(c.tween({ y: ground - up }, 260, easeOut), c.hands({ [hand]: { x, y, angle: dir * -70 } }, 250, easeIn));
        const fx = ctx?.api?.fx;
        if (fx) { const [px, py] = c.figure.points[hand === 'right' ? 'armR' : 'armL'].tip; const stars = fx.particles({ width: 1.8 }); for (let i = 0; i < 6; i++) { const a = fx.range(0, Math.PI * 2), v = fx.range(60, 150) * c.figure.k; stars.emit({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3, trail: 0.05, drag: 3 }); } stars.close(); }
        await c.wait(70);
        // Down, and a bounce of pleasure.
        await c.all(c.tween({ y: ground }, 240, easeIn), c.hands({ [hand]: { x: dir * 16, y: -20 } }, 240));
        await c.tween({ squash: 0.35, crouch: 6, tilt: 0 }, 100, easeOut);
        await c.all(c.tween({ squash: 0, crouch: 0, wide: 0 }, 260, easeOutBack), c.hands({ left: null, right: null }, 260));
        await moves.blink(c);
    },
};

/** It jumps for joy, twice, arms up. */
export const cheer = {
    room: { left: 40, right: 40, up: 150 },
    async play(c) {
        for (let i = 0; i < 2; i++) {
            c.also({ wide: 0.6, stretch: 1 }, 120, easeOut);
            await moves.hop(c, 26);
            c.also({ wide: 0, stretch: 0 }, 300, easeOutBack);
            await c.wait(140);
        }
        await c.tween({ wave: 1 }, 200);
        await c.wait(700);
        await c.tween({ wave: 0 }, 200);
    },
};

/**
 * It hauls on a rope, like someone who means it: both hands on the rope in front of it, leaning far
 * back, heels dug in, heaving in time with its team and sweating for it. It walks to where the scene
 * says and goes on heaving there.
 * `data.to`: where to, in character units from where it stands (negative: to the left);
 * `data.lean`: how far it leans, in degrees (negative: to the left); `data.pace`;
 * `data.beat`: how long one heave lasts, in ms (a whole team gives the same one).
 */
export const haul = {
    room: { left: 80, right: 80, up: 100 },
    async play(c, ctx) {
        const s = c.state, way = s.dir || 1, lean = ctx?.data?.lean ?? -way * 24, beat = ctx?.data?.beat ?? 520, fx = ctx?.api?.fx ?? null;
        const front = way > 0 ? 'right' : 'left', back = way > 0 ? 'left' : 'right';
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        /** Both hands on the rope, one before the other, at the height of the belt. */
        const grip = (pull, ms) => c.hands({ [front]: { x: way * (22 - pull), y: 2 }, [back]: { x: way * (10 - pull), y: 3 } }, ms, easeInOut);
        const sweat = () => { if (!fx || fx.random() > 0.5) return; const [x, y] = c.figure.points.top; const drops = fx.particles({ width: 1.6 }); for (let i = 0; i < 3; i++) drops.emit({ x: x - way * 6 * c.figure.k, y, vx: -way * fx.range(30, 90) * c.figure.k, vy: -fx.range(40, 110) * c.figure.k, ay: 420 * c.figure.k, life: 0.5, trail: 0.03 }); drops.close(); };
        await c.all(grip(0, 200), c.tween({ tilt: lean, crouch: 7, squint: 0.7 }, 200, easeOut));
        const walk = moves.walkTo(c, s.x + (ctx?.data?.to ?? 0) * c.figure.k, ctx?.data?.pace ?? 0.5);
        // (The heaves go on while it walks: the body is the walk's, the arms and the lean are the heave's.)
        const heave = async () => {
            await c.all(grip(9, beat * 0.4), c.tween({ tilt: lean * 1.45, crouch: 11 }, beat * 0.4, easeOut));
            sweat();
            await c.all(grip(0, beat * 0.6), c.tween({ tilt: lean, crouch: 7 }, beat * 0.6, easeInOut));
        };
        let arrived = false;
        walk.then(() => { arrived = true; }, () => { arrived = true; });
        while (!arrived) await c.all(grip(9, beat * 0.4).then(() => grip(0, beat * 0.6)), c.wait(beat));
        for (;;) await heave();
    },
};
