// The customs officer at its post, its book under its arm: something is
// coming in from the sea. A hand over its eyes; a look lower (is that boat
// going down?); eyes wide; a blink. `data.for`: how long it watches.

import { easing, moves, props } from 'figurant';

const { easeInOut } = easing;
const { notebook } = props;

export const watchCustomsOfficer = {
    character: 'customs-officer',
    room: { left: 60, right: 60, up: 110 },

    async play(c, ctx) {
        const s = c.state, way = s.dir, end = c.clock.now + (ctx?.data?.for ?? 5000);
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.give('right', notebook, { tilt: way * 12, state: { draw: 1 } });
        await c.all(c.hands({ right: { x: -way * 12, y: 6, angle: 30 } }, 300), c.tween({ gazeX: way, gazeY: -0.1 }, 300));
        await c.all(c.hands({ left: { x: way * 9, y: -42, angle: way > 0 ? -100 : 280 } }, 420, easeInOut), c.tween({ tilt: way * 5 }, 420, easeInOut));
        await c.wait(1300);
        await c.tween({ gazeY: 0.5, wide: 0.8 }, 200);
        await c.wait(700);
        await moves.blink(c);
        await c.all(c.hands({ left: null }, 400), c.tween({ tilt: 0, wide: 0.3 }, 400, easeInOut));
        while (c.clock.now < end - 700) { await c.tween({ gazeY: 0.5 }, 300); await c.wait(500); await c.tween({ gazeY: 0 }, 300); await c.wait(400); }
        await c.tween({ wide: 0, gazeY: 0 }, 300);
    },
};
