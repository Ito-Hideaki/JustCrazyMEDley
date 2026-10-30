import { Electrical } from './Electrical.js';

const LESSONS = [
    { section: '1/5 キャラクターの動かし方', text: '← → で左右に走る / Space でジャンプ。\n左右への移動とジャンプを、それぞれ試してみよう！', goal: 'move' },
    { section: '2/5 タンイーの取得方法', text: 'タンイーに触れると単位を取得！\n右にある3個を集めよう。練習中の単位は本編の記録に入りません。', goal: 'collect' },
    { section: '3/5 赤点・青点：横から触れる', text: '赤点に横や下から当たると、ライフが1減ります。\nまずはジャンプせず、赤点に触れてみよう。', goal: 'damage', item: 'red', loss: 1 },
    { section: '3/5 赤点・青点：青点のダメージ', text: '青点に横や下から当たると、ライフが2減ります。\n青点に触れ、右上のハートの変化を見てみよう。', goal: 'damage', item: 'blue', loss: 2 },
    { section: '3/5 赤点・青点：赤点を踏む', text: '赤点を上から踏むと、タンイーに変わります！\n近づいてジャンプし、落下しながら赤点を踏もう。ライフも1回復！', goal: 'stomp', item: 'red' },
    { section: '3/5 赤点・青点：青点を踏む', text: '青点も上から踏めば、ダメージなしでタンイーに変わります。\n青点を踏んでみよう。踏んだ後は離れてから触れると単位を取れます。', goal: 'stomp', item: 'blue' },
    { section: '4/5 その他アイテム：レポート', text: 'レポートも横や下から触れるとダメージ。\n右のレポートに歩いて触れてみよう。', goal: 'damage', item: 'report', loss: 1 },
    { section: '4/5 その他アイテム：踏んで避ける', text: 'レポートは上から踏めば、消えて跳ね上がります。\n今度はジャンプして上から踏もう！ 赤点・青点とは違い、単位には変わりません。', goal: 'stomp', item: 'report' },
    { section: '4/5 その他アイテム：エナドリ', text: '転がるエナドリも、横から触れるとダメージ。\n上から踏んで消そう。失敗したら R でこの練習をやり直せます。', goal: 'stomp', item: 'drink' },
    { section: '4/5 その他アイテム：学科専用アイテム', text: 'スクーター・感電・コンデンサ・セミコロン・薬品もダメージアイテム。\nここでは感電アイテムに歩いて触れてみよう。', goal: 'damage', item: 'special', loss: 1 },
    { section: '4/5 その他アイテム：専用アイテムを踏む', text: '学科専用アイテムも上から踏めば安全に消せます。\n感電アイテムを踏もう！ 踏みつけ10回で一時的な無敵モードになります。', goal: 'stomp', item: 'special' },
    { section: '5/5 ライフ：回復', text: '右上のハートがライフ。最大5個、赤点・青点を踏むと1回復します。\n残り1個から、赤点を踏んで2個に回復させよう。落とし穴では1個失います。', goal: 'recover', item: 'red', life: 1 },
    { section: '5/5 ライフ：0になったら', text: 'ライフが0になるとゲームオーバーで、ホームへ戻ります。\n残り1個でレポートに触れてみよう。この練習なら何度でもやり直せます！', goal: 'empty', item: 'report', life: 1 }
];

export class Tutorial extends Electrical {
    constructor() {
        super('Tutorial');
    }

