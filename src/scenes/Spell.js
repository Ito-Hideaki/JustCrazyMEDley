import { SPELL_COLUMNS, SPELL_LENGTH, decodeSpell } from '../saveData.js';

// ふっかつのじゅもんを入力する画面。文字表とキーボード入力の両方に対応する
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

        this.spellInput = this.add.dom(centerX, 150).createElement('input', {
            width: '900px',
            height: '72px',
            padding: '0 12px',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid #ffff66',
            outline: 'none',
            color: '#ffff66',
            font: '48px monospace',
            textAlign: 'center',
            pointerEvents: 'none'
        });
        this.spellInput.node.type = 'text';
        this.spellInput.node.maxLength = SPELL_LENGTH;
        this.spellInput.node.autocomplete = 'off';
        this.spellInput.node.autocapitalize = 'off';
        this.spellInput.node.placeholder = 'ここに入力';
        this.spellInput.node.setAttribute('aria-label', 'ふっかつのじゅもん');
        this.spellInput.addListener('input keydown');
        this.spellInput.on('input', event => {
            this.entered = Array.from(this.normalizeKana(event.target.value)).slice(0, SPELL_LENGTH);
            this.messageText.setText('');
        });
        this.spellInput.on('keydown', event => {
            if (event.code === 'Space' && !event.isComposing) {
                event.preventDefault();
            }
        });

        this.messageText = this.add.text(centerX, 215, '', {
            fontSize: '32px',
            color: '#ff6666'
        }).setOrigin(0.5);

        this.add.text(centerX, 695, 'そのまま入力　Enter / Space 決定　Esc で文字選択　I で入力に戻る', {
            fontSize: '24px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // 五十音表。左から あ行・か行…、上から あ・い・う・え・お段。空白マスは作らず、fieldRows[段] に実在するボタンだけ入れる
        const cell = 64;
        const rowCount = 5;
        const startX = centerX - (SPELL_COLUMNS.length * cell) / 2 + cell / 2;
        this.buttonActions = new Map();
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
        keyboard.on('keydown-LEFT', () => {
            if (!this.isSpellInputFocused()) this.moveCursor(0, -1);
        });
        keyboard.on('keydown-RIGHT', () => {
            if (!this.isSpellInputFocused()) this.moveCursor(0, 1);
        });
        keyboard.on('keydown-UP', () => {
            if (!this.isSpellInputFocused()) this.moveCursor(-1, 0);
        });
        keyboard.on('keydown-DOWN', () => {
            if (!this.isSpellInputFocused()) this.moveCursor(1, 0);
        });
        keyboard.on('keydown-ENTER', event => {
            if (this.isSpellInputFocused()) {
                if (!event.isComposing) this.submit();
            } else {
                this.activateCursor();
            }
        });
        keyboard.on('keydown-SPACE', event => {
            if (this.isSpellInputFocused()) {
                if (!event.isComposing) this.submit();
            } else {
                this.activateCursor();
            }
        });
        keyboard.on('keydown-ESC', () => {
            if (this.isSpellInputFocused()) {
                this.spellInput.node.blur();
            }
        });
        keyboard.on('keydown-I', () => {
            if (!this.isSpellInputFocused()) {
                this.spellInput.node.focus();
            }
        });
        keyboard.on('keydown-BACKSPACE', () => {
            if (!this.isSpellInputFocused()) {
                this.removeChar();
            }
        });

        this.refresh();
        this.updateCursor();
        this.spellInput.node.focus();
    }

    createButton(x, y, label, fontSize, padding, onClick) {
        const button = this.add.text(x, y, label, {
            fontSize: `${fontSize}px`,
            color: '#ffffff',
            backgroundColor: '#333333',
            padding
        }).setOrigin(0.5);
        this.buttonActions.set(button, onClick);
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
        const action = this.buttonActions.get(this.fieldRows[this.cursorRow][this.cursorCol]);
        action();
    }

    isSpellInputFocused() {
        return document.activeElement === this.spellInput.node;
    }

    normalizeKana(text) {
        return text.normalize('NFC').replace(/[\u30a1-\u30f6]/g, ch =>
            String.fromCharCode(ch.charCodeAt(0) - 0x60));
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
        this.spellInput.node.value = this.entered.join('');
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
