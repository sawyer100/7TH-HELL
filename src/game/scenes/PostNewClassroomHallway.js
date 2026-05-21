import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import { setCurrentChapterName } from "../db";

const main_width = 1600;
const main_height = 900;
const hallway_segments = 2;
const world_width = main_width * hallway_segments;

export class PostNewClassroomHallway extends Scene {
  constructor() {
    super("PostNewClassroomHallway");
  }

  create() {
    setCurrentChapterName("post-new-classroom-hallway").catch((error) => {});
    this.game.canvas.style.cursor = "default";
    this.schoolAlarmStarted = false;
    this.schoolAlarmTweens = [];
    this.leftAlarm = null;
    this.rightAlarm = null;
    this.OVERLAYlockdown = null;
    this.LOCKDOWNRedCircleStuff = null;
    this.input.setTopOnly(true);

    this.ready = false;
    this.canMove = false;
    this.dialogueActive = false;
    this.enteringStairwell = false;

    this.cameras.main.setBounds(0, 0, world_width, main_height);
    this.cameras.main.scrollX = 0;

    this.createWorld();
    this.startSchoolAlarm();
    this.createCinemaBorders();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createDialogueBox();
    this.createKeys();

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.game.canvas.style.cursor = "default";
      this.stopSchoolAlarm();

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });

    this.bootScene();
  }

  bootScene() {
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
    this.entryBlack.setScrollFactor(0);
    this.entryBlack.setAlpha(1);

    this.tweens.add({
      targets: this.entryBlack,
      alpha: 0,
      duration: 650,
      ease: "Sine.Out",
      onComplete: () => {
        this.entryBlack.destroy();
      },
    });

    this.startDialogue(
      [
        {
          type: "say",
          speaker: "Meryl",
          text: "Keep going right. The stairwell should be just ahead.",
        },
        {
          type: "say",
          speaker: "Kim",
          text: "Right. Let's move.",
        },
      ],
      () => {
        this.hideDialogueUI();
        this.ready = true;
        this.canMove = true;
        this.updateObjectiveHeader("Go right");
      },
    );
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
    smooth.setScrollFactor(0);

    const pixel = this.add.image(x, y - 6, "alarm-pixel");
    pixel.setOrigin(0.5);
    pixel.setDepth(1501);
    pixel.setBlendMode(screen);
    pixel.setAlpha(0);
    pixel.setVisible(false);
    pixel.setScrollFactor(0);

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
    this.OVERLAYlockdown.setAlpha(0);
    this.OVERLAYlockdown.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.OVERLAYlockdown.setScrollFactor(0);

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
    this.LOCKDOWNRedCircleStuff.setAlpha(0);
    this.LOCKDOWNRedCircleStuff.setBlendMode(Phaser.BlendModes.SCREEN);
    this.LOCKDOWNRedCircleStuff.setScrollFactor(0);

    this.tweens.add({
      targets: this.OVERLAYlockdown,
      alpha: 0.72,
      duration: 450,
      ease: "Cubic.Out",
    });

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

  stopSchoolAlarm() {
    if (this.schoolAlarmTweens) {
      this.schoolAlarmTweens.forEach((tween) => {
        if (tween) {
          tween.stop();
        }
      });
    }

    this.schoolAlarmTweens = [];

    if (this.leftAlarm) {
      if (this.leftAlarm.smooth) {
        this.leftAlarm.smooth.destroy();
      }

      if (this.leftAlarm.pixel) {
        this.leftAlarm.pixel.destroy();
      }
    }

    if (this.rightAlarm) {
      if (this.rightAlarm.smooth) {
        this.rightAlarm.smooth.destroy();
      }

      if (this.rightAlarm.pixel) {
        this.rightAlarm.pixel.destroy();
      }
    }

    if (this.OVERLAYlockdown) {
      this.OVERLAYlockdown.destroy();
    }

    if (this.LOCKDOWNRedCircleStuff) {
      this.LOCKDOWNRedCircleStuff.destroy();
    }

    this.leftAlarm = null;
    this.rightAlarm = null;
    this.OVERLAYlockdown = null;

    this.LOCKDOWNRedCircleStuff = null;
    this.schoolAlarmStarted = false;
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, world_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

    this.segmentInfo = [];

    for (let i = 0; i < hallway_segments; i += 1) {
      this.makeHallwaySegment(i);
    }

    const first = this.segmentInfo[0];
    const second = this.segmentInfo[1];

    this.floorY = first.floorY;

    // This is the classroom door they just came out of.
    this.classroomDoor = this.add.image(
      first.left + 235,
      first.background.y + 70,
      "id-card-full-door",
    );

    this.classroomDoor.setOrigin(0.5, 0);
    this.classroomDoor.setDepth(18);
    this.classroomDoor.setScale((main_width / first.background.width) * 1.037);

    this.kim = this.add.image(first.left + 430, this.floorY + 8, "id-card-kim");
    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(40);
    this.kim.setScale(335 / this.kim.height);

    this.meryl = this.add.image(
      first.left + 250,
      this.floorY + 8,
      "id-card-meryl",
    );

    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);
    this.meryl.setScale(335 / this.meryl.height);

    this.stairwellExitX = second.left + 1320;
    this.stairwellExitY = second.floorY + 8;

    this.stairwellMarker = this.add.rectangle(
      this.stairwellExitX,
      this.stairwellExitY - 120,
      150,
      300,
      0x00ff00,
      0,
    );

    this.stairwellMarker.setOrigin(0.5);
    this.stairwellMarker.setDepth(10);
  }

  makeHallwaySegment(index) {
    const x = index * main_width;

    const background = this.add.image(
      x + main_width / 2,
      110,
      "id-card-background",
    );

    background.setOrigin(0.5, 0);
    background.setDepth(1);
    background.setScale(main_width / background.width);

    const left = background.x - background.displayWidth * background.originX;
    const bottom =
      background.y + background.displayHeight * (1 - background.originY);
    const floorY = bottom - 45;

    const locker = this.add.image(left + 965, floorY + 8, "id-card-locker");
    locker.setOrigin(0.5, 1);
    locker.setDepth(11);
    locker.setScale(335 / locker.height);

    this.segmentInfo.push({
      index,
      left,
      floorY,
      background,
      locker,
    });
  }

  createCinemaBorders() {
    const borderH = 110;
    const extra = 110;

    this.topCinemaBorder = this.add.rectangle(
      0,
      -extra,
      main_width,
      borderH + extra,
      0x000000,
      1,
    );

    this.topCinemaBorder.setOrigin(0, 0);

    this.topCinemaBorder.setDepth(2000);
    this.topCinemaBorder.setScrollFactor(0);

    this.bottomCinemaBorder = this.add.rectangle(
      0,
      main_height - borderH,
      main_width,
      borderH + extra,
      0x000000,
      1,
    );

    this.bottomCinemaBorder.setOrigin(0, 0);
    this.bottomCinemaBorder.setDepth(2000);

    this.bottomCinemaBorder.setScrollFactor(0);
  }

  createPauseButton() {
    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);

    this.pauseButton.setDepth(3100);
    this.pauseButton.setScrollFactor(0);

    const pScaleX = 78 / this.pauseButton.width;
    const pScaleY = 78 / this.pauseButton.height;
    let pScale = pScaleX;

    if (pScaleY < pScaleX) {
      pScale = pScaleY;
    }

    this.pauseButton.setScale(pScale);
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
  }

  createObjectiveHeader() {
    this.objectiveHeader = this.add.text(main_width / 2, 32, "", {
      fontFamily: "DogicaBold",
      fontSize: "20px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    });

    this.objectiveHeader.setOrigin(0.5, 0);
    this.objectiveHeader.setDepth(3200);

    this.objectiveHeader.setScrollFactor(0);

    this.objectiveHeader.setVisible(false);
  }

  updateObjectiveHeader(text) {
    if (!text) {
      this.objectiveHeader.setVisible(false);
      this.objectiveHeader.setText("");
      return;
    }

    this.objectiveHeader.setText(`Objective: ${text}`);
    this.objectiveHeader.setVisible(true);
  }

  createInteractionPrompt() {
    this.interactPromptRoot = this.add.container(0, 0);
    this.interactPromptRoot.setDepth(3300);
    this.interactPromptRoot.setVisible(false);

    this.interactPromptKeyText = this.add.text(0, 0, "", {
      fontFamily: "DogicaBold",
      fontSize: "25px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center",
    });

    this.interactPromptKeyText.setOrigin(0.5);

    this.interactPromptNameText = this.add.text(0, 37, "", {
      fontFamily: "DogicaBold",
      fontSize: "15px",

      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    });

    this.interactPromptNameText.setOrigin(0.5);

    this.interactPromptRoot.add([
      this.interactPromptKeyText,
      this.interactPromptNameText,
    ]);
  }

  showInteractionPrompt(x, y, actionText, label) {
    if (!this.interactPromptRoot) {
      return;
    }

    this.interactPromptRoot.setPosition(x, y);
    this.interactPromptKeyText.setText(actionText);
    this.interactPromptNameText.setText(label);

    this.interactPromptRoot.setVisible(true);
  }

  hideInteractionPrompt() {
    if (this.interactPromptRoot) {
      this.interactPromptRoot.setVisible(false);
    }
  }

  createDialogueBox() {
    this.dialogueBox = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialogueBox.setOrigin(0.5, 1);
    this.dialogueBox.setDepth(3000);

    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setScale(1470 / this.dialogueBox.width);
    this.dialogueBox.setVisible(false);
  }

  createKeys() {
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (!this.ready) {
      return;
    }

    if (this.dialogueActive || this.enteringStairwell) {
      this.hideInteractionPrompt();
      this.updateCamera(delta);
      return;
    }

    if (this.canMove) {
      this.moveCharacters(delta);
    }

    this.updateCamera(delta);
    this.updateStairwellInteraction();
  }

  moveCharacters(delta) {
    const speed = 390;
    const dt = delta / 1000;
    let dx = 0;

    if (this.aKey.isDown) {
      dx -= 1;
    }

    if (this.dKey.isDown) {
      dx += 1;
    }

    let nextKimX = this.kim.x + dx * speed * dt;

    const minX = 110;
    const maxX = world_width - 120;

    nextKimX = Phaser.Math.Clamp(nextKimX, minX, maxX);

    this.kim.x = nextKimX;
    this.kim.y = this.floorY + 8;

    const followTargetX = this.kim.x - 150;
    const followTargetY = this.kim.y;

    const followSpeed = Math.min(1, dt * 4.2);

    this.meryl.x = Phaser.Math.Linear(this.meryl.x, followTargetX, followSpeed);
    this.meryl.y = Phaser.Math.Linear(this.meryl.y, followTargetY, followSpeed);
  }

  updateCamera(delta) {
    const targetScroll = Phaser.Math.Clamp(
      this.kim.x - main_width / 2,
      0,
      world_width - main_width,
    );

    const dt = delta / 1000;
    const cameraFollowSpeed = Math.min(1, dt * 7.5);

    const nextScroll = Phaser.Math.Linear(
      this.cameras.main.scrollX,
      targetScroll,
      cameraFollowSpeed,
    );

    this.cameras.main.scrollX = Math.round(nextScroll);
  }

  updateStairwellInteraction() {
    const distance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.stairwellExitX,
      this.stairwellExitY,
    );

    if (distance > 175) {
      this.hideInteractionPrompt();
      return;
    }

    this.showInteractionPrompt(
      this.stairwellExitX,
      this.stairwellExitY - 330,
      "E TO ENTER",
      "Stairwell",
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.enterStairwell();
    }
  }

  startDialogue(lines, onDone) {
    if (this.dialogue) {
      this.dialogue.destroy();
      this.dialogue = null;
    }

    this.dialogueActive = true;
    this.canMove = false;
    this.dialogueBox.setVisible(true);
    this.dialogueBox.setAlpha(1);

    this.dialogue = new DialogueRunner(this, {
      data: {
        id: "post-new-classroom-hallway-runtime-dialogue",
        lines,
      },

      box: this.dialogueBox,
      boxPadX: 78,
      boxPadY: 34,
      fontSize: 26,
      typeSpeed: 28,

      onDone: () => {
        this.dialogueActive = false;

        if (onDone) {
          onDone();
        }
      },
    });

    this.dialogue.textObj.setScrollFactor(0);
    this.dialogue.arrNextThing.setScrollFactor(0);
    this.dialogue.hitThing.setScrollFactor(0);

    this.dialogue.start();
  }

  hideDialogueUI() {
    if (this.dialogueBox) {
      this.dialogueBox.setVisible(false);
    }

    if (this.dialogue) {
      if (this.dialogue.textObj) {
        this.dialogue.textObj.setVisible(false);
      }

      if (this.dialogue.arrNextThing) {
        this.dialogue.arrNextThing.setVisible(false);
      }

      if (this.dialogue.hitThing) {
        this.dialogue.hitThing.disableInteractive();
      }
    }
  }

  async enterStairwell() {
    if (this.enteringStairwell) {
      return;
    }

    this.enteringStairwell = true;
    this.canMove = false;
    this.hideInteractionPrompt();

    const blackScreen = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      1,
    );

    blackScreen.setOrigin(0, 0);
    //
    blackScreen.setDepth(999999);
    blackScreen.setScrollFactor(0);
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

    this.scene.start("Stairwell");

    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");

    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    
    this.scene.bringToTop("InventoryOverlay");
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
