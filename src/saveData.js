// ゲームデータのセーブ形式
// ビット列: [ステージ0の8bit][ステージ1の8bit]...[ステージ4の8bit][完了回数8bit][合計取得数8bit]
// 各ステージの値は、そのステージでの最大取得数（2進数8bit）
// ステージ順: 0 機械, 1 電気, 2 電子, 3 情報, 4 物質
export const STAGE_COUNT = 5;
const COUNTER_BITS = 8;
const TOTAL_BITS = STAGE_COUNT * COUNTER_BITS + COUNTER_BITS * 2;

// 開発用：URLに ?scene=○○ を付けて開いているときはゲームオーバーにしない
export const IS_SCENE_DEBUG = Boolean(new URLSearchParams(globalThis.location?.search ?? '').get('scene'));

export function createEmptySaveData() {
    return {
        stages: new Array(STAGE_COUNT).fill(0),
        completedCount: 0,
        totalTangye: 0
    };
}

function numberToBits(value, length) {
    return Math.min(value, 2 ** length - 1).toString(2).padStart(length, '0');
}

// セーブデータを '0' と '1' だけの文字列にする
export function encodeSaveData(data) {
    return data.stages.map(count => numberToBits(count, COUNTER_BITS)).join('')
        + numberToBits(data.completedCount, COUNTER_BITS)
        + numberToBits(data.totalTangye, COUNTER_BITS);
}

// ふっかつのじゅもん：セーブデータ56bit＋チェックサム8bitを6bitずつ、ひらがな64文字で表す（11文字）
// 五十音表の1行（あ行など）を1要素とする。'.' は空白マス。上から あ・い・う・え・お の段
export const SPELL_COLUMNS = [
    'あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの',
    'はひふへほ', 'まみむめも', 'や.ゆ.よ', 'らりるれろ', 'わ.を.ん',
    'がぎぐげご', 'ざじずぜぞ', 'だぢづでど', 'ばびぶ..',
];
export const SPELL_CHARS = SPELL_COLUMNS.join('').replace(/\./g, '');
export const SPELL_LENGTH = 11;
const SPELL_CHECK_BITS = 8;

function checksumBits(bits) {
    let sum = 0;
    for (let i = 0; i < bits.length; i += 8) {
        sum = (sum * 31 + parseInt(bits.slice(i, i + 8), 2) + 7) % 256;
    }
    return numberToBits(sum, SPELL_CHECK_BITS);
}

export function encodeSpell(data) {
    const bits = encodeSaveData(data);
    const all = (bits + checksumBits(bits)).padEnd(SPELL_LENGTH * 6, '0');
    let spell = '';
    for (let i = 0; i < all.length; i += 6) {
        spell += SPELL_CHARS[parseInt(all.slice(i, i + 6), 2)];
    }
    return spell;
}

// 呪文をセーブデータに戻す。文字や長さ、チェックサムが不正なら null
export function decodeSpell(text) {
    const spell = String(text)
        .replace(/[\u30a1-\u30f6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
        .replace(/[\s\u3000]/g, '');
    if (spell.length !== SPELL_LENGTH) {
        return null;
    }
    let all = '';
    for (const ch of spell) {
        const index = SPELL_CHARS.indexOf(ch);
        if (index < 0) {
            return null;
        }
        all += index.toString(2).padStart(6, '0');
    }
    const payloadLength = TOTAL_BITS;
    const bits = all.slice(0, payloadLength);
    if (all.slice(payloadLength, payloadLength + SPELL_CHECK_BITS) !== checksumBits(bits) ||
        /1/.test(all.slice(payloadLength + SPELL_CHECK_BITS))) {
        return null;
    }
    return decodeSaveData(bits);
}

// ビット列をセーブデータに戻す。形式が不正なら null
export function decodeSaveData(bits) {
    if (typeof bits !== 'string' || bits.length !== TOTAL_BITS || /[^01]/.test(bits)) {
        return null;
    }
    const stages = [];
    for (let s = 0; s < STAGE_COUNT; s++) {
        stages.push(parseInt(bits.slice(s * COUNTER_BITS, (s + 1) * COUNTER_BITS), 2));
    }
    const counterStart = STAGE_COUNT * COUNTER_BITS;
    return {
        stages,
        completedCount: parseInt(bits.slice(counterStart, counterStart + COUNTER_BITS), 2),
        totalTangye: parseInt(bits.slice(counterStart + COUNTER_BITS), 2)
    };
}
