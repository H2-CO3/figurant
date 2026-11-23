// Spring-mounted follower: it chases a target with a delay, overshoots, then
// comes back. Drives secondary motion: whatever trails behind a moving body
// (lashes, arms, ears, a tail).

/**
 * @param {object} [options]
 * @param {number} [options.stiffness] pull towards the target
 * @param {number} [options.damping]   how quickly the oscillation dies out
 * @param {number} [options.teleport]  jump distance beyond which the follower
 *                                     snaps to the target instead of chasing it
 */
export function createFollower({ stiffness = 260, damping = 17, teleport = 160 } = {}) {
    const f = { x: NaN, y: NaN, vx: 0, vy: 0 };

    /**
     * Advances the simulation by dt milliseconds towards (tx, ty).
     * @returns {[number, number]} the follower's offset from the target
     */
    f.step = (tx, ty, dt) => {
        // First call, or the target jumped: snap to it with no momentum.
        if (!(Math.hypot(tx - f.x, ty - f.y) < teleport)) {
            f.x = tx; f.y = ty; f.vx = f.vy = 0;
            return [0, 0];
        }
        const steps = 2, h = Math.min(dt, 34) / 1000 / steps;
        for (let i = 0; i < steps; i++) {
            f.vx += (stiffness * (tx - f.x) - damping * f.vx) * h;
            f.vy += (stiffness * (ty - f.y) - damping * f.vy) * h;
            f.x += f.vx * h;
            f.y += f.vy * h;
        }
        return [f.x - tx, f.y - ty];
    };

    return f;
}
