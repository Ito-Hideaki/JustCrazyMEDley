const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

for (const name of ['Mechanical', 'Electrical', 'Denshi', 'Joho', 'Chemical']) {
    test(`${name}: loads the collection sound and plays it once per collected credit`, () => {
        const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        const context = vm.createContext({ Phaser: { Scene: class {} } });
        vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
            `\nglobalThis.Scene = ${name};`, context);
        const scene = new context.Scene();
        const loaded = [];
        scene.load = { image() {}, audio: (...args) => loaded.push(args) };
        scene.preload();
        assert.deepEqual(loaded, [
            ['specialBgm', 'assets/maou_bgm_8bit29.mp3'],
            ['itemStomp', 'assets/決定ボタンを押す50.mp3'],
            ['gradeStomp', 'assets/決定ボタンを押す33.mp3'],
            ['stageBgm', 'assets/魔王魂 ループ  8bit05.mp3'],
            ['jumpTakeoff', 'assets/キャンセル9.mp3'],
            ['jumpLand', 'assets/ジャンプの着地.mp3'],
            ['jumpAir', 'assets/ちょこっと触る.mp3'],
            ['blockHit', 'assets/決定ボタンを押す44.mp3'],
            ['running', 'assets/アスファルトの上を走る1.mp3'],
            ['tangyeCollect', 'assets/決定ボタンを押す35.mp3'],
            ['akatenHit', 'assets/ガラスにひびが入る.mp3'],
            ['aotenHit', 'assets/石が砕ける.mp3'],
            ['reportHit', 'assets/ビープ音4.mp3'],
            ['enadoriHit', 'assets/缶を開ける.mp3'],
            ...(name === 'Chemical' ? [['chemicalHit', 'assets/グラスにワインを注ぐ.mp3']] : []),
            ...(name === 'Electrical' ? [['electricalHit', 'assets/電気バチバチ.mp3']] : []),
            ...(name === 'Mechanical' ? [['scooterHit', 'assets/ロボットを殴る1.mp3']] : []),
            ...(name === 'Joho' ? [['semicolonHit', 'assets/old-ubuntu-error-sound.mp3']] : []),
            ...(name === 'Denshi' ? [['condenserExplosion', 'assets/マッチの火を吹き消す.mp3']] : [])
        ]);
        for (const [, asset] of loaded) {
            assert.ok(fs.existsSync(path.join(__dirname, '..', asset)), asset);
        }

        const collection = source.match(/this\.tangyeGroup\.getChildren\(\)\.slice\(\)\.forEach\(tangye => \{([\s\S]*?)\n        \}\);/);
        assert.ok(collection);
        let touching = false;
        const played = [];
        const data = { awaitingSeparation: true };
        const tangye = {
            getBounds: () => ({}),
            getData: key => data[key],
            setData: (key, value) => { data[key] = value; },
            destroy() { this.destroyed = true; }
        };
        Object.assign(scene, {
            characterStand: { y: 0 },
            characterStandVelocityY: 0,
            runTangyeCount: 0,
            isHitFromAbove: () => false,
            sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
            updateTangyeCountDisplay() {}
        });
        context.Phaser.Geom = { Intersects: { RectangleToRectangle: () => touching } };
        context.scene = scene;
        context.tangye = tangye;
        context.playerBounds = {};
        const collect = () => vm.runInContext(`(function(tangye) {${collection[1]}\n}).call(scene, tangye);`, context);
        touching = true;
        collect();
        assert.equal(played.length, 0);
        touching = false;
        collect();
        assert.equal(played.length, 0);
        touching = true;
        collect();
        assert.deepEqual(played, ['tangyeCollect']);
        assert.equal(scene.runTangyeCount, 1);
        assert.equal(tangye.destroyed, true);
    });

    if (name === 'Denshi') {
        test('Denshi: condenser explosion plays once, including while immune, but not on stomps', () => {
            const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Denshi.js'), 'utf8');
            let touching = false;
            let above = false;
            const context = vm.createContext({ Phaser: {
                Scene: class {},
                Geom: { Intersects: { RectangleToRectangle: () => touching } }
            } });
            vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
                '\nglobalThis.Scene = Denshi;', context);
            for (const immune of [false, true]) {
                const scene = new context.Scene();
                const played = [];
                let damage = 0;
                const data = { damageEffectTexture: 'DenshiDamageExplosion' };
                const target = {
                    getBounds: () => ({}),
                    getData: key => data[key],
                    setData(key, value) { data[key] = value; return this; },
                    setTexture() {},
                    setScale() {},
                    setAlpha() {},
                    destroy() {}
                };
                Object.assign(scene, {
                    sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
                    isHitFromAbove: () => above,
                    isDamageImmune: () => immune,
                    showDamageCause() {},
                    getDamage: () => { damage++; },
                    registerStomp() {},
                    jumpSpeed: 100,
                    departmentDamageGroup: { remove() {} },
                    itemPreviousPositions: new Map(),
                    textures: { get: () => ({ getSourceImage: () => ({ width: 70, height: 55 }) }) },
                    tweens: { add() {} }
                });
                touching = false;
                above = false;
                scene.handleStompableContact(target, {}, 'departmentDamage');
                assert.deepEqual(played, []);
                touching = true;
                above = true;
                scene.handleStompableContact(target, {}, 'departmentDamage');
                assert.equal(played.pop(), 'itemStomp');
                assert.deepEqual(played, []);
                above = false;
                scene.handleStompableContact(target, {}, 'departmentDamage');
                scene.handleStompableContact(target, {}, 'departmentDamage');
                assert.deepEqual(played, ['condenserExplosion']);
                assert.equal(data.spent, true);
                assert.equal(damage, immune ? 0 : 1);
            }
        });

    }

    test(`${name}: item sounds match damaging contacts only`, () => {
        const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        const context = vm.createContext({ Phaser: {
            Scene: class {},
            Geom: { Intersects: { RectangleToRectangle: () => true } }
        } });
        vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
            `\nglobalThis.Scene = ${name};`, context);
        const scene = new context.Scene();
        let above = false;
        let immune = false;
        let damage = 0;
        let stomps = 0;
        const played = [];
        Object.assign(scene, {
            isHitFromAbove: () => above,
            isDamageImmune: () => immune,
            showDamageCause() {},
            sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
            getDamage: () => { damage++; immune = true; },
            registerStomp: () => { stomps++; },
            jumpSpeed: 100
        });
        const target = { getBounds: () => ({}), getData: () => undefined, destroy() {} };
        scene.handleStompableContact(target, {}, 'report');
        scene.handleStompableContact(target, {}, 'report');
        assert.deepEqual(played, ['reportHit']);
        assert.equal(damage, 1);
        immune = false;
        above = true;
        scene.handleStompableContact(target, {}, 'report');
        assert.equal(stomps, 1);
        assert.equal(played.pop(), 'itemStomp');
        assert.equal(damage, 1);
        assert.deepEqual(played, ['reportHit']);
        scene.handleStompableContact(target, {}, 'enadori');
        assert.equal(stomps, 2);
        assert.equal(played.pop(), 'itemStomp');
        assert.equal(damage, 1);
        assert.deepEqual(played, ['reportHit']);
        above = false;
        immune = true;
        scene.handleStompableContact(target, {}, 'enadori');
        assert.deepEqual(played, ['reportHit']);
        assert.equal(damage, 1);
        if (name === 'Joho' || name === 'Electrical') {
            scene.handleStompableContact(target, {}, 'departmentDamage');
            assert.deepEqual(played, ['reportHit']);
            assert.equal(damage, 1);
            above = true;
            immune = false;
            scene.handleStompableContact(target, {}, 'departmentDamage');
            assert.equal(played.pop(), 'itemStomp');
            assert.deepEqual(played, ['reportHit']);
            assert.equal(damage, 1);
            above = false;
        }
        for (const kind of ['enadori', 'departmentDamage']) {
            immune = false;
            scene.handleStompableContact(target, {}, kind);
        }
        assert.equal(damage, 3);
        assert.deepEqual(played, name === 'Joho'
            ? ['reportHit', 'enadoriHit', 'semicolonHit']
            : name === 'Electrical'
            ? ['reportHit', 'enadoriHit', 'electricalHit']
            : ['reportHit', 'enadoriHit']);
        if (name === 'Mechanical') {
            const scooter = { ...target, getData: key => key === 'type' ? 'scooter' : undefined };
            immune = false;
            above = true;
            scene.handleStompableContact(scooter, {}, 'enadori');
            assert.equal(played.pop(), 'itemStomp');
            assert.deepEqual(played, ['reportHit', 'enadoriHit']);
            assert.equal(damage, 3);
            above = false;
            immune = true;
            scene.handleStompableContact(scooter, {}, 'enadori');
            assert.deepEqual(played, ['reportHit', 'enadoriHit']);
            assert.equal(damage, 3);
            immune = false;
            scene.handleStompableContact(scooter, {}, 'enadori');
            scene.handleStompableContact(scooter, {}, 'enadori');
            assert.deepEqual(played, ['reportHit', 'enadoriHit', 'scooterHit']);
            assert.equal(damage, 4);
        }
    });

    if (name === 'Electrical') {
        test('Electrical: places the shock image at x=600 and plays exactly its first 0.5 seconds', () => {
            const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Electrical.js'), 'utf8');
            const context = vm.createContext({ Phaser: {
                Scene: class {},
                Geom: { Intersects: { RectangleToRectangle: () => true } }
            } });
            vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
                '\nglobalThis.Scene = Electrical;', context);
            const scene = new context.Scene();
            const images = [];
            const loaded = [];
            scene.load = { audio() {}, image: (...args) => loaded.push(args) };
            scene.preload();
            assert.ok(loaded.some(([key, asset]) =>
                key === 'ElectricalDamageItem' && asset === 'assets/E-Kanden.png'));
            Object.assign(scene, {
                groundY: 500,
                add: { image(x, y, texture) {
                    const item = { x, y, texture, setScale() {}, setData() {} };
                    images.push(item);
                    return item;
                } },
                textures: { get: () => ({ getSourceImage: () => ({ width: 70, height: 55 }) }) },
                departmentDamageGroup: { add() {} },
                itemPreviousPositions: new Map()
            });
            scene.placeAllDepartmentDamage();
            assert.equal(images.length, 11);
            assert.equal(images[0].x, 600);
            assert.equal(images[0].y, 445);
            assert.equal(images[0].texture, 'ElectricalDamageItem');
            const played = [];
            Object.assign(scene, {
                isHitFromAbove: () => false,
                isDamageImmune: () => false,
                showDamageCause() {},
                getDamage() {},
                sound: { play: (key, marker) => played.push([key, marker.name, marker.start, marker.duration]), stopByKey: key => assert.equal(key, 'jumpAir') }
            });
            scene.handleStompableContact({ getBounds: () => ({}), destroy() {} }, {}, 'departmentDamage');
            assert.deepEqual(played, [['electricalHit', 'shock', 0, 0.5]]);
        });
    }

    if (name === 'Chemical') {
        test('Chemical: original hazard damage plays only the first 0.6 seconds, not on stomps or while immune', () => {
            const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Chemical.js'), 'utf8');
            let touching = true;
            let above = false;
            let immune = false;
            const context = vm.createContext({ Phaser: {
                Scene: class {},
                Geom: { Intersects: { RectangleToRectangle: () => touching } }
            } });
            vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
                '\nglobalThis.Scene = Chemical;', context);
            const scene = new context.Scene();
            const played = [];
            let damage = 0;
            const makeTarget = () => {
                const data = { damageEffectTexture: 'ChemicalDamageExplosion' };
                return {
                    x: 600, displayHeight: 55,
                    getBounds: () => ({}),
                    getData: key => data[key],
                    setData(key, value) { data[key] = value; return this; },
                    setTexture() {},
                    setScale() {},
                    setFlipX() {},
                    setY() {},
                    setAlpha() {},
                    destroy() {}
                };
            };
            Object.assign(scene, {
                sound: { play: (key, marker) => played.push(marker
                    ? [key, marker.name, marker.start, marker.duration] : [key]), stopByKey: key => assert.equal(key, 'jumpAir') },
                isHitFromAbove: () => above,
                isDamageImmune: () => immune,
                showDamageCause() {},
                getDamage: () => { damage++; },
                registerStomp() {},
                jumpSpeed: 100,
                groundY: 500,
                characterStand: { x: 500 },
                departmentDamageGroup: { remove() {} },
                itemPreviousPositions: new Map(),
                textures: { get: () => ({ getSourceImage: () => ({ width: 70, height: 55 }) }) },
                tweens: { add() {} }
            });
            touching = false;
            scene.handleStompableContact(makeTarget(), {}, 'departmentDamage');
            touching = true;
            above = true;
            scene.handleStompableContact(makeTarget(), {}, 'departmentDamage');
            assert.equal(played.pop()[0], 'itemStomp');
            above = false;
            immune = true;
            scene.handleStompableContact(makeTarget(), {}, 'departmentDamage');
            assert.deepEqual(played, []);
            assert.equal(damage, 0);
            immune = false;
            const target = makeTarget();
            scene.handleStompableContact(target, {}, 'departmentDamage');
            scene.handleStompableContact(target, {}, 'departmentDamage');
            assert.deepEqual(played, [['chemicalHit', 'pour', 0, 0.6]]);
            assert.equal(damage, 1);
        });
    }

    test(`${name}: block head hits play sound for normal and hidden blocks, not landing or side contact`, () => {
        const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        const start = source.indexOf('        const characterBounds =', source.indexOf('const previousHeadTopY'));
        const end = source.indexOf('        this.resolveHorizontalBlockCollisions', start);
        assert.ok(start >= 0 && end > start);
        for (const hidden of [false, true]) {
            for (const contact of ['head', 'landing', 'side']) {
                const played = [];
                const data = { hiddenBlock: hidden, revealed: false };
                const platform = {
                    getBounds: () => ({ left: 80, right: 120, top: 100, bottom: 115, centerX: 100 }),
                    getData: key => data[key],
                    setVisible() { return this; },
                    setAlpha() { return this; },
                    setData(key, value) { data[key] = value; return this; }
                };
                data.hiddenGroup = [platform];
                const bounds = contact === 'side' ? { left: 130, right: 150 } : { left: 90, right: 110 };
                const scene = {
                    characterStand: { y: contact === 'landing' ? 85 : 130, getBounds: () => bounds },
                    previousCharacterY: contact === 'landing' ? 75 : 140,
                    playerHalfHeight: 20,
                    characterStandVelocityY: contact === 'landing' ? 100 : -100,
                    platformGroup: { getChildren: () => [platform] },
                    wallGroup: { getChildren: () => [] },
                    solidBlockBounds: [{ block: platform, bounds: platform.getBounds() }],
                    getPlayerCollisionBounds: () => bounds,
                    isHitFromAbove: () => contact === 'landing',
                    sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
                    tweens: { killTweensOf() {} },
                    placeTangye: () => ({ displayHeight: 20 }),
                    itemPreviousPositions: new Map()
                };
                const context = vm.createContext({ scene, previousHeadTopY: scene.previousCharacterY - 20 });
                const collide = () => vm.runInContext(`(function() {${source.slice(start, end)} }).call(scene);`, context);
                collide();
                assert.deepEqual(played, contact === 'head' ? ['blockHit'] : []);
                if (contact === 'head') {
                    assert.equal(scene.characterStandVelocityY, 0);
                    assert.equal(scene.characterStand.y, 135);
                    scene.previousCharacterY = scene.characterStand.y;
                    context.previousHeadTopY = scene.previousCharacterY - scene.playerHalfHeight;
                    scene.characterStand.y += 1;
                    collide();
                    assert.deepEqual(played, ['blockHit']);
                }
            }
        }
    });

    test(`${name}: all non-grade damage items play button-50 on stomps even while immune`, () => {
        const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
        let touching = true;
        const context = vm.createContext({ Phaser: {
            Scene: class {},
            Geom: { Intersects: { RectangleToRectangle: () => touching } }
        } });
        vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace(/export /g, '') +
            `\nglobalThis.Scene = ${name};`, context);
        const scene = new context.Scene();
        const played = [];
        let destroyed = 0;
        Object.assign(scene, {
            isHitFromAbove: () => true,
            isDamageImmune: () => true,
            sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
            registerStomp() {},
            jumpSpeed: 100
        });
        for (const kind of ['report', 'enadori', 'departmentDamage']) {
            const target = {
                getBounds: () => ({}), getData: () => undefined,
                destroy: () => { destroyed++; }
            };
            touching = false;
            scene.handleStompableContact(target, {}, kind);
            touching = true;
            scene.handleStompableContact(target, {}, kind);
        }
        assert.deepEqual(played, ['itemStomp', 'itemStomp', 'itemStomp']);
        assert.equal(destroyed, 3);
    });

    for (const [group, item, sound] of [
        ['AkatenGroup', 'akaten', 'akatenHit'],
        ['AotenGroup', 'aoten', 'aotenHit']
    ]) {
        test(`${name}: ${item} plays contact sound only for damaging contact, not stomps`, () => {
            const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', `${name}.js`), 'utf8');
            const contact = source.match(new RegExp(
                `this\\.${group}\\.getChildren\\(\\)\\.slice\\(\\)\\.forEach\\(${item} => \\{([\\s\\S]*?)\\n        \\}\\);`
            ));
            assert.ok(contact);
            let touching = true;
            let above = false;
            let immune = false;
            let damage = 0;
            let stomps = 0;
            const played = [];
            const data = { moving: true };
            const target = {
                getBounds: () => ({}),
                getData: key => data[key],
                setData: (key, value) => { data[key] = value; },
                setTexture() {},
                setScale() {}
            };
            const scene = {
                isHitFromAbove: () => above,
                isDamageImmune: () => immune,
                showDamageCause() {},
                sound: { play: key => played.push(key), stopByKey: key => assert.equal(key, 'jumpAir') },
                getDamage: () => { damage++; immune = true; },
                getAoten: () => { damage++; immune = true; },
                tweens: { killTweensOf() {} },
                [group]: { remove() {} },
                tangyeGroup: { add() {} },
                registerStomp: () => { stomps++; },
                jumpSpeed: 100,
                life: 3,
                maxLife: 3
            };
            const context = vm.createContext({
                scene, target, playerGetDamage: {},
                Phaser: { Geom: { Intersects: { RectangleToRectangle: () => touching } } }
            });
            const collide = () => vm.runInContext(
                `(function(${item}) {${contact[1]}\n}).call(scene, target);`, context
            );
            touching = false;
            collide();
            assert.deepEqual(played, []);
            touching = true;
            collide();
            collide();
            assert.deepEqual(played, [sound]);
            assert.equal(damage, 1);
            scene.isDamageKnockback = true;
            above = true;
            scene.isDamageShowing = false;
            collide();
            assert.equal(stomps, 0);
            assert.equal(data.moving, true);
            assert.deepEqual(played, [sound]);
            scene.isDamageKnockback = false;
            immune = true;
            above = true;
            collide();
            assert.equal(stomps, 1);
            assert.deepEqual(played, [sound, 'gradeStomp']);
            assert.equal(data.moving, false);
            assert.equal(data.awaitingSeparation, true);
            assert.equal(scene.characterStandVelocityY, -100);
            above = false;
            collide();
            assert.deepEqual(played, [sound, 'gradeStomp']);
            assert.equal(damage, 1);
            data.moving = true;
            above = true;
            immune = false;
            collide();
            assert.equal(stomps, 2);
            assert.deepEqual(played, [sound, 'gradeStomp', 'gradeStomp']);
            assert.equal(damage, 1);
        });
    }
}
