// Made for her: a curtsey, cheeks full; and she stands.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const curtseyHer = {
    character: 'paper-dancer-her',
    room: { left: 40, right: 40, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        await c.all(c.tween({ crouch: 7, tilt: -5, blush: 1, gazeY: 0.4 }, 420, easeInOut), c.hands({ left: { x: -17, y: 10 }, right: { x: 17, y: 10 } }, 420, easeInOut));
        await c.wait(520);
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0, gazeX: s.dir }, 420, easeInOut), c.hands({ left: null, right: null }, 420));
        await c.wait(900);
        await c.tween({ blush: 0 }, 300);
    },
};
