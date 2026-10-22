export function createCommonItems(scene, positions, { spawnEnadori = true } = {}) {
    scene.itemPreviousPositions ??= new WeakMap();
    scene.AkatenGroup = scene.add.group();
    scene.AotenGroup = scene.add.group();
    scene.reportGroup = scene.add.group();
    scene.commonEnadoriGroup = scene.add.group();

    positions.movingTangye.forEach(([x, centerY, range], index) => {
        const item = scene.placeTangye(x, centerY - range);
        item.setData('moving', true);
        item.setScale(0.3);
        scene.tweens.add({
            targets: item,
            y: centerY + range,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: index * 100,
        });
    });

    positions.akaten.forEach(([y, centerX, range]) => {
        createSwingingHazard(scene, scene.AkatenGroup, 'Akaten', y, centerX, range, 'akaten');
    });
    positions.aoten.forEach(([y, centerX, range]) => {
        createSwingingHazard(scene, scene.AotenGroup, 'Aoten', y, centerX, range, 'aoten');
    });
    positions.reports.forEach(([centerX, y, range]) => {
        const item = scene.add.image(centerX - range, y, 'report1').setScale(0.5);
        item.setData('swing', { centerX, centerY: y, range, phase: 0, direction: 1 });
        scene.reportGroup.add(item);
    });
    positions.enadori.forEach(([x, y]) => createRollingHazard(scene, x, y));

    if (spawnEnadori) {
        const spawn = { delay: 7000, maxCount: 8, marginRight: 100 };
        scene.commonEnadoriSpawnTimer = scene.time.addEvent({
            delay: spawn.delay,
            loop: true,
            callback: () => {
                if (scene.isGameOver || scene.isLeaving || scene.isCapturing) {
                    return;
                }
                if (scene.commonEnadoriGroup.getLength() >= spawn.maxCount) {
                    return;
                }
                const x = scene.cameras.main.scrollX + scene.scale.width + spawn.marginRight;
                const isOverPit = scene.pits.some(pit => x > pit.left && x < pit.right);
                if (x <= scene.worldWidth && !isOverPit) {
                    createRollingHazard(scene, x, scene.groundY - 20);
                }
            },
        });
    }
    scene.commonDamageMessage = scene.add.text(scene.scale.width / 2, 55, '', {
        fontSize: '30px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 5,
        padding: { top: 8, bottom: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
}

function createSwingingHazard(scene, group, texture, y, centerX, range, kind) {
    const item = scene.add.image(centerX - range, y, texture).setScale(0.3);
    item.setData('moving', true);
    item.setData('kind', kind);
    item.setData('swing', {
        centerX,
        centerY: y,
        range,
        phase: 0,
        direction: 1,
    });
    group.add(item);
}

function createRollingHazard(scene, x, y) {
    const body = scene.add.rectangle(x, y, 40, 40).setVisible(false);
    const sprite = scene.add.image(x, y, 'enadori1').setScale(0.5);
    body.setData('sprite', sprite);
    body.setData('direction', -1);
    body.setData('velocityY', 0);
    body.setData('grounded', true);
    body.setData('hopTimer', Phaser.Math.FloatBetween(1, 2.5));
    body.once('destroy', () => sprite.destroy());
    scene.commonEnadoriGroup.add(body);
}

export function updateCommonItems(scene, deltaSeconds) {
    const solidBlocks = [
        ...scene.platformGroup.getChildren(),
        ...(scene.wallGroup?.getChildren() ?? []),
    ];
    const movers = [
        ...scene.AkatenGroup.getChildren(),
        ...scene.AotenGroup.getChildren(),
        ...scene.reportGroup.getChildren(),
    ];
    const angularSpeed = Math.PI / 1.5;
    movers.forEach(item => {
        const swing = item.getData('swing');
        const phase = swing.phase + swing.direction * angularSpeed * deltaSeconds;
        const offset = swing.range * Math.cos(phase);
        const nextX = swing.centerX - offset;
        const nextY = swing.centerY;
        const bounds = item.getBounds();
        const hitsBlock = solidBlocks.some(block => {
            const blockBounds = block.getBounds();
            return nextX + bounds.width / 2 > blockBounds.left &&
                nextX - bounds.width / 2 < blockBounds.right &&
                nextY + bounds.height / 2 > blockBounds.top &&
                nextY - bounds.height / 2 < blockBounds.bottom;
        });
        if (hitsBlock) {
            swing.direction *= -1;
            return;
        }
        swing.phase = phase;
        item.setPosition(nextX, nextY);
    });

    scene.commonEnadoriGroup.getChildren().slice().forEach(body => {
        updateRollingHazard(scene, body, deltaSeconds, solidBlocks);
    });
}

function updateRollingHazard(scene, body, deltaSeconds, solidBlocks) {
    const sprite = body.getData('sprite');
    const halfWidth = body.width / 2;
    const halfHeight = body.height / 2;
    let direction = body.getData('direction');
    let velocityY = body.getData('velocityY');
    const nextX = body.x + direction * 200 * deltaSeconds;
    const hitsWall = solidBlocks.some(block => {
        const bounds = block.getBounds();
        return body.y + halfHeight > bounds.top && body.y - halfHeight < bounds.bottom &&
            nextX + halfWidth > bounds.left && nextX - halfWidth < bounds.right;
    });
    if (hitsWall) {
        direction *= -1;
    } else {
        body.x = nextX;
    }

    let hopTimer = body.getData('hopTimer');
    if (body.getData('grounded')) {
        hopTimer -= deltaSeconds;
        if (hopTimer <= 0) {
            velocityY = -800;
            hopTimer = Phaser.Math.FloatBetween(1, 3);
        }
    }

    const previousBottom = body.y + halfHeight;
    velocityY += scene.gravity * deltaSeconds;
    body.y += velocityY * deltaSeconds;
    const currentBottom = body.y + halfHeight;
    let grounded = false;
    const isOverPit = scene.pits.some(pit => body.x > pit.left && body.x < pit.right);
    if (!isOverPit && velocityY >= 0 && previousBottom <= scene.groundY && currentBottom >= scene.groundY) {
        body.y = scene.groundY - halfHeight;
        velocityY = 0;
        grounded = true;
    }
    for (const block of solidBlocks) {
        const bounds = block.getBounds();
        if (velocityY >= 0 && previousBottom <= bounds.top && body.y + halfHeight >= bounds.top &&
            body.x + halfWidth > bounds.left && body.x - halfWidth < bounds.right) {
            body.y = bounds.top - halfHeight;
            velocityY = 0;
            grounded = true;
        }
    }
    body.setData('direction', direction);
    body.setData('velocityY', velocityY);
    body.setData('grounded', grounded);
    body.setData('hopTimer', hopTimer);
    sprite.setPosition(body.x, body.y);
    sprite.rotation += direction * (200 / halfHeight) * deltaSeconds;
    if (body.y - halfHeight > scene.scale.height + 200 ||
        body.x < scene.cameras.main.scrollX - 300) {
        body.destroy();
    }
}

export function resolveCommonItems(scene, playerBounds, previousBottomY) {
    const playerHalfHeight = scene.characterStand.displayHeight / 2;
    const currentBottomY = scene.characterStand.y + playerHalfHeight;
    const enemies = [
        ...scene.AkatenGroup.getChildren(),
        ...scene.AotenGroup.getChildren(),
    ];
    enemies.forEach(item => {
        const bounds = item.getBounds();
        if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, bounds)) {
            return;
        }
        const stomped = scene.characterStandVelocityY >= 0 &&
            previousBottomY <= bounds.top &&
            currentBottomY >= bounds.top &&
            playerBounds.right > bounds.left &&
            playerBounds.left < bounds.right;
        if (stomped) {
            item.setTexture('tangye').setScale(0.2).setData('moving', false);
            scene.AkatenGroup.remove(item, false, false);
            scene.AotenGroup.remove(item, false, false);
            scene.tangyeGroup.add(item);
            scene.characterStandVelocityY = -scene.jumpSpeed;
            if (item.getData('kind') === 'akaten' && scene.life < scene.maxLife) {
                scene.life += 1;
                scene.updateLifeDisplay();
            }
            return;
        }
        applyCommonDamage(scene, item, item.getData('kind'));
    });

    const stompables = [
        ...scene.reportGroup.getChildren().map(item => [item, 'report']),
        ...scene.commonEnadoriGroup.getChildren().map(item => [item, 'enadori']),
    ];
    stompables.forEach(([item, kind]) => {
        const bounds = item.getBounds();
        if (!Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, bounds)) {
            return;
        }
        const stomped = scene.characterStandVelocityY >= 0 &&
            previousBottomY <= bounds.top &&
            currentBottomY >= bounds.top &&
            playerBounds.right > bounds.left &&
            playerBounds.left < bounds.right;
        if (stomped) {
            scene.characterStandVelocityY = -scene.jumpSpeed * 1.2;
            item.destroy();
            return;
        }
        applyCommonDamage(scene, item, kind);
    });
}

function applyCommonDamage(scene, item, kind) {
    item.destroy();
    const messages = {
        akaten: '赤点を取ってしまった...',
        aoten: '青点... 再試なし...',
        report: '理不尽レポートを喰らった',
        enadori: 'カフェインの過剰摂取！寝なさい！',
    };
    scene.commonDamageMessage.setText(messages[kind] ?? 'アイテムにぶつかった！').setVisible(true);
    scene.commonDamageMessageTimer?.remove(false);
    scene.commonDamageMessageTimer = scene.time.delayedCall(2000, () => {
        scene.commonDamageMessage.setVisible(false);
    });
    scene.life = Math.max(scene.life - 1, 0);
    scene.updateLifeDisplay();
    if (scene.life <= 0) {
        scene.gameOver();
    } else {
        scene.characterStand.setTexture(scene.damageTextureKey);
        scene.time.delayedCall(600, () => {
            if (scene.characterStand.active) {
                scene.characterStand.setTexture(scene.standTextureKey);
            }
        });
    }
}
