import { createEmptySaveData, encodeSaveData } from '../saveData.js';

export class Denshi extends Phaser.Scene {

    constructor() {
        super('Denshi');
    }

    preload() {
        this.load.image('background', 'assets/back1.png');//背景
        this.load.image('ground1', 'assets/ground1.png');//地面（チョコ）
        this.load.image('DenshicharacterStand', 'assets/D-stand.png');//J（主人公）
        this.load.image('DenshicharacterDamage', 'assets/D-damage.png');//J（主人公）
        this.load.image('DenshicharacterRun1', 'assets/D-run-1.png');//J（主人公）
        this.load.image('DenshicharacterRun2', 'assets/D-run-2.png');//J（主人公）
        this.load.image('DenshicharacterRun3', 'assets/D-run-3.png');//J（主人公）
        this.load.image('DenshicharacterRun4', 'assets/D-run-4.png');//J（主人公）
        this.load.image('tangye', 'assets/tangye.png');//タン・イー
        this.load.image('Akaten', 'assets/Akaten.png');//赤点
        this.load.image('Aoten', 'assets/Aoten.png');//青点
        this.load.image('kuchu1', 'assets/kuchu1.png');//空中のオブジェクト
        this.load.image('gameover', 'assets/gameover.png');
        this.load.image('life', 'assets/life.png');//ライフアイコン
    }

