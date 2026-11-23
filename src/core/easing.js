// Easing curves: p in [0, 1] -> value (may overshoot 1 for the "back" family).

export const linear = p => p;
export const easeIn = p => p * p * p;
export const easeOut = p => 1 - Math.pow(1 - p, 3);
export const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

const B = 1.70158;
export const easeOutBack = p => 1 + (B + 1) * Math.pow(p - 1, 3) + B * Math.pow(p - 1, 2);
export const easeInBack = p => (B + 1) * p * p * p - B * p * p;
export const easeInOutBack = p => {
    const c = B * 1.525;
    return p < 0.5
        ? (Math.pow(2 * p, 2) * ((c + 1) * 2 * p - c)) / 2
        : (Math.pow(2 * p - 2, 2) * ((c + 1) * (p * 2 - 2) + c) + 2) / 2;
};

/** Light elastic settle: overshoots the target, then oscillates into place. */
export const easeOutElastic = p => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    return 1 + Math.pow(2, -9 * p) * Math.sin((p * 9 - 0.75) * ((2 * Math.PI) / 3.2));
};

/**
 * Trapezoid speed profile: accelerate over a fraction r, cruise, brake over r.
 * Used for walks, so the character neither starts nor stops abruptly.
 */
export const ramp = (r = 0.18) => p => {
    const v = 1 / (1 - r);
    if (p < r) return (v * p * p) / (2 * r);
    if (p > 1 - r) { const q = 1 - p; return 1 - (v * q * q) / (2 * r); }
    return v * (p - r / 2);
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
