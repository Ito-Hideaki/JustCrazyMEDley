const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => fs.readFileSync(path.join(__dirname, '..', ...file.split('/')), 'utf8');
const source = read('src/scenes/Tutorial.js');
const context = vm.createContext({
    Electrical: class {
        constructor(key) { this.key = key; }
        update() {}
        getDamage(from, amount) {
            this.life = Math.max(0, this.life - amount);
            if (this.life === 0) this.gameOver();
        }
    },
    Phaser: { Input: { Keyboard: { JustDown: key => {
        const pressed = key.pressed;
        key.pressed = false;
        return pressed;
    } } } }
});
vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
    '\nglobalThis.Tutorial = Tutorial; globalThis.lessons = LESSONS;', context);

function setup(index = 0) {
    const scene = new context.Tutorial();
    const transitions = [];
    const saveData = { stages: [7, 8, 9, 10, 11], totalTangye: 45, completedCount: 2 };
    const character = {
        x: 220, y: 590, anims: { stop() {} },
        setPosition(x, y) { this.x = x; this.y = y; return this; },
        setTexture() { return this; }, setAlpha() { return this; }, setVisible() { return this; }
    };
    Object.assign(scene, {
        lessonIndex: index, maxLife: 5, characterStandBaseY: 590,
        characterStand: character, coyoteTime: 0.3, saveData,
        time: { removeAllEvents() {} }, tweens: { killAll() {} },
        sound: { stopByKey: key => assert.equal(key, 'jumpAir') },
        damageCauseText: { setVisible() {} },
        lessonText: { setText() {} }, lessonStatus: { setText(text) { this.text = text; } },
        nextKey: {}, retryKey: {}, skipKey: {}, skipLetterKey: {},
        updateLifeDisplay() {}, updateTangyeCountDisplay() {}, updateStompCountDisplay() {},
        placePracticeItem() {}, placeTangye() {},
        scene: { start: key => transitions.push(key) }
    });
    for (const group of ['tangyeGroup', 'AkatenGroup', 'AotenGroup', 'reportGroup', 'enadoriGroup', 'departmentDamageGroup']) {
        scene[group] = { clear() {} };
    }
    scene.startLesson();
    return { scene, transitions, saveData };
}

