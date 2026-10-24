import { SPELL_CHARS, SPELL_COLUMNS, SPELL_LENGTH, decodeSpell } from '../saveData.js';

// ふっかつのじゅもんを入力する画面。文字表と、その下のコマンド行をキーボードで選ぶ
export class Spell extends Phaser.Scene {

    constructor() {
        super('Spell');
    }

    create() {
        this.cameras.main.setBackgroundColor('#000000');
        const centerX = this.scale.width / 2;
        this.entered = [];

        this.add.text(centerX, 60, 'ふっかつのじゅもんを いれてください', {
            fontSize: '40px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.spellText = this.add.text(centerX, 150, '', {
            fontSize: '56px',
            color: '#ffff66',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        this.messageText = this.add.text(centerX, 215, '', {
            fontSize: '32px',
            color: '#ff6666'
        }).setOrigin(0.5);

        this.add.text(centerX, 695, '矢印キーで移動　Enter / Space で決定　Backspace で1文字消す', {
            fontSize: '24px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // 五十音表。左から あ行・か行…、上から あ・い・う・え・お段。空白マスは作らず、fieldRows[段] に実在するボタンだけ入れる
        const cell = 64;
        const rowCount = 5;
        const startX = centerX - (SPELL_COLUMNS.length * cell) / 2 + cell / 2;
        this.fieldRows = Array.from({ length: rowCount }, () => []);
        SPELL_COLUMNS.forEach((column, col) => {
            [...column].forEach((ch, row) => {
                if (ch === '.') {
                    return;
                }
                const button = this.createButton(startX + col * cell, 290 + row * cell, ch, 36, { x: 10, y: 6 }, () => this.addChar(ch));
                this.fieldRows[row].push(button);
            });
        });

        // 最下段のコマンド行
        const commandY = 635;
        this.fieldRows.push([
            this.createButton(centerX - 300, commandY, 'もどす', 36, { x: 24, y: 12 }, () => this.removeChar()),
            this.createButton(centerX, commandY, 'けってい', 36, { x: 24, y: 12 }, () => this.submit()),
            this.createButton(centerX + 300, commandY, 'わすれた', 36, { x: 24, y: 12 }, () => this.scene.start('Home')),
        ]);

        this.cursorRow = 0;
        this.cursorCol = 0;

        const keyboard = this.input.keyboard;
        keyboard.on('keydown-LEFT', () => this.moveCursor(0, -1));
        keyboard.on('keydown-RIGHT', () => this.moveCursor(0, 1));
        keyboard.on('keydown-UP', () => this.moveCursor(-1, 0));
        keyboard.on('keydown-DOWN', () => this.moveCursor(1, 0));
        keyboard.on('keydown-ENTER', () => this.activateCursor());
        keyboard.on('keydown-SPACE', () => this.activateCursor());
        keyboard.on('keydown-BACKSPACE', () => this.removeChar());
        // ひらがな・カタカナの直接入力にも対応する
        keyboard.on('keydown', event => {
            if (event.key.length !== 1) {
                return;
            }
            const ch = event.key.replace(/[\u30a1-\u30f6]/, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
            if (SPELL_CHARS.includes(ch)) {
                this.addChar(ch);
            }
        });

        this.refresh();
        this.updateCursor();
    }

    createButton(x, y, label, fontSize, padding, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            backgroundColor: '#333333',
            padding
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        button.on('pointerdown', onClick);
        return button;
    }

    moveCursor(dRow, dCol) {
        const rowCount = this.fieldRows.length;
        const rowLength = this.fieldRows[this.cursorRow].length;
        if (dCol !== 0) {
            this.cursorCol = (this.cursorCol + dCol + rowLength) % rowLength;
        } else {
            // 上下移動は、移動先の段で横位置がいちばん近いボタンに移る
            const currentX = this.fieldRows[this.cursorRow][this.cursorCol].x;
            const newRow = (this.cursorRow + dRow + rowCount) % rowCount;
            let best = 0;
            this.fieldRows[newRow].forEach((button, i) => {
                if (Math.abs(button.x - currentX) < Math.abs(this.fieldRows[newRow][best].x - currentX)) {
                    best = i;
                }
            });
            this.cursorCol = best;
            this.cursorRow = newRow;
        }
        this.updateCursor();
    }

    updateCursor() {
        this.focusedButton?.setBackgroundColor('#333333');
        this.focusedButton = this.fieldRows[this.cursorRow][this.cursorCol];
        this.focusedButton.setBackgroundColor('#3366cc');
    }

    activateCursor() {
        this.fieldRows[this.cursorRow][this.cursorCol].emit('pointerdown');
    }

    addChar(ch) {
        if (this.entered.length < SPELL_LENGTH) {
            this.entered.push(ch);
            this.messageText.setText('');
            this.refresh();
        }
    }

    removeChar() {
        this.entered.pop();
        this.messageText.setText('');
        this.refresh();
    }

    refresh() {
        const slots = Array.from({ length: SPELL_LENGTH }, (_, i) => this.entered[i] ?? '・');
        this.spellText.setText(slots.join(' '));
    }

    submit() {
        const data = decodeSpell(this.entered.join(''));
        if (!data) {
            this.messageText.setText('じゅもんが ちがいます');
            return;
        }
        this.registry.set('saveData', data);
        this.scene.start('Home');
    }
}
