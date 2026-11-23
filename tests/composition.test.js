import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance, createStage, stickman, playComposition, checkComposition, compositionLength, describeProblems, moves } from '../src/index.js';
import { fakeDocument } from './helpers/fake-dom.js';

const wave = { async play(c) { await c.tween({ wave: 1 }, 200); await c.wait(400); await c.tween({ wave: 0 }, 200); } };
const forTeapot = { character: 'teapot', async play() {} };
const endless = { async play(c) { for (;;) { await moves.blink(c); await c.wait(300); } } };
const project = { characters: { stickman, twin: { ...stickman, name: 'twin' } }, animations: { wave, forTeapot, endless }, props: { box: { name: 'box', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 9 0' } }], points: { grip: [0, 0] } } } };

const duet = {
    title: 'Two meet', width: 400,
    cast: [{ id: 'a', character: 'stickman', at: -150 }, { id: 'b', character: 'twin', at: 150, dir: -1 }],
    props: [{ prop: 'box', at: 0 }],
    ties: [{ from: 'a:handR', to: 'b:top' }],
    tracks: {
        a: [{ at: 0, walk: -40 }, { at: 3000, play: 'wave' }],
        b: [{ at: 500, walk: 40 }, { at: 3000, play: 'endless' }, { at: 5000, move: 'hop' }],
    },
};

test('a well-formed scene has no problems, and its mistakes are reported with their fix', () => {
    assert.deepEqual(checkComposition('duet', duet, project), []);
    const bad = checkComposition('bad', {
        cast: [{ id: 'a', character: 'stickman', at: 0 }, { id: 'a', character: 'ghost' }],
        props: [{ prop: 'sofa', at: 0 }],
        ties: [{ from: 'a:elbow', to: 'nobody:top' }],
        tracks: { a: [{ at: 900, play: 'forTeapot' }, { at: 100, walk: 'far' }, { at: 1200, move: 'fly' }, { at: 1300, walk: 4, play: 'wave' }, { at: 1400, play: 'missing' }], z: [] },
    }, project);
    const fields = bad.map(problem => problem.field);
    for (const field of ['cast[1].id', 'cast[1].character', 'cast[1].at', 'props[0].prop', 'ties[0].from', 'ties[0].to', 'tracks.a[0].play', 'tracks.a[1].at', 'tracks.a[1].walk', 'tracks.a[2].move', 'tracks.a[3]', 'tracks.a[4].play', 'tracks.z']) assert.ok(fields.includes(field), `${field} is reported`);
    assert.equal(bad.length, 13, describeProblems(bad).join('\n'));
    for (const line of describeProblems(bad)) assert.match(line, /^scene "bad" /);
    assert.equal(checkComposition('x', { tracks: {} }, project).length, 1, 'a scene needs a cast');
});

test('a scene plays: everyone starts in place, each clip starts on time and replaces the one before', async () => {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    const show = playComposition({ stage, clock, composition: duet, ...project, origin: () => [500, 400], unit: 1 });
    const a = show.actors.a.figure, b = show.actors.b.figure;
    await advance(clock, 32);
    assert.equal(Math.round(a.state.x), -150, 'a starts where the scene puts it');
    assert.equal(b.state.dir, -1, 'b faces the way it was told');
    assert.ok(Math.abs(a.points.legL.foot[1] - 400) < 0.5, 'on the floor');
    await advance(clock, 400);
    assert.ok(a.state.x > -150, 'a is walking');
    assert.equal(Math.round(b.state.x), 150, 'b has not started: its clip is at 500 ms');
    await advance(clock, 2400);
    assert.equal(Math.round(a.state.x), -40, 'a arrived');
    assert.equal(Math.round(b.state.x), 40, 'b arrived');
    assert.equal(a.state.wave, 0);
    await advance(clock, 600);
    assert.ok(a.state.wave > 0.5, 'at 3 s a plays its animation');
    let highest = 0;
    clock.onFrame(() => { highest = Math.max(highest, -b.standHeight() - b.state.y); });
    await advance(clock, 2400);
    assert.ok(highest > 5, `at 5 s the hop cut b's endless animation short (it rose ${highest.toFixed(1)} px)`);
    assert.ok(show.time() > 5800 && show.time() < 6000, 'and the scene knows what time it is');
    // The tie follows its two points.
    const tie = stage.svg.children.find(layer => layer.attrs['data-fig-layer'] === 'tie').children[0];
    assert.match(tie.attrs.d, /^M [\d.-]+ [\d.-]+ Q /);
    assert.equal(compositionLength(duet), 9000);
    show.stop();
    assert.equal(stage.svg.children.filter(layer => layer.attrs['data-fig-layer'] === 'stickman').length, 0, 'stop clears the floor');
});

test('an animation made for another character is not played in a scene, and a looping scene starts again', async () => {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    let played = 0;
    const counted = { async play(c) { played++; await c.wait(100); } };
    const show = playComposition({
        stage, clock, origin: () => [500, 400],
        composition: { cast: [{ id: 'a', character: 'stickman', at: 0 }], tracks: { a: [{ at: 0, play: 'forTeapot' }, { at: 200, play: 'counted' }, { at: 400, walk: 30 }] }, loop: true, length: 1500 },
        characters: project.characters, animations: { forTeapot: { ...forTeapot, play: async () => { played += 100; } }, counted },
    });
    await advance(clock, 1400);
    assert.equal(played, 1, 'only the animation it may play was played');
    assert.equal(Math.round(show.actors.a.figure.state.x), 30);
    await advance(clock, 600);
    assert.equal(played, 2, 'the scene started again');
    assert.ok(show.actors.a.figure.state.x < 30, 'from where it began');
    show.stop();
});

test('every scene of the project is well formed and plays through without a stray number', async () => {
    const config = (await import('../examples/figurant.config.js')).default;
    const everyone = { ...config.cast, ...config.emoji };
    const project = { characters: Object.fromEntries(Object.entries(everyone).map(([key, member]) => [key, member.character])), animations: config.scenes, props: config.props };
    const names = Object.keys(config.compositions);
    assert.ok(names.includes('walk-the-dog') && names.includes('strike'), names.join());
    for (const name of names) {
        const composition = config.compositions[name];
        assert.deepEqual(describeProblems(checkComposition(name, composition, project)), [], name);
        const { doc, win } = fakeDocument();
        const stage = createStage({ doc, win });
        const clock = createClock();
        const show = playComposition({ stage, clock, composition, ...project, origin: () => [800, 500], unit: 1 });
        const moved = new Set();
        // Doing something: any number of its state (but its own clock) has left where it started.
        const numbers = state => Object.fromEntries(Object.entries(state).filter(([key, value]) => typeof value === 'number' && !['clock', 'breath'].includes(key)));
        const start = Object.fromEntries(Object.entries(show.actors).map(([id, entry]) => [id, numbers(entry.figure.state)]));
        clock.onFrame(() => { for (const [id, entry] of Object.entries(show.actors)) if (Object.entries(start[id]).some(([key, value]) => Math.abs(entry.figure.state[key] - value) > 0.2)) moved.add(id); });
        await advance(clock, compositionLength(composition) - 200);
        assert.deepEqual([...moved].sort(), Object.keys(show.actors).sort(), `${name}: everyone in the cast does something`);
        for (const [id, entry] of Object.entries(show.actors)) for (const [key, value] of Object.entries(entry.figure.state)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${name}: ${id}.${key}`);
        show.stop();
    }
});

test('a cast member may ride another: it goes where its carrier goes, and the checker refuses a rider that walks', async () => {
    const characters = { stickman };
    const scene = { cast: [{ id: 'mount', character: 'stickman', at: -100 }, { id: 'rider', character: 'stickman', on: 'mount', at: 10, up: 40 }], tracks: { mount: [{ at: 0, walk: 100 }], rider: [{ at: 0, move: 'blink' }] } };
    assert.deepEqual(checkComposition('ride', scene, { characters }), []);
    assert.equal(checkComposition('ride', { ...scene, tracks: { rider: [{ at: 0, walk: 5 }] } }, { characters }).length, 1, 'a rider does not walk');
    assert.equal(checkComposition('ride', { ...scene, cast: [scene.cast[0], { ...scene.cast[1], on: 'nobody' }] }, { characters }).length, 1, 'its carrier is in the cast');

    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    const show = playComposition({ stage, clock, composition: scene, characters, origin: () => [500, 300] });
    const { mount, rider } = show.actors;
    const gap = () => [rider.figure.state.x - mount.figure.state.x, rider.figure.state.y - mount.figure.state.y];
    assert.deepEqual(gap(), [10, -40], 'aboard from the first frame');
    const before = mount.figure.state.x;
    await advance(clock, 3200);
    assert.ok(mount.figure.state.x - before > 50, 'the carrier has moved');
    assert.deepEqual(gap().map(Math.round), [10, -40], 'and the rider with it');
    // A new clip does not drop the rider to the floor for an instant.
    const again = playComposition({ stage, clock, composition: { ...scene, tracks: { rider: [{ at: 100, move: 'look-left' }] } }, characters, origin: () => [500, 300] });
    let lowest = -Infinity;
    // What is drawn counts, not the number afterwards: the feet, against the carrier's.
    const off = clock.onFrame(() => { lowest = Math.max(lowest, again.actors.rider.figure.points.legL.foot[1] - again.actors.mount.figure.points.legL.foot[1]); });
    await advance(clock, 600);
    off(); again.stop();
    assert.ok(lowest <= -39.5, `the rider stays aboard when its clip starts (it sank to ${lowest.toFixed(1)})`);
    // A carrier that heaves on the spot takes its rider with it.
    mount.figure.state.heave = 6;
    await advance(clock, 32);
    assert.equal(Math.round(gap()[1]), -34, 'the rider goes down with the deck');
    show.stop();
});

test('a character may rise above the floor and stay up from one clip to the next, until it is told to come down', async () => {
    const sky = {
        width: 600, length: 9000, loop: true,
        cast: [{ id: 'a', character: 'stickman', at: 0 }],
        tracks: { a: [{ at: 0, fly: 120, over: 800 }, { at: 1500, move: 'look-right', over: 600 }, { at: 3000, move: 'wave', over: 1500 }, { at: 5000, fly: 0, over: 600 }] },
    };
    assert.deepEqual(checkComposition('sky', sky, project), []);
    assert.match(describeProblems(checkComposition('bad', { ...sky, tracks: { a: [{ at: 0, fly: -5 }] } }, project)).join('\n'), /fly/, 'a height is a number, up from the floor');
    assert.match(describeProblems(checkComposition('bad', { cast: [{ id: 'a', character: 'stickman', at: 0 }, { id: 'b', character: 'stickman', on: 'a' }], tracks: { b: [{ at: 0, fly: 50 }] } }, project)).join('\n'), /rides/, 'a rider does not fly by itself');

    const { doc, win } = fakeDocument();
    const clock = createClock();
    const show = playComposition({ stage: createStage({ doc, win }), clock, composition: sky, ...project, origin: () => [500, 400], unit: 1 });
    const a = show.actors.a.figure;
    const height = () => -a.standHeight() - a.state.y;
    await advance(clock, 1200);
    assert.ok(Math.abs(height() - 120) < 0.5, `it rose to 120 (${height().toFixed(1)})`);
    await advance(clock, 1200);
    assert.ok(Math.abs(height() - 120) < 0.5, `the next clip leaves it up there (${height().toFixed(1)})`);
    await advance(clock, 1400);
    assert.ok(a.state.wave > 0.5 && Math.abs(height() - 120) < 0.5, 'and the one after, while it waves');
    await advance(clock, 2200);
    assert.ok(Math.abs(height()) < 0.5, `told to come down, it is back on the floor (${height().toFixed(1)})`);
    await advance(clock, 4300);
    assert.ok(height() > 100, `the scene starts again: it rises again (${height().toFixed(1)})`);
    await advance(clock, 0);
    show.stop();
});

test('in a scene an animation plays where its character stands, not around the middle of the floor', async () => {
    // An animation written the usual way: around 0, where the character is when it starts.
    const seen = {};
    const stepAside = { character: 'stickman', async play(c) { seen.prop = c.prop(project.props.box, { x: 60, y: 0 }); await c.tween({ x: 20 * c.figure.k }, 200); await c.wait(3000); } };
    const scene = {
        width: 800,
        cast: [{ id: 'a', character: 'stickman', at: 200 }, { id: 'b', character: 'twin', at: -250 }],
        tracks: { a: [{ at: 0, play: 'stepAside' }, { at: 4000, walk: 100 }], b: [{ at: 0, walk: -200 }] },
    };
    const { doc, win } = fakeDocument();
    const clock = createClock();
    const show = playComposition({ stage: createStage({ doc, win }), clock, composition: scene, ...project, animations: { ...project.animations, stepAside }, origin: () => [500, 400], unit: 1 });
    const a = show.actors.a.figure, b = show.actors.b.figure;
    await advance(clock, 1500);
    assert.ok(Math.abs(a.points.centre[0] - 720) < 1, `it stepped 20 aside from where it stood, at 200 (${a.points.centre[0].toFixed(1)}, not 520)`);
    assert.ok(Math.abs(seen.prop.point('grip')[0] - 760) < 1, `and its prop is 60 from where it stood (${seen.prop.point('grip')[0].toFixed(1)}, not 560)`);
    assert.ok(Math.abs(b.points.centre[0] - 300) < 1, 'someone who walks still goes where the scene says, from the middle');
    // Changing what positions are measured from never moves anyone: the next clip starts from where it is.
    let jump = 0, before = a.points.centre[0];
    const watch = clock.onFrame(() => { jump = Math.max(jump, Math.abs(a.points.centre[0] - before)); before = a.points.centre[0]; });
    await advance(clock, 6000);
    watch();
    assert.ok(jump < 12, `nobody jumps when the animation gives way to a walk (largest step in one frame: ${jump.toFixed(1)} px)`);
    assert.ok(Math.abs(a.points.centre[0] - 600) < 1, `after the animation, a walk is again measured from the middle (${a.points.centre[0].toFixed(1)})`);
    show.stop();
});
