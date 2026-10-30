const DATA = {
    M: [
        { name: "ケバブ", time: 3.3 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    E: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    D: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    J: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    C: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
}

const CENTER_X = 800;
const CENTER_Y = 450;
const PANEL_CENTER_Y = 550;
const PANEL_GAP = 30;
const PANEL_GAP_X = 100;
const PANEL_WIDTH = 500;
const PANEL_HEIGHT = 100;
const RANK_WIDTH = 150;
const SECTION_WIDTH = RANK_WIDTH + PANEL_WIDTH;

const TRANSTITION_DURATION = 8000;

const RANK_FONT = "72px 'Quantico'";
const NAME_FONT = "36px 'DotGothic16'";
const time_FONT = "48px 'Quantico'";
const TITLE_FONT = "96px 'DotGothic16'";

const DEPARTMENT_ORDER = ["M", "E", "D", "J", "C"];

function getNextDepartment(department) {
    return DEPARTMENT_ORDER[(DEPARTMENT_ORDER.indexOf(department) + 1) % DEPARTMENT_ORDER.length];
}

function getPreviousDepartment(department) {
    return DEPARTMENT_ORDER[(DEPARTMENT_ORDER.indexOf(department) - 1 + DEPARTMENT_ORDER.length) % DEPARTMENT_ORDER.length];
}

const INITIAL_DATA = {
    M: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    E: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    D: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    J: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
    C: [
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
        { name: "-", time: 10000 },
    ],
};

function shakeColor(rad, c1, c2) {
    const c1rgb = Phaser.Display.Color.IntegerToRGB(c1);
    const c2rgb = Phaser.Display.Color.IntegerToRGB(c2);
    const f1 = Math.pow((1 + Math.sin(rad)) / 2, 0.5);
    const f2 = 1 - f1;
    const color = Phaser.Display.Color.GetColor(c1rgb.r * f1 + c2rgb.r * f2, c1rgb.g * f1 + c2rgb.g * f2, c1rgb.b * f1 + c2rgb.b * f2);
    return color;
}

class Panel extends Phaser.GameObjects.Graphics {
    static bw = 8;
    static color = {
        g: {
            l: 0xffff66,
            m: 0xf4dd44,
            d: 0xccaa00
        },
        s: {
            l: 0xeeffee,
            m: 0xdde0e0,
            d: 0xaaaaaa
        },
        c: {
            l: 0xee7722,
            m: 0xcc5500,
            d: 0xaa4400
        },
        n: {
            l: 0xffffff,
            m: 0xdddddd,
            d: 0xcccccc
        }
    };

    /** @type { "g" | "s" | "c" | "n" } */
    type;
    outline = [0, 0, PANEL_WIDTH, PANEL_HEIGHT, Panel.bw];
    fillOutline = [Panel.bw, Panel.bw, PANEL_WIDTH - Panel.bw * 2, PANEL_HEIGHT - Panel.bw * 2, 0];

    constructor(scene, x, y, type) {
        super(scene);
        this.x = x;
        this.y = y;
        this.type = type;
        this.depth = 10;

        scene.events.on("update", this.update, this);
    }

    update(time) {
        this.clear();
        this.drawBorder(time);
        this.drawFill(time);
    }

    drawFill(time) {
        const rad1 = time / 1000 * Math.PI * 2 * 0.5;
        const rad2 = rad1 + Math.PI / 2 * -0.5;
        switch (this.type) {
            case "g":
            case "s":
            case "c":
                const colors = Panel.color[this.type];
                const c1 = shakeColor(rad1, colors.l, colors.m);
                const c2 = shakeColor(rad2, colors.l, colors.m);
                this.fillGradientStyle(c1, c2, c1, c2, 1);
                break;
            case "n":
                this.fillStyle(Panel.color[this.type].l);
                break;
        }
        this.fillRect(...this.fillOutline);
    }

    drawBorder(time) {
        this.fillStyle(Panel.color[this.type].d);
        this.fillRoundedRect(...this.outline);
    }
}

class Section {
    constructor(scene, x, y, rank, data) {
        const type = rank <= 3 ? ["g", "s", "c"][rank - 1] : "n";
        this.rank = rank;
        this.data = data;
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.panel = new Panel(scene, x + RANK_WIDTH, y, type);

        this.createRankText();
        this.createNameText();
        this.createTimeText();
    }

    createRankText() {
        const text = this.scene.add.text(this.x + RANK_WIDTH / 2, this.y + PANEL_HEIGHT / 2, this.rank.toString(), {
            font: RANK_FONT,
            color: "#000000"
        });
        text.setOrigin(0.5);
        text.depth = 20;
    }

    createNameText() {
        const text = this.scene.add.text(this.x + RANK_WIDTH + 20, this.y + PANEL_HEIGHT / 2, this.data.name, {
            font: NAME_FONT,
            color: "#000000"
        });
        text.setFixedSize(300, 0);
        text.setOrigin(0, 0.5);
        text.depth = 20;
    }

    createTimeText() {
        const str = `${this.data.time.toFixed(1)}s`;
        const text = this.scene.add.text(this.x + RANK_WIDTH + PANEL_WIDTH - 20, this.y + PANEL_HEIGHT / 2, str, {
            font: time_FONT,
            color: "#000000"
        });
        text.setOrigin(1, 0.5);
        text.depth = 20;
    }
}

class CategoryTitle extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text) {
        super(scene, x, y, text, {
            font: TITLE_FONT,
            color: "#000000"
        });
        this.setOrigin(0.5);
        this.depth = 20;
    }
}

