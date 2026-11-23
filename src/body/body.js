// The generic body: two legs and two arms hung from attachment points that the
// head provides. Pure geometry, no DOM: every function here returns points, and
// the renderer draws them. That keeps the hard part (walking without sliding,
// sitting, reaching) testable without a browser.
//
// Units are "character units"; `k` converts them to stage units. The y axis
// points down, as in SVG.

import { lerp, clamp } from '../core/easing.js';
import { solveTwoBone } from './ik.js';

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

/** Default proportions. A character may override any of them. */
export const DEFAULT_PROPORTIONS = {
    thigh: 28, shin: 30,
    reach: 53,      // hip-to-ground distance when standing (legs slightly bent)
    foot: 9,
    stride: 28,     // half the distance a foot travels on the ground per step
    lift: 10,       // how high a foot rises while swinging forward
    upper: 27, fore: 27,
    hand: 7,        // length of the hand stroke drawn when a hand is placed
};

/** Distance covered by one full walk cycle (two steps), at scale 1. */
export const cycleLength = body => 4 * body.stride;

/** How far the hips drop to sit on an edge (hips at ground level), at scale 1. */
export const sitDrop = body => body.reach;

/** Hip height above the ground when sitting on a chair-like seat, at scale 1. */
export const seatHeight = body => body.shin;

/** A fresh pose. Scenes animate these numbers; the functions below read them. */
export function createPose() {
    return {
        legs: 0, arms: 0,   // how far the limbs have grown, 0..1
        walk: 0,            // 0 standing -> 1 walking
        phase: 0,           // walk cycle phase, in radians
        dir: 1,             // facing: 1 right, -1 left
        sit: 0,             // sitting on an edge, legs dangling, 0..1
        seat: 0,            // sitting on a chair, feet on the ground, 0..1
        stretch: 0,         // both arms raised, 0..1
        wave: 0,            // right arm waving, 0..1
        breath: 0,          // idle breathing amplitude, 0..1
        tuck: 0,            // in the air: legs folded under the body and turning with its tilt, 0..1
        clock: 0,           // ms, drives the small periodic motions
        // Hand targets. weight 0 = free arm, 1 = hand on target. x and y are
        // character units from the figure's origin, so a pose travels with the
        // body; with page: true they are page pixels, to reach something on the
        // page. angle is where the hand points, in degrees from straight down
        // (90 = right, 180 = up, -90 = left).
        handL: { x: 0, y: 0, weight: 0, angle: 0, page: false },
        handR: { x: 0, y: 0, weight: 0, angle: 0, page: false },
        // Foot targets, for steps a walk cannot make: a tap, a kick, a point.
        // weight 0 = the foot does what the walk or the seat says, 1 = on
        // target. x is character units from under the hip (positive to the
        // right), y the height above the ground. pitch tips the toe, in
        // degrees: 0 flat, 90 straight down (on the toe), negative up (on the
        // heel).
        footL: { x: 0, y: 0, weight: 0, pitch: 0 },
        footR: { x: 0, y: 0, weight: 0, pitch: 0 },
    };
}

/**
 * Where a foot is in its cycle.
 * @returns {{ step: number, lift: number, planted: boolean }} `step` is the
 *          foot's offset from the hip along the walking direction.
 */
export function footCycle(body, phase, side) {
    const p = (((phase + (side > 0 ? Math.PI : 0)) % TAU) + TAU) % TAU;
    if (p < Math.PI) {
        // Stance: the foot stays on the ground while the body passes over it.
        return { step: body.stride * (1 - (2 * p) / Math.PI), lift: 0, planted: true };
    }
    // Swing: the foot lifts and travels forward.
    const u = (p - Math.PI) / Math.PI;
    return {
        step: body.stride * -Math.cos(Math.PI * u),
        lift: body.lift * Math.sin(Math.PI * u),
        planted: false,
    };
}

