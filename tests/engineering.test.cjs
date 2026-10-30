const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
const src = fs.readFileSync(require('node:path').join(__dirname, '../src/minigames/engineering.js'), 'utf8').replace(/export /g, '');
vm.runInContext(src + '\nglobalThis.rules = {GAMES,makeDeck,createGame,advanceGame,pressGame,gaugePosition,logicAnswer,demoKey,createDemoGame,getFinalDifficulty};', context);
const {GAMES,makeDeck,createGame,advanceGame,pressGame,gaugePosition,logicAnswer,demoKey,createDemoGame,getFinalDifficulty} = context.rules;
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function solve(s) {
    const press = key => pressGame(s, key, s.elapsed);
    const move = (x, y) => {
        while(s.x < x) press('ArrowRight'); while(s.x > x) press('ArrowLeft');
        while(s.y < y) press('ArrowDown'); while(s.y > y) press('ArrowUp');
    };
    switch(s.id) {
        case 'crane': case 'launch': case 'bulb': case 'charge': case 'chip': case 'led': case 'files': case 'robot': case 'molecule': case 'magnetmaze': case 'thermal': case 'memory': case 'lightning': case 'microbes': {
            let next=0;
            for(let t=0;t<s.duration && s.result===null;t+=0.03) {
                advanceGame(s,t);
                if(s.result===null && t>=next) { const key=demoKey(s); if(key) { pressGame(s,key,t); next=t+0.15; } }
            }
            break;
        }
        case 'bolt': s.sequence.forEach(press); break;
        case 'catch': while(s.cursor !== s.target) press(s.cursor < s.target ? 'ArrowRight' : 'ArrowLeft'); advanceGame(s,s.impact); break;
        case 'lathe':
            for(let t = 0; t < s.duration; t += 0.005) {
                advanceGame(s,t);
                if(Math.abs(gaugePosition(s)-s.target) < s.width) { press('Space'); break; }
            }
            break;
        case 'wire': ['ArrowUp','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowDown'].forEach(press); break;
        case 'voltage': for(let i=0;i<s.target;i++) press('ArrowUp'); press('Space'); break;
        case 'solder': for(const [x,y] of s.targets) { move(x,y); press('Space'); } break;
        case 'logic': press(logicAnswer(s) === 0 ? 'ArrowLeft' : 'ArrowRight'); press('Space'); break;
        case 'debug': for(let i=0;i<s.target;i++) press('ArrowRight'); press('Space'); break;
        case 'sort':
            for(let pass=0;pass<4;pass++) for(let i=0;i<3 && s.result === null;i++) {
                while(s.cursor<i) press('ArrowRight'); while(s.cursor>i) press('ArrowLeft');
                if(s.values[i]>s.values[i+1]) press('Space');
            }
            break;
        case 'packet':
            for(const obstacle of s.obstacles) {
                if(s.cursor===obstacle.lane) press(s.cursor===4?'ArrowLeft':'ArrowRight');
                advanceGame(s,obstacle.at);
            }
            advanceGame(s,s.surviveUntil); break;
        case 'titrate': for(let i=0;i<s.target;i++) press('Space'); press('ArrowUp'); break;
    }
}
test('deck covers all 25 games and all five departments in each block', () => {
    for(let seed=1;seed<60;seed++) {
        const deck = makeDeck(rng(seed));
        assert.equal(new Set(deck).size,25);
        for(let i=0;i<GAMES.length;i+=5) assert.equal(new Set(deck.slice(i,i+5).map(id=>GAMES.find(g=>g.id===id).dept)).size,5);
    }
});
test('all 25 games are solvable across variants and difficulty tiers', () => {
    for(const game of GAMES) for(let tier=0;tier<3;tier++) for(let seed=1;seed<=30;seed++) {
        const state = createGame(game.id,tier,rng(seed));
        solve(state);
        assert.equal(state.result,true,`${game.id}, tier ${tier}, seed ${seed}`);
    }
});
test('late input cannot rescue a timeout, and finished rounds cannot change', () => {
    for(const game of GAMES) {
        const state = createGame(game.id,2,rng(15));
        advanceGame(state,100);
        const result = state.result;
        assert.notEqual(result,null);
        for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space']) pressGame(state,key,101);
        assert.equal(state.result,result);
    }
});
test('wrong inputs give helpful retries instead of instant losses', () => {
    const bolt=createGame('bolt'); pressGame(bolt,'ArrowLeft'); assert.equal(bolt.result,null); assert.ok(bolt.feedback);
    const wire=createGame('wire'); pressGame(wire,'ArrowRight'); pressGame(wire,'ArrowRight'); assert.equal(wire.result,null); assert.equal(wire.x,1);
    const solder=createGame('solder',0,rng(1)); solder.x=(solder.targets[0][0]+1)%3; pressGame(solder,'Space'); assert.equal(solder.result,null);
    const titrate=createGame('titrate'); for(let i=0;i<=titrate.target;i++) pressGame(titrate,'Space'); pressGame(titrate,'ArrowUp'); assert.equal(titrate.result,null);
    pressGame(titrate,'ArrowDown'); pressGame(titrate,'ArrowUp'); assert.equal(titrate.result,true);
});

