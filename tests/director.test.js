import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSpots, describeProblems, ATTRIBUTES } from '../src/director/spots.js';
import { measureRoom, chooseVariant, moodAllows } from '../src/director/room.js';

// A page reduced to what readSpots needs: elements with attributes.
const page = (...elements) => ({
    querySelectorAll: () => elements.map(attrs => ({
        tagName: attrs.tag || 'DIV',
        getAttributeNames: () => Object.keys(attrs).filter(k => k !== 'tag'),
        getAttribute: name => attrs[name],
    })),
});

test('a spot is read with its options, and missing options take their defaults', () => {
    const { spots, problems } = readSpots(page(
        { 'data-fig-spot': 'projects', 'data-fig-at': '0.06', 'data-fig-enter': 'rope', 'data-fig-scene': 'patrol', 'data-fig-on': 'idle' },
        { 'data-fig-spot': 'plain' },
        { class: 'unrelated' },
    ));
    assert.deepEqual(problems, []);
    assert.equal(spots.length, 2);
    const { element, ...first } = spots[0];
    assert.deepEqual(first, { name: 'projects', cast: 'default', scene: 'patrol', at: 0.06, enter: 'rope', on: 'idle', mood: 'free', sit: true });
    const { element: _, ...second } = spots[1];
    assert.deepEqual(second, { name: 'plain', cast: 'default', scene: null, at: 0.5, enter: 'walk', on: null, mood: 'free', sit: true });
});

test('an element with a scene is a spot even without data-fig-spot', () => {
    const { spots, problems } = readSpots(page({ 'data-fig-scene': 'psy' }));
    assert.deepEqual(problems, []);
    assert.equal(spots[0].name, 'psy');
    assert.equal(spots[0].on, 'attention', 'attention is the default trigger');
});

test('homes are read separately from spots', () => {
    const { spots, homes } = readSpots(page({ 'data-fig-home': 'eye', tag: 'SVG' }));
    assert.equal(spots.length, 0);
    assert.equal(homes[0].cast, 'eye');
});

test('every mistake is reported with a way to fix it, and never applied', () => {
    const { spots, problems } = readSpots(page(
        { 'data-fig-spot': 'a', 'data-fig-at': '120' },
        { 'data-fig-spot': 'b', 'data-fig-enter': 'ropee' },
        { 'data-fig-spot': 'c', 'data-fig-sceen': 'psy' },
        { 'data-fig-spot': 'd', 'data-fig-mood': 'sad' },
        { 'data-fig-spot': '' },
        { 'data-fig-spot': 'a' },
        { 'data-fig-at': '0.3' },
        { 'data-fig-spot': 'e', 'data-fig-on': 'click' },
    ), {});
    const by = attribute => problems.filter(p => p.attribute === attribute);

    assert.match(by('data-fig-at')[0].message, /from 0 to 1/);
    assert.equal(spots.find(s => s.name === 'a').at, 0.5, 'the bad value is ignored, the default applies');
    assert.match(by('data-fig-enter')[0].fix, /Did you mean "rope"\?/);
    assert.match(by('data-fig-sceen')[0].fix, /Did you mean "data-fig-scene"\?/);
    assert.match(by('data-fig-mood')[0].fix, /Allowed: free, solemn/);
    assert.ok(by('data-fig-spot').some(p => /needs a name/.test(p.message)));
    assert.ok(by('data-fig-spot').some(p => /Two places are named "a"/.test(p.message)));
    assert.ok(by('data-fig-at').some(p => /no effect on its own/.test(p.message)));
    assert.match(by('data-fig-on')[0].message, /no scene is set/);
    for (const p of problems) assert.ok(p.fix.length > 10, `every problem carries a fix: ${p.message}`);
});

test('scene and character names are checked against what exists', () => {
    const { problems } = readSpots(page(
        { 'data-fig-scene': 'psyy' },
        { 'data-fig-spot': 'x', 'data-fig-cast': 'bos' },
        { 'data-fig-home': 'eey' },
    ), { scenes: ['psy', 'writer'], casts: ['eye', 'boss'] });
    assert.equal(problems.length, 3);
    assert.match(problems[0].fix, /Did you mean "psy"\?/);
    assert.match(problems[1].fix, /Did you mean "boss"\?/);
    assert.match(problems[2].fix, /Did you mean "eye"\?/);
    assert.match(describeProblems(problems)[0], /^<div> No scene is named "psyy"\. Did you mean/);
});

test("Figurant's own drawing layers are not mistaken for page markers", () => {
    const { problems } = readSpots(page({ 'data-fig-layer': 'stickman', tag: 'g' }));
    assert.deepEqual(problems, []);
});

test('every attribute documents itself', () => {
    for (const [name, rule] of Object.entries(ATTRIBUTES)) {
        assert.ok(name.startsWith('data-fig-'));
        assert.ok(rule.about.length > 10, `${name} has a description`);
    }
});

test('room is measured in character units from the feet', () => {
    const room = measureRoom({ point: [300, 500], bounds: { left: 0, right: 1000, top: 100, bottom: 800 }, k: 2 });
    assert.deepEqual(room, { left: 150, right: 350, up: 200 });
    const cramped = measureRoom({ point: [-20, 50], bounds: { left: 0, right: 100, top: 100, bottom: 800 }, k: 1 });
    assert.equal(cramped.left, 0);
    assert.equal(cramped.up, 0);
});

test('the largest version that fits is chosen; none means the scene is not played', () => {
    const scene = {
        name: 'psy', props: ['chair', 'couch'],
        room: { left: 20, right: 180, up: 110 },
        variants: [{ name: 'compact', room: { left: 20, right: 50, up: 110 }, props: ['chair'] }],
    };
    const wide = chooseVariant(scene, { left: 100, right: 400, up: 300 });
    assert.equal(wide.name, 'full');
    assert.deepEqual(wide.scene.props, ['chair', 'couch']);

    const narrow = chooseVariant(scene, { left: 100, right: 90, up: 300 });
    assert.equal(narrow.name, 'compact');
    assert.deepEqual(narrow.scene.props, ['chair'], 'the variant overrides the scene');
    assert.equal(narrow.scene.variants, undefined);

    assert.equal(chooseVariant(scene, { left: 100, right: 30, up: 300 }), null);
    assert.equal(chooseVariant(scene, { left: 100, right: 400, up: 60 }), null, 'not enough headroom');
    assert.equal(chooseVariant({ name: 'tiny' }, { left: 0, right: 0, up: 0 }).name, 'full', 'no room declared: always fits');
});

test('a solemn place only accepts scenes written for it', () => {
    assert.equal(moodAllows({ name: 'gag' }, 'free'), true);
    assert.equal(moodAllows({ name: 'gag' }, 'solemn'), false);
    assert.equal(moodAllows({ name: 'vigil', mood: 'solemn' }, 'solemn'), true);
    assert.equal(moodAllows({ name: 'look', mood: 'any' }, 'solemn'), true);
});
