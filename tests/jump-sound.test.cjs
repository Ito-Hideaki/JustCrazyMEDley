const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const name of ['Mechanical', 'Electrical', 'Denshi', 'Joho', 'Chemical']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
    const start = source.indexOf('        const wasGrounded =');
    const end = source.indexOf('        this.updateMovers(deltaSeconds);', start);
    assert.ok(start >= 0 && end > start);
    const code = source.slice(start, end);

    function setup({ grounded = false, y = 480, velocity = 100, pressed = false, allowed = false, blocked = false, platform = false } = {}) {
        const played = [];
        const stopped = [];
        const bounds = { left: 80, right: 120, top: 500, bottom: 530, centerX: 100 };
        const block = { getBounds: () => bounds, getData: () => false };
        const scene = {
            characterStand: { x: 100, y, getBounds: () => ({ left: 90, right: 110 }) },
            playerHalfHeight: 20,
            characterStandVelocityY: velocity,
            characterStandBaseY: 600,
            gravity: 1000,
            jumpSpeed: 500,
            isGrounded: grounded,
            isDamageKnockback: true,
            coyoteJumpAvailable: allowed,
            coyoteTimeRemaining: allowed ? 0.3 : 0,
            sound: { play: key => played.push(key), stopByKey: key => stopped.push(key) },
            spaceKey: {},
            platformGroup: { getChildren: () => platform ? [block] : [] },
            wallGroup: { getChildren: () => [] },
            solidBlockBounds: platform ? [{ block, bounds }] : [],
            getPlayerCollisionBounds: () => ({ left: 90, right: 110 }),
            isHitFromAbove() {
                return this.characterStandVelocityY > 0 &&
                    this.previousCharacterY + 20 <= 500 && this.characterStand.y + 20 >= 500;
            },
            resolveHorizontalBlockCollisions() {},
            resolveLowerLaneRestriction() {},
            updateHiddenBlockVisibility() {},
            pits: []
        };
        const context = vm.createContext({
            scene, deltaSeconds: 0.016, previousCharacterX: 100, previousCharacterY: y,
            isPitInputBlocked: () => blocked,
            Phaser: { Input: { Keyboard: { JustDown: () => pressed } } }
        });
        const frame = () => vm.runInContext(`(function() {${code}\n}).call(scene);`, context);
        return { scene, played, stopped, frame };
    }

    test(`${name}: takeoff audio requires an accepted, unblocked jump`, () => {
        for (const [pressed, allowed, blocked] of [
            [true, true, false], [false, true, false], [true, false, false], [true, true, true]
        ]) {
            const { played, frame } = setup({ grounded: true, y: 600, velocity: 0, pressed, allowed, blocked });
            frame();
            assert.deepEqual(played, pressed && allowed && !blocked ? ['jumpTakeoff', 'jumpAir'] : []);
        }
    });

    test(`${name}: extra jump sound plays once, not every airborne frame or on a pit fall`, () => {
        const { scene, played, frame } = setup({ grounded: true, y: 600, velocity: 0, pressed: true, allowed: true });
        frame();
        scene.coyoteJumpAvailable = false;
        scene.coyoteTimeRemaining = 0;
        frame();
        assert.deepEqual(played, ['jumpTakeoff', 'jumpAir']);
        const falling = setup({ y: 650, velocity: 300 });
        falling.scene.pits = [{ left: 0, right: 200 }];
        falling.frame();
        assert.deepEqual(falling.played, []);
    });

    test(`${name}: landing audio plays once on ground and blocks, not in midair or while standing`, () => {
        for (const platform of [false, true]) {
            const { scene, played, stopped, frame } = setup({ y: platform ? 479 : 599, platform });
            frame();
            assert.deepEqual(played, ['jumpLand']);
            assert.ok(stopped.includes('jumpAir'));
            assert.equal(scene.isGrounded, true);
            assert.equal(scene.characterStandVelocityY, 0);
            assert.equal(scene.isDamageKnockback, name === 'Electrical');
            frame();
            assert.equal(scene.isDamageKnockback, false);
            assert.deepEqual(played, ['jumpLand']);
        }
        const { scene, played, frame } = setup({ y: 300 });
        frame();
        assert.deepEqual(played, []);
        assert.equal(scene.isDamageKnockback, true);
    });
}
