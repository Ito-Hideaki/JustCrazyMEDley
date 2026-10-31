const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'runningSound.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.replace('export ', ''), context);

function createScene() {
    const sound = {
        isPlaying: false, plays: 0, destroyed: false,
        addMarker(marker) { this.marker = marker; },
        play(marker) { assert.equal(marker, 'step'); this.isPlaying = true; this.plays++; },
        stop() { this.isPlaying = false; },
        destroy() { this.stop(); this.destroyed = true; }
    };
    const scene = {
        sound: { add(key) { assert.equal(key, 'running'); return sound; } },
        events: new EventEmitter(),
        characterStand: { x: 100 },
        characterStandVelocityY: 0,
        isGrounded: true,
        cursors: { left: { isDown: false }, right: { isDown: true } }
    };
    context.setupRunningSound(scene);
    const frame = (dx = 10) => {
        scene.characterStand.x += dx;
        scene.events.emit('postupdate');
    };
    return { scene, sound, frame };
}

test('running sound loops exactly the first 0.2 seconds without restarting each frame', () => {
    const { scene, sound, frame } = createScene();
    assert.equal(sound.marker.start, 0);
    assert.equal(sound.marker.duration, 0.2);
    assert.equal(sound.marker.config.loop, true);
    frame();
    frame();
    assert.equal(sound.plays, 1);
    frame(0);
    assert.equal(sound.isPlaying, false);
    scene.cursors.right.isDown = false;
    scene.cursors.left.isDown = true;
    frame(-10);
    assert.equal(sound.plays, 2);
    scene.cursors.left.isDown = false;
    frame();
    assert.equal(sound.isPlaying, false);
});

for (const [flag, value] of [
    ['isGrounded', false], ['characterStandVelocityY', -100],
    ['isDamageShowing', true], ['isGameOver', true], ['isLeaving', true],
    ['isCapturing', true], ['isEntering', true], ['mustReleasePitKeys', true], ['mustReleaseMovementKeys', true]
]) {
    test(`running sound stops while ${flag}=${value}`, () => {
        const { scene, sound, frame } = createScene();
        frame();
        scene[flag] = value;
        frame();
        assert.equal(sound.isPlaying, false);
    });
}

for (const event of ['pause', 'sleep', 'shutdown']) {
    test(`running sound stops on ${event} and cleans up on shutdown`, () => {
        const { scene, sound, frame } = createScene();
        frame();
        scene.events.emit(event);
        assert.equal(sound.isPlaying, false);
        if (event !== 'shutdown') scene.events.emit('shutdown');
        assert.equal(sound.destroyed, true);
        for (const name of ['postupdate', 'pause', 'sleep', 'shutdown']) {
            assert.equal(scene.events.listenerCount(name), 0);
        }
    });
}

test('all departments initialize running audio during scene creation', () => {
    for (const name of ['Mechanical', 'Electrical', 'Denshi', 'Joho', 'Chemical']) {
        const sceneSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        assert.match(sceneSource, /import \{ setupRunningSound \} from '\.\/runningSound\.js';/);
        const create = sceneSource.slice(sceneSource.indexOf('    create()'), sceneSource.indexOf('    update('));
        assert.match(create, /setupRunningSound\(this\);/);
    }
});

test('shared running audio supports Home character and velocity fields', () => {
    const sound = {
        isPlaying: false, addMarker() {},
        play() { this.isPlaying = true; },
        stop() { this.isPlaying = false; },
        destroy() {}
    };
    const scene = {
        events: new EventEmitter(), sound: { add: () => sound },
        character: { x: 100 }, velocityY: 0, isGrounded: true,
        cursors: { left: { isDown: false }, right: { isDown: true } }
    };
    context.setupRunningSound(scene, scene.character, () => scene.velocityY);
    scene.character.x += 10;
    scene.events.emit('postupdate');
    assert.equal(sound.isPlaying, true);
    scene.velocityY = -100;
    scene.character.x += 10;
    scene.events.emit('postupdate');
    assert.equal(sound.isPlaying, false);
    scene.events.emit('shutdown');
});
