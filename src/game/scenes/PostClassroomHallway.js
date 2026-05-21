import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";

const main_width = 1600;
const main_height = 900;

export class PostClassroomHallway extends Scene {
  constructor() {
    super("PostClassroomHallway");
  }

  init(data) {
    this.fromTestSave = false;

    if (data) {
      if (data.fromTestSave) {
        this.fromTestSave = true;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.studentRunCount = 0;

    this.schoolAlarmStarted = false;

    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);

    this.bg.setDepth(-20);

    this.topCinemaBorder = this.add.rectangle(
      0,
      -110,
      main_width,
      220,
      0x000000,
      1,
    );
    this.topCinemaBorder.setOrigin(0, 0);
    this.topCinemaBorder.setDepth(2000);

    this.bottomCinemaBorder = this.add.rectangle(
      0,
      main_height - 100,
      main_width,
      350,
      0x000000,
      1,
    );
    this.bottomCinemaBorder.setOrigin(0, 0);
    this.bottomCinemaBorder.setDepth(2000);

    this.background = this.add.image(main_width / 2, 110, "id-card-background");
    this.background.setOrigin(0.5, 0);

    this.background.setDepth(1);
    this.background.setScale(main_width / this.background.width);

    const bgLeft =
      this.background.x -
      this.background.displayWidth * this.background.originX;

    const bgBottom =
      this.background.y +
      this.background.displayHeight * (1 - this.background.originY);

    this.floorY = bgBottom - 45;
    this.doorWalkX = bgLeft + 380;

    this.door = this.add.image(
      this.background.x - 400,

      this.background.y + 70,
      "id-card-door-open",
    );

    this.door.setOrigin(this.background.originX, this.background.originY);

    this.door.setDepth(10);

    this.door.setScale((main_width / this.background.width) * 1.037);

    this.locker = this.add.image(
      bgLeft + 965,
      this.floorY + 8,
      "id-card-locker",
    );
    this.locker.setOrigin(0.5, 1);

    this.kim = this.add.image(bgLeft + 585, this.floorY + 8, "id-card-kim");
    this.kim.setOrigin(0.5, 1);

    this.kim.setScale(335 / this.kim.height);
    this.kim.setDepth(20);

    this.locker.setDepth(11);

    this.meryl = this.add.image(bgLeft + 755, this.floorY + 8, "id-card-meryl");
    this.meryl.setDepth(20);

    this.meryl.setScale(335 / this.meryl.height);

    this.locker.setScale(335 / this.locker.height);

    this.meryl.setOrigin(0.5, 1);

    this.zombie = this.add.image(
      bgLeft + 1230,
      this.floorY + 8,
      "knowledge-walker-right", //s tarts facing right tho
    );
    this.zombie.setOrigin(0.5, 1);

    this.zombie.setDepth(19);
    this.zombie.setScale(360 / this.zombie.height);

    this.zombie.setTint(0x88ff88);

    this.agroIcon = this.add.image(
      this.zombie.x - 40,
      this.zombie.y - this.zombie.displayHeight - 45,
      "agro-icon",
    );
    this.agroIcon.setOrigin(0.5);
    this.agroIcon.setDepth(3100);

    this.agroIcon.setAlpha(0);
    this.agroIcon.setVisible(false);

    this.agroIcon.setScale(90 / this.agroIcon.height);

    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);

    this.pauseButton.setDepth(3100);

    const pauseScale = Math.min(
      78 / this.pauseButton.width,
      78 / this.pauseButton.height,
    );

    this.pauseButton.setScale(pauseScale);

    this.pauseButton.setInteractive({ useHandCursor: false });

    this.pauseButton.on("pointerover", () => {
      this.pauseButton.setAlpha(0.75);
      this.input.setDefaultCursor("pointer");
    });

    this.pauseButton.on("pointerout", () => {
      this.pauseButton.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    this.pauseButton.on("pointerdown", () => {
      this.openPauseMenu();
    });

    this.dialogueBox = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialogueBox.setOrigin(0.5, 1);
    this.dialogueBox.setDepth(3000);

    this.dialogueBox.setScale(1470 / this.dialogueBox.width);

    this.startSchoolAlarm();

    const dialogueData = {
      id: "post-classroom-hallway-dialogue",
      lines: [
        {
          type: "say",
          speaker: "Meryl",
          text: "The hallway's worse than before.",
        },
        {
          type: "say",
          speaker: "Kim",
          text: "OMG?!?1!?",
        },
        {
          type: "say",
          speaker: "Meryl",
          text: "WHAT IS THAT?!??1",
        },
        {
          type: "say",
          speaker: "Meryl",
          text: "I don't think it sees us yet.",
        },
        {
          type: "action",
          id: "zombieNoticesPlayers",
        },
        {
          type: "say",
          speaker: "Meryl",
          text: "OMG IT SEES US-",
        },
        {
          type: "action",
          id: "goToFirstFight",
        },
      ],
    };

    this.dialogue = new DialogueRunner(this, {
      data: dialogueData,
      box: this.dialogueBox,
      boxPadX: 78,
      boxPadY: 34,
      fontSize: 26,
      typeSpeed: 28,

      onAction: async (line) => {
        await this.runDialogueAction(line);
      },

      onDone: () => {
        console.log("CRQAZY OMG NICE JOB");
      },
    });

    this.dialogue.start();

    this.entryBlack = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      1,
    );

    this.entryBlack.setOrigin(0, 0);

    this.entryBlack.setDepth(999999);
    this.entryBlack.setAlpha(1);

    this.tweens.add({
      targets: this.entryBlack,
      alpha: 0,
      duration: 800,
      ease: "Sine.Out",
      onComplete: () => {
        this.entryBlack.destroy();
      },
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");

      if (this.schoolAlarmTweens) {
        this.schoolAlarmTweens.forEach((tween) => {
          if (tween) {
            tween.stop();
          }
        });

        this.schoolAlarmTweens = null;
      }

      if (this.dialogue) {
        this.dialogue.destroy();

        this.dialogue = null;
      }
    });
  }

  makeSmoothAlarmTexture() {
    const name = "smooth-alarm-red";

    if (this.textures.exists(name)) {
      return;
    }

    const size = 312;
    const tex = this.textures.createCanvas(name, size, size);
    const ctx = tex.getContext();

    const cx = size / 2;
    const cy = size / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);

    grad.addColorStop(0, "rgba(255, 80, 80, 1.00)");
    grad.addColorStop(0.18, "rgba(255, 55, 55, 0.70)");
    grad.addColorStop(0.38, "rgba(255, 35, 35, 0.35)");
    grad.addColorStop(0.62, "rgba(255, 20, 20, 0.12)");
    grad.addColorStop(0.82, "rgba(255, 10, 10, 0.04)");
    grad.addColorStop(1, "rgba(255, 0, 0, 0)");

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    tex.refresh();
  }

