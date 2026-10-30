const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'stageBgm.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.replace('export ', ''), context);

test('stage BGM loops at 20% volume and follows scene lifecycle without leaks', () => {
    const music = {
        playing: false, destroyed: false, plays: 0,
        play() { this.playing = true; this.plays++; },
        pause() { this.playing = false; },
        resume() { this.playing = true; },
        destroy() { this.playing = false; this.destroyed = true; }
    };
    const scene = {
        events: new EventEmitter(),
        sound: { add(key, config) {
            assert.equal(key, 'stageBgm');
            assert.equal(config.loop, true);
            assert.equal(config.volume, 0.2);
            return music;
        } }
    };
    context.setupStageBgm(scene);
    assert.equal(music.playing, true);
    for (const [stop, start] of [['pause', 'resume'], ['sleep', 'wake']]) {
        scene.events.emit(stop);
        assert.equal(music.playing, false);
        scene.events.emit(start);
        assert.equal(music.playing, true);
    }
    assert.equal(music.plays, 1);
    scene.events.emit('shutdown');
    assert.equal(music.playing, false);
    assert.equal(music.destroyed, true);
    assert.equal(scene.events.eventNames().length, 0);
});

test('all five departments start BGM in create, not Home', () => {
    for (const name of ['Mechanical', 'Electrical', 'Denshi', 'Joho', 'Chemical']) {
        const sceneSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        assert.match(sceneSource, /import \{ setupStageBgm \} from '\.\/stageBgm\.js';/);
        const create = sceneSource.slice(sceneSource.indexOf('    create()'), sceneSource.indexOf('    update('));
        assert.equal((create.match(/setupStageBgm\(this\);/g) || []).length, 1);
    }
    const home = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'home.js'), 'utf8');
    assert.doesNotMatch(home, /setupStageBgm/);
});

test('invincibility and lucky zone share special BGM until both end, without overlapping tracks', () => {
    const tracks = [];
    const scene = {
        events: new EventEmitter(),
        sound: { add(key, config) {
            assert.equal(config.loop, true);
            assert.equal(config.volume, 0.2);
            assert.ok(tracks.every(track => !track.playing));
            const track = {
                key, playing: false, destroyed: false,
                play() { this.playing = true; },
                pause() { this.playing = false; },
                resume() { this.playing = true; },
                destroy() { this.playing = false; this.destroyed = true; }
            };
            tracks.push(track);
            return track;
        } }
    };
    context.setupStageBgm(scene);
    const frame = () => scene.events.emit('postupdate');
    scene.isInvulnerable = true;
    scene.isPitRespawnProtected = true;
    frame();
    assert.equal(tracks.length, 1);
    scene.isStarInvincible = true;
    frame();
    assert.equal(tracks.at(-1).key, 'specialBgm');
    scene.isCameraRaised = true;
    frame();
    scene.isStarInvincible = false;
    frame();
    assert.equal(tracks.length, 2);
    scene.events.emit('pause');
    assert.equal(tracks.at(-1).playing, false);
    scene.events.emit('resume');
    assert.equal(tracks.at(-1).playing, true);
    scene.isCameraRaised = false;
    frame();
    assert.equal(tracks.at(-1).key, 'stageBgm');
    scene.isCameraRaised = true;
    frame();
    assert.equal(tracks.at(-1).key, 'specialBgm');
    scene.events.emit('shutdown');
    assert.ok(tracks.every(track => track.destroyed));
    assert.equal(scene.events.eventNames().length, 0);
});