/**
 * How far the hips must drop, at scale 1, for the planted foot to stay on the
 * ground. A leg is longest when the foot is under the hip and too short at the
 * ends of a stride, so the body dips there: that dip is the walk's natural bob,
 * derived from the leg's length rather than added for show.
 */
export function walkDrop(body, pose) {
    const leg = (body.thigh + body.shin) * 0.995;
    let drop = 0;
    for (const side of [-1, 1]) {
        const cycle = footCycle(body, pose.phase, side);
        // A swinging foot is lifted by less than it needs near its ends, so it
        // constrains the hips too.
        const height = Math.sqrt(Math.max(0, leg * leg - cycle.step * cycle.step)) + cycle.lift;
        drop = Math.max(drop, body.reach - height);
    }
    return drop * pose.walk * pose.legs;
}

/**
 * @param {object} body    proportions
 * @param {object} pose    see createPose()
 * @param {number} side    -1 left, 1 right
 * @param {[number, number]} hip  attachment point, in stage units
 * @param {number} groundY ordinate of the ground under the character
 * @param {number} k       scale
 * @returns {null | { hip, knee, foot, toe }} null while the leg has not grown
 */
export function legPoints(body, pose, side, hip, groundY, k) {
    const g = pose.legs * k;
    if (g < 0.03) return null;

    const cycle = footCycle(body, pose.phase, side);
    let fx = hip[0] + lerp(side * 5, cycle.step * pose.dir, pose.walk) * g;
    let fy = groundY - cycle.lift * pose.walk * g;

    if (pose.sit > 0.001) {
        // On an edge: the legs hang in front of it and swing gently.
        const swing = Math.sin(pose.clock * 0.0036 + (side > 0 ? 0 : 2.2));
        fx = lerp(fx, hip[0] + (side * 10 + 6 * swing) * g, pose.sit);
        fy = lerp(fy, hip[1] + (body.thigh + body.shin) * 0.88 * g - Math.abs(swing) * 3 * g, pose.sit);
    }
    if (pose.seat > 0.001) {
        // On a chair: thighs forward, feet flat on the ground, slightly apart.
        fx = lerp(fx, hip[0] + (pose.dir * body.thigh * 0.96 + side * 4) * g, pose.seat);
        fy = lerp(fy, groundY, pose.seat);
    }

    const placed = side < 0 ? pose.footL : pose.footR;
    const weight = placed ? placed.weight : 0;
    if (weight > 0.001) {
        fx = lerp(fx, hip[0] + placed.x * g, weight);
        fy = lerp(fy, groundY - placed.y * g, weight);
    }

    // In the air: the legs fold under the body and belong to it, so they turn
    // with its tilt instead of hanging along the screen.
    const tuck = clamp(pose.tuck || 0, 0, 1);
    const turn = (pose.tilt || 0) * RAD, cos = Math.cos(turn), sin = Math.sin(turn);
    if (tuck > 0.001) {
        const lx = (side * 3 + pose.dir * 4) * g, ly = (body.thigh + body.shin) * 0.55 * g;
        fx = lerp(fx, hip[0] + lx * cos - ly * sin, tuck);
        fy = lerp(fy, hip[1] + lx * sin + ly * cos, tuck);
    }

    const forward = Math.max(pose.walk, pose.seat, tuck);
    const bend = lerp(side * 0.6, pose.dir, forward);
    const { joint, end } = solveTwoBone(hip, [fx, fy], body.thigh * g, body.shin * g, bend);
    const pitch = weight > 0.001 ? (placed.pitch || 0) * weight * RAD : 0;
    const tx = lerp(side, pose.dir, forward) * body.foot * g * Math.cos(pitch), ty = body.foot * g * Math.sin(pitch);
    const toe = [
        end[0] + lerp(tx, tx * cos - ty * sin, tuck),
        end[1] + lerp(ty, tx * sin + ty * cos, tuck),
    ];
    return { hip, knee: joint, foot: end, toe };
}

