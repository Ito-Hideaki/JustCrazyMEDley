export class Denshi extends Phaser.Scene {

    constructor() {
        super('Denshi');
    }

    preload() {
        this.load.image('background', 'assets/back1.png');//背景
        this.load.image('ground1', 'assets/ground1.png');//地面（チョコ）
        this.load.image('JStand', 'assets/J-stand.png');//J（主人公）
        this.load.image('JDamage', 'assets/J-damage.png');//J（主人公）
        this.load.image('JRun1', 'assets/J-run-1.png');//J（主人公）
        this.load.image('JRun2', 'assets/J-run-2.png');//J（主人公）
        this.load.image('JRun3', 'assets/J-run-3.png');//J（主人公）
        this.load.image('JRun4', 'assets/J-run-4.png');//J（主人公）
        this.load.image('tangye', 'assets/tangye.png');//タン・イー
        this.load.image('Akaten', 'assets/Akaten.png');//赤点
        this.load.image('Aoten', 'assets/Aoten.png');//青点
        this.load.image('kuchu1', 'assets/kuchu1.png');//空中のオブジェクト
    }

    create() {
        // 背景と地面
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');//背景を配置
        this.groundHeight = 100;
        this.groundY = this.scale.height - this.groundHeight;
        this.ground1 = this.add.tileSprite(
            this.scale.width / 2,
            this.groundY + this.groundHeight / 2,
            this.scale.width,
            this.groundHeight,
            'ground1'
        );//地面を配置
        this.groundLine = this.add.rectangle(this.scale.width / 2, this.groundY, this.scale.width, 6, 0x75c645).setOrigin(0.5, 0).setScrollFactor(0);//地面の境界

        this.background.setScrollFactor(0);
        this.ground1.setScrollFactor(0);

        // ワールドと操作・物理設定
        this.worldWidth = 19200;
        this.moveSpeed = 400;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.gravity = 1000;//重力
        this.jumpSpeed = 620;//ジャンプ速度

        // 空中のオブジェクト 
        this.kuchu1 = this.add.tileSprite(1000, 460, 550, 35, 'kuchu1');//空中のオブジェクトを配置

        // 収集アイテム
        this.tangye = this.add.image(1500,  590, 'tangye');//タン・イーを配置
        this.tangye.setScale(0.3);//タン・イーのサイズを調整
        this.hasCollectedTangye = false;//タン・イーを収集したかどうかのフラグ
        this.tangyeCount = 0;//取得したタン・イーの数

        // 取得数の表示（右上に固定）
        this.tangyeCountText = this.add.text(this.scale.width - 20, 20, 'Tang-Ye: 0', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);

        // プレイヤー
        this.JStand = this.add.sprite(220, 0, 'JStand');//J（主人公）を配置
        this.JStand.setScale(0.6) ;//J（主人公）のサイズを調整
        this.JStandBaseY = this.groundY - this.JStand.displayHeight / 2;
        this.JStand.y = this.JStandBaseY;
        if (!this.anims.exists('JRun')) {
            this.anims.create({
                key: 'JRun',
                frames: ['JRun1', 'JRun2', 'JRun3', 'JRun4'].map(key => ({ key })),
                frameRate: 10,
                repeat: -1
            });
        }
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);//スペースキーの挙動を監視
        this.JStandVelocityY = 0;//J（主人公）のY軸速度
        this.isGrounded = true;//J（主人公）が地面にいるかどうか

        // カメラ
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.worldWidth, this.scale.height);
        cam.startFollow(this.JStand, true, 0.1 , 0.1);
        cam.setFollowOffset(-300, 0);
    }

    update(time,delta) {
        const deltaSeconds = delta / 1000;//デルタタイムを秒に変換
        this.run(deltaSeconds);

        // ジャンプ入力
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.isGrounded) {//スペースキーが押され、かつ地面にいる場合
            this.JStandVelocityY = -this.jumpSpeed;//ジャンプ速度を設定
            this.isGrounded = false;//地面から離れたことを示す
        }
        this.isGrounded = false;

        // Y方向の移動と空中オブジェクトとの判定
        const footBottomY = this.JStand.y + this.JStand.displayHeight / 2;//キャラクターの足元のY座標
        const headTopY = this.JStand.y - this.JStand.displayHeight / 2;//キャラクターの頭頂のY座標

        this.JStandVelocityY += this.gravity * deltaSeconds;//重力を適用
        this.JStand.y += this.JStandVelocityY * deltaSeconds;//Y軸の位置を更新

        const currentBottomY = this.JStand.y + this.JStand.displayHeight / 2;//キャラクターの足元の現在のY座標
        const charaterBounds = this.JStand.getBounds();//キャラクターのバウンディングボックスを取得
        const platformBounds = this.kuchu1.getBounds();//地面のバウンディングボックスを取得

        const isCollidingWithPlatform =
            this.JStandVelocityY >=0 &&
            footBottomY <= platformBounds.top &&
            currentBottomY >= platformBounds.top &&
            charaterBounds.right > platformBounds.left &&
            charaterBounds.left < platformBounds.right;

        const isCollidingWithHead =
            this.JStandVelocityY < 0 &&
            headTopY >= platformBounds.bottom &&
            this.JStand.y - this.JStand.displayHeight / 2 <= platformBounds.bottom &&
            charaterBounds.right > platformBounds.left &&
            charaterBounds.left < platformBounds.right;

        if(isCollidingWithHead) {
            this.JStand.y = platformBounds.bottom + this.JStand.displayHeight / 2;
            this.JStandVelocityY = 0;
        }

        if(isCollidingWithPlatform) {
            this.JStand.y = platformBounds.top - this.JStand.displayHeight / 2;
            this.JStandVelocityY = 0;
            this.isGrounded = true;
        }

        // 地面への着地
        if (this.JStand.y >= this.JStandBaseY) {//地面に着地した場合
            this.JStand.y = this.JStandBaseY;//Y軸を地面の位置に固定
            this.JStandVelocityY = 0;//Y軸速度をリセッな
            this.isGrounded = true;//地面にいることを示す
        }

        // アイテム取得判定
        if(!this.hasCollectedTangye){
            const isCollinding = Phaser.Geom.Intersects.RectangleToRectangle(
                this.JStand.getBounds(),
                this.tangye.getBounds()
            );//J（主人公）とタン・イーの衝突判定

            if(isCollinding) {//J（主人公）とタン・イーが衝突した場合
                this.hasCollectedTangye = true;//タン・イーを収集したことを示す
                this.tangye.destroy();//タン・イーを非表示にする
                this.tangyeCount += 1;
                this.tangyeCountText.setText(`Tang-Ye: ${this.tangyeCount}`);
            }
        }

        // 地面のスクロール
        this.ground1.tilePositionX = this.cameras.main.   scrollX;
    }

    run(deltaSeconds) {
        let direction = 0;
        if (this.cursors.right.isDown) {
            direction = 1;
        } else if (this.cursors.left.isDown) {
            direction = -1;
        }

        if (direction !== 0) {
            this.JStand.x += direction * this.moveSpeed * deltaSeconds;
            this.JStand.setFlipX(direction < 0);
            if (!this.JStand.anims.isPlaying) {
                this.JStand.play('JRun');
            }
        } else {
            this.JStand.anims.stop();
            this.JStand.setTexture('JStand');
        }

        this.JStand.x = Phaser.Math.Clamp(
            this.JStand.x,
            this.JStand.displayWidth / 2,
            this.worldWidth - this.JStand.displayWidth / 2
        );
    }
}
