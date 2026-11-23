// Two-bone inverse kinematics: place a knee or an elbow so that a limb made of
// two segments goes from its root to a target.

/**
 * @param {[number, number]} root   where the limb is attached (hip, shoulder)
 * @param {[number, number]} target where its end should be (foot, hand)
 * @param {number} l1   length of the first segment (thigh, upper arm)
 * @param {number} l2   length of the second segment (shin, forearm)
 * @param {number} bend which side the joint folds to: -1..1, sign picks the side
 * @returns {{ joint: [number, number], end: [number, number], reached: boolean }}
 *          `end` equals `target` when it is within reach; otherwise the limb is
 *          stretched towards it and `reached` is false.
 */
export function solveTwoBone(root, target, l1, l2, bend) {
    let dx = target[0] - root[0], dy = target[1] - root[1];
    let d = Math.hypot(dx, dy);
    if (d < 1e-6) { dx = 0; dy = 1; d = 1e-6; }

    const max = (l1 + l2) * 0.999;
    const min = Math.abs(l1 - l2) * 1.001 + 1e-6;
    const wanted = d;
    const reach = Math.min(max, Math.max(min, d));
    dx *= reach / d; dy *= reach / d; d = reach;

    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return {
        joint: [root[0] + (a * dx + bend * h * dy) / d, root[1] + (a * dy - bend * h * dx) / d],
        end: [root[0] + dx, root[1] + dy],
        reached: Math.abs(wanted - d) < 1e-3,
    };
}
