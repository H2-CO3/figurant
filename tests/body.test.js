import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveTwoBone } from '../src/body/ik.js';
import {
    DEFAULT_PROPORTIONS as BODY, createPose, cycleLength, seatHeight,
    footCycle, legPoints, armPoints, walkDrop, elbowBend,
} from '../src/body/body.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a, b, tolerance, message) =>
    assert.ok(Math.abs(a - b) <= tolerance, `${message}: expected ${b} ± ${tolerance}, got ${a}`);

test('IK keeps both segment lengths and lands on a reachable target', () => {
    const root = [10, 20], target = [35, 50];
    const { joint, end, reached } = solveTwoBone(root, target, 28, 30, 1);
    assert.equal(reached, true);
    near(dist(root, joint), 28, 1e-6, 'first segment');
    near(dist(joint, end), 30, 1e-6, 'second segment');
    near(dist(end, target), 0, 1e-6, 'end on target');
});

test('IK stretches towards a target that is out of reach, and says so', () => {
    const { joint, end, reached } = solveTwoBone([0, 0], [500, 0], 28, 30, 1);
    assert.equal(reached, false);
    near(dist([0, 0], end), 58, 0.1, 'fully stretched');
    near(dist([0, 0], joint), 28, 1e-6, 'first segment');
    assert.ok(end[0] > 0 && Math.abs(end[1]) < 1e-6, 'pointing at the target');
});

test('IK bend sign chooses the side the joint folds to', () => {
    const a = solveTwoBone([0, 0], [0, 40], 28, 30, 1).joint;
    const b = solveTwoBone([0, 0], [0, 40], 28, 30, -1).joint;
    assert.ok(a[0] * b[0] < 0, 'the two solutions are mirror images');
});

test('a planted foot does not slide while the character walks', () => {
    // The body advances; the walk phase follows the distance covered. While a
    // foot is planted, its position on the ground must not move.
    const pose = { ...createPose(), legs: 1, walk: 1, dir: 1 };
    const k = 1, groundY = 100;

    for (const side of [-1, 1]) {
        let plantedAt = null, checked = 0;
        for (let bodyX = 0; bodyX <= 3 * cycleLength(BODY); bodyX += 0.5) {
            pose.phase = (bodyX / cycleLength(BODY)) * Math.PI * 2;
            const hip = [bodyX, groundY - BODY.reach + walkDrop(BODY, pose)];
            const { foot } = legPoints(BODY, pose, side, hip, groundY, k);
            if (footCycle(BODY, pose.phase, side).planted) {
                if (plantedAt === null) plantedAt = foot[0];
                near(foot[0], plantedAt, 1e-6, `side ${side} at x=${bodyX}`);
                near(foot[1], groundY, 1e-6, 'planted foot is on the ground');
                checked++;
            } else {
                plantedAt = null;
                assert.ok(foot[1] <= groundY + 1e-6, 'a swinging foot never goes underground');
            }
        }
        assert.ok(checked > 100, 'the stance phase was actually exercised');
    }
});

test('the walk dips at the ends of a stride and stands tall in between', () => {
    const pose = { ...createPose(), legs: 1, walk: 1 };
    const at = phase => walkDrop(BODY, { ...pose, phase });
    assert.ok(at(0) > 1.5 && at(0) < 4, `a small dip at full stride, got ${at(0)}`);
    near(at(Math.PI / 2), 0, 1e-9, 'no dip when a foot is under the hip');
    assert.equal(walkDrop(BODY, { ...pose, walk: 0 }), 0, 'no dip when standing');
});

test('walking left mirrors walking right', () => {
    const base = { ...createPose(), legs: 1, walk: 1, phase: 1.1 };
    const right = legPoints(BODY, { ...base, dir: 1 }, 1, [0, 0], 53, 1);
    const left = legPoints(BODY, { ...base, dir: -1 }, 1, [0, 0], 53, 1);
    near(left.foot[0], -right.foot[0], 1e-6, 'foot');
    near(left.knee[0], -right.knee[0], 1e-6, 'knee');
});

test('a limb that has not grown is not drawn', () => {
    const pose = createPose();
    assert.equal(legPoints(BODY, pose, 1, [0, 0], 53, 1), null);
    assert.equal(armPoints(BODY, pose, 1, [0, 0], 1), null);
});

