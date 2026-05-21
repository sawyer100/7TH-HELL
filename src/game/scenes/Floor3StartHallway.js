import Phaser, { Scene } from "phaser";
import { loadGameData, saveGameData } from "../db";
import { DialogueRunner } from "./DialogueRunner";

const main_width = 1600;
const main_height = 900;

export class Floor3StartHallway extends Scene {
  constructor() {
    super("Floor3StartHallway");
  }

  init(data) {
    this.returnedFromDombisBattleWon = false;

    if (data) {
      if (data.dombisDefeated) {
        this.returnedFromDombisBattleWon = true;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.canMove = false;
    this.dialogueActive = false;
    this.dombisBattleStarted = false;
    this.dombisDefeated = false;
    this.enteringStairwell = false;

    if (this.returnedFromDombisBattleWon) {
      this.dombisDefeated = true;
    }

    this.createWorld();
    this.createCinemaBorders();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createDialogueBox();
    this.createKeys();

    this.updateObjectiveHeader("Survive Floor 3");

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.game.canvas.style.cursor = "default";

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
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

    this.time.delayedCall(3000, async () => {
      await this.saveFloor3StateToDb();
      await this.loadFloor3StateFromDb();

      if (!this.dombisDefeated) {
        this.dombis.setVisible(true);
      }

      this.tweens.add({
        targets: this.entryBlack,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out",
        onComplete: () => {
          this.entryBlack.destroy();

          this.playPlayerEntrance(() => {
            if (this.dombisDefeated) {
              this.showEmptyHallwayAfterBoss();
              return;
            }

            this.startDombisCutscene();
          });
        },
      });
    });
  }

  createWorld() {
    this.bg = this.add.image(
      main_width / 2,
      main_height / 2,
      "floor-3-background",
    );

    this.bg.setOrigin(0.5);
    this.bg.setDepth(1);

    const scaleX = main_width / this.bg.width;
    const scaleY = main_height / this.bg.height - 200;

    let bgScale = scaleX;

    if (scaleY > scaleX) {
      bgScale = scaleY;
    }

    this.bg.setScale(bgScale);

    this.floorY = 770;

    this.kimStartX = 240;
    this.merylStartX = 95;

    this.kim = this.add.image(-170, this.floorY, "id-card-kim");
    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(30);
    this.kim.setScale(300 / this.kim.height);
    this.kim.setAlpha(0);

    this.meryl = this.add.image(-320, this.floorY, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(29);
    this.meryl.setScale(300 / this.meryl.height);
    this.meryl.setAlpha(0);

    this.dombis = this.add.image(
      main_width / 2 + 120,
      this.floorY,
      "knowledge-dombis-front",
    );

    this.dombis.setOrigin(0.5, 1);
    this.dombis.setDepth(25);
    this.dombis.setScale(480 / this.dombis.height);
    this.dombis.setVisible(false);

    this.agroIcon = this.add.image(
      this.dombis.x,
      this.dombis.y - this.dombis.displayHeight - 45,
      "agro-icon",
    );

    this.agroIcon.setOrigin(0.5);
    this.agroIcon.setDepth(3100);
    this.agroIcon.setScale(95 / this.agroIcon.height);
    this.agroIcon.setAlpha(0);
    this.agroIcon.setVisible(false);

    this.stairwellX = main_width - 130;
    this.stairwellY = this.floorY;

    this.stairwellZone = this.add.rectangle(
      this.stairwellX,
      this.stairwellY - 90,
      150,
      240,
      0x00ff00,
      0,
    );

    this.stairwellZone.setOrigin(0.5);
    this.stairwellZone.setDepth(5);
    this.stairwellZone.setVisible(false);
  }

  createCinemaBorders() {
    const topH = 120;
    const bottomH = 120;

    this.topBorder = this.add.rectangle(0, 0, main_width, topH, 0x000000, 1);
    this.topBorder.setOrigin(0, 0);
    this.topBorder.setDepth(2500);

    this.bottomBorder = this.add.rectangle(
      0,
      main_height,
      main_width,
      bottomH,
      0x000000,
      1,
    );

    this.bottomBorder.setOrigin(0, 1);
    this.bottomBorder.setDepth(2500);
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

  createDialogueBox() {
    this.dialogueBox = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialogueBox.setOrigin(0.5, 1);
    this.dialogueBox.setDepth(3000);
    this.dialogueBox.setScale(1470 / this.dialogueBox.width);
    this.dialogueBox.setVisible(false);
  }

  createKeys() {
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (this.dialogueActive) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.enteringStairwell) {
      this.hideInteractionPrompt();
      return;
    }

    if (!this.canMove) {
      this.hideInteractionPrompt();
      return;
    }

    this.moveCharacters(delta);
    this.updateStairwellInteraction();
  }

  moveCharacters(delta) {
    const speed = 360;
    const dt = delta / 1000;

    let dx = 0;

    if (this.aKey.isDown) {
      dx -= 1;
    }

    if (this.dKey.isDown) {
      dx += 1;
    }

    this.kim.x += dx * speed * dt;
    this.kim.x = Phaser.Math.Clamp(this.kim.x, 90, main_width - 90);
    this.kim.y = this.floorY;

    this.meryl.x = Phaser.Math.Linear(this.meryl.x, this.kim.x - 145, dt * 4);
    this.meryl.y = this.floorY;
  }

  async loadFloor3StateFromDb() {
    const data = await loadGameData();

    if (!data.floor3) {
      return;
    }

    if (data.floor3.dombisDefeated) {
      this.dombisDefeated = true;
    }
  }

  async saveFloor3StateToDb() {
    const data = await loadGameData();

    if (!data.currentStoryState) {
      data.currentStoryState = {};
    }

    data.currentStoryState.chapterName = "floor3-starthallway";
    data.currentStoryState.chapterObjective = null;
    data.currentStoryState.checkPoint = null;

    if (!data.floor3) {
      data.floor3 = {};
    }

    if (this.returnedFromDombisBattleWon) {
      data.floor3.dombisDefeated = true;
    }

    if (this.dombisDefeated) {
      data.floor3.dombisDefeated = true;
    }

    await saveGameData(data);
  }

  playPlayerEntrance(onComplete) {
    this.canMove = false;

    this.kim.x = -170;
    this.kim.y = this.floorY;
    this.kim.setAlpha(0);

    this.meryl.x = -320;
    this.meryl.y = this.floorY;
    this.meryl.setAlpha(0);

    this.tweens.add({
      targets: this.meryl,
      x: this.merylStartX,
      alpha: 1,
      duration: 950,
      ease: "Sine.Out",
    });

    this.tweens.add({
      targets: this.kim,
      x: this.kimStartX,
      alpha: 1,
      duration: 950,
      ease: "Sine.Out",
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  startDombisCutscene() {
    if (this.dombisDefeated) {
      this.showEmptyHallwayAfterBoss();
      return;
    }

    this.canMove = false;
    this.dombis.setVisible(true);

    const dialogueData = this.cache.json.get("dialogue-floor3-dombis");

    if (!dialogueData) {
      this.playDombisAlertAndStartBattle();
      return;
    }

    this.startDialogue(dialogueData.lines, () => {
      this.hideDialogueUI();
      this.playDombisAlertAndStartBattle();
    });
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
        id: "floor3-dombis-runtime-dialogue",
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

  playDombisAlertAndStartBattle() {
    this.agroIcon.setVisible(true);

    this.tweens.add({
      targets: this.agroIcon,
      alpha: 1,
      y: this.agroIcon.y - 18,
      duration: 180,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(700, () => {
          this.startDombisBattle();
        });
      },
    });
  }

  async saveDombisEncountered() {
    const data = await loadGameData();

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    if (!data.encounteredEnemies.includes("dombis")) {
      data.encounteredEnemies.push("dombis");
    }

    await saveGameData(data);
  }

  async startDombisBattle() {
    if (this.dombisBattleStarted) {
      return;
    }

    this.dombisBattleStarted = true;
    this.canMove = false;

    await this.saveDombisEncountered();

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
        duration: 550,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    this.scene.start("FightScene", {
      area: "floor3",
      chapterName: "floor3-starthallway",
      enemies: [
        {
          id: "dombis",
          count: 1,
        },
      ],

      battleReturnScene: "Floor3StartHallway",
      battleReturnData: {
        dombisDefeated: true,
      },

      battleLoseScene: "Floor3StartHallway",
      battleLoseData: {},
    });
  }

  showEmptyHallwayAfterBoss() {
    this.dombisDefeated = true;
    this.canMove = true;
    this.updateObjectiveHeader("Find the stairs");

    if (this.dombis) {
      this.dombis.setVisible(false);
    }

    if (this.agroIcon) {
      this.agroIcon.setVisible(false);
    }
  }

  updateStairwellInteraction() {
    const distance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.stairwellX,
      this.stairwellY,
    );

    if (distance > 160) {
      this.hideInteractionPrompt();
      return;
    }

    this.showInteractionPrompt(
      this.stairwellX,
      this.stairwellY - 180,
      "E TO ENTER",
      "Stairwell",
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.enterNextStairwell();
    }
  }

  async enterNextStairwell() {
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
    blackScreen.setDepth(999999);
    blackScreen.setAlpha(0);

    await new Promise((resolve) => {
      this.tweens.add({
        targets: blackScreen,
        alpha: 1,
        duration: 500,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    this.scene.start("Stairwell", {
      targetFloor: 4,
      nextScene: "Floor4StartHallway",
      nextChapter: "floor4-starthallway",
      floorTitleText: "FLOOR 4",
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
