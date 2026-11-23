import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStage } from '../src/stage/stage.js';
import { createFigure } from '../src/figure/figure.js';
import { stickman } from '../src/characters/stickman.js';
import { fakeDocument, pathPoints } from './helpers/fake-dom.js';

const near = (a, b, tolerance, message) =>
    assert.ok(Math.abs(a - b) <= tolerance, `${message}: expected ${b} ± ${tolerance}, got ${a}`);

function setup(options) {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const figure = createFigure({ stage, character: stickman, ...options });
    return { doc, stage, figure };
}

test('the stage is decorative and never intercepts a click', () => {
    const { stage } = setup();
    assert.equal(stage.svg.attrs['aria-hidden'], 'true');
    assert.match(stage.svg.attrs.style, /pointer-events:none/);
});

test('a standing figure has both feet on the ground, under its anchor', () => {
    const { figure } = setup();
    Object.assign(figure.state, { legs: 1, arms: 1 });
    figure.state.y = -figure.standHeight();
    figure.render([400, 300]);

    for (const leg of [figure.points.legL, figure.points.legR]) {
        near(leg.foot[1], 300, 0.01, 'foot on the anchor line');
        near(leg.foot[0], 400, 6, 'foot under the body');
    }
});

test('what is drawn is what was computed', () => {
    const { figure, stage } = setup();
    Object.assign(figure.state, { legs: 1, arms: 1, y: -75 });
    figure.render([100, 200]);

    const layer = stage.svg.children[0];
    const legPath = layer.children.find(n => n.attrs.class === 'fig-limb');
    const drawn = pathPoints(legPath.attrs.d);
    assert.equal(drawn.length, 4, 'hip, knee, foot, toe');
    near(drawn[2][0], figure.points.legL.foot[0], 0.01, 'foot x');
    near(drawn[2][1], figure.points.legL.foot[1], 0.01, 'foot y');
});

test('scale and unit size the figure without moving its feet off the ground', () => {
    for (const [unit, scale] of [[1, 1], [0.5, 1], [2, 0.6]]) {
        const { figure } = setup({ unit });
        Object.assign(figure.state, { legs: 1, scale });
        figure.state.y = -figure.standHeight();
        figure.render([0, 500]);
        near(figure.points.legL.foot[1], 500, 0.01, `unit ${unit}, scale ${scale}`);
        near(figure.k, unit * scale, 1e-9, 'pixels per unit');
    }
});

