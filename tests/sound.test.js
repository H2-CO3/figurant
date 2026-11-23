import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSoundtrack, checkSounds, createClock, createStage, playComposition, checkComposition } from '../src/index.js';
import { fakeDocument } from './helpers/fake-dom.js';

const fakeStage = () => createStage(fakeDocument());

/** What stands for a sound file being played: it only remembers what it is told. */
function player(duration = 2) {
    const made = [];
    const open = address => { const audio = { address, paused: true, currentTime: 0, duration, volume: 1, playbackRate: 1, loop: false, plays: 0, play() { this.paused = false; this.plays++; return Promise.resolve(); }, pause() { this.paused = true; } }; made.push(audio); return audio; };
    return { made, open };
}

test('a sound starts at its time, at the place in the file the scene is at', () => {
    const { made, open } = player();
    const track = createSoundtrack({ sounds: [{ at: 1000, src: 'assets/hello.mp3', volume: 0.5 }], open, base: 'http://localhost/' });
    track.sync({ time: 0 });
    assert.equal(made[0].address, 'http://localhost/assets/hello.mp3', 'a path from the project\'s folder');
    assert.equal(made[0].paused, true, 'not before its time');
    track.sync({ time: 1400 });
    assert.equal(made[0].paused, false);
    assert.ok(Math.abs(made[0].currentTime - 0.4) < 1e-9, 'joined 0.4 s in, not from its start');
    assert.equal(made[0].volume, 0.5);
    track.sync({ time: 3200 });
    assert.equal(made[0].paused, true, 'over once the file is: it lasts 2 s');
});

test('pausing, slowing down and going to a moment do the same to what is heard', () => {
    const { made, open } = player(10);
    const track = createSoundtrack({ sounds: [{ at: 0, src: 'a.wav' }], open, base: 'http://localhost/' });
    track.sync({ time: 500 });
    track.sync({ time: 520, playing: false });
    assert.equal(made[0].paused, true, 'paused with the scene');
    track.sync({ time: 520, speed: 0.5 });
    assert.equal(made[0].paused, false);
    assert.equal(made[0].playbackRate, 0.5, 'at half speed with it');
    made[0].currentTime = 0.6;
    track.sync({ time: 620 });
    assert.equal(made[0].currentTime, 0.6, 'a little drift is left alone: correcting it would click');
    track.sync({ time: 4000 });
    assert.equal(made[0].currentTime, 4, 'the scene went to a moment: so did the sound');
    track.sync({ time: 100 });
    assert.ok(Math.abs(made[0].currentTime - 0.1) < 1e-9, 'and back');
    track.stop();
    assert.equal(made[0].paused, true);
});

test('a sound that loops goes round; where nothing can play, nothing is asked', () => {
    const { made, open } = player(2);
    const track = createSoundtrack({ sounds: [{ at: 0, src: 'rain.ogg', loop: true }], open, base: 'http://localhost/' });
    track.sync({ time: 5000 });
    assert.equal(made[0].paused, false);
    assert.equal(made[0].currentTime, 1, '5 s into a 2 s file that loops');
    const silent = createSoundtrack({ sounds: [{ at: 0, src: 'a.mp3' }], open: undefined });
    assert.equal(silent.count, globalThis.Audio ? 1 : 0);
    silent.sync({ time: 100 });
});

test('a browser that refuses sound is not asked again on every frame', async () => {
    let asked = 0;
    const open = () => ({ paused: true, currentTime: 0, duration: 5, play() { asked++; return Promise.reject(new Error('NotAllowedError')); }, pause() {} });
    const track = createSoundtrack({ sounds: [{ at: 0, src: 'a.mp3' }], open, base: 'http://localhost/' });
    for (let frame = 0; frame < 60; frame++) { track.sync({ time: 100 + frame * 16 }); await null; await null; }
    assert.ok(asked >= 2 && asked <= 3, `${asked} times in sixty frames`);
});

test('mistakes in the sounds of a scene are reported with their fix', () => {
    assert.deepEqual(checkSounds('s', undefined), []);
    assert.deepEqual(checkSounds('s', [{ at: 0, src: 'assets/a.mp3', volume: 0.3 }, { at: 200, src: 'b.WAV?v=2', loop: true }]), []);
    const fields = checkSounds('s', [{ src: 'a.mp3' }, { at: 0, src: 'notes.txt' }, { at: 0, src: 'a.mp3', volume: 3 }]).map(problem => problem.field);
    assert.deepEqual(fields, ['sounds[0].at', 'sounds[1].src', 'sounds[2].volume']);
    assert.equal(checkSounds('s', 'a.mp3')[0].field, 'sounds');
    const character = { name: 'dot', head: { create: () => ({ state: {}, frame() {}, draw() {} }) } };
    const scene = { cast: [{ id: 'a', character: 'dot', at: 0 }], tracks: {}, sounds: [{ at: -5, src: 'a.mp3' }] };
    assert.ok(checkComposition('s', scene, { characters: { dot: character } }).some(problem => problem.field === 'sounds[0].at'), 'a scene\'s check looks at its sounds');
});

test('a scene plays its sounds in its own time, and starts them again when it loops', async () => {
    const { made, open } = player(1);
    const clock = createClock();
    const show = playComposition({
        stage: fakeStage(), clock, origin: () => [0, 0], characters: {},
        composition: { cast: [], tracks: {}, length: 2000, loop: true, sounds: [{ at: 500, src: 'assets/pop.mp3' }] },
        sound: { open, base: 'http://localhost/' },
    });
    const run = async ms => { for (let done = 0; done < ms; done += 50) { clock.tick(50); await null; await null; } };
    await run(400);
    assert.equal(made[0].paused, true);
    await run(300);
    assert.equal(made[0].paused, false, 'at 0.7 s it sounds');
    show.sound({ playing: false });
    assert.equal(made[0].paused, true, 'the page holds the scene: the sound holds');
    show.sound({ playing: true });
    await run(1000);
    assert.equal(made[0].paused, true, 'the file is over');
    await run(1000);
    assert.equal(made[0].paused, false, 'the scene began again: so did its sound');
    assert.equal(made[0].plays >= 3, true);
    show.stop();
    assert.equal(made[0].paused, true);
    const mute = playComposition({ stage: fakeStage(), clock, origin: () => [0, 0], characters: {}, composition: { cast: [], tracks: {}, sounds: [{ at: 0, src: 'a.mp3' }] }, sound: false });
    clock.tick(50);
    assert.equal(made.length, 1, 'sound: false plays none');
    mute.stop();
});

test('a file the browser cannot move within is not put back to its place on every frame', () => {
    // Served by a host that gives no part of a file, a sound cannot be taken to a moment: it stays where it is.
    let moved = 0;
    const open = () => ({ paused: true, duration: 10, playbackRate: 1, get currentTime() { return 0; }, set currentTime(value) { moved++; }, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } });
    const track = createSoundtrack({ sounds: [{ at: 0, src: 'a.mp3' }], open, base: 'http://localhost/' });
    for (let frame = 0; frame < 120; frame++) track.sync({ time: 2000 + frame * 16 });
    assert.ok(moved <= 5, `${moved} times in 120 frames`);
});
