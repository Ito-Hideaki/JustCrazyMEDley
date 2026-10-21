import { Home } from './scenes/home.js';
import { Title } from './scenes/Title.js';
import { Spell } from './scenes/Spell.js';
import { Ending } from './scenes/Ending.js';
import { Mechanical } from './scenes/Mechanical.js';
import { Electrical } from './scenes/Electrical.js';
import { Denshi } from './scenes/Denshi.js';
import { Joho } from './scenes/Joho.js';
import { Chemical } from './scenes/Chemical.js';

// 日本語フォントは文字の上端が描画領域からはみ出して見切れるので、全テキストに上下の余白を付ける
const addText = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function (x, y, text, style = {}) {
    if (style.padding === undefined) {
        const pad = Math.ceil(parseInt(style.fontSize ?? 16, 10) * 0.25);
        style = { ...style, padding: { top: pad, bottom: pad } };
    }
    return addText.call(this, x, y, text, style);
};

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Title,
        Spell,
        Home,
        Mechanical,
        Electrical,
        Denshi,
        Joho,
        Chemical,
        Ending
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            