test('seated on a chair: thighs forward, shins down, feet on the ground', () => {
    const pose = { ...createPose(), legs: 1, seat: 1, dir: 1 };
    const groundY = 100, hip = [0, groundY - seatHeight(BODY)];
    for (const side of [-1, 1]) {
        const { knee, foot, toe } = legPoints(BODY, pose, side, hip, groundY, 1);
        near(foot[1], groundY, 1e-6, 'foot on the ground');
        assert.ok(knee[0] > hip[0] + BODY.thigh * 0.8, 'knee well in front of the hip');
        near(knee[1], hip[1], 8, 'thigh roughly level');
        assert.ok(toe[0] > foot[0], 'toes point forward');
    }
});

test('a hand reaches its target exactly, and the arm keeps its lengths', () => {
    const pose = { ...createPose(), arms: 1 };
    const shoulder = [80, 0];
    pose.handR = { x: 60, y: 30, weight: 1 };
    const { elbow, hand, reached } = armPoints(BODY, pose, 1, shoulder, 1);
    assert.equal(reached, true);
    near(dist(hand, [60, 30]), 0, 1e-6, 'hand on target');
    near(dist(shoulder, elbow), BODY.upper, 1e-6, 'upper arm');
    near(dist(elbow, hand), BODY.fore, 1e-6, 'forearm');
});

test('the elbow falls outwards and down, whichever way the hand goes', () => {
    const pose = { ...createPose(), arms: 1 };
    const cases = [
        // side, shoulder, hand target, what to expect of the elbow
        [-1, [-40, 0], [-20, 20], e => e[0] < -40, 'left hand to the chest: elbow out to the left'],
        [1, [40, 0], [20, 20], e => e[0] > 40, 'right hand to the chest: elbow out to the right'],
        [-1, [0, 0], [40, 0], e => e[1] > 0, 'left hand thrust forward: elbow below the arm'],
        [1, [0, 0], [40, 0], e => e[1] > 0, 'right hand thrust forward: elbow below the arm'],
        [1, [0, 0], [-40, 0], e => e[1] > 0, 'right hand across the body: elbow below the arm'],
        [1, [0, 0], [25, -35], e => e[0] > 12, 'right hand raised: elbow out, not across the face'],
    ];
    for (const [side, shoulder, target, expectation, label] of cases) {
        const key = side < 0 ? 'handL' : 'handR';
        const { elbow, hand } = armPoints(BODY, { ...pose, [key]: { x: target[0], y: target[1], weight: 1 } }, side, shoulder, 1);
        assert.ok(expectation(elbow), `${label}; elbow at ${elbow.map(n => n.toFixed(1))}`);
        near(dist(hand, target), 0, 1e-6, `${label}: hand on target`);
    }
});

test('the elbow never jumps from one side to the other between two close targets', () => {
    // Sweep the hand in a full circle around the shoulder: the bend must change
    // gradually, so the elbow cannot pop.
    for (const side of [-1, 1]) {
        let previous = null;
        for (let a = 0; a <= 360; a += 0.5) {
            const target = [30 * Math.cos(a * Math.PI / 180), 30 * Math.sin(a * Math.PI / 180)];
            const bend = elbowBend([0, 0], target, side);
            if (previous !== null) assert.ok(Math.abs(bend - previous) < 0.08, `side ${side}, jump at ${a}°`);
            previous = bend;
        }
    }
});

test('wherever the hand goes, the arm is never drawn longer than it is', () => {
    const pose = { ...createPose(), arms: 1 };
    for (let a = 0; a < 360; a += 3) {
        for (const r of [12, 30, 50]) {
            const target = { x: r * Math.cos(a * Math.PI / 180), y: r * Math.sin(a * Math.PI / 180), weight: 1 };
            const { shoulder, elbow, hand } = armPoints(BODY, { ...pose, handR: target }, 1, [0, 0], 1);
            assert.ok(dist(shoulder, elbow) <= BODY.upper + 1e-6, `upper arm too long at ${a}°, r=${r}`);
            assert.ok(dist(elbow, hand) <= BODY.fore + 1e-6, `forearm too long at ${a}°, r=${r}`);
            near(dist(hand, [target.x, target.y]), 0, 1e-6, `hand on target at ${a}°, r=${r}`);
        }
    }
});