  makeAlarmSide(x, y, smoothSize, pixelSize) {
    this.makeSmoothAlarmTexture();

    const screen = Phaser.BlendModes.SCREEN;
    const smooth = this.add.image(x, y, "smooth-alarm-red");
    smooth.setOrigin(0.5);

    smooth.setDepth(1500);
    smooth.setBlendMode(screen);
    smooth.setAlpha(0);

    smooth.setVisible(false);

    const pixel = this.add.image(x, y - 6, "alarm-pixel");
    pixel.setOrigin(0.5);
    pixel.setDepth(1501);
    pixel.setBlendMode(screen);

    pixel.setAlpha(0);
    pixel.setVisible(false);

    const smoothBaseScale = smoothSize / smooth.width;

    const pixelBaseScale = pixelSize / pixel.width;

    smooth.setScale(smoothBaseScale);
    pixel.setScale(pixelBaseScale);

    return {
      smooth,
      pixel,
      smoothBaseScale,
      pixelBaseScale,
    };
  }

  startSchoolAlarm() {
    if (this.schoolAlarmStarted) {
      return;
    }

    this.schoolAlarmStarted = true;
    this.schoolAlarmTweens = [];

    this.OVERLAYlockdown = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x330000,
      1,
    );

    this.OVERLAYlockdown.setOrigin(0, 0);
    this.OVERLAYlockdown.setDepth(1000);
    this.OVERLAYlockdown.setAlpha(0.72);