test('animated examples solve every game using the same rules as the player', () => {
    for(const game of GAMES) for(let tier=0;tier<3;tier++) for(let seed=1;seed<=10;seed++) {
        const s=createDemoGame(createGame(game.id,tier,rng(seed))); let next=0;
        for(let t=0;t<s.duration && s.result===null;t+=0.03) {
            advanceGame(s,t);
            if(s.result===null && t>=next) {
                const key=demoKey(s);
                if(key) { pressGame(s,key,t); next=t+0.48; }
            }
        }
        assert.equal(s.result,true,`demo: ${game.id}, tier ${tier}, seed ${seed}`);
    }
});

test('every demo has a different puzzle and leaves the live round untouched', () => {
    const signature = s => JSON.stringify(['sequence','target','targets','blocks','phaseOffset','balance','items','recipe','values','obstacles','pickup','cursor','a','b','temperature','events'].map(key=>s[key]));
    for(const game of GAMES) for(let tier=0;tier<3;tier++) for(let seed=1;seed<=30;seed++) {
        const live=createGame(game.id,tier,rng(seed));
        const before=JSON.stringify(live);
        const demo=createDemoGame(live);
        assert.notEqual(signature(demo),signature(live),game.id);
        const key=demoKey(demo);
        if(key) pressGame(demo,key,0);
        assert.equal(JSON.stringify(live),before,`${game.id}: demo must not mutate live round`);
    }
});

const saveWithTotal = total => ({ stages: Array.from({length:5},(_,i)=>Math.max(0,Math.min(40,total-i*40))), totalTangye: 999 });
test('difficulty uses only five clamped stage records and has correct endpoints', () => {
    assert.equal(getFinalDifficulty(saveWithTotal(150)).challenge,1);
    assert.equal(getFinalDifficulty(saveWithTotal(200)).challenge,0);
    assert.equal(getFinalDifficulty(saveWithTotal(175)).challenge,0.5);
    assert.equal(getFinalDifficulty({stages:[40,40,40,40,40,40],totalTangye:0}).total,200);
    assert.equal(getFinalDifficulty({stages:[255,-1,NaN,Infinity,'40']}).total,40);
    assert.equal(getFinalDifficulty().challenge,1);
});
test('each additional tangye makes every game no harder at the same round tier', () => {
    for(let tier=0;tier<3;tier++) for(const game of GAMES) {
        let previous;
        for(let total=150;total<=200;total++) {
            const difficulty=getFinalDifficulty(saveWithTotal(total));
            const s=createGame(game.id,tier,rng(7),difficulty);
            if(previous) {
                assert.ok(s.duration>=previous.duration,`${game.id}: timer at ${total}`);
                assert.ok(s.motionScale<=previous.motionScale);
                assert.ok(s.phaseWindow>=previous.phaseWindow);
                if(s.sequence) assert.ok(s.sequence.length<=previous.sequence.length);
                if(s.width) assert.ok(s.width>=previous.width);
                if(s.impact) assert.ok(s.impact>=previous.impact);
                if(s.obstacleTravel) assert.ok(s.obstacleTravel>=previous.obstacleTravel);
            }
            previous=s;
        }
    }
});
test('all games and their separate demos stay solvable from 150 through 200 tangye', () => {
    for(const total of [150,151,160,175,190,199,200]) for(const game of GAMES) for(let tier=0;tier<3;tier++) for(let seed=1;seed<=5;seed++) {
        const difficulty=getFinalDifficulty(saveWithTotal(total));
        const live=createGame(game.id,tier,rng(seed),difficulty);
        const demo=createDemoGame(live);
        assert.deepEqual(demo.difficulty,difficulty);
        solve(live);
        assert.equal(live.result,true,`${game.id} live at ${total}`);
        let next=0;
        for(let t=0;t<demo.duration && demo.result===null;t+=0.03) {
            advanceGame(demo,t);
            if(demo.result===null && t>=next) {
                const key=demoKey(demo);
                if(key) { pressGame(demo,key,t); next=t+0.48; }
            }
        }
        assert.equal(demo.result,true,`${game.id} demo at ${total}, tier ${tier}, seed ${seed}`);
    }
});