test('a walking figure keeps its planted foot still on the page', () => {
    const { figure } = setup();
    const s = figure.state;
    Object.assign(s, { legs: 1, walk: 1, dir: 1 });
    s.y = -figure.standHeight();
    const cycle = 4 * figure.body.stride;

    let plantedAt = null, checked = 0;
    for (let x = 0; x < cycle * 2; x += 1) {
        s.x = x;
        s.phase = (x / cycle) * Math.PI * 2;
        figure.render([0, 300]);
        const p = ((s.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (p < Math.PI) { // left leg (side -1) is in stance
            const foot = figure.points.legL.foot;
            if (plantedAt === null) plantedAt = foot[0];
            near(foot[0], plantedAt, 0.01, `left foot at x=${x}`);
            near(foot[1], 300, 0.01, 'on the ground');
            checked++;
        } else plantedAt = null;
    }
    assert.ok(checked > 50);
});

test('an arm can be sent to a point of the page', () => {
    const { figure } = setup();
    const s = figure.state;
    Object.assign(s, { legs: 1, arms: 1 });
    s.y = -figure.standHeight();
    s.handR = { x: 430, y: 230, weight: 1, page: true };
    figure.render([400, 300]);
    assert.equal(figure.points.armR.reached, true);
    near(figure.points.armR.hand[0], 430, 0.01, 'hand x');
    near(figure.points.armR.hand[1], 230, 0.01, 'hand y');
});

test('sitting on a chair lowers the hips and leaves the feet on the ground', () => {
    const { figure } = setup();
    const s = figure.state;
    Object.assign(s, { legs: 1, arms: 1 });
    s.y = -figure.standHeight();
    figure.render([400, 300]);
    const standingHip = figure.points.legL.hip[1];

    s.seat = 1;
    figure.render([400, 300]);
    const { hip, knee, foot } = figure.points.legL;
    near(foot[1], 300, 0.01, 'foot still on the ground');
    near(hip[1] - standingHip, figure.body.reach - figure.body.shin, 0.01, 'hips lowered to seat height');
    near(knee[1], hip[1], 8, 'thigh roughly level');
});

test('a hand target given from the body travels with the body', () => {
    const { figure } = setup({ unit: 2 });
    const s = figure.state;
    Object.assign(s, { legs: 1, arms: 1 });
    s.y = -figure.standHeight();
    s.handL = { x: -10, y: 5, weight: 1, angle: 180, page: false };

    for (const origin of [[100, 400], [700, 250]]) {
        figure.render(origin);
        const { hand, tip, reached } = figure.points.armL;
        const [cx, cy] = figure.points.centre;
        assert.equal(reached, true);
        near(hand[0], cx - 10 * 2, 0.01, 'hand x follows the body');
        near(hand[1], cy + 5 * 2, 0.01, 'hand y follows the body');
        near(tip[0], hand[0], 0.01, 'hand stroke points straight up');
        near(hand[1] - tip[1], figure.body.hand * 2, 0.01, 'hand stroke length');
    }
});

test('the shadow is invisible until asked for', () => {
    const { figure, stage } = setup();
    figure.render([0, 0]);
    const shadow = stage.svg.children[0].children.find(n => n.attrs.class === 'fig-shadow');
    assert.equal(shadow.attrs.opacity, '0');
    Object.assign(figure.state, { legs: 1, shadow: 1, floor: 0 });
    figure.state.y = -figure.standHeight();
    figure.render([0, 0]);
    assert.ok(Number(shadow.attrs.opacity) > 0.1);
});

test('destroy removes everything the figure drew', () => {
    const { figure, stage } = setup();
    assert.equal(stage.svg.children.length, 1);
    figure.destroy();
    assert.equal(stage.svg.children.length, 0);
});

test('a character may ask for its arms in front of its body', () => {
    const order = character => {
        const { doc, win } = fakeDocument();
        const figure = createFigure({ stage: createStage({ doc, win }), character });
        const kids = figure.layer.children;
        const head = kids.findIndex(k => k.attrs.class === 'fig-head');
        const limbs = kids.map((k, i) => (k.attrs.class === 'fig-limb' ? i : -1)).filter(i => i >= 0);
        return { before: limbs.filter(i => i < head).length, after: limbs.filter(i => i > head).length };
    };
    assert.deepEqual(order(stickman), { before: 4, after: 0 }, 'by default every limb is behind the head');
    assert.deepEqual(order({ ...stickman, arms: 'front' }), { before: 2, after: 2 }, 'arms in front, legs still behind');
});

test('a head is told where the ground is and what the body measures, and a character may have no arms', () => {
    const { doc, win } = fakeDocument();
    let seen = null;
    const character = {
        name: 'thing', arms: 'none', proportions: { reach: 30, thigh: 16, shin: 16 },
        head: { create: () => ({ state: {}, frame: () => ({ hips: [[-5, 10], [5, 10]], shoulders: [[0, 0], [0, 0]], hipY: 10, top: [0, -10] }), draw(ctx) { seen = ctx; } }) },
    };
    const figure = createFigure({ stage: createStage({ doc, win }), character });
    Object.assign(figure.state, { legs: 1, arms: 1 });
    figure.state.y = -figure.standHeight();
    figure.render([400, 300]);
    near(seen.ground, 300, 0.01, 'the ground, in page pixels');
    assert.equal(seen.body.reach, 30, 'the proportions it was given');
    assert.equal(figure.points.armL, null, 'no arm is computed');
    assert.equal(figure.layer.children.filter(k => k.attrs.class === 'fig-limb').length, 2, 'and none is drawn: two legs only');
});

test('the anatomy a head may borrow: a leg computed the engine\'s way', async () => {
    const { anatomy } = await import('../src/index.js');
    const { DEFAULT_PROPORTIONS, createPose } = await import('../src/body/body.js');
    const leg = anatomy.legPoints(DEFAULT_PROPORTIONS, { ...createPose(), legs: 1 }, 1, [40, 47], 100, 1);
    near(leg.foot[1], 100, 0.01, 'its foot is on the ground');
    assert.equal(typeof anatomy.footCycle, 'function');
    assert.equal(typeof anatomy.solveTwoBone, 'function');
});

test('a character may give its limbs a colour of its own', () => {
    const { doc, win } = fakeDocument();
    const plain = createFigure({ stage: createStage({ doc, win }), character: stickman });
    const brown = createFigure({ stage: createStage({ doc, win }), character: { ...stickman, limbs: '#5a3a22' } });
    const limb = figure => figure.layer.children.find(k => k.attrs.class === 'fig-limb').attrs.stroke;
    assert.match(limb(plain), /--fig-ink/);
    assert.equal(limb(brown), '#5a3a22');
});

test('a head cannot take one of the body\'s numbers for its own', () => {
    // A moon once called its lit part `phase`: that is the walk cycle, and walking changed the moon.
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clashing = { name: 'moon', head: { create: () => ({ state: { gazeX: 0, phase: 0.6 }, frame: () => ({ hips: [[-5, 10], [5, 10]], shoulders: [[-8, 0], [8, 0]], hipY: 10, top: [0, -10] }), draw() {} }) } };
    assert.throws(() => createFigure({ stage, character: clashing }), /"phase".*body/);
    const fine = { name: 'moon', head: { create: () => ({ state: { gazeX: 0, lit: 0.6 }, frame: () => ({ hips: [[-5, 10], [5, 10]], shoulders: [[-8, 0], [8, 0]], hipY: 10, top: [0, -10] }), draw() {} }) } };
    assert.equal(createFigure({ stage, character: fine }).state.lit, 0.6);
});
