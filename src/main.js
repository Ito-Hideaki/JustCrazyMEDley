import { Home } from './scenes/home.js';
import { Mechanical } from './scenes/Mechanical.js';
import { Electrical } from './scenes/Electrical.js';
import { Denshi } from './scenes/Denshi.js';
import { Joho } from './scenes/Joho.js';
import { Chemical } from './scenes/Chemical.js';

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
        Home,
        Mechanical,
        Electrical,
        Denshi,
        Joho,
        Chemical
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);
            