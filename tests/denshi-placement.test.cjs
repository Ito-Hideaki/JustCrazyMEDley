const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Denshi.js'), 'utf8');
const context = vm.createContext({ Phaser: { Scene: class {} } });
vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace('export ', '') +
    '\nglobalThis.Scene = Denshi;', context);
const electricalSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Electrical.js'), 'utf8');
vm.runInContext(electricalSource.replace(/^import .*;\r?\n/gm, '').replace('export ', '') +
    '\nglobalThis.Electrical = Electrical;', context);

function setup(electrical = false) {
    const scene = electrical ? new context.Electrical() : new context.Scene();
    const groups = {};
    for (const name of ['AkatenGroup', 'AotenGroup', 'reportGroup', 'departmentDamageGroup']) {
        groups[name] = { items: [], add(item) { this.items.push(item); } };
    }
    const dimensions = {
        Akaten: 'Akaten.png', Aoten: 'Aoten.png',
        report1: 'report-1.png', DenshiDamageItem: 'D-condenser.png',
        ElectricalDamageItem: 'E-Kanden.png', block: 'block-one.png'
    };
    const images = Object.fromEntries(Object.entries(dimensions).map(([key, file]) => {
        const png = fs.readFileSync(path.join(__dirname, '..', 'assets', file));
        return [key, { width: png.readUInt32BE(16), height: png.readUInt32BE(20) }];
    }));
    Object.assign(scene, groups, {
        groundY: 620, worldWidth: 12800, pits: [], terrain: [],
        placeTerrain(x, y, columns, rows) {
            this.terrain.push({
                left: x, right: x + columns * images.block.width,
                top: y, bottom: y + rows * images.block.height
            });
        },
        itemPreviousPositions: new Map(),
        placeGroundSegment() {},
        textures: { get: key => ({ getSourceImage: () => images[key] }) },
        add: {
            image(x, y, key) {
                const data = {};
                return {
                    x, y, ...images[key],
                    setScale(scale) {
                        this.displayWidth = this.width * scale;
                        this.displayHeight = this.height * scale;
                        return this;
                    },
                    setData(key, value) { data[key] = value; return this; },
                    getData: key => data[key]
                };
            }
        }
    });
    scene.placeAllPits();
    scene.placeAllAkaten();
    scene.placeAllAoten();
    scene.placeAllReports();
    scene.placeAllDepartmentDamage();
    if (electrical) scene.placeAllWalls();
    return scene;
}

function envelope(item) {
    const { centerX, range } = item.getData('swing') ?? { centerX: item.x, range: 0 };
    return {
        left: centerX - range - item.displayWidth / 2,
        right: centerX + range + item.displayWidth / 2,
        top: item.y - item.displayHeight / 2,
        bottom: item.y + item.displayHeight / 2
    };
}

test('Denshi adds ten ground-level condensers while preserving the original', () => {
    const scene = setup();
    const items = scene.departmentDamageGroup.items;
    assert.equal(items.length, 11);
    assert.equal(items[0].getData('swing').centerX, 3500);
    assert.equal(items[0].getData('swing').range, 120);
    assert.equal(items[0].y, scene.groundY - 25);
    for (const item of items.slice(1)) {
        const bounds = envelope(item);
        assert.equal(bounds.bottom, scene.groundY);
        assert.ok(bounds.left >= 0 && bounds.right <= scene.worldWidth);
        assert.ok(!scene.pits.some(pit => bounds.left < pit.right && bounds.right > pit.left));
        assert.equal(item.getData('moving'), true);
        assert.equal(item.getData('damageEffectTexture'), 'DenshiDamageExplosion');
    }
});

test('Electrical has eleven stationary enlarged hazards resting on clear ground', () => {
    const scene = setup(true);
    const items = scene.departmentDamageGroup.items;
    assert.equal(items.length, 11);
    assert.equal(items[0].x, 600);
    const hazards = [...scene.AkatenGroup.items, ...scene.AotenGroup.items, ...scene.reportGroup.items, ...items];
    for (const item of items) {
        const a = envelope(item);
        assert.equal(item.displayWidth, 140);
        assert.equal(a.bottom, scene.groundY);
        assert.equal(item.getData('swing'), undefined);
        assert.equal(item.getData('moving'), true);
        assert.ok(a.left >= 0 && a.right <= scene.worldWidth);
        assert.ok(!scene.pits.some(pit => a.left < pit.right && a.right > pit.left));
        for (const b of [
            ...scene.terrain, ...hazards.filter(other => other !== item).map(envelope)
        ]) {
            assert.ok(a.right <= b.left || a.left >= b.right ||
                a.bottom <= b.top || a.top >= b.bottom, `overlap at x=${item.x}`);
        }
    }
});

test('condenser movement envelopes stay separated from other non-drink hazards', () => {
    const scene = setup();
    const condensers = scene.departmentDamageGroup.items;
    const hazards = [
        ...scene.AkatenGroup.items, ...scene.AotenGroup.items,
        ...scene.reportGroup.items, ...condensers
    ];
    for (const item of condensers) {
        const a = envelope(item);
        for (const other of hazards) {
            if (item === other) continue;
            const b = envelope(other);
            assert.ok(a.right <= b.left || a.left >= b.right ||
                a.bottom <= b.top || a.top >= b.bottom,
            `overlapping hazard movement near x=${item.getData('swing').centerX}`);
        }
    }
});
