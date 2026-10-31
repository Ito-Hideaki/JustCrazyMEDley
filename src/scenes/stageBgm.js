export function setupStageBgm(scene) {
    let special = Boolean(scene.isStarInvincible || scene.isCameraRaised);
    const createMusic = () => scene.sound.add(special ? 'specialBgm' : 'stageBgm', { loop: true, volume: 0.2 });
    let music = createMusic();
    const update = () => {
        const nextSpecial = Boolean(scene.isStarInvincible || scene.isCameraRaised);
        if (nextSpecial === special) return;
        special = nextSpecial;
        music.destroy();
        music = createMusic();
        music.play();
    };
    const pause = () => music.pause();
    const resume = () => music.resume();
    music.play();
    scene.events.on('postupdate', update);
    scene.events.on('pause', pause);
    scene.events.on('sleep', pause);
    scene.events.on('resume', resume);
    scene.events.on('wake', resume);
    scene.events.once('shutdown', () => {
        scene.events.off('postupdate', update);
        scene.events.off('pause', pause);
        scene.events.off('sleep', pause);
        scene.events.off('resume', resume);
        scene.events.off('wake', resume);
        music.destroy();
    });
}
