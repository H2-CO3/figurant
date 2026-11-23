// The paper moon goes through its phases. It yawns, shuts its eyes and is cut
// down to nothing, one cut at a time (new moon: only the night paper is left,
// and its stars sink). Then it peeps, grows back cut by cut to a full moon,
// throws its arms open while its stars twinkle, and settles at its usual phase.
//
// Stop-motion: every change is a pose held for a few photographs. Nothing glides.

/** One photograph: a tenth of a second. */
const FRAME = 100;
const steps = n => p => Math.min(1, Math.ceil(p * n) / n);

export const phasesPaperMoon = {
    character: 'paper-moon',
    room: { left: 70, right: 70, up: 120 },

    async play(c) {
        const s = c.state, usual = s.lit;
        c.onLeave(() => { s.lit = usual; s.twinkle = 0; });
        const pose = (to, n = 1) => c.tween(to, n * FRAME, steps(n));
        const hold = n => c.wait(n * FRAME);

        // A yawn: mouth round, arms up, then eyes shut.
        await pose({ wide: 1 }, 1);
        await c.hands({ left: { x: -34, y: -36 }, right: { x: 34, y: -40 } }, 3 * FRAME, steps(3));
        await hold(5);
        await c.all(pose({ wide: 0, lid: 0 }, 2), c.hands({ left: null, right: null }, 3 * FRAME, steps(3)));
        await hold(3);
        // Cut down to a new moon, one cut every third of a second.
        for (let phase = usual; phase > 0; phase -= 0.125) { s.lit = Math.max(0, phase - 0.125); await pose({ crouch: 3 }, 1); await pose({ crouch: 0 }, 1); await hold(1); }
        await hold(7);
        // It peeps, and grows back to full.
        await pose({ lid: 0.4, gazeX: 1 }, 2); await hold(3);
        await pose({ lid: 1, gazeX: 0 }, 2);
        for (let phase = 0.125; phase <= 1.001; phase += 0.125) { s.lit = phase; await pose({ tilt: phase * 8 % 2 < 1 ? -3 : 3 }, 1); await hold(2); }
        // Full: arms open, the stars at their biggest.
        await c.all(pose({ tilt: 0, wide: 0.5, twinkle: 1 }, 2), c.hands({ left: { x: -44, y: -20 }, right: { x: 44, y: -20 } }, 3 * FRAME, steps(3)));
        await hold(4);
        await pose({ crouch: 5 }, 1); await pose({ crouch: 0 }, 1); await hold(8);
        // Back to its usual self.
        await c.all(pose({ wide: 0, twinkle: 0, lid: 0.8 }, 3), c.hands({ left: null, right: null }, 3 * FRAME, steps(3)));
        for (let phase = 1; phase > usual + 0.01; phase -= 0.125) { s.lit = Math.max(usual, phase - 0.125); await hold(3); }
        await hold(4);
    },
};