test('new games give recoverable mistakes and require the actual objective', () => {
    const crane=createGame('crane'); pressGame(crane,'Space'); assert.equal(crane.carrying,false); assert.equal(crane.result,null);
    const battery=createGame('charge'); pressGame(battery,'Space',0); pressGame(battery,'Space',0.1); assert.equal(battery.result,null); assert.equal(battery.charge,0);
    const robot=createGame('robot'); const x=robot.x,y=robot.y; pressGame(robot,'ArrowLeft'); assert.equal(robot.x,x); assert.equal(robot.y,y); pressGame(robot,'Space'); assert.notDeepEqual([robot.x,robot.y],[x,y]);
    const files=createGame('files'); pressGame(files,'ArrowRight'); assert.equal(files.count,0); assert.ok(files.feedback); pressGame(files,'ArrowLeft'); assert.equal(files.count,1);
});

test('short timers keep all scheduled objectives reachable before their deadlines', () => {
    for(let total=150;total<=200;total++) for(let tier=0;tier<3;tier++) {
        const difficulty=getFinalDifficulty(saveWithTotal(total));
        const catchGame=createGame('catch',tier,rng(1),difficulty);
        assert.ok(catchGame.impact<catchGame.duration);
        const packet=createGame('packet',tier,rng(1),difficulty);
        assert.ok(packet.surviveUntil<packet.duration);
        assert.ok(packet.obstacles.at(-1).at<packet.surviveUntil);
    }
    assert.ok(Math.abs(createGame('voltage',0,rng(1),getFinalDifficulty(saveWithTotal(150))).duration-4.55)<0.00001);
    assert.equal(createGame('voltage',0,rng(1),getFinalDifficulty(saveWithTotal(200))).duration,7);
});

test('replacement games require different actions rather than matching a visible target', () => {
    const removed=['mix','phase','balance','polarity','scope','magnet'];
    assert.ok(removed.every(id=>!GAMES.some(game=>game.id===id)));
    const shot=createGame('launch'); shot.aim=shot.target; pressGame(shot,'Space',0);
    assert.equal(shot.result,null); const aim=shot.aim; pressGame(shot,'ArrowLeft',0.1); assert.equal(shot.aim,aim);
    advanceGame(shot,0.66); assert.equal(shot.result,true);
    const lateShot=createGame('launch');lateShot.aim=lateShot.target;pressGame(lateShot,'Space',lateShot.duration-0.1);advanceGame(lateShot,lateShot.duration+1);assert.equal(lateShot.result,false);
    const recall=createGame('memory',0,rng(2));pressGame(recall,recall.sequence[0],0);assert.equal(recall.count,0);
    for(const key of recall.sequence)pressGame(recall,key,recall.showFor+0.01);assert.equal(recall.result,true);
    const storm=createGame('lightning',0,rng(3));pressGame(storm,'Space',0);assert.equal(storm.count,0);
    for(const event of storm.events)pressGame(storm,'Space',event.at+0.01);assert.equal(storm.result,true);
    const missed=createGame('lightning');advanceGame(missed,missed.events[0].at+missed.window+0.01);assert.equal(missed.result,false);
    const furnace=createGame('thermal');advanceGame(furnace,furnace.duration);assert.equal(furnace.result,false);
    const cells=createGame('microbes');pressGame(cells,'Space');assert.equal(cells.result,null);cells.answer=cells.target;pressGame(cells,'Space');assert.equal(cells.result,true);
});
test('magnetic maze moves automatically, brakes, and blocks the direct route', () => {
    const s=createGame('magnetmaze');pressGame(s,'ArrowRight',0);advanceGame(s,1);assert.equal(s.mistakes,1);assert.equal(s.x,s.startX);
    pressGame(s,'ArrowUp',1);advanceGame(s,1.5);assert.ok(s.y<500);
    pressGame(s,'Space',1.5);const position=[s.x,s.y];advanceGame(s,2);assert.deepEqual([s.x,s.y],position);
});