/**
 * Which way the elbow folds for a hand going to `target`: of the two possible
 * elbows, the one that sits outwards and down, where a relaxed arm lets it
 * fall. Returns a bend for solveTwoBone, -1..1.
 *
 * When the arm points almost exactly along that preferred direction the two
 * elbows are equally good, and jumping from one to the other would show. There
 * the bend eases through zero instead: the elbow swings through the picture
 * plane, and the arm looks foreshortened for a moment, as a real one would.
 */
export function elbowBend(shoulder, target, side) {
    const dx = target[0] - shoulder[0], dy = target[1] - shoulder[1];
    const d = Math.hypot(dx, dy) || 1;
    // Unit normal to the arm's axis, and the preferred elbow direction.
    const nx = dy / d, ny = -dx / d;
    const px = side * 0.62, py = 0.78;
    return clamp((nx * px + ny * py) / 0.25, -1, 1);
}

/**
 * @param {[number, number]} shoulder attachment point, in stage units
 * @param {[number, number]} [drag]   secondary-motion offset from a follower
 * @param {{ x, y, weight, angle? }} [target] hand target in stage units;
 *        defaults to the pose's own target for that side
 * @returns {null | { shoulder, elbow, hand, tip, reached }} null while the arm
 *          has not grown. `tip` is the end of the hand stroke (equal to `hand`
 *          for a free arm). `reached` is false when the target is out of reach.
 */
export function armPoints(body, pose, side, shoulder, k, drag = [0, 0], target) {
    const g = pose.arms * k;
    if (g < 0.03) return null;

    // Free arm: angles measured from straight down, positive to the right.
    const swing = Math.sin(pose.phase + (side > 0 ? 0 : Math.PI));
    let a1 = lerp(side * 22, 32 * swing, pose.walk);
    let a2 = lerp(side * 8, 32 * swing + pose.dir * 28, pose.walk);
    a1 = lerp(a1, side * 150, pose.stretch);
    a2 = lerp(a2, side * 168, pose.stretch);
    if (side > 0) {
        a1 = lerp(a1, 120, pose.wave);
        a2 = lerp(a2, 165 + 22 * Math.sin(pose.clock * 0.014), pose.wave);
    }
    // Inertia: arms trail behind the body, the forearm more than the upper arm.
    const lift = clamp(-drag[1], -9, 16);
    a1 += drag[0] * 1.0 + side * lift * 2.0;
    a2 += drag[0] * 1.9 + side * lift * 3.2;
    // On an edge: hands resting on it, either side of the body.
    a1 = lerp(a1, side * 34, pose.sit);
    a2 = lerp(a2, side * -6, pose.sit);
    a1 += side * 2.5 * pose.breath * Math.sin(pose.clock * 0.0021);

    const l1 = body.upper * g, l2 = body.fore * g;
    let elbow = [shoulder[0] + l1 * Math.sin(a1 * RAD), shoulder[1] + l1 * Math.cos(a1 * RAD)];
    let hand = [elbow[0] + l2 * Math.sin(a2 * RAD), elbow[1] + l2 * Math.cos(a2 * RAD)];
    let reached = true;

    // Reaching: the hand goes to its target and the elbow follows.
    target = target || (side < 0 ? pose.handL : pose.handR);
    const w = clamp(target.weight, 0, 1);
    let tip = hand;
    if (w > 0.001) {
        const solved = solveTwoBone(shoulder, [target.x, target.y], l1, l2,
            elbowBend(shoulder, [target.x, target.y], side));
        elbow = [lerp(elbow[0], solved.joint[0], w), lerp(elbow[1], solved.joint[1], w)];
        hand = [lerp(hand[0], solved.end[0], w), lerp(hand[1], solved.end[1], w)];
        reached = solved.reached;
        const a = (target.angle || 0) * RAD, reach = body.hand * g * w;
        tip = [hand[0] + reach * Math.sin(a), hand[1] + reach * Math.cos(a)];
    }
    return { shoulder, elbow, hand, tip, reached };
}