    create() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);//Homeからの暗転から明るくする
        this.isLeaving = false;//ステージの右端から出ていく最中かどうか
        // 背景と地面
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');//背景を配置
        this.groundHeight = 100;
        this.groundY = this.scale.height - this.groundHeight;
        this.worldWidth = 12800;//ワールドの幅（地面の生成より前に必要）
        this.pits = [];//落とし穴の範囲 {left, right}
        this.maxLife = 3;//ライフの最大数
        this.life = this.maxLife;//ライフ
        this.placeAllPits();//落とし穴を配置し、穴を避けて地面を作る

        this.background.setScrollFactor(0);

        // ワールドと操作・物理設定
        this.moveSpeed =650;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.gravity = 3000;//重力
        this.jumpSpeed = 1100;//ジャンプ速度

        // 空中のオブジェクト 
        this.platformGroup = this.add.group();//配置した空中ブロックの管理用
        this.placeAllPlatforms();//空中ブロックを配置

        // 収集アイテム
        this.stageIndex = 2;//このステージの番号（0 機械, 1 電気, 2 電子, 3 情報, 4 物質）
        this.saveData = this.registry.get('saveData') ?? createEmptySaveData();//保存済みデータ（初回は全て0）
        this.collectedNow = new Array(40).fill(false);//今回のプレイで取得したタン・イーの番号
        this.tangyeGroup = this.add.group();//配置したタン・イーの管理用
        this.AkatenGroup = this.add.group();//配置した赤点の管理用
        this.AotenGroup = this.add.group();//配置した青点の管理用
        this.tangyeCount = this.saveData.totalTangye;//取得したタン・イーの合計数
        this.placeAllTangye();//未取得のタン・イーを配置
        this.placeAllMoveTangye();//未取得の動くタン・イーを配置
        this.placeAllAkaten();
        this.placeAllAoten();

        // 取得数の表示（右上に固定）：タン・イーの画像＋数字
        this.tangyeCountText = this.add.text(this.scale.width - 20, 20, String(this.tangyeCount), {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
        this.tangyeCountIcon = this.add.image(0, 20 + this.tangyeCountText.height / 2, 'tangye')
            .setScale(0.2).setScrollFactor(0).setDepth(100);
        this.updateTangyeCountDisplay();

        // ライフの表示（右上、取得数の下に固定）：life画像をライフの数だけ並べる
        const lifeIconSize = 40;
        this.lifeIcons = [];
        for (let i = 0; i < this.maxLife; i++) {
            const icon = this.add.image(this.scale.width - 20 - lifeIconSize / 2 - (this.maxLife - 1 - i) * (lifeIconSize + 8), 90, 'life')
                .setDisplaySize(lifeIconSize, lifeIconSize).setScrollFactor(0).setDepth(100);
            this.lifeIcons.push(icon);
        }
        this.updateLifeDisplay();

        // 画面左端のワールド座標の表示（左上に固定）
        this.leftXText = this.add.text(20, 20, 'X: 0', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(100);

        // プレイヤー
        this.characterStand = this.add.sprite(220, 0, 'DenshicharacterStand');//J（主人公）を配置
        this.characterStand.setScale(0.5) ;//J（主人公）のサイズを調整
        this.characterStandBaseY = this.groundY - this.characterStand.displayHeight / 2;
        this.characterStand.y = this.characterStandBaseY;
        if (!this.anims.exists('DenshiRun')) {
            this.anims.create({
                key: 'DenshiRun',
                frames: ['DenshicharacterRun1', 'DenshicharacterRun2', 'DenshicharacterRun3', 'DenshicharacterRun4'].map(key => ({ key })),
                frameRate: 10,
                repeat: -1
            });
        }
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);//スペースキーの挙動を監視
        this.characterStandVelocityY = 0;//J（主人公）のY軸速度
        this.isGrounded = true;//J（主人公）が地面にいるかどうか

        // カメラ
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.worldWidth, this.scale.height);
        cam.startFollow(this.characterStand, true, 0.1 , 0.1);
        cam.setFollowOffset(-300, 0);

        // Pキーでステージ全体を1枚の画像として保存
        this.isCapturing = false;
        this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P).on('down', () => this.captureWholeStage());
    }

    // カメラを1画面ずつ動かして撮影し、横につなげて1枚のPNGにする
    captureWholeStage() {
        if (this.isCapturing) {
            return;
        }
        this.isCapturing = true;

        const cam = this.cameras.main;
        const viewW = this.scale.width;
        const viewH = this.scale.height;
        const maxScrollX = this.worldWidth - viewW;
        const savedScrollX = cam.scrollX;
        const hudTexts = [this.tangyeCountText, this.tangyeCountIcon, ...this.lifeIcons, this.leftXText];

        cam.stopFollow();
        hudTexts.forEach(text => text.setVisible(false));

        const canvas = document.createElement('canvas');
        canvas.width = this.worldWidth;
        canvas.height = viewH;
        const ctx = canvas.getContext('2d');

        const finish = () => {
            hudTexts.forEach(text => text.setVisible(true));
            cam.startFollow(this.characterStand, true, 0.1, 0.1);
            cam.setFollowOffset(-300, 0);
            cam.scrollX = savedScrollX;
            this.isCapturing = false;

            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = 'stage.png';
            a.click();
        };

        const captureAt = scrollX => {
            cam.scrollX = scrollX;
            // 描画に反映されてから撮影する
            this.game.events.once('postrender', () => {
                this.game.renderer.snapshot(image => {
                    const draw = () => {
                        ctx.drawImage(image, scrollX, 0);
                        if (scrollX >= maxScrollX) {
                            finish();
                        } else {
                            captureAt(Math.min(scrollX + viewW, maxScrollX));
                        }
                    };
                    if (image.complete) {
                        draw();
                    } else {
                        image.onload = draw;
                    }
                });
            });
        };

        captureAt(0);
    }

    update(time,delta) {
        if (this.isCapturing) {
            return;
        }
        const deltaSeconds = delta / 1000;//デルタタイムを秒に変換
        if (this.isLeaving) {
            // 出ていく最中は操作を受け付けず、右へ歩き続ける
            this.characterStand.x += this.moveSpeed * deltaSeconds;
            return;
        }
        this.run(deltaSeconds);
        if (this.characterStand.x > this.worldWidth) {
            this.leaveStage();
        }

        // ジャンプ入力
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            if (this.isGrounded) {//スペースキーが押され、かつ地面にいる場合
                this.characterStandVelocityY = -this.jumpSpeed;//ジャンプ速度を設定
                this.isGrounded = false;//地面から離れたことを示す
            }
        }
        this.isGrounded = false;

        // Y方向の移動と空中オブジェクトとの判定
        const footBottomY = this.characterStand.y + this.characterStand.displayHeight / 2;//キャラクターの足元のY座標
        const headTopY = this.characterStand.y - this.characterStand.displayHeight / 2;//キャラクターの頭頂のY座標

        this.characterStandVelocityY += this.gravity * deltaSeconds;//重力を適用
        this.characterStand.y += this.characterStandVelocityY * deltaSeconds;//Y軸の位置を更新

        const currentBottomY = this.characterStand.y + this.characterStand.displayHeight / 2;//キャラクターの足元の現在のY座標
        const charaterBounds = this.characterStand.getBounds();//キャラクターのバウンディングボックスを取得
        for (const platform of this.platformGroup.getChildren()) {
            const platformBounds = platform.getBounds();//空中ブロックのバウンディングボックスを取得
            const overlapsX =
                charaterBounds.right > platformBounds.left &&
                charaterBounds.left < platformBounds.right;

            const isCollidingWithPlatform =
                this.characterStandVelocityY >= 0 &&
                footBottomY <= platformBounds.top &&
                currentBottomY >= platformBounds.top &&
                overlapsX;

            const isCollidingWithHead =
                this.characterStandVelocityY < 0 &&
                headTopY >= platformBounds.bottom &&
                this.characterStand.y - this.characterStand.displayHeight / 2 <= platformBounds.bottom &&
                overlapsX;

            if (isCollidingWithHead) {
                this.characterStand.y = platformBounds.bottom + this.characterStand.displayHeight / 2;
                this.characterStandVelocityY = 0;
            }

            if (isCollidingWithPlatform) {
                this.characterStand.y = platformBounds.top - this.characterStand.displayHeight / 2;
                this.characterStandVelocityY = 0;
                this.isGrounded = true;
            }
        }

        // 地面への着地（落とし穴の上では着地しない）
        const isOverPit = this.pits.some(pit => this.characterStand.x > pit.left && this.characterStand.x < pit.right);
        if (!isOverPit && this.characterStand.y >= this.characterStandBaseY && this.characterStand.y - this.characterStandVelocityY * deltaSeconds <= this.characterStandBaseY) {//地面に着地した場合
            this.characterStand.y = this.characterStandBaseY;//Y軸を地面の位置に固定
            this.characterStandVelocityY = 0;//Y軸速度をリセッな
            this.isGrounded = true;//地面にいることを示す
        }

        // 落とし穴に落ちた（画面の下に出た）場合
        if (this.characterStand.y - this.characterStand.displayHeight / 2 > this.scale.height) {
            this.fallIntoPit();
        }

        // アイテム取得判定
        const playerBounds = this.characterStand.getBounds();
        this.tangyeGroup.getChildren().slice().forEach(tangye => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, tangye.getBounds())) {//J（主人公）とタン・イーが衝突した場合
                if (tangye.getData('moving')) {//動くタン・イーに当たった
                    this.characterStandVelocityY = -this.jumpSpeed;//当たったら自動で跳ね上がる
                }
                this.collectedNow[tangye.getData('number')] = true;//取得した番号を記録
                tangye.destroy();//タン・イーを消す（グループからも自動で外れる）
                this.tangyeCount += 1;
                this.updateTangyeCountDisplay();
            }
        });



        const playerGetDamage = this.characterStand.getBounds();
        this.AkatenGroup.getChildren().slice().forEach(akaten => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerGetDamage, akaten.getBounds())) {//J（主人公）とアカテンが衝突した場合
                if (akaten.getData('moving')) {//動くアカテンに当たった
                    this.getDamage();
                }
                this.collectedNow[akaten.getData('number')] = true;//取得した番号を記録
                akaten.destroy();//アカテンを消す（グループからも自動で外れる）
                this.tangyeCount += 1;
                this.updateTangyeCountDisplay();
            }
        });

        this.AotenGroup.getChildren().slice().forEach(aoten => {
            if (Phaser.Geom.Intersects.RectangleToRectangle(playerGetDamage, aoten.getBounds())) {//J（主人公）とアオテンが衝突した場合
                if (aoten.getData('moving')) {//動くアオテンに当たった
                    this.getDamage();
                }
                this.collectedNow[aoten.getData('number')] = true;//取得した番号を記録
                aoten.destroy();//アオテンを消す（グループからも自動で外れる）
                this.tangyeCount += 1;
                this.updateTangyeCountDisplay();
            }
        });

        // 地面のスクロール
        this.leftXText.setText(`X: ${Math.round(this.cameras.main.scrollX)}`);
    }

    // 取得数の数字を更新し、画像を数字の左隣に置く
    updateTangyeCountDisplay() {
        this.tangyeCountText.setText(String(this.tangyeCount));
        this.tangyeCountIcon.x = this.tangyeCountText.x - this.tangyeCountText.width - 10 - this.tangyeCountIcon.displayWidth / 2;
    }

    // 落とし穴を [左端X, 幅] の一覧で指定する。3個。穴の部分だけ地面を作らない
    placeAllPits() {
        const pits = [
            [4500, 200], [5100, 400], [9100, 1400],
        ];
        pits.forEach(([x, width]) => this.pits.push({ left: x, right: x + width }));

        // 穴と穴の間に地面を作る（ワールド座標に固定。模様がずれないよう tilePositionX を揃える）
        let segmentLeft = 0;
        const boundaries = [...this.pits.map(pit => [pit.left, pit.right]), [this.worldWidth, this.worldWidth]];
        boundaries.forEach(([pitLeft, pitRight]) => {
            this.placeGroundSegment(segmentLeft, pitLeft);
            segmentLeft = pitRight;
        });
    }

    placeGroundSegment(left, right) {
        const width = right - left;
        if (width <= 0) {
            return;
        }
        const ground = this.add.tileSprite(left, this.groundY, width, this.groundHeight, 'ground1').setOrigin(0, 0);
        ground.tilePositionX = left;
        this.add.rectangle(left, this.groundY, width, 6, 0x75c645).setOrigin(0, 0);//地面の境界
    }

    // 残りライフ分の画像は通常表示、失った分は薄く表示する
    updateLifeDisplay() {
        this.lifeIcons.forEach((icon, i) => icon.setAlpha(i < this.life ? 1 : 0.25));
    }

    // 落とし穴に落ちた：ライフを1減らし、直前の地面に戻る（ステージの最初には戻らない）
    fallIntoPit() {
        this.getDamage();
        const pit = this.pits.find(p => this.characterStand.x > p.left - this.characterStand.displayWidth && this.characterStand.x < p.right + this.characterStand.displayWidth);
        const respawnX = pit ? pit.left - 150 : this.characterStand.x;
        this.characterStand.x = Math.max(respawnX, this.characterStand.displayWidth / 2);
        this.characterStand.y = this.characterStandBaseY;
        this.characterStandVelocityY = 0;
        this.isGrounded = true;
    }

    getDamage(){
        this.life = Math.max(this.life -1 ,0 );
        this.updateLifeDisplay();
        if (this.life <= 0) {
            this.gameOver();
            return;
        }   
    }

    // 空中ブロックを1個、指定した座標に配置する
    placePlatform(x, y) {
        const platform = this.add.tileSprite(x, y, 275, 35, 'kuchu1');
        this.platformGroup.add(platform);
        return platform;
    }

    // 空中ブロック15個の座標一覧
    placeAllPlatforms() {
        const platforms = [
            [1000, 460],  [2500, 300],  [3000, 460],  [3000, 140],  [5800, 300],
            [6400, 460],  [8100, 460],  [8375, 300],  [9300, 550],  [9750, 420],
            [10200, 510], [11200, 300], [11800, 460], [11800, 140], [15000, 460],
        ];
        platforms.forEach(([x, y]) => this.placePlatform(x, y));
    }

    // タン・イーを1個、番号と座標を指定して配置する
    placeTangye(number, x, y) {
        const tangye = this.add.image(x, y, 'tangye');
        tangye.setScale(0.2);
        tangye.setData('number', number);
        this.tangyeGroup.add(tangye);
        return tangye;
    }

    placeAkaten(number, x, y) {
        const Akaten = this.add.image(x, y, 'Akaten');
        Akaten.setScale(0.2);
        Akaten.setData('number', number);
        this.AkatenGroup.add(Akaten);
        return Akaten;
    }

    placeAoten(number, x, y) {
        const Aoten = this.add.image(x, y, 'Aoten');
        Aoten.setScale(0.2);
        Aoten.setData('number', number);
        this.AotenGroup.add(Aoten);
        return Aoten;
    }

    // タン・イーの座標一覧。配列の位置がそのまま番号（0〜）になる。30〜39は隠しブロック・赤点・青点用に空けてある
    placeAllTangye() {
        const positions = [
            [500, 460],  [1000, 590],  [1000, 300],  [1350, 460],  [2500, 250],
            [3000, 590],  [3000, 410],  [3000, 90],  [4600, 350],  [5200, 350],
            [5400, 350],  [6400, 230],  [7100, 590],  [7500, 590],  [8050, 330],
            [8150, 330],  [8350, 90],  [8450, 90], [9300, 400], [9750, 90],
            [10200, 400], [11200, 150], [11800, 90], [11800, 400],
        ];
        positions.forEach(([x, y], number) => {
            if (!this.saveData.stages[this.stageIndex][number]) {//取得済みの番号は配置しない
                this.placeTangye(number, x, y);
            }
        });
    }

    // 上下に動くタン・イーを配置する。番号は24〜29、30〜33を順に使う
    placeAllMoveTangye() {
        // [x座標, 上下運動の中心y, 中心から上下に動く幅]。1つずつ設定する
        const moves = [
            [1600, 350, 120], [4500, 350, 150], [5000, 300, 100], [5300, 350, 200], [5800, 200, 50],
            [6800, 350, 100], [7800, 400, 70], [8700, 100, 40], [10100, 200, 20], [12100, 100, 30],
        ];
        const numbers = [24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
        moves.forEach(([x, centerY, range], i) => {
            const number = numbers[i];
            if (this.saveData.stages[this.stageIndex][number]) {
                return;
            }
            const tangye = this.placeTangye(number, x, centerY - range);
            tangye.setData('moving', true);
            tangye.setScale(0.3);//動くタン・イーは少し大きくする
            this.tweens.add({
                targets: tangye,
                y: centerY + range,
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 100,
            });
        });
    }

    placeAllAkaten() {
        // [y座標, 左右運動の中心x, 中心から左右に動く幅]。1つずつ設定する
        const moves = [
            [590, 2000, 80], [590, 3840, 20], [590, 10800, 40], 
        ];
        const numbers = [34,35,36];
        moves.forEach(([y, centerX, range], i) => {
            const number = numbers[i];
            if (this.saveData.stages[this.stageIndex][number]) {
                return;
            }
            const akaten = this.placeAkaten(number,  centerX - range, y);
            akaten.setData('moving', true);
            akaten.setScale(0.3);//動くタン・イーは少し大きくする
            this.tweens.add({
                targets: akaten,
                x: centerX + range,
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 10,
            });
        });
    }

    placeAllAoten() {
        // [y座標, 左右運動の中心x, 中心から左右に動く幅]。1つずつ設定する
        const moves = [
            [590, 7300, 100], [120, 8300, 50], [590, 12400, 100], 
        ];
        const numbers = [34,35,36];
        moves.forEach(([y, centerX, range], i) => {
            const number = numbers[i];
            if (this.saveData.stages[this.stageIndex][number]) {
                return;
            }
            const aoten = this.placeAoten(number,  centerX - range, y);
            aoten.setData('moving', true);
            aoten.setScale(0.3);//動くタン・イーは少し大きくする
            this.tweens.add({
                targets: aoten,
                x: centerX + range,
                duration: 1500,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: i * 5,
            });
        });
    }
    // ステージ完了時に呼ぶ。今回の取得分をセーブデータに反映し、ビット列を返す
    completeStage() {
        const stage = this.saveData.stages[this.stageIndex];
        this.collectedNow.forEach((collected, number) => {
            if (collected) {
                stage[number] = true;
            }
        });
        this.saveData.completedCount += 1;
        this.saveData.totalTangye = this.saveData.stages.flat().filter(Boolean).length;
        this.registry.set('saveData', this.saveData);
        return encodeSaveData(this.saveData);
    }

    // ライフ0：GAME OVERを表示し、暗転して選択画面へ戻る
    gameOver() {
        this.isLeaving = true;
        this.characterStand.setVisible(false);
        const { width, height } = this.scale;
        const img = this.add.image(width / 2, height / 2, 'gameover').setScrollFactor(0).setDepth(1000);
        const fit = Math.min(width / img.width, height / img.height, 1);
        img.setScale(fit);
        this.time.delayedCall(2000, () => {
            this.cameras.main.fadeOut(1000, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('Home');
            });
        });
    }

    // ステージの右端から出て、1秒かけて暗転しHomeへ戻る
    leaveStage() {
        this.isLeaving = true;
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Home', { fromStage: true });
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
            this.characterStand.x += direction * this.moveSpeed * deltaSeconds;
            this.characterStand.setFlipX(direction < 0);
            if (!this.characterStand.anims.isPlaying) {
                this.characterStand.play('DenshiRun');
            }
        } else {
            this.characterStand.anims.stop();
            this.characterStand.setTexture('DenshicharacterStand');
        }

        this.characterStand.x = Phaser.Math.Clamp(
            this.characterStand.x,
            this.characterStand.displayWidth / 2,
            Infinity//右端は制限しない（超えたらステージを出る）
        );
    }
}
