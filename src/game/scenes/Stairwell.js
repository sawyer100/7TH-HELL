import Phaser, { Scene } from "phaser";
import { setCurrentChapterName } from "../db";

const main_width = 1600;
const main_height = 900;

export class Stairwell extends Scene {
  constructor() {
    super("Stairwell");
  }

  init(data) {
    this.targetFloor = 2;
    this.nextScene = "Floor2StartHallway";
    this.nextChapter = "floor2-starthallway";
    this.floorTitleText = "FLOOR 2";

    if (data) {
      if (data.targetFloor) {
        this.targetFloor = data.targetFloor;
      }

      if (data.nextScene) {
        this.nextScene = data.nextScene;
      }

      if (data.nextChapter) {
        this.nextChapter = data.nextChapter;
      }

      if (data.floorTitleText) {
        this.floorTitleText = data.floorTitleText;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.hideHudIconsForStairwell();
    this.canMove = true;
    this.enteringFloorTwo = false;

    this.createWorld();
    this.createPauseButton();

    this.createObjectiveHeader();
    this.createInteractionPrompt();

    this.createKeys();

    this.updateObjectiveHeader("Go upstairs");

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.game.canvas.style.cursor = "default";

      this.showHudIconsAfterStairwell();
    });

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
      duration: 650,
      ease: "Sine.Out",
      onComplete: () => {
        this.entryBlack.destroy();
      },
    });
  }

  hideHudIconsForStairwell() {
    if (this.scene.isActive("InventoryIconOverlay")) {
      this.scene.sleep("InventoryIconOverlay");
    }

    if (this.scene.isActive("KnowledgeLogOverlay")) {
      this.scene.sleep("KnowledgeLogOverlay");
    }
  }

  showHudIconsAfterStairwell() {
    if (this.scene.isSleeping("InventoryIconOverlay")) {
      this.scene.wake("InventoryIconOverlay");
    }

    if (this.scene.isSleeping("KnowledgeLogOverlay")) {
      this.scene.wake("KnowledgeLogOverlay");
    }
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

    this.stairs = this.add.image(
      main_width / 2,
      main_height / 2 + 10,
      "stairwell-stairs",
    );

    this.stairs.setOrigin(0.5);
    this.stairs.setDepth(1);

    const stairScale = 1260 / this.stairs.width;
    this.stairs.setScale(stairScale);
    // basiclaly the path th eplayer follows
    this.pathNodes = {
      start: {
        x: 1460,
        y: 700,
        label: "START",
      },

      pointA: {
        x: 940,
        y: 700,
        label: "POINT_A",
      },

      pointB: {
        x: 635,
        y: 505,
        label: "POINT_B",
      },

      pointC: {
        x: 120,
        y: 505,
        label: "POINT_C",
      },

      pointD: {
        x: 850,
        y: 290,
        label: "POINT_D",
      },

      pointE: {
        x: 1430,
        y: 290,
        label: "POINT_E",
      },
    };

    this.pathSegment = "START_TO_A";
    this.pathT = 0;

    this.reachedPointB = false;
    this.kimTrail = [];

    this.floorTwoDoor = this.add.image(1100, 290, "stairwell-door");

    this.floorTwoDoor.setOrigin(0.5, 1);

    this.floorTwoDoor.setDepth(8);

    this.floorTwoDoor.setScale(190 / this.floorTwoDoor.height);
    this.kim = this.add.image(
      this.pathNodes.start.x,
      this.pathNodes.start.y,
      "id-card-kim",
    );

    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(20);
    this.kim.setScale(230 / this.kim.height);

    this.meryl = this.add.image(
      this.floorTwoDoor.x + 145,
      this.pathNodes.pointD.y,
      "id-card-meryl",
    );

    this.meryl.setOrigin(0.5, 1);

    this.meryl.setDepth(19);
    this.meryl.setScale(230 / this.meryl.height);

    this.floorTwoEnterX = this.floorTwoDoor.x;
    this.floorTwoEnterY = this.floorTwoDoor.y;

    this.drawDebugStairPath();
  }

  createPauseButton() {
    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);
    this.pauseButton.setDepth(3100);

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

  createKeys() {
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (this.enteringFloorTwo) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.canMove) {
      this.moveCharacters(delta);
    }

    this.updateFloorTwoInteraction();
  }

  moveCharacters(delta) {
    const dt = delta / 1000;
    const pathSpeed = 0.85;

    let pathMove = 0;

    if (this.pathSegment === "START_TO_A") {
      if (this.aKey.isDown) {
        pathMove += 1;
      }

      if (this.dKey.isDown) {
        pathMove -= 1;
      }
    }

    if (this.pathSegment === "A_TO_B") {
      if (this.aKey.isDown) {
        pathMove += 1;
      }

      if (this.dKey.isDown) {
        pathMove -= 1;
      }
    }

    if (this.pathSegment === "B_IDLE") {
      if (this.aKey.isDown) {
        this.pathSegment = "B_TO_C";
        this.pathT = 0;
        pathMove = 1;
      } else if (this.dKey.isDown) {
        this.pathSegment = "B_TO_D";
        this.pathT = 0;
        pathMove = 1;
      }
    }

    if (this.pathSegment === "B_TO_C") {
      if (this.aKey.isDown) {
        pathMove += 1;
      }

      if (this.dKey.isDown) {
        pathMove -= 1;
      }
    }

    if (this.pathSegment === "B_TO_D") {
      if (this.dKey.isDown) {
        pathMove += 1;
      }

      if (this.aKey.isDown) {
        pathMove -= 1;
      }
    }

    if (this.pathSegment === "D_TO_E") {
      if (this.dKey.isDown) {
        pathMove += 1;
      }

      if (this.aKey.isDown) {
        pathMove -= 1;
      }
    }

    if (pathMove !== 0) {
      this.pathT += pathMove * pathSpeed * dt;
      this.handlePathSegmentEnds();
      this.updateKimPositionOnPath();
    }
  }


  getPointOnCurrentPathSegment() {
    const start = this.pathNodes[this.walkSegment];
    const end = this.pathNodes[this.walkSegment + 1];

    return {
      x: Phaser.Math.Linear(start.x, end.x, this.walkT),

      y: Phaser.Math.Linear(start.y, end.y, this.walkT),
    };
  }


  getPathEndsForCurrentSegment() {
    if (this.pathSegment === "START_TO_A") {
      return {
        start: this.pathNodes.start,
        end: this.pathNodes.pointA,
      };
    }

    if (this.pathSegment === "A_TO_B") {
      return {
        start: this.pathNodes.pointA,
        end: this.pathNodes.pointB,
      };
    }

    if (this.pathSegment === "B_TO_C") {
      return {
        start: this.pathNodes.pointB,
        end: this.pathNodes.pointC,
      };
    }

    if (this.pathSegment === "B_TO_D") {
      return {
        start: this.pathNodes.pointB,
        end: this.pathNodes.pointD,
      };
    }

    if (this.pathSegment === "D_TO_E") {
      return {
        start: this.pathNodes.pointD,
        end: this.pathNodes.pointE,
      };
    }

    return {
      start: this.pathNodes.pointB,
      end: this.pathNodes.pointB,
    };
  }

  handlePathSegmentEnds() {
    if (this.pathSegment === "START_TO_A") {
      if (this.pathT <= 0) {
        this.pathT = 0;
      }

      if (this.pathT >= 1) {
        this.pathSegment = "A_TO_B";
        this.pathT = 0;
      }

      return;
    }

    if (this.pathSegment === "A_TO_B") {
      if (this.pathT <= 0) {
        this.pathSegment = "START_TO_A";
        this.pathT = 1;
      }

      if (this.pathT >= 1) {
        this.pathSegment = "B_IDLE";
        this.pathT = 0;
        this.reachedPointB = true;
        this.kim.x = this.pathNodes.pointB.x;
        this.kim.y = this.pathNodes.pointB.y;
      }

      return;
    }

    if (this.pathSegment === "B_TO_C") {
      if (this.pathT <= 0) {
        this.pathSegment = "B_IDLE";
        this.pathT = 0;
        this.kim.x = this.pathNodes.pointB.x;
        this.kim.y = this.pathNodes.pointB.y;
      }

      if (this.pathT >= 1) {
        this.pathT = 1;
      }

      return;
    }

    if (this.pathSegment === "B_TO_D") {
      if (this.pathT <= 0) {
        this.pathSegment = "B_IDLE";
        this.pathT = 0;
        this.kim.x = this.pathNodes.pointB.x;
        this.kim.y = this.pathNodes.pointB.y;
      }

      if (this.pathT >= 1) {
        this.pathSegment = "D_TO_E";
        this.pathT = 0;
        this.kim.x = this.pathNodes.pointD.x;
        this.kim.y = this.pathNodes.pointD.y;
      }

      return;
    }

    if (this.pathSegment === "D_TO_E") {
      if (this.pathT <= 0) {
        this.pathSegment = "B_TO_D";
        this.pathT = 1;
        this.kim.x = this.pathNodes.pointD.x;
        this.kim.y = this.pathNodes.pointD.y;
      }

      if (this.pathT >= 1) {
        this.pathT = 1;
      }
    }
  }

  updateKimPositionOnPath() {
    if (this.pathSegment === "B_IDLE") {
      this.kim.x = this.pathNodes.pointB.x;
      this.kim.y = this.pathNodes.pointB.y;
      return;
    }

    const ends = this.getPathEndsForCurrentSegment();

    // how much along hte path you are on
    this.kim.x = Phaser.Math.Linear(ends.start.x, ends.end.x, this.pathT);

    this.kim.y = Phaser.Math.Linear(ends.start.y, ends.end.y, this.pathT);
  }

  updateFloorTwoInteraction() {
    if (this.pathSegment !== "D_TO_E") {
      this.hideInteractionPrompt();
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.floorTwoDoor.x,
      this.floorTwoDoor.y,
    );

    if (distance > 230) {
      this.hideInteractionPrompt();
      return;
    }

    const floorLabel = `Floor ${this.targetFloor}`;

    this.showInteractionPrompt(
      this.floorTwoDoor.x,
      this.floorTwoDoor.y - 120,
      "E TO ENTER",
      floorLabel,
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.enterFloorTwo();
    }
  }

  playFloorTitle(titleText) {
    return new Promise((resolve) => {
      const blackScreen = this.add.rectangle(
        0,
        0,
        main_width,
        main_height,
        0x000000,
        1,
      );

      blackScreen.setOrigin(0, 0);
      blackScreen.setDepth(999998);

      blackScreen.setAlpha(1);

      const title = this.add.text(main_width / 2, main_height / 2, titleText, {
        fontFamily: "DogicaBold",
        fontSize: "46px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      });

      title.setOrigin(0.5);

      title.setDepth(999999);
      title.setAlpha(0);

      this.tweens.add({
        targets: title,
        alpha: 1,
        duration: 750,
        ease: "Sine.Out",
        onComplete: () => {
          this.time.delayedCall(900, () => {
            this.tweens.add({
              targets: title,
              alpha: 0,
              duration: 650,
              ease: "Sine.In",
              onComplete: () => {
                title.destroy();
                resolve();
              },
            });
          });
        },

      });
    });
  }

  async enterFloorTwo() {
    if (!this.scene.manager.keys[this.nextScene]) {

      console.warn(`Scene ${this.nextScene} does not exist yet.`);
      this.canMove = true;
      return;
    }

    this.canMove = false;
    this.hideInteractionPrompt();
    await this.playFloorTitle(this.floorTitleText);

    await setCurrentChapterName(this.nextChapter);

    this.scene.start(this.nextScene);

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
