import { createEmptySaveData } from '../saveData.js';

export class Title extends Phaser.Scene {

    constructor() {
        super('Title');
    }

    preload() {
        this.load.image('logo', 'assets/logo.png');
        this.load.image('background', 'assets/back1.png');
    }


    create() {
        this.registry.set('saveData', createEmptySaveData());
        this.add.tileSprite(640, 360, 1280, 720, 'background');

        const centerX = this.scale.width / 2;

        this.logo = this.add.image(centerX, 200, 'logo').setOrigin(0.5);
        this.logo.scale = 0.4;

        this.options = [
            { label: 'はじめから', scene: 'Home', y: 400 },
            { label: 'つづきから（ふっかつのじゅもん）', scene: 'Spell', y: 520 },
        ];
        this.options.forEach((option, i) => {
            option.text = this.add.text(centerX, option.y, option.label, {
                fontSize: '40px',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 30, y: 16 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            option.text.on('pointerover', () => this.select(i));
            option.text.on('pointerdown', () => this.decide(i));
        });

        this.add.text(centerX, 650, '↑↓ で選択　Enter / Space で決定', {
            fontSize: '28px',
            color: '#000000'
        }).setOrigin(0.5);

        this.selected = 0;
        this.select(0);

        const keyboard = this.input.keyboard;
        keyboard.on('keydown-UP', () => this.select((this.selected + this.options.length - 1) % this.options.length));
        keyboard.on('keydown-DOWN', () => this.select((this.selected + 1) % this.options.length));
        keyboard.on('keydown-ENTER', () => this.decide(this.selected));
        keyboard.on('keydown-SPACE', () => this.decide(this.selected));
    }

    select(index) {
        this.selected = index;
        this.options.forEach((option, i) => {
            option.text.setBackgroundColor(i === index ? '#3366cc' : '#333333');
        });
    }

    decide(index) {
        this.scene.start(this.options[index].scene);
    }
}
