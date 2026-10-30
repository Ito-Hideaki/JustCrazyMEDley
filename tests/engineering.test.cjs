const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
const src = fs.readFileSync(require('node:path').join(__dirname, '../src/minigames/engineering.js'), 'utf8').replace(/export /g, '');
vm.runInContext(src + '\nglobalThis.rules = {GAMES,makeDeck,createGame,advanceGame,pressGame,gaugePosition,phasePosition,logicAnswer,demoKey,createDemoGame,getFinalDifficulty};', context);
const {GAMES,makeDeck,createGame,advanceGame,pressGame,gaugePosition,phasePosition,logicAnswer,demoKey,createDemoGame,getFinalDifficulty} = context.rules;
const rng = seed => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
function solve(s) {
    const press = key => pressGame(s, key, s.elapsed);
    const move = (x, y) => {
        while(s.x < x) press('ArrowRight'); while(s.x > x) press('ArrowLeft');
        while(s.y < y) press('ArrowDown'); while(s.y > y) press('ArrowUp');
    };
    switch(s.id) {
        case 'bolt': case 'mix': s.sequence.forEach(press); break;
        case 'catch': while(s.cursor !== s.target) press(s.cursor < s.target ? 'ArrowRight' : 'ArrowLeft'); advanceGame(s,s.impact); break;
        case 'lathe': case 'phase':
            for(let t = 0; t < s.duration; t += 0.005) {
                advanceGame(s,t);
                if(s.id === 'lathe' ? Math.abs(gaugePosition(s)-s.target) < s.width : Math.abs(phasePosition(s)) < 0.25) { press('Space'); break; }
            }
            break;
        case 'wire': ['ArrowUp','ArrowRight','ArrowRight','ArrowRight','ArrowRight','ArrowDown'].forEach(press); break;
        case 'voltage': for(let i=0;i<s.target;i++) press('ArrowUp'); press('Space'); break;
        case 'solder': for(const [x,y] of s.targets) { move(x,y); press('Space'); } break;
        case 'polarity': press(s.target === 0 ? 'ArrowLeft' : 'ArrowRight'); press('Space'); break;
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
        case 'scope': move(...s.target); press('Space'); break;
    }
}
test('deck covers all 15 games and all five departments in each block', () => {
    for(let seed=1;seed<60;seed++) {
        const deck = makeDeck(rng(seed));
        assert.equal(new Set(deck).size,15);
        for(let i=0;i<15;i+=5) assert.equal(new Set(deck.slice(i,i+5).map(id=>GAMES.find(g=>g.id===id).dept)).size,5);
    }
});
test('all 15 games are solvable across variants and difficulty tiers', () => {
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
    const polarity=createGame('polarity'); pressGame(polarity,'Space'); assert.equal(polarity.result,null); solve(polarity); assert.equal(polarity.result,true);
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
    const signature = s => JSON.stringify(
        s.id==='bolt'||s.id==='mix' ? s.sequence :
        s.id==='wire' ? s.blocks :
        s.id==='phase' ? s.phaseOffset ?? Math.PI/2 :
        s.id==='solder' ? s.targets :
        s.id==='logic' ? [s.a,s.b,logicAnswer(s)] :
        s.id==='sort' ? s.values :
        s.id==='packet' ? [s.cursor,s.obstacles.map(o=>o.lane)] : s.target
    );
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
