// Seeded pseudo-random numbers (mulberry32). Engine code never calls
// Math.random: with a seed, an effect plays out the same way every time, so a
// frame captured at a given instant is reproducible and can be tested.

/** @returns {() => number} a generator of numbers in [0, 1) */
export function createRandom(seed = 1) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
