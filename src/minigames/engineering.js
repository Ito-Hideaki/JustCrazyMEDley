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
        durationScale: 1.45 - 0.55 * challenge,
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
    { id: 'phase', dept: 1, title: '丸を緑で止めよう！', subtitle: '交流波形のゼロクロス', controls: '光点が緑の帯に入ったら SPACE！', duration: 7 },
    { id: 'solder', dept: 2, title: 'はんだ付け！', subtitle: '基板を3か所つなぐ', controls: '矢印：白枠を動かす　緑のマスで SPACE', duration: 10 },
    { id: 'polarity', dept: 2, title: '＋と−を合わせよう！', subtitle: 'コンデンサを逆に挿すな', controls: '← →：向きを選択　SPACE：取り付け', duration: 6 },
    { id: 'logic', dept: 2, title: 'ルールで選ぼう！', subtitle: '論理ゲートの出力テスト', controls: '←：0　→：1　SPACE：確定', duration: 7 },
    { id: 'debug', dept: 3, title: 'ぬけた記号を入れよう！', subtitle: '締切直前の構文エラー', controls: '← →：記号を選ぶ　SPACE：実行', duration: 7 },
    { id: 'sort', dept: 3, title: '並べ替えろ！', subtitle: '実験データを昇順に', controls: '← →：隣接ペアを選ぶ　SPACE：交換', duration: 10 },
    { id: 'packet', dept: 3, title: '通信を守れ！', subtitle: 'バグだらけのネットワーク', controls: '← →：移動　赤いバグを避け続けろ！', duration: 6 },
    { id: 'titrate', dept: 4, title: '同じ数だけ入れよう！', subtitle: '実験ノートどおりの滴定', controls: 'SPACE：1滴足す　↓：1滴戻す　↑：できた！', duration: 7 },
    { id: 'mix', dept: 4, title: '順番どおり混ぜろ！', subtitle: '新素材のレシピを再現', controls: '表示された色の矢印を順番に！', duration: 8 },
    { id: 'scope', dept: 4, title: 'キラキラを見つけよう！', subtitle: '顕微鏡で結晶を観察', controls: '矢印：視野移動　結晶に合わせて SPACE', duration: 8 }
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
    return [0, 1, 2].flatMap(tier => shuffle([0, 1, 2, 3, 4], rng).map(dept => pools[dept][tier].id));
}
export function createGame(id, tier = 0, rng = Math.random, difficulty = null) {
    const definition = GAMES.find(game => game.id === id);
    if (!definition) throw new Error(`Unknown microgame: ${id}`);
    const motionScale = difficulty?.motionScale ?? 1;
    const timingScale = difficulty?.timingScale ?? 1;
    const s = { ...definition, tier, difficulty, motionScale, phaseWindow: 0.38 * timingScale, duration: (definition.duration + 3 - tier * 0.2) * (difficulty?.durationScale ?? 1), elapsed: 0, result: null, cursor: 0, count: 0, mistakes: 0, feedback: '' };
    switch (id) {
        case 'bolt': s.sequence = Array.from({ length: 4 + tier + (difficulty?.sequenceExtra ?? 0) }, (_, i) => ARROWS[i % 4]); break;
        case 'catch': s.cursor = 2; s.target = int(rng, 5); s.impact = (4.3 - tier * 0.15) / motionScale; break;
        case 'lathe': s.target = 0.35 + rng() * 0.3; s.width = (0.16 - tier * 0.01) * timingScale; break;
        case 'wire': s.x = 0; s.y = 1; s.path = [[0, 1]]; s.blocks = [[2, 1], [1, 2]]; break;
        case 'voltage': s.value = 0; s.target = 3 + int(rng, 6); break;
        case 'phase': break;
        case 'solder': s.x = 0; s.y = 0; s.targets = shuffle([[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], rng).slice(0, 3); break;
        case 'polarity': s.target = int(rng, 2); s.cursor = 1 - s.target; break;
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
            s.obstacleTravel = 1.4 / motionScale;
            s.surviveUntil = 7 / motionScale;
            s.obstacles = [2, 3.5, 5, 6.5].map(at => ({ at: at / motionScale, lane: int(rng, 5), passed: false }));
            break;
        case 'titrate': s.target = 4 + int(rng, 4); break;
        case 'mix': s.sequence = Array.from({ length: 4 + tier + (difficulty?.sequenceExtra ?? 0) }, () => ARROWS[int(rng, 4)]); break;
        case 'scope': s.x = 2; s.y = 1; s.target = [int(rng, 5), int(rng, 3)]; if (s.target[0] === 2 && s.target[1] === 1) s.target[0] = 4; break;
    }
    return s;
}
export function gaugePosition(s) {
    return (Math.sin(s.elapsed * (1.9 + s.tier * 0.15) * (s.motionScale ?? 1) - Math.PI / 2) + 1) / 2;
}
export function phasePosition(s) { return Math.sin(s.elapsed * (2.2 + s.tier * 0.15) * (s.motionScale ?? 1) + (s.phaseOffset ?? Math.PI / 2)); }

// Teach the same controls with a separate puzzle; never reveal the live round.
export function createDemoGame(current) {
    const demo = createGame(current.id, current.tier, Math.random, current.difficulty);
    switch (current.id) {
        case 'bolt': case 'mix':
            demo.sequence = current.sequence.map(key => ARROWS[(ARROWS.indexOf(key) + 1) % 4]);
            break;
        case 'catch': demo.target = current.target === 0 ? 4 : 0; break;
        case 'lathe': demo.target = 0.18; break;
        case 'wire':
            demo.blocks = current.blocks.map(([x,y]) => [x, 2-y]);
            demo.routeY = 2;
            break;
        case 'voltage': demo.target = current.target === 3 ? 5 : 3; break;
        case 'phase': demo.phaseOffset = 0; break;
        case 'solder': demo.targets = current.targets.map(([x,y]) => [(x+1)%3,y]); break;
        case 'polarity': demo.target = 1-current.target; demo.cursor = 1-demo.target; break;
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
        case 'scope':
            demo.target = [(current.target[0]+1)%5,current.target[1]];
            if (demo.target[0] === 2 && demo.target[1] === 1) demo.target[0] = 3;
            break;
    }
    return demo;
}
export function logicAnswer(s) { return s.gate === 'AND' ? s.a & s.b : s.gate === 'OR' ? s.a | s.b : s.a ^ s.b; }
export function advanceGame(s, elapsed) {
    if (s.result !== null) return;
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
        case 'bolt': case 'mix':
            if (!ARROWS.includes(key)) return;
            if (key !== s.sequence[s.count]) retry('光っている矢印を押そう！');
            else if (++s.count === s.sequence.length) s.result = true;
            break;
        case 'catch': case 'packet': s.cursor = clamp(s.cursor + dx, 0, 4); break;
        case 'lathe': if (key === 'Space') check(Math.abs(gaugePosition(s) - s.target) <= s.width, 'もう一度！ 黄色の針が緑に来たら押そう'); break;
        case 'phase': if (key === 'Space') check(Math.abs(phasePosition(s)) <= s.phaseWindow, '黄色い丸が緑の帯に来たら押そう'); break;
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
        case 'solder': case 'scope': {
            s.x = clamp(s.x + dx, 0, s.id === 'scope' ? 4 : 2);
            s.y = clamp(s.y + dy, 0, s.id === 'scope' ? 2 : 1);
            if (key === 'Space') {
                const target = s.id === 'scope' ? s.target : s.targets[s.count];
                if (s.x !== target[0] || s.y !== target[1]) retry('白い枠を光るマスに合わせよう！');
                else if (s.id === 'scope' || ++s.count === 3) s.result = true;
            }
            break;
        }
        case 'polarity': case 'logic':
            if (dx) s.cursor = dx < 0 ? 0 : 1;
            if (key === 'Space') check(s.cursor === (s.id === 'logic' ? logicAnswer(s) : s.target), '上のお手本を見て、もう一度！');
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
    "phase": [
        "黄色い丸を見よう",
        "緑の帯と重なったら\nSPACEを押そう！"
    ],
    "solder": [
        "白い枠があなたの道具",
        "矢印：枠を動かす\n緑の◎でSPACE！\n3か所つなごう。"
    ],
    "polarity": [
        "＋と−の並びを見よう",
        "← →：向きを選ぶ\n上と同じ並びなら\nSPACEで決定！"
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
    "mix": [
        "光る矢印を押そう",
        "左から1回ずつ！\n色より矢印を見よう。"
    ],
    "scope": [
        "白い枠があなたの視野",
        "矢印：枠を動かす\n黄色い◆に合わせて\nSPACEで撮影！"
    ]
};
// Demonstration chooses the next action from the visible puzzle, not a separate animation.
export function demoKey(s) {
    const toward = (x,y) => s.x < x ? 'ArrowRight' : s.x > x ? 'ArrowLeft' : s.y < y ? 'ArrowDown' : s.y > y ? 'ArrowUp' : 'Space';
    switch(s.id) {
        case 'bolt': case 'mix': return s.sequence[s.count];
        case 'catch': return s.cursor === s.target ? null : s.cursor < s.target ? 'ArrowRight' : 'ArrowLeft';
        case 'lathe': return Math.abs(gaugePosition(s)-s.target) <= s.width ? 'Space' : null;
        case 'phase': return Math.abs(phasePosition(s)) <= s.phaseWindow ? 'Space' : null;
        case 'wire': {
            const routeY = s.routeY ?? 0;
            return s.x === 4 ? (s.y < 1 ? 'ArrowDown' : 'ArrowUp') : s.y !== routeY ? (s.y < routeY ? 'ArrowDown' : 'ArrowUp') : 'ArrowRight';
        }
        case 'voltage': return s.value === s.target ? 'Space' : s.value < s.target ? 'ArrowUp' : 'ArrowDown';
        case 'solder': return toward(...s.targets[s.count]);
        case 'scope': return toward(...s.target);
        case 'polarity': case 'logic': {
            const answer = s.id === 'logic' ? logicAnswer(s) : s.target;
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