    this.OVERLAYlockdown.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.LOCKDOWNRedCircleStuff = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x9a0000,
      1,
    );

    this.LOCKDOWNRedCircleStuff.setOrigin(0, 0);
    this.LOCKDOWNRedCircleStuff.setDepth(1001);

    this.LOCKDOWNRedCircleStuff.setAlpha(0.08);

    this.LOCKDOWNRedCircleStuff.setBlendMode(Phaser.BlendModes.SCREEN);

    // we can stop all of hthem easily later isntead of manualy doing it, we will put them in []
    this.schoolAlarmTweens.push(
      this.tweens.add({
        targets: this.LOCKDOWNRedCircleStuff,
        alpha: {
          from: 0.08,
          to: 0.28,
        },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      }),
    );

    this.leftAlarm = this.makeAlarmSide(105, 125, 1250, 780);

    this.rightAlarm = this.makeAlarmSide(main_width - 105, 125, 1250, 780);

    [this.leftAlarm, this.rightAlarm].forEach((alarm) => {
      alarm.smooth.setVisible(true);
      alarm.pixel.setVisible(true);

      // same here
      this.schoolAlarmTweens.push(
        this.tweens.add({
          targets: alarm.smooth,
          alpha: {
            from: 0.35,
            to: 0.7,
          },
          scaleX: {
            from: alarm.smoothBaseScale,
            to: alarm.smoothBaseScale * 1.22,
          },
          scaleY: {
            from: alarm.smoothBaseScale,
            to: alarm.smoothBaseScale * 1.22,
          },
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.Out",
        }),
      );

      this.schoolAlarmTweens.push(
        this.tweens.add({
          targets: alarm.pixel,
          alpha: {
            from: 0.12,
            to: 0.32,
          },
          scaleX: {
            from: alarm.pixelBaseScale,
            to: alarm.pixelBaseScale * 1.08,
          },
          scaleY: {
            from: alarm.pixelBaseScale,
            to: alarm.pixelBaseScale * 1.08,
          },
          duration: 420,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        }),
      );
    });

    this.cameras.main.shake(260, 0.006);
  }

  async runDialogueAction(line) {
    if (line.id === "zombieNoticesPlayers") {
      this.zombie.setTexture("knowledge-walker-left");

      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.zombie,
          x: this.zombie.x - 50,
          duration: 120,

          yoyo: true,
          repeat: 2,
          ease: "Sine.InOut",
          onComplete: resolve,
        });
      });

      this.agroIcon.setPosition(
        this.zombie.x - 40,
        this.zombie.y - this.zombie.displayHeight - 45,
      );

      this.agroIcon.setVisible(true);

      this.agroIcon.setAlpha(0);

      this.agroIcon.setScale(0.2);
      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.agroIcon,
          alpha: 1,
          scaleX: 90 / this.agroIcon.height,
          scaleY: 90 / this.agroIcon.height,
          y: this.agroIcon.y - 18,
          duration: 220,
          ease: "Back.Out",
          onComplete: resolve,
        });
      });

      return;
    }

    if (line.id === "goToFirstFight") {
      await this.endSceneForFutureFight();
      return;
    }
  }

  async endSceneForFutureFight() {
    const blackScreen = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      1,
    );
    blackScreen.setOrigin(0, 0);

    blackScreen.setDepth(999999);
    blackScreen.setAlpha(0);

    await new Promise((resolve) => {
      this.tweens.add({
        targets: blackScreen,
        alpha: 1,
        duration: 650,
        ease: "Cubic.In",

        onComplete: resolve,
      });
    });

    this.input.setDefaultCursor("default");
    if (this.game) {
      if (this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }
    }

    // start fight with 2 zombies
    this.scene.start("FightScene", {
      area: "post-classroom-hallway",
      chapterName: "post-classroom-hallway",
      enemies: [
        {
          id: "walker",
          count: 2,
        },
      ],
    });
  }

  shouldBlockPauseOpen() {
    const closedOverlayFrame = this.registry.get("escClosedOverlayFrame");

    if (closedOverlayFrame === this.game.loop.frame) {
      return true;
    }

    const inventory = this.scene.get("InventoryOverlay");

    if (inventory) {
      if (inventory.isOpen) {
        return true;
      }
    }

    const knowledgeLog = this.scene.get("KnowledgeLogOverlay");

    if (knowledgeLog) {
      if (knowledgeLog.isOpen) {
        return true;
      }
    }

    return false;
  }

  openPauseMenu() {
    if (this.shouldBlockPauseOpen()) {
      return;
    }

    if (!this.scene.isActive("PauseMenuOverlay")) {
      this.scene.launch("PauseMenuOverlay");
    }

    const pauseMenu = this.scene.get("PauseMenuOverlay");

    if (pauseMenu) {
      if (pauseMenu.open) {
        pauseMenu.open(this.scene.key);
      }
    }
  }
}