test('only the new-game title option routes to Tutorial; continuation still uses Spell', () => {
    const title = read('src/scenes/Title.js');
    assert.match(title, /label: 'はじめから（初めての方）', scene: 'Tutorial'/);
    assert.match(title, /label: 'つづきから（ふっかつのじゅもん）', scene: 'Spell'/);
    assert.match(read('src/main.js'), /const scenes = \[Title, Spell, Home, Tutorial,/);
    assert.match(read('src/scenes/Electrical.js'), /constructor\(sceneKey = 'Electrical'\)/);
});

test('five topics contain actual movement, collection, contact, stomping and life exercises', () => {
    assert.equal(new Set(context.lessons.map(lesson => lesson.section[0])).size, 5);
    for (const goal of ['move', 'collect', 'damage', 'stomp', 'recover', 'empty']) {
        assert.ok(context.lessons.some(lesson => lesson.goal === goal));
    }
    for (const item of ['red', 'blue', 'report', 'drink', 'special']) {
        assert.ok(context.lessons.some(lesson => lesson.item === item));
    }
    assert.equal(context.lessons.find(lesson => lesson.item === 'blue' && lesson.goal === 'damage').loss, 2);
});

test('skipping any exercise reaches Home exactly once and never modifies saves', () => {
    for (let i = 0; i < context.lessons.length; i++) {
        const { scene, transitions, saveData } = setup(i);
        const before = JSON.stringify(saveData);
        scene.skipKey.pressed = true;
        scene.update(0, 16);
        scene.finishTutorial();
        assert.deepEqual(transitions, ['Home']);
        assert.equal(JSON.stringify(saveData), before);
    }
});

test('S also skips when the host reserves Escape', () => {
    const { scene, transitions } = setup();
    scene.skipLetterKey.pressed = true;
    scene.update(0, 16);
    assert.deepEqual(transitions, ['Home']);
});

test('Enter cannot bypass an unfinished exercise; completed exercises advance and reset', () => {
    const { scene } = setup();
    scene.nextKey.pressed = true;
    scene.update(0, 16);
    assert.equal(scene.lessonIndex, 0);
    scene.actions = new Set(['left', 'right', 'jump']);
    scene.update(0, 16);
    assert.equal(scene.lessonReady, true);
    scene.nextKey.pressed = true;
    scene.update(0, 16);
    assert.equal(scene.lessonIndex, 1);
    assert.equal(scene.lessonReady, false);
    assert.equal(scene.mustReleasePitKeys, true);
    scene.runTangyeCount = 3;
    scene.update(0, 16);
    assert.equal(scene.lessonReady, true);
});

test('contact damage, stomps and life recovery satisfy their corresponding exercises', () => {
    for (let i = 0; i < context.lessons.length; i++) {
        const { scene } = setup(i);
        if (scene.lesson.goal === 'damage') scene.getDamage(0, scene.lesson.loss);
        else if (scene.lesson.goal === 'stomp') scene.stompCount = 1;
        else if (scene.lesson.goal === 'recover') { scene.life = 2; scene.stompCount = 1; }
        else continue;
        scene.update(0, 16);
        assert.equal(scene.lessonReady, true, scene.lesson.section);
    }
});

test('practice deaths can be retried without exiting or retaining damage and progress', () => {
    const { scene, transitions } = setup(4);
    scene.getDamage(0, 5);
    assert.equal(scene.practiceFailed, true);
    scene.retryKey.pressed = true;
    scene.update(0, 16);
    assert.equal(scene.isGameOver, false);
    assert.equal(scene.practiceFailed, false);
    assert.equal(scene.life, 4);
    assert.equal(scene.damageTaken, 0);
    assert.deepEqual(transitions, []);
});

test('final life-zero exercise completes tutorial without saving or a real game-over transition', () => {
    const { scene, transitions, saveData } = setup(context.lessons.length - 1);
    const before = JSON.stringify(saveData);
    scene.getDamage(0, 1);
    assert.equal(scene.lessonReady, true);
    scene.nextKey.pressed = true;
    scene.update(0, 16);
    assert.deepEqual(transitions, ['Home']);
    scene.saveStageRecord();
    scene.completeStage();
    scene.leaveStage();
    assert.equal(JSON.stringify(saveData), before);
});

test('real Tutorial damage bounce cannot stomp either grade, including the landing frame', () => {
    const electrical = read('src/scenes/Electrical.js');
    const real = vm.createContext({
        Phaser: {
            Scene: class {},
            Input: { Keyboard: { JustDown: () => false } },
            Geom: { Intersects: { RectangleToRectangle: () => true } }
        },
        isPitInputBlocked: () => false,
        deltaSeconds: 0.016, previousCharacterX: 650, previousCharacterY: 550
    });
    for (const code of [electrical, source]) {
        vm.runInContext(code.replace(/^import .*;\r?\n/gm, '').replace(/export /g, ''), real);
    }
    for (const [group, item, loss] of [['AkatenGroup', 'akaten', 1], ['AotenGroup', 'aoten', 2]]) {
        const scene = vm.runInContext('new Tutorial()', real);
        const timers = new Map();
        let stomps = 0;
        const data = { moving: true };
        const target = {
            getBounds: () => ({ left: 626.8, right: 673.2, top: 573.6, bottom: 620, centerY: 596.8 }),
            getData: key => data[key],
            setData(key, value) { data[key] = value; },
            setTexture() {}, setScale() {}
        };
        Object.assign(scene, {
            life: 5, maxLife: 5, damageTaken: 0, jumpSpeed: 500,
            lessonReady: false, playerHalfHeight: 20,
            characterStand: {
                x: 650, y: 600, anims: { stop() {} }, setTexture() {}, setAlpha() {},
                getBounds() { return { left: 630, right: 670, top: this.y - 20, bottom: this.y + 20 }; }
            },
            updateLifeDisplay() {}, showDamageCause() {},
            sound: { play() {}, stopByKey() {} },
            time: {
                delayedCall(delay, callback) { timers.set(delay, callback); return { remove() {} }; },
                addEvent: () => ({ remove() {} })
            },
            tweens: { killTweensOf() {} },
            [group]: { remove() {} }, tangyeGroup: { add() {} },
            registerStomp() { stomps++; },
            isGrounded: false, characterStandBaseY: 600, gravity: 1000,
            coyoteTimeRemaining: 0, spaceKey: {}, pits: [],
            platformGroup: { getChildren: () => [] }, wallGroup: { getChildren: () => [] },
            resolveHorizontalBlockCollisions() {}, updateHiddenBlockVisibility() {}
        });
        scene.getDamage(0, loss);
        assert.equal(scene.damageTaken, loss);
        timers.get(600)();
        assert.equal(scene.isDamageKnockback, true);
        const contact = electrical.match(new RegExp(
            `this\\.${group}\\.getChildren\\(\\)\\.slice\\(\\)\\.forEach\\(${item} => \\{([\\s\\S]*?)\\n        \\}\\);`
        ));
        real.scene = scene;
        real.target = target;
        real.playerGetDamage = {};
        const collide = () => vm.runInContext(
            `(function(${item}) {${contact[1]}\n}).call(scene, target);`, real);
        scene.previousCharacterY = 550;
        scene.characterStand.y = 570;
        scene.characterStandVelocityY = 100;
        assert.equal(scene.isHitFromAbove(target, true), true);
        collide();
        assert.equal(stomps, 0);
        const start = electrical.indexOf('        const wasGrounded =');
        const end = electrical.indexOf('        this.updateMovers(deltaSeconds);', start);
        const frame = () => vm.runInContext(
            `(function() {${electrical.slice(start, end)}\n}).call(scene);`, real);
        scene.characterStand.y = 550;
        scene.characterStandVelocityY = 4000;
        frame();
        assert.equal(scene.isGrounded, true);
        assert.equal(scene.isDamageKnockback, true);
        assert.equal(scene.isHitFromAbove(target, true), true);
        collide();
        assert.equal(stomps, 0);
        assert.equal(data.moving, true);
        assert.equal(scene.life, 5 - loss);
        frame();
        assert.equal(scene.isDamageKnockback, false);
        scene.previousCharacterY = 550;
        scene.characterStand.y = 570;
        scene.characterStandVelocityY = 100;
        collide();
        assert.equal(stomps, 1);
        assert.equal(data.moving, false);
    }
});
