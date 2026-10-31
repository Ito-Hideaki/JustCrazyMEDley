const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'home.js'), 'utf8');
function setup() {
    let pressed = false;
    const context = vm.createContext({ Phaser: {
        Scene: class {},
        Input: { Keyboard: { JustDown: () => { const result = pressed; pressed = false; return result; } } }
    } });
    vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace('export ', '') +
        '\nglobalThis.Home = Home;', context);
    const scene = new context.Home();
    const played = [];
    const stopped = [];
    Object.assign(scene, {
        character: {
            x: 100, y: 600, displayHeight: 40,
            getBounds: () => ({ left: 90, right: 110 }),
            anims: { stop() {} }, setTexture() {}
        },
        characterBaseY: 600, velocityY: 0, isGrounded: true,
        gravity: 1000, jumpSpeed: 500, blocks: [],
        run() {}, sound: { play: key => played.push(key), stopByKey: key => stopped.push(key) },
        bumpBlock() {},
        scene: { manager: { keys: { Electrical: {} } } },
        cameras: { main: { fadeOut() {}, once() {} } }
    });
    return { scene, played, stopped, press: () => { pressed = true; }, frame: () => scene.update(0, 16) };
}

test('Home loads all applicable sound assets and initializes shared running audio', () => {
    const { scene } = setup();
    const loaded = [];
    scene.load = { image() {}, audio: (...args) => loaded.push(args) };
    scene.preload();
    assert.deepEqual(loaded.map(([key]) => key), ['running', 'jumpTakeoff', 'jumpAir', 'jumpLand', 'blockHit']);
    for (const [, asset] of loaded) assert.ok(fs.existsSync(path.join(__dirname, '..', asset)));
    assert.match(source, /setupRunningSound\(this, this\.character, \(\) => this\.velocityY\)/);
});

test('Home plays both jump sounds once and landing sound once', () => {
    const { scene, played, press, frame } = setup();
    press();
    frame();
    press();
    frame();
    assert.deepEqual(played, ['jumpTakeoff', 'jumpAir']);
    scene.character.y = 599;
    scene.velocityY = 100;
    frame();
    frame();
    assert.deepEqual(played, ['jumpTakeoff', 'jumpAir', 'jumpLand']);
});

test('Home head hit plays block sound and transition landing plays once', () => {
    const { scene, played, stopped, frame } = setup();
    scene.isGrounded = false;
    scene.character.y = 540;
    scene.velocityY = -500;
    scene.blocks = [{
        getBounds: () => ({ left: 80, right: 120, bottom: 515 }),
        getData: () => 'Electrical'
    }];
    frame();
    assert.equal(scene.isLeaving, true);
    assert.deepEqual(played, ['blockHit']);
    assert.deepEqual(stopped, ['jumpAir']);
    scene.character.y = 599;
    scene.velocityY = 100;
    frame();
    frame();
    assert.deepEqual(played, ['blockHit', 'jumpLand']);
});
