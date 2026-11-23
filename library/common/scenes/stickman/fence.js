// Made for the stick figure: a bout with a sword of light. On guard, two lunges, a
// step back, a salute. `data.colour` is the colour of the blade. Two of them facing each other, one starting a beat
// after the other, make a duel: each lunges while the other draws back.
// It plays towards the side the figure faces (`dir`).

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;

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

export const fenceStickman = {
    character: 'stickman',
    room: { left: 70, right: 70, up: 110 },

    async play(c, ctx) {
        const s = c.state, way = s.dir || 1, k = c.figure.k, home = s.x;
        const sword = way > 0 ? 'right' : 'left', free = way > 0 ? 'left' : 'right';
        c.onLeave(() => { c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        // The blade points the way the figure faces, a little up.
        const blade = c.give(sword, lightSword(ctx?.data?.colour ?? '#2f7df6'), { tilt: way > 0 ? -8 : 188, state: { draw: 0 } });
        /** The sword arm out in front at `reach`, the other up behind for balance. */
        const arms = (reach, lift, ms, ease = easeInOut) => c.hands({ [sword]: { x: way * reach, y: lift }, [free]: { x: -way * 20, y: -22 } }, ms, ease);

        // On guard: knees bent, front foot forward.
        await c.all(
            c.animate(blade.state, { draw: 1 }, 320),
            arms(22, -6, 320),
            c.tween({ crouch: 5, gazeX: way * 0.8 }, 320, easeOut),
            c.feet({ [sword]: { x: way * 9, y: 0 }, [free]: { x: -way * 7, y: 0 } }, 320, easeOut),
        );
        await c.wait(380);

        for (let bout = 0; bout < 2; bout++) {
            // The lunge: the front foot shoots out, the arm goes straight, the body follows.
            await c.all(
                c.feet({ [sword]: { x: way * 24, y: 0, pitch: -20 } }, 170, easeOut),
                arms(36, -8, 170, easeOut),
                c.tween({ x: home + way * 16 * k, tilt: way * 9, crouch: 9 }, 170, easeOut),
            );
            await c.wait(260);
            // Back on guard, then a step away while the other comes.
            await c.all(
                c.feet({ [sword]: { x: way * 9, y: 0 } }, 240, easeInOut),
                arms(20, -10, 240),
                c.tween({ x: home - way * 6 * k, tilt: -way * 4, crouch: 5 }, 240, easeInOut),
            );
            await c.wait(520);
            await c.tween({ x: home, tilt: 0 }, 220, easeInOut);
            await c.wait(260);
        }

        // The salute: upright, the blade raised before the face, then lowered.
        await c.all(c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 260, easeInOut), c.tween({ crouch: 0, gazeX: way * 0.4 }, 260), c.hands({ [sword]: { x: way * 8, y: -30 }, [free]: null }, 260, easeInOut));
        await c.wait(420);
        await c.hands({ [sword]: { x: way * 24, y: 2 } }, 240, easeIn);
        await c.animate(blade.state, { draw: 0 }, 220);
        await c.hands({ left: null, right: null }, 200);
        await c.feet({ left: null, right: null }, 1);
        await moves.blink(c);
    },
};
