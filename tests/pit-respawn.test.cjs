const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', file), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
const context = vm.createContext({
    Phaser: { Scene: class {}, Math: { Clamp: (value, min, max) => Math.max(min, Math.min(value, max)) } }
});
vm.runInContext(read('pitRespawn.js') + '\nglobalThis.helpers = {getGroundRespawnX, isPitInputBlocked, lockPitRespawnInput};', context);
const { getGroundRespawnX, isPitInputBlocked, lockPitRespawnInput } = context.helpers;

test('respawn input requires release before a fresh press, with no delay', () => {
    for (const held of ['left', 'right', 'up', 'down', 'space', 'shift']) {
        const scene = {
            time: { now: 100 },
            cursors: Object.fromEntries(['left', 'right', 'up', 'down', 'space', 'shift']
                .map(key => [key, { isDown: key === held }])),
        };
        scene.spaceKey = scene.cursors.space;
        lockPitRespawnInput(scene);
        assert.equal(isPitInputBlocked(scene), true);
        scene.cursors[held].isDown = false;
        assert.equal(isPitInputBlocked(scene), false);
        scene.cursors[held].isDown = true;
        assert.equal(isPitInputBlocked(scene), false);
    }
});

test('released controls unlock immediately without a timed wait', () => {
    const scene = {
        time: { now: 0 },
        cursors: { left: { isDown: false }, right: { isDown: false } },
        spaceKey: { isDown: false }
    };
    lockPitRespawnInput(scene);
    assert.equal(isPitInputBlocked(scene), false);
    scene.cursors.right.isDown = true;
    assert.equal(isPitInputBlocked(scene), false);
});

test('isolated pits retain the original 150px respawn offset', () => {
    assert.equal(getGroundRespawnX([{ left: 1000, right: 1400 }], 1200, 40), 850);
    assert.equal(getGroundRespawnX([], 220, 40), 220);
});

test('consecutive pits respawn on the intervening island, not in the previous pit', () => {
    const pits = [{ left: 1000, right: 1300 }, { left: 1400, right: 1500 }];
    assert.equal(getGroundRespawnX(pits, 1450, 40), 1341);
    assert.equal(getGroundRespawnX(pits, 1450, 80), 1350);
    assert.equal(getGroundRespawnX([...pits].reverse(), 1450, 40), 1341);
});

test('touching and overlapping pits do not produce a nonexistent ground segment', () => {
    const pits = [{ left: 1000, right: 1300 }, { left: 1200, right: 1400 }, { left: 1400, right: 1500 }];
    assert.equal(getGroundRespawnX(pits, 1450, 40), 850);
    assert.equal(pits[0].right, 1300);
});

