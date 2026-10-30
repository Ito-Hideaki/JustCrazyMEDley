import { createEmptySaveData, encodeSpell } from '../saveData.js';
import { FINAL_REQUIRED } from '../minigames/engineering.js';

export class Home extends Phaser.Scene {

    constructor() {
        super('Home');
    }

    init(data) {
        this.fromStage = data?.fromStage === true;//ステージから戻ってきたかどうか
    }

    preload() {
        this.load.image('background', 'assets/back1.png');//背景
        this.load.image('ground1', 'assets/ground1.png');//地面
        this.load.image('characterStand', 'assets/J-stand.png');//J（主人公）
        this.load.image('characterRun1', 'assets/J-run-1.png');//J（主人公）
        this.load.image('characterRun2', 'assets/J-run-2.png');//J（主人公）
        this.load.image('characterRun3', 'assets/J-run-3.png');//J（主人公）
        this.load.image('characterRun4', 'assets/J-run-4.png');//J（主人公）
        this.load.image('kuchu1', 'assets/kuchu1.png');//空中のオブジェクト
        this.load.image('tangye', 'assets/tangye.png');//取得単位アイコン
    }

    create() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);
        // 背景と地面（1画面に収まるのでスクロールしない）
        this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.groundHeight = 100;
        this.groundY = this.scale.height - this.groundHeight;
        this.add.tileSprite(0, this.groundY, this.scale.width, this.groundHeight, 'ground1').setOrigin(0, 0);

        // 操作・物理設定（Johoと同じ）
        this.moveSpeed = 600;
        this.gravity = 3000;//重力
        this.jumpSpeed = 1100;//ジャンプ速度
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // プレイヤー
        this.character = this.add.sprite(120, 0, 'characterStand');
        this.character.setScale(0.5);
        this.startX = 120;//操作を始める位置
        this.isEntering = this.fromStage;//画面の左端から歩いて入ってくる最中かどうか
        if (this.isEntering) {
            this.character.x = -this.character.displayWidth / 2;
        }
        this.characterBaseY = this.groundY - this.character.displayHeight / 2;
        this.character.y = this.characterBaseY;
        this.velocityY = 0;
        this.isGrounded = true;
        if (!this.anims.exists('JRun')) {
            this.anims.create({
                key: 'JRun',
                frames: ['characterRun1', 'characterRun2', 'characterRun3', 'characterRun4'].map(key => ({ key })),
                frameRate: 10,
                repeat: -1
            });
        }

        // 学科ブロック。順番はセーブデータのステージ番号と同じ
        const saveData = this.registry.get('saveData') ?? createEmptySaveData();
        const totalTangye = saveData.stages.reduce((sum, count) => sum + count, 0);
        const stages = [
            { label: '機械工学科', scene: 'Mechanical', saveIndex: 0 },
            { label: '電気工学科', scene: 'Electrical', saveIndex: 1 },
            { label: '電子工学科', scene: 'Denshi', saveIndex: 2 },
            { label: '情報工学科', scene: 'Joho', saveIndex: 3 },
            { label: '物質工学科', scene: 'Chemical', saveIndex: 4 },
            { label: 'ファイナル', scene: 'Final', hidden: totalTangye < FINAL_REQUIRED },
            { label: '終了', scene: 'Ending' },
        ];
        const visibleStages = stages.filter(stage => !stage.hidden);
        const slotCount = visibleStages.length;//表示するブロックだけを等間隔に並べる
        const blockWidth = 175;
        const sideMargin = 5;//画面端との余白（7個並べても重ならない値）
        const blockHeight = 35;
        // ジャンプで頭が届く高さ（最高点より少し低い位置）にブロックの下面を置く
        const jumpHeight = this.jumpSpeed ** 2 / (2 * this.gravity);
        const blockBottomY = this.groundY - this.character.displayHeight - jumpHeight * 0.6;
        const labelStyle = {
            fontSize: '22px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            padding: { top: 6, bottom: 6 }
        };
        this.blocks = [];
        visibleStages.forEach((stage, i) => {
            const x = sideMargin + (this.scale.width - sideMargin * 2) / slotCount * (i + 0.5);
            const y = blockBottomY - blockHeight / 2;
            const block = this.add.tileSprite(x, y, blockWidth, blockHeight, 'kuchu1');
            block.setData('scene', stage.scene);
            block.setData('label', this.add.text(x, y, stage.label, labelStyle).setOrigin(0.5));
            if (stage.saveIndex !== undefined) {
                const countLabel = this.add.text(x, y - 58, `取得単位数: ${saveData.stages[stage.saveIndex]}/40`, {
                    ...labelStyle,
                    fontSize: '16px'
                }).setOrigin(0.5);
                block.setData('countLabel', countLabel);
            }
            this.blocks.push(block);
        });

        this.add.text(this.scale.width / 2, 60, '学科のブロックを下からジャンプでつついてね', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            padding: { top: 8, bottom: 8 }
        }).setOrigin(0.5);

        

        this.add.text(this.scale.width / 2, 150, `合計取得単位数: ${totalTangye}`, {
            fontSize: '28px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5,
            padding: { top: 8, bottom: 8 }
        }).setOrigin(0.5);

        this.isLeaving = false;
    }

    update(time, delta) {
        const deltaSeconds = delta / 1000;
        if (this.isEntering) {
            // 左端から右へ歩いて入ってくる。開始位置に着いたら操作できる
            this.character.setFlipX(false);
            this.character.x += this.moveSpeed * deltaSeconds;
            if (!this.character.anims.isPlaying) {
                this.character.play('JRun');
            }
            if (this.character.x >= this.startX) {
                this.character.x = this.startX;
                this.isEntering = false;
                this.character.anims.stop();
                this.character.setTexture('characterStand');
            }
            return;
        }
        if (this.isLeaving) {
            // 遷移中は操作を受け付けず、キャラクターだけ地面まで落下させる
            this.velocityY += this.gravity * deltaSeconds;
            this.character.y = Math.min(this.character.y + this.velocityY * deltaSeconds, this.characterBaseY);
            return;
        }
        this.run(deltaSeconds);

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.isGrounded) {
            this.velocityY = -this.jumpSpeed;
            this.isGrounded = false;
        }

        const halfHeight = this.character.displayHeight / 2;
        const prevHeadTopY = this.character.y - halfHeight;
        this.velocityY += this.gravity * deltaSeconds;
        this.character.y += this.velocityY * deltaSeconds;

        // 下からブロックをつついたら、その学科の画面へ遷移する
        const characterBounds = this.character.getBounds();
        for (const block of this.blocks) {
            const blockBounds = block.getBounds();
            const overlapsX = characterBounds.right > blockBounds.left && characterBounds.left < blockBounds.right;
            const hitsFromBelow =
                this.velocityY < 0 &&
                prevHeadTopY >= blockBounds.bottom &&
                this.character.y - halfHeight <= blockBounds.bottom;
            if (overlapsX && hitsFromBelow) {
                // 通常のブロックと同じ：頭がブロックの下面で止まり、上向きの速度を失って落ちる
                this.character.y = blockBounds.bottom + halfHeight;
                this.velocityY = 0;
                // 遷移先のシーンがまだ無いブロックは、つついても遷移しない
                if (!this.scene.manager.keys[block.getData('scene')]) {
                    this.bumpBlock(block);
                    return;
                }
                this.isLeaving = true;
                this.character.anims.stop();
                this.character.setTexture('characterStand');
                this.bumpBlock(block);
                // ブロックが弾んだあと、画面を暗転させてから遷移する
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start(block.getData('scene'));
                });
                return;
            }
        }

        // 地面への着地
        if (this.character.y >= this.characterBaseY) {
            this.character.y = this.characterBaseY;
            this.velocityY = 0;
            this.isGrounded = true;
        }
    }

    // つつかれたブロックを少し持ち上げて戻す。キャラクターは頭がぶつかった位置から落下する
    bumpBlock(block) {
        this.tweens.add({
            targets: [block, block.getData('label')],
            y: '-=14',
            duration: 90,
            yoyo: true,
            ease: 'Sine.easeOut'
        });
    }

    run(deltaSeconds) {
        let direction = 0;
        if (this.cursors.right.isDown) {
            direction = 1;
        } else if (this.cursors.left.isDown) {
            direction = -1;
        }

        if (direction !== 0) {
            this.character.x += direction * this.moveSpeed * deltaSeconds;
            this.character.setFlipX(direction < 0);
            if (!this.character.anims.isPlaying) {
                this.character.play('JRun');
            }
        } else {
            this.character.anims.stop();
            this.character.setTexture('characterStand');
        }

        this.character.x = Phaser.Math.Clamp(
            this.character.x,
            this.character.displayWidth / 2,
            this.scale.width - this.character.displayWidth / 2
        );
    }
}
