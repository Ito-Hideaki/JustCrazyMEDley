export function setupRunningSound(scene, character = scene.characterStand, getVelocityY = () => scene.characterStandVelocityY) {
    const sound = scene.sound.add('running');
    sound.addMarker({ name: 'step', start: 0, duration: 0.2, config: { loop: true } });
    let previousX = character.x;
    const stop = () => sound.stop();
    const update = () => {
        const moved = character.x !== previousX;
        previousX = character.x;
        const running = moved && scene.isGrounded && getVelocityY() === 0 &&
            (scene.cursors.left.isDown || scene.cursors.right.isDown) &&
            !scene.isDamageShowing && !scene.isGameOver && !scene.isLeaving &&
            !scene.isCapturing && !scene.isEntering && !scene.mustReleasePitKeys && !scene.mustReleaseMovementKeys;
        if (running) {
            if (!sound.isPlaying) {
                sound.play('step');
            }
        } else if (sound.isPlaying) {
            stop();
        }
    };
    scene.events.on('postupdate', update);
    scene.events.on('pause', stop);
    scene.events.on('sleep', stop);
    scene.events.once('shutdown', () => {
        scene.events.off('postupdate', update);
        scene.events.off('pause', stop);
        scene.events.off('sleep', stop);
        sound.destroy();
    });
}
