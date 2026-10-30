// Pure microgame rules, separated from Phaser rendering for deterministic checks.
export const FINAL_REQUIRED = 150;
export const FINAL_MAX_TANGYE = 200;

export function getFinalDifficulty(saveData) {
    // Read the five department records, not the separately encoded total counter.
    const total = Array.from({ length: 5 }, (_, i) => {
        const count = saveData?.stages?.[i];
        return Number.isFinite(count) ? Math.max(0, Math.min(40, count)) : 0;
    }).reduce((sum, count) => sum + count, 0);
    const challenge = Math.max(0, Math.min(1, (FINAL_MAX_TANGYE - total) / (FINAL_MAX_TANGYE - FINAL_REQUIRED)));
    return {
        total,
        challenge,
        durationScale: 1 - 0.35 * challenge,
        motionScale: 0.7 + 0.45 * challenge,
        timingScale: 1.4 - 0.4 * challenge,
        sequenceExtra: Math.floor(challenge * 3),
        label: challenge === 1 ? '最高' : challenge === 0 ? '最低' : challenge >= 2/3 ? '高め' : challenge <= 1/3 ? '低め' : '標準'
    };
}

export const DEPARTMENTS = [
    { name: '機械工学科', short: '機械', character: 'M', color: 0xffb45c },
    { name: '電気工学科', short: '電気', character: 'E', color: 0xffdf62 },
    { name: '電子工学科', short: '電子', character: 'D', color: 0x77dce7 },
    { name: '情報工学科', short: '情報', character: 'J', color: 0xa997ff },
    { name: '物質工学科', short: '物質', character: 'C', color: 0x99e29a }
];
export const GAMES = [
    { id: 'bolt', dept: 0, title: '締めろ！', subtitle: 'ロボコン前夜のボルト締め', controls: '表示順に矢印を押せ！', duration: 8 },
    { id: 'catch', dept: 0, title: '受け止めろ！', subtitle: '落ちてくる歯車を回収', controls: '← →：移動　歯車の真下へ！', duration: 5 },
    { id: 'lathe', dept: 0, title: '緑で止めよう！', subtitle: '旋盤加工・仕上げの一瞬', controls: '緑の範囲で SPACE！', duration: 7 },
    { id: 'wire', dept: 1, title: 'つなげ！', subtitle: '電源から電球まで配線', controls: '矢印：白枠を動かす　電池から電球へ！', duration: 9 },
    { id: 'voltage', dept: 1, title: '電圧を合わせろ！', subtitle: '実験用電源の調整', controls: '↑ ↓：1Vずつ調整　SPACE：確定', duration: 7 },
    { id: 'lightning', dept: 1, title: '雷から守ろう！', subtitle: '実験室の避雷装置', controls: '雷が光ったらSPACE！ 晴れている間は待とう', duration: 7 },
    { id: 'solder', dept: 2, title: 'はんだ付け！', subtitle: '基板を3か所つなぐ', controls: '矢印：白枠を動かす　緑のマスで SPACE', duration: 10 },
    { id: 'memory', dept: 2, title: '点滅を覚えよう！', subtitle: 'センサーの記憶テスト', controls: '点滅を見て覚える → 同じ矢印を押す', duration: 7 },
    { id: 'logic', dept: 2, title: 'ルールで選ぼう！', subtitle: '論理ゲートの出力テスト', controls: '←：0　→：1　SPACE：確定', duration: 7 },
    { id: 'debug', dept: 3, title: 'ぬけた記号を入れよう！', subtitle: '締切直前の構文エラー', controls: '← →：記号を選ぶ　SPACE：実行', duration: 7 },
    { id: 'sort', dept: 3, title: '並べ替えろ！', subtitle: '実験データを昇順に', controls: '← →：隣接ペアを選ぶ　SPACE：交換', duration: 10 },
    { id: 'packet', dept: 3, title: '通信を守れ！', subtitle: 'バグだらけのネットワーク', controls: '← →：移動　赤いバグを避け続けろ！', duration: 6 },
    { id: 'titrate', dept: 4, title: '同じ数だけ入れよう！', subtitle: '実験ノートどおりの滴定', controls: 'SPACE：1滴足す　↓：1滴戻す　↑：できた！', duration: 7 },
    { id: 'thermal', dept: 4, title: '温度をキープ！', subtitle: '新素材をじっくり加熱', controls: '↑：温める　↓：冷やす　緑の中に保とう', duration: 8 },
    { id: 'microbes', dept: 4, title: '何匹いるかな？', subtitle: '顕微鏡の中の小さな生き物', controls: '↑ ↓：数を選ぶ　SPACE：答える', duration: 8 },
    { id: 'crane', dept: 0, title: '荷物を運ぼう！', subtitle: '工場のクレーン体験', controls: '矢印：フックを動かす　SPACE：つかむ・置く', duration: 10 },
    { id: 'launch', dept: 0, title: '飛ばして届けよう！', subtitle: 'ロボコンのボール発射', controls: '← →：飛ぶ距離を変える　SPACE：発射', duration: 8 },
    { id: 'bulb', dept: 1, title: '消えた電球を直そう！', subtitle: '実験室のあかり点検', controls: '← →：選ぶ　暗い電球でSPACE', duration: 8 },
    { id: 'charge', dept: 1, title: '充電を止めよう！', subtitle: 'ロボコン用バッテリー', controls: 'SPACE：充電開始　緑に来たらもう一度SPACE', duration: 8 },
    { id: 'chip', dept: 2, title: '切り欠きを合わせよう！', subtitle: '小さなチップを取り付ける', controls: '← →：90度回す　向きが合ったらSPACE', duration: 7 },
    { id: 'led', dept: 2, title: '光をそろえよう！', subtitle: 'LED表示を作ろう', controls: '← →：選ぶ　SPACE：点灯・消灯', duration: 9 },
    { id: 'files', dept: 3, title: 'ファイルを仕分けよう！', subtitle: '卒論フォルダのお片付け', controls: '←：保存　→：ゴミ箱　表示に合わせて仕分け', duration: 9 },
    { id: 'robot', dept: 3, title: 'ロボットをゴールへ！', subtitle: 'はじめてのプログラミング', controls: '← →：向きを変える　SPACE：1マス進む', duration: 10 },
    { id: 'molecule', dept: 4, title: '分子を組み立てよう！', subtitle: '色の玉をつないで新素材', controls: '← →：色を選ぶ　SPACE：玉をつなぐ', duration: 9 },
    { id: 'magnetmaze', dept: 4, title: '鉄の玉を運ぼう！', subtitle: '磁石で動かす実験迷路', controls: '矢印：玉の進む向き　SPACE：ブレーキ', duration: 9 },

];
const ARROWS = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const int = (rng, max) => Math.floor(rng() * max);
function shuffle(values, rng) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
        const j = int(rng, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
// Each block of five visits all departments; every game appears exactly once.
export function makeDeck(rng = Math.random) {
    const pools = DEPARTMENTS.map((_, dept) => shuffle(GAMES.filter(game => game.dept === dept), rng));
    return Array.from({length:pools[0].length}, (_,i) => i).flatMap(index => shuffle([0, 1, 2, 3, 4], rng).map(dept => pools[dept][index].id));
}
export function createGame(id, tier = 0, rng = Math.random, difficulty = null) {
    const definition = GAMES.find(game => game.id === id);
    if (!definition) throw new Error(`Unknown microgame: ${id}`);
    const motionScale = difficulty?.motionScale ?? 1;
    const timingScale = difficulty?.timingScale ?? 1;
    const s = { ...definition, tier, difficulty, motionScale, phaseWindow: 0.38 * timingScale, duration: (definition.duration - tier * 0.2) * (difficulty?.durationScale ?? 1), elapsed: 0, result: null, cursor: 0, count: 0, mistakes: 0, feedback: '' };
    switch (id) {
        case 'launch': s.aim=0; s.target=1+int(rng,4); s.flying=false; s.flightAt=0; break;
        case 'lightning': s.events=[0.65+rng()*0.2,2.05+rng()*0.15].map(at=>({at:at/motionScale,protected:false})); s.window=0.5*timingScale/motionScale; break;
        case 'memory': s.sequence=Array.from({length:2+Math.round(difficulty?.challenge??0)},()=>ARROWS[int(rng,4)]); s.showFor=s.sequence.length*0.42+0.45; break;
        case 'thermal': s.temperature=0.8; s.stableFor=0; s.band=0.11*timingScale; break;
        case 'microbes': s.target=3+int(rng,4); s.answer=0; break;
        case 'magnetmaze': s.x=200; s.y=500; s.target=[840,500]; s.startX=200; s.heading=null; s.routeStage=0; s.speed=260*motionScale; s.goalRadius=38*timingScale; break;
        case 'crane': s.x=0; s.y=0; s.pickup=[1+int(rng,2),1]; s.target=[int(rng,3),0]; s.carrying=false; break;
        case 'bulb': s.targets=[int(rng,3)]; s.targets.push((s.targets[0]+1+int(rng,2))%3); break;
        case 'charge': s.charge=0; s.charging=false; s.target=0.65; s.width=0.1*timingScale; break;
        case 'chip': s.orientation=int(rng,4); s.target=(s.orientation+1+int(rng,3))%4; break;
        case 'led': s.target=Array.from({length:4},()=>int(rng,2)); if(!s.target.some(Boolean)) s.target[2]=1; s.bits=[0,0,0,0]; break;
        case 'files': s.items=Array.from({length:4+tier},()=>int(rng,2)); s.items[0]=1; s.items[1]=0; break;
        case 'robot': s.x=1; s.y=1; s.orientation=1; s.target=[int(rng,2)*2,int(rng,2)*2]; break;
        case 'molecule': s.recipe=Array.from({length:3},()=>int(rng,3)); break;
        case 'bolt': s.sequence = Array.from({ length: 4 + tier + (difficulty?.sequenceExtra ?? 0) }, (_, i) => ARROWS[i % 4]); break;
        case 'catch': s.cursor = 2; s.target = int(rng, 5); s.impact = (3 - tier * 0.15) / motionScale; break;
        case 'lathe': s.target = 0.35 + rng() * 0.3; s.width = (0.16 - tier * 0.01) * timingScale; break;
        case 'wire': s.x = 0; s.y = 1; s.path = [[0, 1]]; s.blocks = [[2, 1], [1, 2]]; break;
        case 'voltage': s.value = 0; s.target = 3 + int(rng, 6); break;
        case 'solder': s.x = 0; s.y = 0; s.targets = shuffle([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], rng).slice(0, 3); break;
        case 'logic': s.gate = ['AND', 'OR', 'XOR'][int(rng, 3)]; s.a = int(rng, 2); s.b = int(rng, 2); s.cursor = -1; break;
        case 'debug': {
            const snippets = [
                ['return voltage □', [';', ')', ']'], 0],
                ['if (ready □ { run(); }', [';', ')', ']'], 1],
                ['data[index □ = 5;', [';', ')', ']'], 2]
            ];
            [s.snippet, s.options, s.target] = snippets[int(rng, snippets.length)];
            break;
        }
        case 'sort': s.values = shuffle([1, 2, 3, 4], rng); if (s.values.every((v, i) => v === i + 1)) s.values.reverse(); break;
        case 'packet':
            s.cursor = 2;
            s.obstacleTravel = 0.9 / motionScale;
            s.surviveUntil = 3.7 / motionScale;
            s.obstacles = [1.1, 1.85, 2.6, 3.3].map(at => ({ at: at / motionScale, lane: int(rng, 5), passed: false }));
            break;
        case 'titrate': s.target = 4 + int(rng, 4); break;
    }
    return s;
}
export function gaugePosition(s) {
    return (Math.sin(s.elapsed * (1.9 + s.tier * 0.15) * (s.motionScale ?? 1) - Math.PI / 2) + 1) / 2;
}

// Teach the same controls with a separate puzzle; never reveal the live round.
export function createDemoGame(current) {
    const demo = createGame(current.id, current.tier, Math.random, current.difficulty);
    switch (current.id) {
        case 'launch': demo.target=current.target===1?3:1; break;
        case 'lightning': demo.events=current.events.map(event=>({at:event.at+0.25/current.motionScale,protected:false})); break;
        case 'memory': demo.sequence=current.sequence.map(key=>ARROWS[(ARROWS.indexOf(key)+1)%4]); demo.showFor=current.showFor; break;
        case 'thermal': demo.temperature=0.2; break;
        case 'microbes': demo.target=current.target===3?5:3; break;
        case 'magnetmaze': demo.x=840; demo.startX=840; demo.target=[200,500]; break;
        case 'crane': demo.pickup=[current.pickup[0]===1?2:1,1]; demo.target=[(current.target[0]+1)%3,0]; break;
        case 'bulb': demo.targets=current.targets.map(i=>(i+1)%3); break;
        case 'charge': demo.target=0.35; break;
        case 'chip': demo.target=(current.target+1)%4; demo.orientation=(demo.target+2)%4; break;
        case 'led': demo.target=current.target.map(bit=>1-bit); if(!demo.target.some(Boolean)) demo.target=[1,0,0,0]; break;
        case 'files': demo.items=current.items.map(item=>1-item); break;
        case 'robot': demo.target=current.target.map(value=>2-value); break;
        case 'molecule': demo.recipe=current.recipe.map(color=>(color+1)%3); break;
        case 'bolt':
            demo.sequence = current.sequence.map(key => ARROWS[(ARROWS.indexOf(key) + 1) % 4]);
            break;
        case 'catch': demo.target = current.target === 0 ? 4 : 0; break;
        case 'lathe': demo.target = 0.18; break;
        case 'wire':
            demo.blocks = current.blocks.map(([x,y]) => [x, 2-y]);
            demo.routeY = 2;
            break;
        case 'voltage': demo.target = current.target === 3 ? 5 : 3; break;
        case 'solder': demo.targets = current.targets.map(([x,y]) => [(x+1)%3,y]); break;
        case 'logic':
            demo.gate = current.gate;
            demo.a = logicAnswer(current) ? 0 : 1;
            demo.b = logicAnswer(current) || demo.gate === 'XOR' ? 0 : 1;
            break;
        case 'debug':
            return createGame('debug', current.tier, () => ((current.target+1)%3+0.5)/3, current.difficulty);
        case 'sort':
            demo.values = current.values.join() === '2,1,3,4' ? [1,3,2,4] : [2,1,3,4];
            break;
        case 'packet':
            demo.cursor = 0;
            demo.obstacles.forEach((obstacle,i) => { obstacle.lane = i; });
            break;
        case 'titrate': demo.target = current.target === 4 ? 6 : 4; break;

    }
    return demo;
}
export function logicAnswer(s) { return s.gate === 'AND' ? s.a & s.b : s.gate === 'OR' ? s.a | s.b : s.a ^ s.b; }
export function advanceGame(s, elapsed) {
    if (s.result !== null) return;
    // Evaluate motion only up to the deadline, even after a delayed frame.
    elapsed=Math.min(elapsed,s.duration);
    const dt=Math.max(0,elapsed-s.elapsed);
    if(s.id==='launch' && s.flying && elapsed-s.flightAt>=0.65) {
        s.flying=false;
        if(s.aim===s.target) s.result=true;
        else {s.feedback='点線の着地点を旗に合わせよう！';s.mistakes++;}
    }
    if(s.id==='thermal') {
        const end=Math.min(1,s.temperature+dt*0.14*s.motionScale);
        const low=0.5-s.band,high=0.5+s.band,rate=0.14*s.motionScale;
        s.stableFor+=Math.max(0,Math.min(dt,(high-s.temperature)/rate)-Math.max(0,(low-s.temperature)/rate));
        s.temperature=end;
        if(s.stableFor>=1.5) s.result=true;
    }
    if(s.id==='lightning' && s.events.some(event=>!event.protected && elapsed>event.at+s.window)) s.result=false;
    if(s.id==='magnetmaze' && s.heading) {
        const [dx,dy]=s.heading, oldX=s.x,oldY=s.y;
        s.x=clamp(s.x+dx*s.speed*dt,180,860); s.y=clamp(s.y+dy*s.speed*dt,285,540);
        const hits=dx ? oldY>365 && oldY<560 && Math.max(oldX,s.x)>420 && Math.min(oldX,s.x)<620 : oldX>420 && oldX<620 && Math.max(oldY,s.y)>365 && Math.min(oldY,s.y)<560;
        if(hits) {s.x=s.startX;s.y=500;s.heading=null;s.routeStage=0;s.feedback='壁に当たった！ 上の通路を通ろう';s.mistakes++;}
        if(s.routeStage===0 && s.y<=300) s.routeStage=1;
        if(s.routeStage===1 && (s.startX===200?s.x>=s.target[0]-5:s.x<=s.target[0]+5)) s.routeStage=2;
        const closestX=clamp(s.target[0],Math.min(oldX,s.x),Math.max(oldX,s.x));
        const closestY=clamp(s.target[1],Math.min(oldY,s.y),Math.max(oldY,s.y));
        if(!hits && Math.hypot(closestX-s.target[0],closestY-s.target[1])<=s.goalRadius) s.result=true;
    }
    if(s.id==='charge' && s.charging) {
        s.charge += Math.max(0,elapsed-s.elapsed)*0.2*s.motionScale;
        if(s.charge>1) { s.charge=0; s.charging=false; s.mistakes++; s.feedback='満タンになる前に緑で止めよう！'; }
    }
    s.elapsed = elapsed;
    if (s.id === 'catch' && elapsed >= s.impact) s.result = s.cursor === s.target;
    if (s.id === 'packet') {
        for (const obstacle of s.obstacles) {
            if (!obstacle.passed && elapsed >= obstacle.at) {
                obstacle.passed = true;
                if (s.cursor === obstacle.lane) s.result = false;
            }
        }
        if (s.result === null && elapsed >= s.surviveUntil) s.result = true;
    }
    if (s.result === null && elapsed >= s.duration) s.result = false;
}
export function pressGame(s, key, elapsed = s.elapsed) {
    advanceGame(s, elapsed);
    if (s.result !== null) return;
    const dx = key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0;
    const dy = key === 'ArrowUp' ? -1 : key === 'ArrowDown' ? 1 : 0;
    s.feedback = '';
    const retry = message => { s.feedback = message; s.mistakes++; };
    const check = (correct, message) => { if (correct) s.result = true; else retry(message); };
    switch (s.id) {
        case 'launch':
            if(!s.flying) {s.aim=clamp(s.aim+dx,0,4);if(key==='Space'){s.flying=true;s.flightAt=elapsed;}}
            break;
        case 'lightning':
            if(key==='Space') {const event=s.events.find(event=>!event.protected && elapsed>=event.at && elapsed<=event.at+s.window); if(event){event.protected=true;s.count++;if(s.count===s.events.length)s.result=true;}else retry('雷が光ったらSPACE！ 今は待とう');}
            break;
        case 'memory':
            if(!ARROWS.includes(key)) break;
            if(elapsed<s.showFor) retry('まずは点滅を覚えよう！');
            else if(key!==s.sequence[s.count]) {s.count=0;retry('最初からもう一度。同じ順に押そう！');}
            else if(++s.count===s.sequence.length)s.result=true;
            break;
        case 'thermal': s.temperature=clamp(s.temperature-dy*0.12,0,1); break;
        case 'microbes': s.answer=clamp(s.answer-dy,0,8);if(key==='Space')check(s.answer===s.target,'丸いお皿の中の生き物を数えよう！');break;
        case 'magnetmaze': if(dx||dy)s.heading=[dx,dy];if(key==='Space')s.heading=null;break;
        case 'crane': {
            s.x=clamp(s.x+dx,0,2); s.y=clamp(s.y+dy,0,1);
            if(key==='Space') {
                const destination=s.carrying?s.target:s.pickup;
                if(s.x===destination[0] && s.y===destination[1]) { if(s.carrying) s.result=true; else s.carrying=true; }
                else retry(s.carrying?'旗のマスに運んでSPACE！':'荷物のマスでSPACE！');
            }
            break;
        }
        case 'bulb': s.cursor=clamp(s.cursor+dx,0,2); if(key==='Space') { if(s.cursor!==s.targets[s.count]) retry('暗い電球を選ぼう！'); else if(++s.count===s.targets.length) s.result=true; } break;
        case 'charge':
            if(key==='Space') { if(!s.charging) s.charging=true; else { s.charging=false; check(Math.abs(s.charge-s.target)<=s.width,'もう一度！ 緑のところで止めよう'); if(s.result===null) s.charge=0; } }
            break;
        case 'chip': s.orientation=(s.orientation+dx+4)%4; if(key==='Space') check(s.orientation===s.target,'金色のしるしを上のお手本と同じ向きに！'); break;
        case 'led': s.cursor=clamp(s.cursor+dx,0,3); if(key==='Space') { s.bits[s.cursor]=1-s.bits[s.cursor]; if(s.bits.every((bit,i)=>bit===s.target[i])) s.result=true; } break;
        case 'files': if(dx) { if((dx<0?1:0)!==s.items[s.count]) retry('青い保存は←、赤いゴミ箱は→だよ！'); else if(++s.count===s.items.length) s.result=true; } break;
        case 'robot':
            s.orientation=(s.orientation+dx+4)%4;
            if(key==='Space') { const [x,y]=[[0,-1],[1,0],[0,1],[-1,0]][s.orientation]; s.x=clamp(s.x+x,0,2); s.y=clamp(s.y+y,0,2); if(s.x===s.target[0] && s.y===s.target[1]) s.result=true; }
            break;
        case 'molecule': s.cursor=clamp(s.cursor+dx,0,2); if(key==='Space') { if(s.cursor!==s.recipe[s.count]) retry('上の光る玉と同じ色を選ぼう！'); else if(++s.count===s.recipe.length) s.result=true; } break;
        case 'bolt':
            if (!ARROWS.includes(key)) return;
            if (key !== s.sequence[s.count]) retry('光っている矢印を押そう！');
            else if (++s.count === s.sequence.length) s.result = true;
            break;
        case 'catch': case 'packet': s.cursor = clamp(s.cursor + dx, 0, 4); break;
        case 'lathe': if (key === 'Space') check(Math.abs(gaugePosition(s) - s.target) <= s.width, 'もう一度！ 黄色の針が緑に来たら押そう'); break;
        case 'wire':
            if (!dx && !dy) return;
            {
                const x = clamp(s.x + dx, 0, 4), y = clamp(s.y + dy, 0, 2);
                if (s.blocks.some(p => p[0] === x && p[1] === y)) retry('赤い×は通れないよ。上から回ろう！');
                else { s.x = x; s.y = y; s.path.push([x, y]); if (x === 4 && y === 1) s.result = true; }
            }
            break;
        case 'voltage':
            s.value = clamp(s.value - dy, 0, 12);
            if (key === 'Space') check(s.value === s.target, '上のお手本と同じ数字にしよう');
            break;
        case 'solder': {
            s.x = clamp(s.x + dx, 0, 2);
            s.y = clamp(s.y + dy, 0, 1);
            if (key === 'Space') {
                const target = s.targets[s.count];
                if (s.x !== target[0] || s.y !== target[1]) retry('白い枠を光るマスに合わせよう！');
                else if (++s.count === 3) s.result = true;
            }
            break;
        }
        case 'logic':
            if (dx) s.cursor = dx < 0 ? 0 : 1;
            if (key === 'Space') check(s.cursor === (logicAnswer(s)), '上のお手本を見て、もう一度！');
            break;
        case 'debug': s.cursor = clamp(s.cursor + dx, 0, 2); if (key === 'Space') check(s.cursor === s.target, 'お手本と同じ記号を選ぼう！'); break;
        case 'sort':
            s.cursor = clamp(s.cursor + dx, 0, 2);
            if (key === 'Space') {
                [s.values[s.cursor], s.values[s.cursor + 1]] = [s.values[s.cursor + 1], s.values[s.cursor]];
                if (s.values.every((v, i) => v === i + 1)) s.result = true;
            }
            break;
        case 'titrate':
            if (key === 'Space') s.count = Math.min(s.count + 1, s.target + 2);
            if (key === 'ArrowDown') s.count = Math.max(0, s.count - 1);
            if (key === 'ArrowUp') check(s.count === s.target, s.count > s.target ? '少し多い！ ↓で1滴戻せるよ' : 'もう少し！ SPACEで1滴足そう');
            break;
    }
}

export const GUIDES = {
    launch: ["点線がボールの飛ぶ道", "← →：飛ぶ距離を変える\n旗に合わせてSPACE！\n飛んで着地すれば成功"],
    lightning: ["雷が光ったら守ろう", "晴れている間は待つ\n黄色い雷でSPACE！\n2回守れたら成功"],
    memory: ["点滅の順番を覚えよう", "まずは見るだけ！\n「入力！」が出たら\n同じ矢印を順に押す"],
    thermal: ["温度を緑に保とう", "↑：温める　↓：冷やす\n温度は勝手に上がるよ\n緑で1.5秒キープ！"],
    microbes: ["生き物を数えよう", "↑ ↓：答えの数を変える\n数え終わったらSPACE\n緑の体1つが1匹だよ"],
    magnetmaze: ["玉は止まらず進むよ", "矢印：進む向きを変える\nSPACE：その場で停止\n壁をよけて旗へ！"],

    crane: ['フックがあなたの道具','矢印：フックを動かす\n荷物でSPACE！\n旗まで運んでSPACE！'],
    bulb: ['暗い電球を探そう','← →：白枠を動かす\n暗い電球でSPACE！\n2つ直そう。'],
    charge: ['緑のところで止めよう','SPACE：充電開始\n緑に来たらもう一度\nSPACEを押そう！'],
    chip: ['金色のしるしを見よう','← →：チップを回す\n上と同じ向きなら\nSPACEで取り付け！'],
    led: ['上と同じ光にしよう','← →：白枠を動かす\nSPACE：点灯・消灯\n4つの光をそろえよう'],
    files: ['表示どおり仕分けよう','青い保存マークは←\n赤いゴミ箱マークは→\n最後まで分けよう！'],
    robot: ['矢印がロボットの向き','← →：向きを回す\nSPACE：1マス進む\n旗のマスに行こう！'],
    molecule: ['上の色をまねしよう','← →：色の玉を選ぶ\nSPACE：玉をつなぐ\n左から順につなごう'],

    "bolt": [
        "光る矢印を押そう",
        "左から1回ずつ！\n間違えても大丈夫。"
    ],
    "catch": [
        "緑の受け皿があなた",
        "← →：受け皿を動かす\n歯車の真下へ！\n長押しでも動くよ。"
    ],
    "lathe": [
        "黄色い針を止めよう",
        "緑のゾーンに来たら\nSPACEを押そう！"
    ],
    "wire": [
        "白い枠があなた",
        "矢印：枠を動かす\n電球までつなごう！\n赤い×は通れないよ。"
    ],
    "voltage": [
        "同じ数字にしよう",
        "↑：増やす　↓：減らす\nお手本と同じなら\nSPACEで決定！"
    ],
    "solder": [
        "白い枠があなたの道具",
        "矢印：枠を動かす\n緑の◎でSPACE！\n3か所つなごう。"
    ],
    "logic": [
        "上のルールを見よう",
        "←：0　→：1\nSPACEで決定！"
    ],
    "debug": [
        "同じ記号を探そう",
        "← →：記号を選ぶ\nお手本と同じなら\nSPACEで決定！"
    ],
    "sort": [
        "1・2・3・4の順へ",
        "← →：ペアを動かす\nSPACE：2つを交換\n小さい順にしよう！"
    ],
    "packet": [
        "緑のDATAがあなた",
        "← →：横に動かす\n赤いBUGをよけよう！\n長押しでも動くよ。"
    ],
    "titrate": [
        "指定の数だけ入れよう",
        "SPACE：1滴足す\n↓：1滴戻す\n↑：できた！"
    ],
};
// Demonstration chooses the next action from the visible puzzle, not a separate animation.
export function demoKey(s) {
    const toward = (x,y) => s.x < x ? 'ArrowRight' : s.x > x ? 'ArrowLeft' : s.y < y ? 'ArrowDown' : s.y > y ? 'ArrowUp' : 'Space';
    switch(s.id) {
        case 'launch': return s.flying?null:s.aim===s.target?'Space':s.aim<s.target?'ArrowRight':'ArrowLeft';
        case 'lightning': return s.events.some(event=>!event.protected && s.elapsed>=event.at && s.elapsed<=event.at+s.window)?'Space':null;
        case 'memory': return s.elapsed<s.showFor?null:s.sequence[s.count];
        case 'thermal': return s.temperature<0.44?'ArrowUp':s.temperature>0.55?'ArrowDown':null;
        case 'microbes': return s.answer===s.target?'Space':'ArrowUp';
        case 'magnetmaze': {const key=s.routeStage===0?'ArrowUp':s.routeStage===1?s.startX===200?'ArrowRight':'ArrowLeft':'ArrowDown';const heading={ArrowUp:[0,-1],ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowDown:[0,1]}[key];return s.heading && s.heading[0]===heading[0] && s.heading[1]===heading[1]?null:key;}
        case 'crane': return toward(...(s.carrying?s.target:s.pickup));
        case 'bulb': { const target=s.targets[s.count]; return s.cursor===target?'Space':s.cursor<target?'ArrowRight':'ArrowLeft'; }
        case 'charge': return !s.charging || s.charge>=s.target ? 'Space':null;
        case 'chip': return s.orientation===s.target?'Space':'ArrowRight';
        case 'led': { const target=s.bits.findIndex((bit,i)=>bit!==s.target[i]); return s.cursor===target?'Space':s.cursor<target?'ArrowRight':'ArrowLeft'; }
        case 'files': return s.items[s.count]?'ArrowLeft':'ArrowRight';
        case 'robot': { const direction=s.x<s.target[0]?1:s.x>s.target[0]?3:s.y<s.target[1]?2:0; return s.orientation===direction?'Space':'ArrowRight'; }
        case 'molecule': { const target=s.recipe[s.count]; return s.cursor===target?'Space':s.cursor<target?'ArrowRight':'ArrowLeft'; }
        case 'bolt': return s.sequence[s.count];
        case 'catch': return s.cursor === s.target ? null : s.cursor < s.target ? 'ArrowRight' : 'ArrowLeft';
        case 'lathe': return Math.abs(gaugePosition(s)-s.target) <= s.width ? 'Space' : null;
        case 'wire': {
            const routeY = s.routeY ?? 0;
            return s.x === 4 ? (s.y < 1 ? 'ArrowDown' : 'ArrowUp') : s.y !== routeY ? (s.y < routeY ? 'ArrowDown' : 'ArrowUp') : 'ArrowRight';
        }
        case 'voltage': return s.value === s.target ? 'Space' : s.value < s.target ? 'ArrowUp' : 'ArrowDown';
        case 'solder': return toward(...s.targets[s.count]);
        case 'logic': {
            const answer = logicAnswer(s);
            return s.cursor === answer ? 'Space' : answer === 0 ? 'ArrowLeft' : 'ArrowRight';
        }
        case 'debug': return s.cursor === s.target ? 'Space' : s.cursor < s.target ? 'ArrowRight' : 'ArrowLeft';
        case 'sort': {
            const i = s.values.findIndex((v,i,a) => i < 3 && v > a[i+1]);
            return s.cursor === i ? 'Space' : s.cursor < i ? 'ArrowRight' : 'ArrowLeft';
        }
        case 'packet': {
            const obstacle = s.obstacles.find(o => !o.passed);
            return obstacle && obstacle.lane === s.cursor ? s.cursor === 4 ? 'ArrowLeft' : 'ArrowRight' : null;
        }
        case 'titrate': return s.count < s.target ? 'Space' : 'ArrowUp';
    }
}
