const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Mechanical.js'), 'utf8');
const context = vm.createContext({ Phaser: {
    Scene: class {},
    Math: { FloatBetween: (min, max) => (min + max) / 2 }
} });
vm.runInContext(source.replace(/^import .*;\r?\n/gm, '').replace('export ', '') +
    '\nglobalThis.Scene = Mechanical;', context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'hazardSpawn.js'), 'utf8')
    .replace('export ', ''), context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'scenes', 'Electrical.js'), 'utf8')
    .replace(/^import .*;\r?\n/gm, '').replace('export ', '') +
    '\nglobalThis.Electrical = Electrical;', context);

function setup(bounds, Scene = context.Scene) {
    const scene = new Scene();
    const created = [];
    const make = (x, y, width, height) => {
        const data = {};
        const obj = {
            x, y, width, height,
            setVisible() { return this; },
            setScale() { return this; },
            setData(key, value) { data[key] = value; return this; },
            getData: key => data[key],
            once() {}
        };
        created.push(obj);
        return obj;
    };
    Object.assign(scene, {
        worldWidth: 2000, pits: [],
        platformGroup: { getChildren: () => [] },
        wallGroup: { getChildren: () => bounds.map(b => ({ getBounds: () => b })) },
        textures: { get: () => ({ getSourceImage: () => ({ width: 40, height: 104 }) }) },
        add: { rectangle: make, image: (x, y) => make(x, y, 40, 104) },
        enadoriGroup: { add() {} }
    });
    return { scene, created };
}

test('energy drink spawning inside a wall moves the entire rotating image outside', () => {
    const { scene } = setup([{ left: 500, right: 700, top: 0, bottom: 600 }]);
    const body = scene.placeEnadori(600, 580);
    const radius = Math.hypot(40, 104) / 4;
    assert.ok(body);
    assert.ok(body.x + radius <= 500 || body.x - radius >= 700);
});

test('spawn clearance includes image overhang even when the 40px body fits beside a wall', () => {
    const { scene } = setup([{ left: 500, right: 700, top: 0, bottom: 600 }]);
    const body = scene.placeEnadori(478, 580);
    assert.ok(body.x + Math.hypot(40, 104) / 4 <= 500);
});

test('overhead blocks also exclude the rotating image from spawn positions', () => {
    const { scene } = setup([{ left: 500, right: 700, top: 500, bottom: 555 }]);
    const body = scene.placeEnadori(600, 580);
    const radius = Math.hypot(40, 104) / 4;
    assert.ok(body.x + radius <= 500 || body.x - radius >= 700);
});

test('no drink is created when there is no safe space', () => {
    const { scene, created } = setup([{ left: 0, right: 2000, top: 0, bottom: 600 }]);
    assert.equal(scene.placeEnadori(600, 580), null);
    assert.equal(created.length, 0);
});

test('safe energy drink locations and scooter body clearance remain unchanged', () => {
    const { scene } = setup([{ left: 500, right: 700, top: 0, bottom: 600 }]);
    assert.equal(scene.placeEnadori(300, 580).x, 300);
    assert.equal(scene.placeScooter(470, 585).x, 470);
});

test('Electrical initial and timed drink spawns move out of walls with rotating-image clearance', () => {
    const wall = { left: 2905, right: 3535, top: 280, bottom: 420 };
    for (const x of [3200, 2880, 3555]) {
        const { scene } = setup([wall], context.Electrical);
        scene.worldWidth = 12800;
        const body = scene.placeEnadori(x, 400);
        const radius = Math.hypot(40, 104) / 4;
        assert.ok(body);
        assert.ok(body.x + radius <= wall.left || body.x - radius >= wall.right);
    }
});

test('Electrical rejects fully obstructed spawns and preserves unobstructed tutorial spawns', () => {
    const blocked = setup([{ left: 0, right: 2000, top: 0, bottom: 600 }], context.Electrical);
    assert.equal(blocked.scene.placeEnadori(600, 580), null);
    assert.equal(blocked.created.length, 0);
    const clear = setup([], context.Electrical);
    assert.equal(clear.scene.placeEnadori(800, 580).x, 800);
});
