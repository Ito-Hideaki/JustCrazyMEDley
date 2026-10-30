import { gaugePosition, phasePosition } from './engineering.js';

const SYMBOL = { ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓', ArrowLeft: '←' };
const COLORS = { ArrowUp: 0x80cffa, ArrowRight: 0xffd56f, ArrowDown: 0xb69aff, ArrowLeft: 0xff8d92 };
// Drawing stays inside the shared 50..990 by 244..600 playfield.
export function drawMicrogame(scene, s) {
    const g = scene.graphics;
    const clock = s.visualTime ?? s.elapsed;
    const pulse = 0.5 + Math.sin(clock*5)*0.5;
    const smooth = (key,value) => { scene.motion ??= {}; const old = scene.motion[key] ?? value; return scene.motion[key] = old + (value-old)*0.3; };
    const ink = (...args) => scene.ink(...args);
    const box = (x, y, w, h, color = 0x334964) => {
        g.fillStyle(0x07111f,0.5).fillRoundedRect(x-w/2+4,y-h/2+7,w,h,10);
        g.fillStyle(color).fillRoundedRect(x-w/2,y-h/2,w,h,10);
        g.lineStyle(2,0xffffff,0.18).strokeRoundedRect(x-w/2,y-h/2,w,h,10);
        g.fillStyle(0xffffff,0.07).fillRoundedRect(x-w/2+5,y-h/2+5,w-10,Math.min(18,h/4),5);
    };
    const line = (x1, y1, x2, y2, color = 0x8ae3b1, width = 5) => g.lineStyle(width, color).lineBetween(x1, y1, x2, y2);
    const circle = (x, y, radius, color) => g.fillStyle(color).fillCircle(x, y, radius);
    const grid = (cols, rows, target, cursor, blocked = []) => {
        const gap = cols === 3 ? 155 : 135;
        const startX = 520 - (cols - 1) * gap / 2;
        const startY = rows === 2 ? 370 : 315;
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
            const cx = startX + x * gap, cy = startY + y * 96;
            const danger = blocked.some(p => p[0] === x && p[1] === y);
            const selected = cursor && cursor[0] === x && cursor[1] === y;
            const goal = target && target[0] === x && target[1] === y;
            box(cx, cy, 100, 72, danger ? 0x8f394c : goal ? 0x3a846e : 0x2e425c);
            if (danger) ink(cx, cy, '×', 35, '#ffb5b5');
            if (goal && s.id !== 'wire') ink(cx, cy, s.id === 'scope' ? '◆' : '◎', 38, '#ffdd88');
            if(goal) g.lineStyle(3,0xffdc66,0.35+pulse*0.6).strokeCircle(cx,cy,30+pulse*8);
        }
        if(cursor) {
            const cx=smooth('gx',startX+cursor[0]*gap),cy=smooth('gy',startY+cursor[1]*96);
            g.lineStyle(4,0xffffff).strokeRect(cx-46,cy-32,92,64);
            if(s.id==='solder') { line(cx+20,cy-12,cx+54,cy-43,0xc4dfeb,8); line(cx+54,cy-43,cx+69,cy-57,0xffb45c,14); }
            if(s.id==='scope') { g.lineStyle(3,0xb7efff).strokeCircle(cx,cy,31); line(cx+24,cy+24,cx+42,cy+42,0xb7efff,7); }
        }
        return [startX, startY, gap];
    };
    switch (s.id) {
        case 'bolt': case 'mix': {
            ink(520, 292, s.id === 'bolt' ? '時計回りに締める！' : '実験レシピ', 25, '#ffdd88');
            s.sequence.forEach((key, i) => {
                const x = 520 + (i - (s.sequence.length - 1) / 2) * 94;
                box(x, 410, 78, 85, i < s.count ? 0x315947 : COLORS[key]);
                ink(x, 408, i < s.count ? '✓' : SYMBOL[key], 40, i < s.count ? '#8ae3b1' : '#162537');
                if (i === s.count) {
                    g.lineStyle(4,0xffffff,0.4+pulse*0.6).strokeRoundedRect(x-43,362,86,96,12);
                    ink(x, 479-Math.sin(clock*5)*5, '▲ 次はこれ', 18, '#ffffff');
                }
            });
            ink(810, 550, `${s.count} / ${s.sequence.length}`, 25);
            if(s.id==='bolt') {
                circle(400,550,28,0xadc5d6); circle(400,550,11,0x1a2940);
                const a=s.count*Math.PI/2+Math.sin(clock*3)*0.08;
                line(400,550,400+Math.cos(a)*85,550+Math.sin(a)*25,0xffb45c,14);
            } else {
                for(let i=0;i<5;i++) circle(400+i*35,558-((clock*28+i*13)%42),5+i%3,[0x80cffa,0xffd56f,0xb69aff,0xff8d92][i%4]);
                g.lineStyle(3,0xc7eeff).strokeRect(370,515,185,67);
                g.fillStyle(0xb69aff,0.4).fillRect(374,552-s.count*3,177,26+s.count*3);
            }
            break;
        }
        case 'catch': case 'packet': {
            for (let i = 0; i < 5; i++) {
                const x = 250 + i * 135;
                box(x, 410, 112, 280, 0x223750);
                ink(x, 560, `${i + 1}`, 18, '#94a9c3');
            }
            const playerX = smooth('playerX',250+s.cursor*135);
            box(playerX,519,98,35,0x8ae3b1);
            ink(playerX,518,s.id==='catch'?'受け皿':'DATA',18,'#13283a');
            ink(playerX,578,'↑ あなた',16,'#8ae3b1');
            if (s.id === 'catch') {
                const x = 250 + s.target * 135;
                const y = 285 + Math.min(1, s.elapsed / s.impact) * 215;
                circle(x, y, 30, 0xffb45c);
                circle(x, y, 11, 0x223750);
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4 + s.elapsed;
                    line(x + Math.cos(angle) * 23, y + Math.sin(angle) * 23, x + Math.cos(angle) * 39, y + Math.sin(angle) * 39, 0xffb45c, 12);
                }
            } else {
                for (const obstacle of s.obstacles) {
                    const until = obstacle.at - s.elapsed;
                    if (until >= 0 && until <= s.obstacleTravel) {
                        const x = 250 + obstacle.lane * 135, y = 500 - until / s.obstacleTravel * 220;
                        box(x, y, 70, 48, 0xdd6179);
                        for(let leg=-1;leg<=1;leg++) { line(x-35,y+leg*12,x-46,y+leg*15+Math.sin(clock*15)*4,0xdd6179,4); line(x+35,y+leg*12,x+46,y+leg*15-Math.sin(clock*15)*4,0xdd6179,4); }
                        ink(x, y, 'BUG', 20);
                    }
                }
                ink(520, 278, '赤いBUGと同じレーンにいるな！', 21, '#ffb5b5');
            }
            break;
        }
        case 'lathe': {
            box(520, 390, 700, 90, 0x334964);
            box(170 + s.target * 700, 390, s.width * 1400, 90, 0x3a846e);
            const x = 170 + gaugePosition(s) * 700;
            line(x, 320, x, 455, 0xffdd88, 8);
            ink(x, 300, '▼', 30, '#ffdd88');
            ink(520, 520, '黄色い針が緑に入ったら SPACE！', 28);
            break;
        }
        case 'wire': {
            const [x0, y0, gap] = grid(5, 3, [4, 1], [s.x, s.y], s.blocks);
            s.path.forEach((p, i) => { if (i) line(x0 + s.path[i - 1][0] * gap, y0 + s.path[i - 1][1] * 96, x0 + p[0] * gap, y0 + p[1] * 96, 0xffdd88, 5); });
            ink(x0, y0 + 96, '+ −', 23, '#ffdd88');
            ink(x0 + gap * 4, y0 + 96, '電球', 22);
            ink(520, 565, '白枠を矢印で動かそう！　赤い×は通れない', 22);
            break;
        }
        case 'voltage': {
            box(520, 399, 590, 220, 0x34445b);
            box(520, 403, 400, 100, 0x122a30);
            ink(520, 400, `${s.value.toFixed(1)} V`, 65, '#8ae3b1');
            ink(520, 305, `指定電圧：${s.target} V`, 29, '#ffdd88');
            ink(520, 550, '↑ 上げる     ↓ 下げる     SPACE 確定', 23);
            break;
        }
        case 'phase': {
            box(520, 414, 710, 180 * s.phaseWindow, 0x315947);
            line(165, 414, 875, 414, 0x8ae3b1, 2);
            for (let i = 1; i <= 140; i++) {
                const shift = s.elapsed * (2.2 + s.tier * 0.15) * (s.motionScale ?? 1) + (s.phaseOffset ?? Math.PI / 2);
                const a = (i - 1) / 140 * Math.PI * 4 + shift, b = i / 140 * Math.PI * 4 + shift;
                line(170 + (i - 1) * 5, 414 - Math.sin(a) * 90, 170 + i * 5, 414 - Math.sin(b) * 90, 0x78c9ed, 3);
            }
            circle(520, 414 - phasePosition(s) * 90, 15, 0xffdd88);
            ink(520, 280, '黄色い丸を緑の帯で止めよう！', 27, '#ffdd88');
            ink(520, 557, '黄色の光点を見て SPACE', 24);
            break;
        }
        case 'solder': {
            const target = s.targets[s.count] ?? s.targets[2];
            grid(3, 2, target, [s.x, s.y]);
            ink(520, 283, `光るパッドを接続：${s.count} / 3`, 27, '#ffdd88');
            ink(520, 555, '白枠がこて。緑のパッドへ移動！', 23);
            break;
        }
        case 'polarity': {
            ink(520, 287, `基板の表示：${s.target === 0 ? '＋     −' : '−     ＋'}`, 34, '#ffdd88');
            for (let i = 0; i < 2; i++) {
                const x = 360 + i * 320;
                box(x, 424, 230, 130, s.cursor === i ? 0x497c8a : 0x334964);
                circle(x, 400, 34, 0x78c9ed);
                line(x - 20, 426, x - 20, 465, 0xffffff, 4);
                line(x + 20, 426, x + 20, 465, 0xffffff, 4);
                ink(x, 520, i === 0 ? '← ＋ −' : '− ＋ →', 30);
            }
            break;
        }
        case 'logic': {
            const rule = s.gate === 'AND' ? '2つとも1なら →1。それ以外は ←0' : s.gate === 'OR' ? '1が1つでもあれば →1。なければ ←0' : '2つが違えば →1。同じなら ←0';
            ink(520,280,rule,24,'#ffdd88');
            ink(280, 357, `A = ${s.a}`, 35, '#ffdd88');
            ink(280, 448, `B = ${s.b}`, 35, '#ffdd88');
            line(355, 357, 430, 357); line(355, 448, 430, 448);
            box(520, 400, 180, 145, 0x4e517e);
            ink(520,400,s.gate,32);
            circle(370,357,10,s.a?0xffdc66:0x53627a); circle(370,448,10,s.b?0xffdc66:0x53627a);
            line(610, 400, 700, 400);
            ink(782, 400, s.cursor < 0 ? '?' : `${s.cursor}`, 64, '#8ae3b1');
            ink(520, 550, '← 0     → 1     SPACE 確定', 26);
            break;
        }
        case 'debug': {
            ink(520,276,`お手本の記号： ${s.options[s.target]}　←これと同じものを入れよう`,23,'#ffdd88');
            box(520, 350, 800, 110, 0x111f30);
            ink(520, 349, s.snippet, 32, '#99e29a');
            s.options.forEach((value, i) => { box(330 + i * 190, 492, 140, 85, s.cursor === i ? 0x6b5c99 : 0x334964); ink(330 + i * 190, 490, value, 48); });
            break;
        }
        case 'sort': {
            ink(520, 283, 'お手本： 1 → 2 → 3 → 4', 28, '#ffdd88');
            s.values.forEach((v, i) => {
                const x = smooth(`bar-${v}`, 280 + i * 160);
                box(x, 434 - v * 10, 110, 60 + v * 20, 0x6b5c99);
                ink(x, 410, `${v}`, 46);
            });
            line(280 + s.cursor * 160, 510, 440 + s.cursor * 160, 510, 0xffdd88, 6);
            ink(360 + s.cursor * 160, 549, 'この2つを交換', 24, '#ffdd88');
            break;
        }
        case 'titrate': {
            ink(520, 284, `指定：${s.target} 滴で止める！`, 30, '#ffdd88');
            g.lineStyle(5, 0xffffff).strokeRect(420, 340, 200, 190);
            const h = Math.min(180,s.count * 19);
            const dropY=325+((clock*90)%160);
            if(s.count) { circle(520,dropY,7,0x78c9ed); for(let i=0;i<4;i++) circle(450+i*43,520-((clock*25+i*13)%Math.max(1,h)),3,0xb7efff); }
            g.fillStyle(0x78c9ed).fillRect(425, 525 - h, 190, h);
            ink(520, 414, `${s.count} 滴`, 42);
            ink(520, 568, '多すぎたら ↓ で戻せるよ。↑ で完成！', 24);
            break;
        }
        case 'scope': {
            grid(5, 3, s.target, [s.x, s.y]);
            ink(520, 563, '白枠を結晶 ◆ に合わせて撮影！', 24, '#ffdd88');
            break;
        }
    }
}