    create() {
        super.create();
        this.leftXText.setVisible(false);
        this.timeText.setVisible(false);
        this.damageCauseText.setY(280);
        this.cameras.main.stopFollow();
        this.cameras.main.setScroll(0, 0);
        this.lessonText = this.add.text(30, 140, '', {
            fontSize: '25px', color: '#ffffff', backgroundColor: '#182538',
            padding: { x: 18, y: 12 }, wordWrap: { width: 1160 }
        }).setScrollFactor(0).setDepth(200);
        this.lessonStatus = this.add.text(30, 335, '', {
            fontSize: '26px', color: '#ffff66', stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(200);
        this.add.text(30, 665, '← → 移動 / Space ジャンプ　 R やり直し　 S / Esc チュートリアルをスキップ', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#182538'
        }).setScrollFactor(0).setDepth(200);
        this.nextKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.retryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        this.skipKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.skipLetterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.lessonIndex = 0;
        this.finished = false;
        this.startLesson();
    }

    startLesson() {
        this.time.removeAllEvents();
        this.tweens.killAll();
        this.sound.stopByKey('jumpAir');
        for (const group of [this.tangyeGroup, this.AkatenGroup, this.AotenGroup,
            this.reportGroup, this.enadoriGroup, this.departmentDamageGroup]) {
            group.clear(true, true);
        }
        this.lesson = LESSONS[this.lessonIndex];
        this.lessonReady = false;
        this.practiceFailed = false;
        this.actions = new Set();
        this.life = this.lesson.life ?? (this.lesson.goal === 'stomp' ? 4 : this.maxLife);
        this.damageTaken = 0;
        this.stompCount = 0;
        this.runTangyeCount = 0;
        this.tangyeCount = 0;
        this.isGameOver = false;
        this.isDamageShowing = false;
        this.isDamageKnockback = false;
        this.isInvulnerable = false;
        this.isStarInvincible = false;
        this.isPitRespawnProtected = false;
        this.mustReleaseMovementKeys = false;
        this.mustReleasePitKeys = true;
        this.damageTextureTimer = null;
        this.blinkTimer = null;
        this.characterStand.setPosition(220, this.characterStandBaseY)
            .setTexture('ElectricalcharacterStand').setAlpha(1).setVisible(true);
        this.characterStand.anims.stop();
        this.characterStandVelocityY = 0;
        this.isGrounded = true;
        this.previousCharacterX = this.characterStand.x;
        this.previousCharacterY = this.characterStand.y;
        this.coyoteTimeRemaining = this.coyoteTime;
        this.damageCauseText.setVisible(false);
        this.updateLifeDisplay();
        this.updateTangyeCountDisplay();
        this.updateStompCountDisplay();
        this.lessonText.setText(`${this.lesson.section}\n${this.lesson.text}`);
        if (this.lesson.goal === 'collect') {
            [460, 650, 840].forEach(x => this.placeTangye(x, this.groundY - 30));
        }
        this.placePracticeItem(this.lesson.item);
        this.updateLessonStatus();
    }

    placePracticeItem(kind) {
        let item;
        if (kind === 'red' || kind === 'blue') {
            item = kind === 'red' ? this.placeAkaten(650, 0) : this.placeAoten(650, 0);
            item.setData('moving', true);
        } else if (kind === 'report') {
            item = this.placeReport(650, 0, 0);
        } else if (kind === 'drink') {
            this.placeEnadori(800, this.groundY - 20);
            return;
        } else if (kind === 'special') {
            item = this.add.image(650, 0, 'ElectricalDamageItem');
            const image = this.textures.get('ElectricalDamageItem').getSourceImage();
            item.setScale(Math.min(70 / image.width, 55 / image.height));
            this.departmentDamageGroup.add(item);
        }
        if (item) {
            item.y = this.groundY - item.displayHeight / 2;
            const swing = item.getData('swing');
            if (swing) swing.centerY = item.y;
            this.itemPreviousPositions.set(item, { x: item.x, y: item.y });
        }
    }

    update(time, delta) {
        if (this.finished) return;
        if (Phaser.Input.Keyboard.JustDown(this.skipKey) ||
            Phaser.Input.Keyboard.JustDown(this.skipLetterKey)) {
            this.finishTutorial();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.retryKey)) {
            this.startLesson();
            return;
        }
        if (Phaser.Input.Keyboard.JustDown(this.nextKey) && this.lessonReady) {
            if (++this.lessonIndex === LESSONS.length) this.finishTutorial();
            else this.startLesson();
            return;
        }
        if (this.practiceFailed || this.isGameOver) return;
        const oldX = this.characterStand.x;
        const oldVelocity = this.characterStandVelocityY;
        super.update(time, delta);
        if (this.characterStand.x < oldX) this.actions.add('left');
        if (this.characterStand.x > oldX) this.actions.add('right');
        if (oldVelocity >= 0 && this.characterStandVelocityY < 0 && this.lesson.goal === 'move') {
            this.actions.add('jump');
        }
        const complete = {
            move: this.actions.size === 3,
            collect: this.runTangyeCount >= 3,
            damage: this.damageTaken >= (this.lesson.loss ?? 1),
            stomp: this.stompCount > 0,
            recover: this.life >= 2 && this.stompCount > 0,
            empty: this.life === 0
        }[this.lesson.goal];
        if (complete) this.lessonReady = true;
        this.updateLessonStatus();
    }

    updateLessonStatus() {
        if (this.lessonReady) {
            this.lessonStatus.setText(this.lessonIndex === LESSONS.length - 1
                ? '練習完了！ Enter でホームへ。学科のブロックを下からつついて出発！'
                : 'できました！ Enter で次の練習へ');
        } else if (this.practiceFailed) {
            this.lessonStatus.setText('ライフが0になりました。R でこの練習をやり直そう！');
        } else {
            const progress = this.lesson.goal === 'move'
                ? `左 ${this.actions.has('left') ? 'OK' : '未'} / 右 ${this.actions.has('right') ? 'OK' : '未'} / ジャンプ ${this.actions.has('jump') ? 'OK' : '未'}`
                : this.lesson.goal === 'collect' ? `取得 ${this.runTangyeCount}/3`
                    : '上の説明に沿って試そう。うまくいかなければ R でやり直し！';
            this.lessonStatus.setText(progress);
        }
    }

    getDamage(from, amount = 1) {
        if (this.lessonReady) return;
        const before = this.life;
        super.getDamage(from, amount);
        this.damageTaken += before - this.life;
    }

    updateTangyeCountDisplay() {
        this.tangyeCountText.setText(`練習単位: ${this.runTangyeCount}`);
        this.tangyeCountIcon.x = this.tangyeCountText.x - this.tangyeCountText.width -
            10 - this.tangyeCountIcon.displayWidth / 2;
    }

    gameOver() {
        this.isGameOver = true;
        this.characterStand.anims.stop();
        if (this.lesson.goal === 'empty') this.lessonReady = true;
        else this.practiceFailed = true;
        this.updateLessonStatus();
    }

    run(deltaSeconds) {
        super.run(deltaSeconds);
        this.characterStand.x = Phaser.Math.Clamp(this.characterStand.x,
            this.characterStand.displayWidth / 2, this.worldWidth - this.characterStand.displayWidth / 2);
    }

    finishTutorial() {
        if (this.finished) return;
        this.finished = true;
        this.sound.stopByKey('jumpAir');
        this.scene.start('Home');
    }

    placeAllPits() {
        this.worldWidth = this.scale.width;
        this.pits = [];
        this.placeGroundSegment(0, this.worldWidth);
    }

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
    captureWholeStage() {}
    saveStageRecord() {}
    completeStage() {}
    leaveStage() {}
}
