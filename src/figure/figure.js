// A figure: one character drawn on a stage. It owns the numbers that describe
// how the character looks right now (its "state") and turns them into SVG.
// It knows nothing about scenes or pages: something else animates the state.

import { clamp, lerp } from '../core/easing.js';
import { createFollower } from '../core/spring.js';
import {
    DEFAULT_PROPORTIONS, createPose, legPoints, armPoints, walkDrop, seatHeight,
} from '../body/body.js';

const RAD = Math.PI / 180;
const f = n => n.toFixed(2);
const pt = p => `${f(p[0])} ${f(p[1])}`;

/**
 * @param {object} options
 * @param {object} options.stage      from createStage()
 * @param {object} options.character  { name, head, proportions?, line?, scaleLine?, arms?, sits? }
 *        limbs: a colour for its arms and legs (default: the page's ink)
 *        sits: false for a body that cannot sit on an edge (the director never asks it to)
 *        arms: 'front' draws the arms over the head instead of behind it;
 *        'none' gives it no arms
 *        scaleLine: false keeps limb lines the same thickness at any scale
 * @param {number} [options.unit]     pixels per character unit at scale 1
 */
export function createFigure({ stage, character, unit: initialUnit = 1 }) {
    let unit = initialUnit;
    const body = { ...DEFAULT_PROPORTIONS, ...character.proportions };
    const line = character.line ?? 3;
    const layer = stage.layer(character.name);
    const stroke = {
        fill: 'none',
        // The limbs take the page's ink unless the character has a colour of its own.
        stroke: character.limbs ?? 'var(--fig-ink, currentColor)',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
    };

    // Creation order is stacking order.
    const shadow = stage.el('ellipse', layer, { class: 'fig-shadow', fill: 'var(--fig-ink, currentColor)', opacity: '0' });
    const rope = stage.el('path', layer, { class: 'fig-rope', ...stroke, stroke: 'var(--fig-accent, currentColor)' });
    const limb = () => stage.el('path', layer, { class: 'fig-limb', ...stroke });
    // Arms are behind the head unless the character wants them in front of its
    // body (a wide body would hide a raised arm).
    const armsInFront = character.arms === 'front';
    const limbs = { legL: limb(), legR: limb() };
    // A character with no arms at all (a four-legged one draws its own front legs).
    const armless = character.arms === 'none';
    if (!armsInFront && !armless) Object.assign(limbs, { armL: limb(), armR: limb() });
    const headLayer = stage.el('g', layer, { class: 'fig-head' });
    if (armsInFront) Object.assign(limbs, { armL: limb(), armR: limb() });
    const head = character.head.create({ stage, layer: headLayer, line });

    const own = {
        ...createPose(),
        x: 0, y: 0,        // position relative to the current anchor, in pixels
        scale: 1,
        tilt: 0,           // degrees, clockwise
        squash: 0,         // > 0 squashed (wide and flat), < 0 stretched (narrow and tall)
        crouch: 0,         // body lowered while the feet stay put, in character units
        shadow: 0,         // contact shadow, 0..1
        floor: 0,          // ordinate of the floor under it, relative to the anchor
        rope: 0,           // thread it hangs from: 0 absent -> 1 taut down to it
        ropeTop: 0,        // ordinate of the top of the thread, relative to the anchor
    };
    // A head's numbers are its own: one named like a number of the body would be
    // changed by every step, tilt or jump, and nobody would know why.
    const taken = Object.keys(head.state ?? {}).filter(key => key in own);
    if (taken.length) throw new Error(`The head of "${character.name}" has a number called "${taken[0]}", which is one of the body's numbers. Give it another name (the body has: ${Object.keys(own).join(', ')}).`);
    const state = { ...own, ...head.state };

    const follower = createFollower();
    // What the last render computed, for scenes (where is the hand?) and tests.
    const points = { ground: 0, legL: null, legR: null, armL: null, armR: null, top: [0, 0], centre: [0, 0] };

    // Lines normally thicken with the figure; a character may keep them constant.
    const lineWidth = () => line * (character.scaleLine === false ? unit : state.scale * unit);

    /**
     * Draws the figure.
     * @param {[number, number]} origin current anchor origin, in page pixels
     * @param {number} [dt] ms since the last render (for secondary motion)
     */
    function render(origin, dt = 16) {
        const s = state;
        const k = s.scale * unit;
        s.clock += dt;

        const frame = head.frame(s);
        const ox = origin[0] + s.x;
        // state.y says where the feet stand. Sitting on a chair, crouching and the
        // walk's dip all lower the body without moving the ground under it.
        const seated = (body.reach - seatHeight(body)) * s.seat * s.legs;
        const oy = origin[1] + s.y + (walkDrop(body, s) + s.crouch + seated) * k;

        const breathing = 0.03 * s.breath * Math.sin(s.clock * 0.0021);
        const sq = (s.squash + breathing) * (frame.soft ?? 1);
        const sx = 1 + 0.17 * sq, sy = 1 - 0.21 * sq;
        const cos = Math.cos(s.tilt * RAD), sin = Math.sin(s.tilt * RAD);
        // Head-local coordinates -> page pixels.
        const P = (hx, hy) => {
            hx *= sx; hy *= sy;
            return [ox + k * (hx * cos - hy * sin), oy + k * (hx * sin + hy * cos)];
        };
        const matrix = [k * sx * cos, k * sx * sin, -k * sy * sin, k * sy * cos, ox, oy];

        // Secondary motion is measured in character units, so it feels the same
        // at any size on screen.
        const lag = follower.step(ox / unit, oy / unit, dt);
        const drag = [clamp(lag[0], -15, 15), clamp(lag[1], -15, 15)];

        // Limbs are attached to the head but hang along the screen's vertical.
        const ground = origin[1] + s.y + k * (frame.hipY + body.reach * s.legs);
        points.ground = ground;
        points.centre = [ox, oy];
        points.top = P(frame.top[0], frame.top[1]);

        const width = f(lineWidth());
        const drawLeg = (node, side, hip) => {
            const leg = legPoints(body, s, side, P(hip[0], hip[1]), ground, k);
            node.setAttribute('d', leg ? `M ${pt(leg.hip)} L ${pt(leg.knee)} L ${pt(leg.foot)} L ${pt(leg.toe)}` : '');
            node.setAttribute('stroke-width', width);
            return leg;
        };
        // A hand target is given from the figure's origin unless it says `page`.
        const resolve = h => (h.page ? h : { x: ox + h.x * k, y: oy + h.y * k, weight: h.weight, angle: h.angle });
        const drawArm = (node, side, shoulder) => {
            const target = resolve(side < 0 ? s.handL : s.handR);
            const arm = armPoints(body, s, side, P(shoulder[0], shoulder[1]), k, drag, target);
            if (arm) arm.target = [target.x, target.y];
            node.setAttribute('d', arm
                ? `M ${pt(arm.shoulder)} L ${pt(arm.elbow)} L ${pt(arm.hand)} L ${pt(arm.tip)}`
                : '');
            node.setAttribute('stroke-width', width);
            return arm;
        };
        points.legL = drawLeg(limbs.legL, -1, frame.hips[0]);
        points.legR = drawLeg(limbs.legR, 1, frame.hips[1]);
        points.armL = armless ? null : drawArm(limbs.armL, -1, frame.shoulders[0]);
        points.armR = armless ? null : drawArm(limbs.armR, 1, frame.shoulders[1]);

        head.draw({ state: s, P, matrix, k, unit, drag, dt, line, ground, body });

        // Contact shadow: widens and darkens as the figure nears the floor.
        if (s.shadow > 0.01) {
            const feet = s.y + k * (frame.hipY + body.reach * s.legs);
            const near = clamp(1 - Math.max(0, s.floor - feet) / (150 * k), 0, 1);
            shadow.setAttribute('cx', f(ox));
            shadow.setAttribute('cy', f(origin[1] + s.floor));
            shadow.setAttribute('rx', f(30 * k * (0.45 + 0.55 * near) * sx));
            shadow.setAttribute('ry', f(2.2 * k));
            shadow.setAttribute('opacity', f(0.16 * s.shadow * near * near));
        } else {
            shadow.setAttribute('opacity', '0');
        }

        // Thread: comes down from above to the top of the head.
        if (s.rope > 0.01) {
            const top = origin[1] + s.ropeTop;
            rope.setAttribute('d', `M ${f(points.top[0])} ${f(top)} L ${f(points.top[0])} ${f(lerp(top, points.top[1], s.rope))}`);
            rope.setAttribute('stroke-width', f(Math.max(1, line * k * 0.4)));
        } else {
            rope.setAttribute('d', '');
        }
    }

    return {
        name: character.name,
        stage,
        layer,
        /** Pixels per character unit at scale 1. Settable: a page can resize. */
        get unit() { return unit; },
        set unit(value) { unit = value; },
        line,
        /** Width of the figure's line on screen right now, in pixels. */
        lineWidth,
        state,
        body,
        points,
        render,
        /** Distance from the figure's origin down to the ground when standing, in pixels. */
        standHeight: () => state.scale * unit * (head.frame(state).hipY + body.reach),
        /** Pixels per character unit at the current scale. */
        get k() { return state.scale * unit; },
        destroy() { layer.remove(); },
    };
}
