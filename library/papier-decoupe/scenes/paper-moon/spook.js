// The paper moon frightens. It waves, all sweetness. Then it goes out, cut by
// cut, until only its two eyes are left in the dark; it looks left, right...
// and BOO: red eyes, a row of teeth, claws up, its stars turned to bats, and
// it shakes. A long hold. Then it cannot keep it up: it is itself again, and
// laughs at its own joke.
//
// Stop-motion: poses held a few photographs each; the fright comes on a cut.

/** One photograph: a tenth of a second. */
const FRAME = 100;
const steps = n => p => Math.min(1, Math.ceil(p * n) / n);

export const spookPaperMoon = {
    character: 'paper-moon',
    room: { left: 90, right: 90, up: 150 },

    async play(c) {
        const s = c.state, usual = s.lit;
        c.onLeave(() => { s.lit = usual; s.spook = 0; s.twinkle = 0; });
        const pose = (to, n = 1) => c.tween(to, n * FRAME, steps(n));
        const hold = n => c.wait(n * FRAME);

        // All sweetness.
        await pose({ lid: 1, twinkle: 1 }, 1);
        await c.hands({ right: { x: 40, y: -30 } }, 2 * FRAME, steps(2));
        for (let i = 0; i < 2; i++) { await c.hands({ right: { x: 47, y: -34 } }, FRAME, steps(1)); await c.hands({ right: { x: 36, y: -32 } }, FRAME, steps(1)); }
        await c.all(c.hands({ right: null }, 2 * FRAME, steps(2)), pose({ twinkle: 0 }, 2));
        await hold(3);
        // It goes out.
        for (let lit = usual; lit > 0; lit -= 0.125) { s.lit = Math.max(0, lit - 0.125); await hold(2); }
        await hold(6);
        await pose({ gazeX: -1 }, 1); await hold(5); await pose({ gazeX: 1 }, 1); await hold(5); await pose({ gazeX: 0, crouch: 8 }, 1); await hold(4);
        // BOO.
        s.spook = 1;
        await c.all(pose({ crouch: 0, wide: 1 }, 1), c.hands({ left: { x: -42, y: -34 }, right: { x: 42, y: -34 } }, FRAME, steps(1)));
        for (let i = 0; i < 4; i++) { await pose({ tilt: 7 }, 1); await pose({ tilt: -7 }, 1); }
        await pose({ tilt: 0 }, 1);
        await hold(12);
        // It cannot keep it up.
        s.spook = 0; s.lit = usual;
        await c.all(pose({ wide: 0, squint: 1 }, 1), c.hands({ left: null, right: null }, 2 * FRAME, steps(2)));
        for (let i = 0; i < 4; i++) { await pose({ crouch: 4 }, 1); await pose({ crouch: 0 }, 1); }
        await pose({ squint: 0, lid: 0.8 }, 2);
        await hold(5);
    },
};
