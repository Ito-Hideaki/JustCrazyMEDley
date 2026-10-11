export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/back1.png');//背景
        this.load.image('ground1', 'assets/ground1.png');//地面（緑）
        this.load.image('logo', 'assets/logo.png');//ロゴ
        this.load.image('character1', 'assets/character1.png');//J（主人公）
        this.load.image('tangye', 'assets/tangye.png');//タン・イー

    }
    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');//背景を配置
        this.ground1 = this.add.image(640, 900, 'ground1');//地面を配置
        this.tangye = this.add.image(1280, 590, 'tangye');//タン・イーを配置
        this.tangye.setScale(0.3);//タン・イーのサイズを調整

        this.logo = this.add.image(640, 200, 'logo');//ロゴを配置
        this.logo.setScale(0.5);//ロゴのサイズを調整

        this.character1 = this.add.sprite(640, 540, 'character1');//J（主人公）を配置
        this.character1.setScale(0.8);//J（主人公）のサイズを調整
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);//スペースキーの挙動を監視
        this.character1BaseY = this.character1.y;//J（主人公）のY軸
        this.character1VelocityY = 0;//J（主人公）のY軸速度
        this.isGrounded = true;//J（主人公）が地面にいるかどうか

        this.gravity = 2300;//重力
        this.jumpSpeed = 900;//ジャンプ速度



    }

    update(time,delta) {

        const deltaSeconds = delta / 1000;//デルタタイムを秒に変換
        this.hasCollectedTangye = false;//タン・イーを収集したかどうかのフラグ

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.isGrounded) {//スペースキーが押され、かつ地面にいる場合
            this.character1VelocityY = -this.jumpSpeed;//ジャンプ速度を設定
            this.isGrounded = false;//地面から離れたことを示す
        }

        this.character1VelocityY += this.gravity * deltaSeconds;//重力を適用
        this.character1.y += this.character1VelocityY * deltaSeconds;//Y軸の位置を更新

        if (this.character1.y >= this.character1BaseY) {//地面に着地した場合
            this.character1.y = this.character1BaseY;//Y軸を地面の位置に固定
            this.character1VelocityY = 0;//Y軸速度をリセッな
            this.isGrounded = true;//地面にいることを示す
        }

        this.tangye.x -= 450 * deltaSeconds;//タン・イーを左に移動 
        this.tangye.angle -= 10  ;//タン・イーの角度を更新
        this.tangye.setAngle(this.tangye.angle);
         
        

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
        if (this.tangye.x < -this.tangye.width * this.tangye.scaleX / 2 ) {//画面外に出た場合
            this.tangye.x = 1280 + this.tangye.width * this.tangye.scaleX / 2;//右端に再配置
        }
    }
    
}
