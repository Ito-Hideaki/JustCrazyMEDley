export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/back1.png');//背景
        this.load.image('ground1', 'assets/ground1.png');//地面（チョコ）
        this.load.image('logo', 'assets/logo.png');//ロゴ
        this.load.image('character1', 'assets/character1.png');//J（主人公）
        this.load.image('tangye', 'assets/tangye.png');//タン・イー
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
        this.moveSpeed = 300;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.gravity = 2300;//重力
        this.jumpSpeed = 1100;//ジャンプ速度

        // 空中のオブジェクト
        this.kuchu1 = this.add.tileSprite(1000, 400, 550, 35, 'kuchu1');//空中のオブジェクトを配置

        // 収集アイテム
        this.tangye = this.add.image(1500,  590, 'tangye');//タン・イーを配置
        this.tangye.setScale(0.3);//タン・イーのサイズを調整

        // プレイヤー
        this.character1 = this.add.sprite(220, 0, 'character1');//J（主人公）を配置
        this.character1.setScale(0.8);//J（主人公）のサイズを調整
        this.character1BaseY = this.groundY - this.character1.displayHeight / 2;
        this.character1.y = this.character1BaseY;
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);//スペースキーの挙動を監視
        this.character1VelocityY = 0;//J（主人公）のY軸速度
        this.isGrounded = true;//J（主人公）が地面にいるかどうか

        // カメラ
        const cam = this.cameras.main;
        cam.setBounds(0, 0, this.worldWidth, this.scale.height);
        cam.startFollow(this.character1, true, 0.1 , 0.1);
        cam.setFollowOffset(-300, 0);
    }

    update(time,delta) {
        const deltaSeconds = delta / 1000;//デルタタイムを秒に変換
        this.hasCollectedTangye = false;//タン・イーを収集したかどうかのフラグ
        this.hasCollectedTangye2 = false;//タン・イー2を収集したかどうかのフラグ
        this.isTutorialOpen = false;

        if(this.isTutorialOpen) {
            return;
        }

        // 左右移動
        if (this.cursors.right.isDown) {
            this.character1.x += this.moveSpeed * deltaSeconds;
        } else if (this.cursors.left.isDown) {
            this.character1.x -= this.moveSpeed * deltaSeconds;
        }
        this.character1.x = Phaser.Math.Clamp(
            this.character1.x,
            this.character1.displayWidth / 2,
            this.worldWidth - this.character1.displayWidth / 2
        );

        // ジャンプ入力
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.isGrounded) {//スペースキーが押され、かつ地面にいる場合
            this.character1VelocityY = -this.jumpSpeed;//ジャンプ速度を設定
            this.isGrounded = false;//地面から離れたことを示す
        }
        this.isGrounded = false;

        // Y方向の移動と空中オブジェクトとの判定
        const footBottomY = this.character1.y + this.character1.displayHeight / 2;//キャラクターの足元のY座標
        const headTopY = this.character1.y - this.character1.displayHeight / 2;//キャラクターの頭頂のY座標

        this.character1VelocityY += this.gravity * deltaSeconds;//重力を適用
        this.character1.y += this.character1VelocityY * deltaSeconds;//Y軸の位置を更新

        const currentBottomY = this.character1.y + this.character1.displayHeight / 2;//キャラクターの足元の現在のY座標
        const charaterBounds = this.character1.getBounds();//キャラクターのバウンディングボックスを取得
        const platformBounds = this.kuchu1.getBounds();//地面のバウンディングボックスを取得

        const isCollidingWithPlatform =
            this.character1VelocityY >=0 &&
            footBottomY <= platformBounds.top &&
            currentBottomY >= platformBounds.top &&
            charaterBounds.right > platformBounds.left &&
            charaterBounds.left < platformBounds.right;

        const isCollidingWithHead =
            this.character1VelocityY < 0 &&
            headTopY >= platformBounds.bottom &&
            this.character1.y - this.character1.displayHeight / 2 <= platformBounds.bottom &&
            charaterBounds.right > platformBounds.left &&
            charaterBounds.left < platformBounds.right;

        if(isCollidingWithHead) {
            this.character1.y = platformBounds.bottom + this.character1.displayHeight / 2;
            this.character1VelocityY = 0;
        }

        if(isCollidingWithPlatform) {
            this.character1.y = platformBounds.top - this.character1.displayHeight / 2;
            this.character1VelocityY = 0;
            this.isGrounded = true;
        }

        // 地面への着地
        if (this.character1.y >= this.character1BaseY) {//地面に着地した場合
            this.character1.y = this.character1BaseY;//Y軸を地面の位置に固定
            this.character1VelocityY = 0;//Y軸速度をリセッな
            this.isGrounded = true;//地面にいることを示す
        }

        // アイテム取得判定
        if(!this.hasCollectedTangye){
            const isCollinding = Phaser.Geom.Intersects.RectangleToRectangle(
                this.character1.getBounds(),
                this.tangye.getBounds()
            );//J（主人公）とタン・イーの衝突判定

            if(isCollinding) {//J（主人公）とタン・イーが衝突した場合
                this.hasCollectedTangye = true;//タン・イーを収集したことを示す
                this.tangye.destroy();//タン・イーを非表示にする
            }
        }

        // 地面のスクロール
        this.ground1.tilePositionX = this.cameras.main.   scrollX;
    }
}
