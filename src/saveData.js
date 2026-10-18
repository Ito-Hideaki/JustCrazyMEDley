// ゲームデータのセーブ形式（ゲーム設定 4章）
// ビット列: [ステージ0の40bit][ステージ1の40bit]...[ステージ4の40bit][完了回数8bit][合計取得数8bit]
// ステージ順: 0 機械, 1 電気, 2 電子, 3 情報, 4 物質
export const STAGE_COUNT = 5;
export const TANGYE_PER_STAGE = 40;
const COUNTER_BITS = 8;
const TOTAL_BITS = STAGE_COUNT * TANGYE_PER_STAGE + COUNTER_BITS * 2;

export function createEmptySaveData() {
    return {
        stages: Array.from({ length: STAGE_COUNT }, () => new Array(TANGYE_PER_STAGE).fill(false)),
        completedCount: 0,
        totalTangye: 0
    };
}

function numberToBits(value, length) {
    return Math.min(value, 2 ** length - 1).toString(2).padStart(length, '0');
}

// セーブデータを '0' と '1' だけの文字列にする
export function encodeSaveData(data) {
    const stageBits = data.stages
        .map(stage => stage.map(collected => (collected ? '1' : '0')).join(''))
        .join('');
    return stageBits
        + numberToBits(data.completedCount, COUNTER_BITS)
        + numberToBits(data.totalTangye, COUNTER_BITS);
}

// ビット列をセーブデータに戻す。形式が不正なら null
export function decodeSaveData(bits) {
    if (typeof bits !== 'string' || bits.length !== TOTAL_BITS || /[^01]/.test(bits)) {
        return null;
    }
    const stages = [];
    for (let s = 0; s < STAGE_COUNT; s++) {
        const start = s * TANGYE_PER_STAGE;
        stages.push(bits.slice(start, start + TANGYE_PER_STAGE).split('').map(bit => bit === '1'));
    }
    const counterStart = STAGE_COUNT * TANGYE_PER_STAGE;
    return {
        stages,
        completedCount: parseInt(bits.slice(counterStart, counterStart + COUNTER_BITS), 2),
        totalTangye: parseInt(bits.slice(counterStart + COUNTER_BITS), 2)
    };
}