for (const name of ['Mechanical', 'Electrical', 'Denshi', 'Joho', 'Chemical']) {
    vm.runInContext(read(`${name}.js`) + `\nglobalThis.${name} = ${name};`, context);
    test(`${name}: movement does not resume from a held key after respawn`, () => {
        const scene = new context[name]();
        Object.assign(scene, {
            time: { now: 0 },
            cursors: { left: { isDown: false }, right: { isDown: true } },
            spaceKey: { isDown: false },
            moveSpeed: 600,
            characterStand: {
                x: 500, displayWidth: 100,
                anims: { stop() {}, isPlaying: false },
                setFlipX() {}, play() {}, setTexture() {}
            }
        });
        lockPitRespawnInput(scene);
        scene.run(0.1);
        assert.equal(scene.characterStand.x, 500);
        scene.run(0.1);
        assert.equal(scene.characterStand.x, 500);
        scene.cursors.right.isDown = false;
        scene.run(0.1);
        assert.equal(scene.characterStand.x, 500);
        scene.cursors.right.isDown = true;
        scene.run(0.1);
        assert.equal(scene.characterStand.x, 560);
    });

    test(`${name}: pit respawn protects against item damage for 1500ms, but not another fall`, () => {
        const scene = new context[name]();
        let expireProtection;
        Object.assign(scene, {
            life: 5,
            isInvulnerable: false,
            isStarInvincible: false,
            isPitRespawnProtected: false,
            isDamageKnockback: true,
            pits: [{ left: 1000, right: 1400 }],
            wallGroup: { getChildren: () => [] },
            characterStand: { x: 1200, y: 1000, displayWidth: 100 },
            characterStandBaseY: 570,
            updateLifeDisplay() {},
            time: {
                now: 0,
                delayedCall(delay, callback) {
                    assert.equal(delay, 1500);
                    expireProtection = callback;
                    return { remove() {} };
                }
            }
        });

        assert.equal(scene.isDamageImmune(), false);
        scene.fallIntoPit();
        assert.equal(scene.isDamageKnockback, false);
        assert.equal(scene.mustReleasePitKeys, true);
        assert.equal(scene.life, 4);
        assert.equal(scene.isDamageImmune(), true);
        scene.getDamage(0);
        scene.getAoten();
        assert.equal(scene.life, 4);
        scene.characterStand.x = 1200;
        scene.fallIntoPit();
        assert.equal(scene.life, 3);
        expireProtection();
        assert.equal(scene.isDamageImmune(), false);
        assert.equal(scene.pitRespawnProtectionTimer, null);
    });

    test(`${name}: actual damage marks knockback beyond the damage animation timer`, () => {
        const scene = new context[name]();
        const callbacks = new Map();
        Object.assign(scene, {
            life: 5,
            updateLifeDisplay() {},
            characterStand: {
                anims: { stop() {} }, setTexture() {}, setAlpha() {}, alpha: 1
            },
            time: {
                delayedCall(delay, callback) {
                    callbacks.set(delay, callback);
                    return { remove() {} };
                },
                addEvent: () => ({ remove() {} })
            }
        });
        scene.getDamage(0);
        assert.equal(scene.isDamageKnockback, true);
        assert.equal(scene.characterStandVelocityY, -800);
        callbacks.get(600)();
        assert.equal(scene.isDamageShowing, false);
        assert.equal(scene.isDamageKnockback, true);
        callbacks.get(1500)();
        assert.equal(scene.isInvulnerable, false);
        assert.equal(scene.isDamageKnockback, true);
    });

    test(`${name}: every actual pit respawns over ground with life reduced only once`, () => {
        const scene = new context[name]();
        Object.assign(scene, {
            pits: [], worldWidth: 12800, groundY: 620,
            placeGroundSegment() {},
            wallGroup: { getChildren: () => [] },
            characterStand: { x: 0, y: 1000, displayWidth: 100 },
            characterStandBaseY: 570,
            time: { now: 0, delayedCall: () => ({ remove() {} }) },
            getDamage() { this.life -= 1; }
        });
        scene.placeAllPits();
        for (const pit of scene.pits) {
            for (const x of [pit.left + 1, (pit.left + pit.right) / 2, pit.right - 1]) {
                scene.life = 5;
                scene.characterStand.x = x;
                scene.fallIntoPit();
                const respawn = scene.characterStand.x;
                assert.ok(!scene.pits.some(hole => respawn >= hole.left && respawn <= hole.right),
                    `${name}: fell at ${x}, respawned at ${respawn}`);
                assert.equal(scene.characterStand.y, 570);
                assert.equal(scene.characterStandVelocityY, 0);
                assert.equal(scene.life, 4);
            }
        }
    });
}

test('Mechanical retains the existing wall-top respawn', () => {
    const scene = new context.Mechanical();
    Object.assign(scene, {
        pits: [{ left: 1825, right: 2425 }],
        wallGroup: { getChildren: () => [{ getBounds: () => ({ left: 1600, right: 1825, top: 400 }) }] },
        characterStand: { x: 2000, displayWidth: 100 },
        playerHalfHeight: 50,
        time: { now: 0, delayedCall: () => ({ remove() {} }) },
        getDamage() {}
    });
    scene.fallIntoPit();
    assert.equal(scene.characterStand.x, 1712.5);
    assert.equal(scene.characterStand.y, 350);
});