test('a hand target out of reach is reported, not faked', () => {
    const pose = { ...createPose(), arms: 1 };
    pose.handL = { x: -900, y: 0, weight: 1 };
    const { hand, reached } = armPoints(BODY, pose, -1, [0, 0], 1);
    assert.equal(reached, false);
    assert.ok(dist([0, 0], hand) <= BODY.upper + BODY.fore);
});

test('with no hand target the arm hangs free, and weight blends smoothly', () => {
    const pose = { ...createPose(), arms: 1 };
    const free = armPoints(BODY, pose, 1, [0, 0], 1).hand;
    pose.handR = { x: 40, y: -10, weight: 0.5 };
    const half = armPoints(BODY, pose, 1, [0, 0], 1).hand;
    near(half[0], (free[0] + 40) / 2, 1e-6, 'halfway x');
    near(half[1], (free[1] - 10) / 2, 1e-6, 'halfway y');
});

test('a placed foot goes where it is told, toe pitched, and a free one is untouched', () => {
    const k = 1, groundY = 100, hip = [40, 100 - BODY.reach];
    const free = legPoints(BODY, { ...createPose(), legs: 1 }, 1, hip, groundY, k);

    const pose = { ...createPose(), legs: 1 };
    pose.footR = { x: 18, y: 12, pitch: 90, weight: 1 };
    const right = legPoints(BODY, pose, 1, hip, groundY, k);
    near(right.foot[0], hip[0] + 18, 1e-6, 'foot x, from under the hip');
    near(right.foot[1], groundY - 12, 1e-6, 'foot height above the ground');
    near(right.toe[0], right.foot[0], 1e-6, 'toe straight under the ankle');
    near(right.toe[1], right.foot[1] + BODY.foot, 1e-6, 'toe pointing down');

    const left = legPoints(BODY, pose, -1, [20, hip[1]], groundY, k);
    const leftFree = legPoints(BODY, { ...createPose(), legs: 1 }, -1, [20, hip[1]], groundY, k);
    assert.deepEqual(left, leftFree, 'the other foot stays where it was');
    assert.deepEqual(legPoints(BODY, { ...createPose(), legs: 1, footR: { x: 18, y: 12, pitch: 90, weight: 0 } }, 1, hip, groundY, k), free,
        'a target with no weight changes nothing');

    pose.footR.weight = 0.5;
    const half = legPoints(BODY, pose, 1, hip, groundY, k);
    near(half.foot[1], groundY - 6, 1e-6, 'half way up at half weight');
});

test('tucked legs fold under the body and turn with it; untucked they are untouched', () => {
    const k = 1, groundY = 100, hip = [40, 30];
    const standing = legPoints(BODY, { ...createPose(), legs: 1 }, 1, hip, groundY, k);
    assert.deepEqual(legPoints(BODY, { ...createPose(), legs: 1, tuck: 0, tilt: 180 }, 1, hip, groundY, k), standing,
        'no tuck: the leg hangs along the screen, whatever the tilt');

    const upright = legPoints(BODY, { ...createPose(), legs: 1, tuck: 1, tilt: 0 }, 1, hip, groundY, k);
    assert.ok(upright.foot[1] > hip[1], 'upright: the foot is under the hip');
    assert.ok(upright.foot[1] - hip[1] < (BODY.thigh + BODY.shin) * 0.8, 'and the leg is folded');
    assert.ok(upright.foot[1] < groundY - 10, 'off the ground');

    const over = legPoints(BODY, { ...createPose(), legs: 1, tuck: 1, tilt: 180 }, 1, hip, groundY, k);
    near(over.foot[0] - hip[0], -(upright.foot[0] - hip[0]), 1e-6, 'upside down: mirrored across');
    near(over.foot[1] - hip[1], -(upright.foot[1] - hip[1]), 1e-6, 'upside down: the foot is above the hip');
    near(over.toe[1] - over.foot[1], -(upright.toe[1] - upright.foot[1]), 1e-6, 'and the toe turned with it');
    near(over.toe[0] - over.foot[0], -(upright.toe[0] - upright.foot[0]), 1e-6, 'toe x turned too');
});