class TransitionSign extends Phaser.GameObjects.Graphics {
    xOnScreen;
    constructor(scene, x, y) {
        super(scene);
        this.xOnScreen = x;
        this.y = y;
        this.draw(0);
        scene.events.on("update", this.update, this);
    }
    setPassedTime(time) {
        this.draw(time);
    }
    draw(time) {
        this.clear();
        this.fillStyle(0x000000);
        this.beginPath();
        this.slice(0, 0, 50, -Math.PI/2, -Math.PI/2 + Math.PI*2*(time / TRANSTITION_DURATION), false);
        this.fillPath();
    }
    update() {
        this.x = this.scene.cameras.main.scrollX + this.xOnScreen;
    }
}

class MainScene extends Phaser.Scene {

    currentDepartment = "M";
    currentCategoryTime = 0;

    transitionSign;

    constructor() {
        super("main");
    }

    preload() {
        this.load.image("ranking_background", "assets/ranking_background.png");
        this.load.on("complete", () => {
            const background = this.textures.get("ranking_background");
            for(let i = 0; i < DEPARTMENT_ORDER.length; i++) {
                const department = DEPARTMENT_ORDER[i];
                const frame = background.add(department, 0, 0, i*900, 1600, 900);
            }
        });
    }

    create() {
        for(let i = 0; i < DEPARTMENT_ORDER.length; i++) {
            const department = DEPARTMENT_ORDER[i];
            const screenX = i * 1600;
            this.createCategory(department, screenX);
        }

        this.transitionSign = new TransitionSign(this, 1500, 100);
        this.add.existing(this.transitionSign);

        this.input.keyboard.on("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                this.moveToCategorySmoothly(getPreviousDepartment(this.currentDepartment));
            } else if (event.key === "ArrowRight") {
                this.moveToCategorySmoothly(getNextDepartment(this.currentDepartment));
            }
        });
    }

    /** @param { "M"|"E"|"C"|"D"|"J" } department
    */
    createCategory(department, screenX) {
        const departmentName = {
            "M": "機械工学科",
            "E": "電気工学科",
            "C": "物質工学科",
            "D": "電子工学科",
            "J": "情報工学科"
        }[department];

        const screenCenter = CENTER_X + screenX;
        const panelLeftX = screenCenter - SECTION_WIDTH - PANEL_GAP_X / 2;
        const panelRightX = screenCenter + PANEL_GAP_X / 2;
        for (let i = 0; i < 2; i++) {
            const x = i ? panelRightX : panelLeftX;
            for (let j = 0; j < 5; j++) {
                const y = PANEL_CENTER_Y + (j - 2.5) * (PANEL_HEIGHT + PANEL_GAP) + PANEL_GAP / 2;
                const index = 5 * i + j;
                const section = new Section(this, x, y, index + 1, DATA[department][index]);
                this.add.existing(section.panel);
            }
        }

        const title = new CategoryTitle(this, screenCenter, 150, departmentName + "【フル単】");
        this.add.existing(title);

        const background = this.add.image(screenCenter, CENTER_Y, "ranking_background", department);
        background.setOrigin(0.5);
    }

    moveToCategorySmoothly(department) {
        if(this.currentDepartment === department) return;

        const index = DEPARTMENT_ORDER.indexOf(department);
        if (index === -1) return;
        this.currentDepartment = department;
        const targetX = index * 1600;
        this.tweens.add({
            targets: this.cameras.main,
            scrollX: targetX,
            duration: 1000,
            ease: 'Linear'
        });

        this.currentCategoryTime = 0;
    }

    update(time, delta) {
        this.transitionSign.setPassedTime(this.currentCategoryTime);
        this.currentCategoryTime += delta;
        if(this.currentCategoryTime > TRANSTITION_DURATION) {
            this.moveToCategorySmoothly(getNextDepartment(this.currentDepartment));
        }
    }
}

addEventListener('DOMContentLoaded', async function () {
    await document.fonts.load(RANK_FONT);
    await document.fonts.load(NAME_FONT);
    await document.fonts.load(TITLE_FONT, "電気電子機械物質情報工学科");
    await document.fonts.load(time_FONT);
    await document.fonts.ready;

    const game = new Phaser.Game({
        scale: {
            mode: Phaser.Scale.FIT,
            width: 1600,
            height: 900
        },
        parent: "canvas-wrapper",
        backgroundColor: "#bbbbbb",
        scene: MainScene
    });

});