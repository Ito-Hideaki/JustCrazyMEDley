import { Joho } from './Joho.js';

// ?scene=Blank で開く、ステージ制作用の空ステージ。
// 操作・当たり判定・カメラ・HUD・Pキーの撮影はJohoと共通。
export class Blank extends Joho {
    constructor(sceneKey = 'Blank') {
        super(sceneKey);
    }

    create() {
        super.create();
        this.stageIndex = null;
        this.stageTangyeRecord = 0;
    }

    placeAllPits() {
        this.pits = [];
        this.placeGroundSegment(0, this.worldWidth);
    }

    // 各メソッドに配置を追加して新しいステージを作る。
    // 例: this.placePlatform(1000, 400);
    placeAllPlatforms() {}
    placeAllWalls() {}
    placeAllHiddenBlocks() {}
    placeAllTangye() {}
    placeAllMoveTangye() {}
    placeAllAkaten() {}
    placeAllAoten() {}
    placeAllReports() {}
    placeAllDepartmentDamage() {}
    placeAllEnadori() {}
    startEnadoriSpawner() {}

    // 制作用ステージは学科の取得記録・クリア回数に含めない。
    saveStageRecord() {}
    completeStage() {}
}
