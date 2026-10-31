import { gaugePosition } from './engineering.js';

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
            if (goal && !['wire','robot','crane'].includes(s.id)) ink(cx, cy, '◎', 38, '#ffdd88');
            if(goal) g.lineStyle(3,0xffdc66,0.35+pulse*0.6).strokeCircle(cx,cy,30+pulse*8);
        }
        if(cursor) {
            const cx=smooth('gx',startX+cursor[0]*gap),cy=smooth('gy',startY+cursor[1]*96);
            g.lineStyle(4,0xffffff).strokeRect(cx-46,cy-32,92,64);
            if(s.id==='solder') { line(cx+20,cy-12,cx+54,cy-43,0xc4dfeb,8); line(cx+54,cy-43,cx+69,cy-57,0xffb45c,14); }
        }
        return [startX, startY, gap];
    };
    switch (s.id) {
        case 'launch': {
            const landing=360+s.aim*100, target=360+s.target*100;
            ink(520,280,'点線の着地点を旗に合わせて発射！',25,'#ffdd88');
            line(160,510,880,510,0x8ae3b1,4);
            box(190,490,80,45,0x97b1c4); line(190,480,225,453,0xffb45c,15);
            box(target,508,75,18,0x8ae3b1);line(target,506,target,440,0xffffff,3);ink(target+12,430,'旗',24,'#ffdd88');
            const flight=(t)=>[205+(landing-205)*t,480-150*Math.sin(Math.PI*t)];
            for(let i=1;i<=18;i++) {const [x,y]=flight(i/18);circle(x,y,3,0xa6c5d7);}
            const progress=s.flying?Math.min(1,(s.elapsed-s.flightAt)/0.65):0;
            const [x,y]=flight(progress);circle(x,y,16,0xffdd88);circle(x-4,y-4,5,0xfff3c9);
            ink(520,559,s.flying?'ボールが飛んでいる！':'← →：飛距離を変える　SPACE：発射',23);
            break;
        }
        case 'lightning': {
            const active=s.events.some(event=>!event.protected && s.elapsed>=event.at && s.elapsed<=event.at+s.window);
            const shield=s.events.some(event=>event.protected && s.elapsed-event.at<0.65);
            for(let i=0;i<3;i++)circle(460+i*65,355+(i===1?-18:0),60,active?0x7a6a39:0x62748a);
            box(520,475,210,70,0x334964);ink(520,475,'実験装置',24);
            if(active){line(535,370,500,410,0xffdd55,12);line(500,410,545,408,0xffdd55,12);line(545,408,510,451,0xffdd55,12);}
            if(shield){g.lineStyle(9,0x8ae3b1).strokeCircle(520,469,125);ink(520,389,'守った！',27,'#8ae3b1');}
            ink(520,280,active?'雷！ SPACEで守れ！':shield?'ガード成功！':'晴れている間は待とう…',30,active?'#ffdd55':'#ffffff');
            ink(520,559,`守った回数 ${s.count} / 2`,25,'#8ae3b1');
            break;
        }
        case 'memory': {
            const watching=s.elapsed<s.showFor, slot=Math.floor(s.elapsed/0.42);
            ink(520,280,watching?'見るだけ！ 点滅の順番を覚えよう':'入力！ 覚えた順に矢印を押そう',26,'#ffdd88');
            const arrows=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'];
            arrows.forEach((key,i)=> {const x=280+i*160,lit=watching&&slot<s.sequence.length&&s.sequence[slot]===key&&s.elapsed%0.42<0.32;box(x,415,110,105,lit?COLORS[key]:0x30435b);ink(x,414,SYMBOL[key],48,lit?'#14283f':'#93a8bf');if(lit)g.lineStyle(4,0xffffff).strokeCircle(x,415,65);});
            ink(520,553,watching?'まだ押さなくていいよ':`${'✓ '.repeat(s.count)}${'□ '.repeat(s.sequence.length-s.count)}`,30,'#8ae3b1');
            break;
        }
        case 'thermal': {
            ink(520,280,'↑で温める・↓で冷やす　緑をキープ！',25,'#ffdd88');
            g.lineStyle(4,0xd7efff).strokeRect(290,350,225,170);
            g.fillStyle(0xb69aff,0.65).fillRect(295,430,215,85);
            for(let i=0;i<5;i++)circle(320+i*39,510-((clock*34+i*19)%74),5,0xd8b6ff);
            for(let i=0;i<3;i++)g.fillStyle(0xffb45c).fillTriangle(325+i*63,542,340+i*63,517-Math.sin(clock*7+i)*9,355+i*63,542);
            box(745,420,65,220,0x334964);
            g.fillStyle(0x8ae3b1,0.45).fillRect(712,530-(0.5+s.band)*220,66,s.band*440);
            const y=530-s.temperature*220;line(690,y,800,y,0xffdd88,7);ink(830,y,'◀',27,'#ffdd88');
            box(520,560,450,13,0x334964);g.fillStyle(0x8ae3b1).fillRect(295,553,450*Math.min(1,s.stableFor/1.5),13);
            ink(520,588,`キープ ${s.stableFor.toFixed(1)} / 1.5秒`,20);
            break;
        }
        case 'microbes': {
            g.fillStyle(0x183b43).fillCircle(430,427,130);g.lineStyle(5,0x9de2de).strokeCircle(430,427,130);
            for(let i=0;i<s.target;i++){
                const angle=i*Math.PI*2/s.target+clock*0.12, r=78+Math.sin(clock*1.2+i)*12;
                const x=430+Math.cos(angle)*r,y=427+Math.sin(angle)*r;
                box(x,y,42,27,0x8ae3b1);circle(x+8,y-3,3,0x14283f);line(x-20,y,x-29,y+Math.sin(clock*8+i)*7,0x8ae3b1,3);
            }
            ink(520,280,'緑の生き物は何匹？ 動いているよ！',25,'#ffdd88');
            box(760,423,130,130,0x334964);ink(760,413,`${s.answer}`,60);ink(760,515,'↑ ↓ で選ぶ',22);
            ink(520,578,'数えたら SPACEで回答！',24);
            break;
        }
        case 'magnetmaze': {
            box(520,430,760,285,0x223b48);
            g.lineStyle(3,0x8ae3b1).strokeRoundedRect(180,285,680,255,8);
            box(520,462,200,195,0x92576a);ink(520,450,'壁',34,'#ffd2d2');
            circle(s.target[0],s.target[1],s.goalRadius,0x3a846e);ink(s.target[0],s.target[1],'旗',27,'#ffdd88');
            for(let i=0;i<6;i++)line(310+i*70,321,332+i*70,321,0x608b99,3);
            circle(s.x,s.y,16,0xc3dae5);circle(s.x-5,s.y-5,5,0xffffff);
            if(s.heading)ink(s.x,s.y-32,s.heading[0]>0?'→':s.heading[0]<0?'←':s.heading[1]<0?'↑':'↓',25,'#ffdd88');
            ink(520,268,'矢印で進む向きを変える。SPACEで止まる！',22,'#ffdd88');
            ink(520,586,'赤い壁を回って旗へ！ 玉は自動で進むよ',22);
            break;
        }
        case 'crane': {
            grid(3,2,s.carrying?s.target:s.pickup,[s.x,s.y]);
            const x=smooth('hookX',365+s.x*155), y=smooth('hookY',370+s.y*96);
            line(x,265,x,y-20,0xc8e4ed,4);
            g.lineStyle(5,0xffdd88).strokeCircle(x,y-10,12);
            if(s.carrying) { box(x,y+17,52,40,0xffb45c); ink(x,y+17,'荷物',16,'#13283a'); }
            else { box(365+s.pickup[0]*155,370+s.pickup[1]*96,52,40,0xffb45c); ink(365+s.pickup[0]*155,370+s.pickup[1]*96,'荷物',16,'#13283a'); }
            ink(365+s.target[0]*155,370+s.target[1]*96,'旗',24,'#ffdd88');
            ink(520,555,s.carrying?'旗のマスへ運んで SPACE！':'荷物のマスで SPACE！',25,'#ffdd88');
            break;
        }
        case 'bulb': {
            ink(520,283,`暗い電球を直そう：${s.count} / 2`,27,'#ffdd88');
            for(let i=0;i<3;i++) {
                const x=300+i*220, dark=i===(s.targets[s.count]??-1);
                if(!dark) { circle(x,390,65+pulse*7,0x635c30); for(let j=0;j<8;j++) {const a=j*Math.PI/4; line(x+Math.cos(a)*52,390+Math.sin(a)*52,x+Math.cos(a)*68,390+Math.sin(a)*68,0xffdd88,3);} }
                circle(x,390,42,dark?0x465164:0xffdd88); box(x,447,46,30,0x97b1c4);
                ink(x,390,dark?'消灯':'点灯',20,dark?'#a6b6ce':'#14283f');
                if(i===s.cursor) g.lineStyle(4,0xffffff).strokeRoundedRect(x-85,317,170,160,14);
            }
            ink(520,553,'白枠を暗い電球へ → SPACE',25);
            break;
        }
        case 'charge': {
            ink(520,284,s.charging?'緑に来たら SPACEで止める！':'SPACEで充電スタート！',29,'#ffdd88');
            g.lineStyle(6,0xc8e4ed).strokeRoundedRect(220,345,600,120,12);
            box(835,405,25,52,0xc8e4ed);
            g.fillStyle(0x78c9ed,0.8).fillRect(226,351,588*Math.min(1,s.charge),108);
            g.fillStyle(0x8ae3b1,0.3).fillRect(226+588*(s.target-s.width),351,1176*s.width,108);
            g.lineStyle(4,0x8ae3b1).strokeRect(226+588*(s.target-s.width),348,1176*s.width,114);
            ink(520,405,`${Math.round(s.charge*100)}%`,42,'#ffffff');
            if(s.charging) ink(520,511,'⚡ 充電中 ⚡',27,'#ffdd88');
            break;
        }
        case 'chip': {
            ink(400,284,'お手本のしるし →',25,'#ffdd88');
            const chip=(x,y,size,orientation)=> {
                box(x,y,size,size,0x253340);
                for(let i=-1;i<=1;i++) { line(x-size/2-12,y+i*size/4,x+size/2+12,y+i*size/4,0x97b1c4,4); line(x+i*size/4,y-size/2-12,x+i*size/4,y+size/2+12,0x97b1c4,4); }
                box(x,y,size,size,0x253340);
                const a=orientation*Math.PI/2-Math.PI/2;
                circle(x+Math.cos(a)*size*0.37,y+Math.sin(a)*size*0.37,size*0.09,0xffdd88);
            };
            chip(675,287,55,s.target); chip(520,438,140,s.orientation);
            ink(520,557,'← → で回す　金色が同じ向きなら SPACE',23);
            break;
        }
        case 'led': {
            ink(520,280,'上の光と同じにしよう！',26,'#ffdd88');
            for(let i=0;i<4;i++) {
                const x=280+i*160;
                circle(x,345,32,s.target[i]?0xffdd88:0x324052);
                ink(x,345,s.target[i]?'ON':'OFF',17,s.target[i]?'#14283f':'#bac8d8');
                box(x,463,100,105,s.bits[i]?0x6f6937:0x334964);
                circle(x,455,26,s.bits[i]?0xffdd88:0x19283a);
                if(s.bits[i]) g.lineStyle(3,0xffdd88,0.3+pulse*0.4).strokeCircle(x,455,33+pulse*5);
                if(i===s.cursor) g.lineStyle(4,0xffffff).strokeRect(x-54,407,108,112);
            }
            ink(520,557,'← →：白枠　SPACE：つける・消す',23);
            break;
        }
        case 'files': {
            const keep=!!s.items[s.count];
            ink(520,280,`${s.count} / ${s.items.length} ファイル整理`,26,'#ffdd88');
            box(520,400,180,150,keep?0x357c9d:0xa04961);
            ink(520,377,keep?'保存':'ゴミ箱',37);
            ink(520,431,keep?'卒論データ':'不要なコピー',22);
            box(260,470,170,75,0x357c9d); ink(260,470,'← 保存',26);
            box(780,470,170,75,0xa04961); ink(780,470,'ゴミ箱 →',26);
            ink(520,558,'青は左へ、赤は右へ！',27,'#ffdd88');
            break;
        }
        case 'robot': {
            const [x0,y0,gap]=grid(3,3,s.target,null);
            const x=smooth('rx',x0+s.x*gap),y=smooth('ry',y0+s.y*96);
            box(x,y,56,54,0x8ae3b1); ink(x,y,['↑','→','↓','←'][s.orientation],35,'#14283f');
            ink(x0+s.target[0]*gap,y0+s.target[1]*96,'旗',23,'#ffdd88');
            ink(520,570,'← →：向きを回す　SPACE：1マス前へ',22);
            break;
        }
        case 'molecule': {
            const colors=[0xff8d92,0x80cffa,0xffd56f],names=['赤','青','黄'];
            ink(520,278,'上の玉を左からつなごう！',26,'#ffdd88');
            s.recipe.forEach((color,i)=>{ const x=380+i*140; if(i) line(x-100,350,x-40,350,0xc8e4ed,7); circle(x,350,32,colors[color]); ink(x,350,i<s.count?'✓':names[color],22,'#14283f'); if(i===s.count) g.lineStyle(4,0xffffff).strokeCircle(x,350,40+pulse*4); });
            colors.forEach((color,i)=> { const x=300+i*220; box(x,485,150,92,s.cursor===i?0x587a88:0x334964); circle(x,485,28,color); ink(x,485,names[i],20,'#14283f'); });
            break;
        }
        case 'bolt': {
            ink(520, 292, '時計回りに締める！', 25, '#ffdd88');
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
            circle(400,550,28,0xadc5d6); circle(400,550,11,0x1a2940);
            const a=s.count*Math.PI/2+Math.sin(clock*3)*0.08;
            line(400,550,400+Math.cos(a)*85,550+Math.sin(a)*25,0xffb45c,14);
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
        case 'solder': {
            const target = s.targets[s.count] ?? s.targets[2];
            grid(3, 2, target, [s.x, s.y]);
            ink(520, 283, `光るパッドを接続：${s.count} / 3`, 27, '#ffdd88');
            ink(520, 555, '白枠がこて。緑のパッドへ移動！', 23);
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

    }
}
