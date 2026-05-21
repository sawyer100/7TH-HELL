import Phaser, { Scene } from "phaser";
import { loadGameData, saveGameData } from "../db";
import { DialogueRunner } from "./DialogueRunner";

const main_width = 1600;
const main_height = 900;

export class Floor5StartHallway extends Scene {
  constructor() {
    super("Floor5StartHallway");
  }

  init(data) {
    this.returnedFromAlphaBattleWon = false;
    this.returnedFromAlphaLootPending = false;

    if (data) {
      if (data.alphaDefeated) {
        this.returnedFromAlphaBattleWon = true;
      }

      if (data.alphaLootPending) {
        this.returnedFromAlphaLootPending = true;
      }
    }
  }
  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.canMove = false;
    this.dialogueActive = false;
    this.alphaBattleStarted = false;
    this.alphaDefeated = false;
    this.enteringStairwell = false;

    if (this.returnedFromAlphaBattleWon) {
      this.alphaDefeated = true;
    }

    this.createWorld();
    this.createCinemaBorders();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createDialogueBox();
    this.createKeys();

    this.updateObjectiveHeader("Survive Floor 5");

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
      await this.saveFloor5StateToDb();
      await this.loadFloor5StateFromDb();

      if (!this.alphaDefeated) {
        this.showAlphaGroup();
      }

      this.tweens.add({
        targets: this.entryBlack,
        alpha: 0,
        duration: 900,
        ease: "Sine.Out",
        onComplete: () => {
          this.entryBlack.destroy();

          this.playPlayerEntrance(() => {
            if (this.alphaDefeated) {
              if (this.returnedFromAlphaLootPending) {
                if (!this.alphaLootCollected) {
                  this.playAlphaDeathDrops();
                  return;
                }
              }

              this.showEmptyHallwayAfterBoss();
              return;
            }

            this.startAlphaCutscene();
          });
        },
      });
    });
  }

  async playAlphaDeathDrops() {
    this.canMove = false;
    this.hideAlphaGroup();

    if (this.agroIcon) {
      this.agroIcon.setVisible(false);
    }

    const boom = this.add.image(
      this.alpha.x,
      this.alpha.y - 180,
      "zombie-explosion",
    );
    boom.setOrigin(0.5);
    boom.setDepth(200);
    boom.setScale(0.2);
    boom.setAlpha(0);

    this.tweens.add({
      targets: boom,
      alpha: 1,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 220,
      ease: "Back.Out",
      onComplete: () => {
        this.tweens.add({
          targets: boom,
          alpha: 0,
          scaleX: 2.2,
          scaleY: 2.2,
          duration: 180,
          ease: "Quad.In",
          onComplete: () => {
            boom.destroy();
          },
        });
      },
    });

    this.alphaDrops = [];
    this.alphaDropsCollected = 0;

    const possibleDrops = [
      "healing_potion",
      "bandage",
      "onigiri",
      "energy_bar",
      "energy_drink",
      "whistle",
    ];

    for (let i = 0; i < 5; i += 1) {
      const randomId =
        possibleDrops[Math.floor(Math.random() * possibleDrops.length)];

      const drop = this.add.image(
        this.alpha.x + Phaser.Math.Between(-120, 120),
        this.floorY - 60 + Phaser.Math.Between(-40, 30),
        this.getDropIconKey(randomId),
      );

      drop.setOrigin(0.5, 1);
      drop.setDepth(120);
      drop.setScale(82 / drop.height);

      this.alphaDrops.push({
        id: randomId,
        sprite: drop,
        collected: false,
      });
    }

    this.time.delayedCall(350, () => {
      this.canMove = true;
      this.updateObjectiveHeader("Collect the loot");
    });
  }
  getDropIconKey(itemId) {
    const map = {
      healing_potion: "item-healing-potion",
      bandage: "item-bandage",
      onigiri: "item-onigiri",
      energy_bar: "item-energy-bar",
      energy_drink: "item-energy-drink",
      whistle: "item-whistle",
      adrenaline_shot: "item-adrenaline-shot",
    };

    if (map[itemId]) {
      return map[itemId];
    }

    return "item-healing-potion";
  }
  createWorld() {
    this.bg = this.add.image(
      main_width / 2,
      main_height / 2,
      "floor-5-background",
    );

    this.bg.setOrigin(0.5);
    this.bg.setDepth(1);

    const scaleX = main_width / this.bg.width;
    const scaleY = main_height / this.bg.height;

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
    this.kim.setDepth(40);
    this.kim.setScale(300 / this.kim.height);
    this.kim.setAlpha(0);

    this.meryl = this.add.image(-320, this.floorY, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);
    this.meryl.setScale(300 / this.meryl.height);
    this.meryl.setAlpha(0);

    this.alphaRunner = this.add.image(
      main_width / 2 + 310,
      this.floorY,
      "knowledge-runner-left",
    );

    this.alphaRunner.setOrigin(0.5, 1);
    this.alphaRunner.setDepth(24);
    this.alphaRunner.setScale(300 / this.alphaRunner.height);
    this.alphaRunner.setVisible(false);

    this.alpha = this.add.image(
      main_width / 2 + 450,
      this.floorY,
      "alpha-front",
    );

    this.alpha.setOrigin(0.5, 1);
    this.alpha.setDepth(25);

    // Feet stay on the floor. Body stretches upward to the bottom of top cinema border.
    this.alpha.displayHeight = this.floorY - 120;
    this.alpha.scaleX = this.alpha.scaleY;
    this.alpha.setVisible(false);

    this.alphaWalker = this.add.image(
      main_width / 2 + 500,
      this.floorY,
      "knowledge-walker-left",
    );

    this.alphaWalker.setOrigin(0.5, 1);
    this.alphaWalker.setDepth(24);
    this.alphaWalker.setScale(300 / this.alphaWalker.height);
    this.alphaWalker.setVisible(false);

    this.agroIcon = this.add.image(
      this.alpha.x,
      this.alpha.y - this.alpha.displayHeight - 45,
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
    this.updateAlphaDropInteraction();
    this.updateStairwellInteraction();
  }
  updateAlphaDropInteraction() {
    if (!this.alphaDrops) {
      return;
    }

    let nearDrop = null;

    this.alphaDrops.forEach((drop) => {
      if (drop.collected) {
        return;
      }

      const d = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        drop.sprite.x,
        drop.sprite.y,
      );

      if (d < 120) {
        nearDrop = drop;
      }
    });

    if (!nearDrop) {
      return;
    }

    this.showInteractionPrompt(
      nearDrop.sprite.x,
      nearDrop.sprite.y - 110,
      "E TO PICK UP",
      "Loot",
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.collectAlphaDrop(nearDrop);
    }
  }
  async collectAlphaDrop(drop) {
    if (!drop) {
      return;
    }

    if (drop.collected) {
      return;
    }

    drop.collected = true;

    const targetX = main_width - 86;
    const targetY = 70;

    this.tweens.add({
      targets: drop.sprite,
      x: targetX,
      y: targetY,
      alpha: 0,
      scaleX: 0.2,
      scaleY: 0.2,
      duration: 380,
      ease: "Cubic.In",
      onComplete: async () => {
        drop.sprite.destroy();

        const data = await loadGameData();

        if (!data.inventory) {
          data.inventory = {};
        }

        if (!Array.isArray(data.inventory.consumables)) {
          data.inventory.consumables = [];
        }

        let found = null;

        data.inventory.consumables.forEach((entry) => {
          if (entry) {
            if (entry.id === drop.id) {
              found = entry;
            }
          }
        });

        if (found) {
          found.qty = Number(found.qty || 0) + 1;
        } else {
          data.inventory.consumables.push({
            id: drop.id,
            qty: 1,
          });
        }

        await saveGameData(data);

        this.alphaDropsCollected += 1;

        if (this.alphaDropsCollected >= this.alphaDrops.length) {
          this.alphaLootCollected = true;
          await this.saveFloor5StateToDb();
          this.showEmptyHallwayAfterBoss();
        }
      },
    });
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

  async loadFloor5StateFromDb() {
    const data = await loadGameData();

    if (!data.floor5) {
      return;
    }

    if (data.floor5.alphaDefeated) {
      this.alphaDefeated = true;
    }

    if (data.floor5.alphaLootCollected) {
      this.alphaLootCollected = true;
    } else {
      this.alphaLootCollected = false;
    }
  }

  async saveFloor5StateToDb() {
    const data = await loadGameData();

    if (!data.currentStoryState) {
      data.currentStoryState = {};
    }

    data.currentStoryState.chapterName = "floor5-boss";
    data.currentStoryState.chapterObjective = null;
    data.currentStoryState.checkPoint = null;

    if (!data.floor5) {
      data.floor5 = {};
    }

    if (this.returnedFromAlphaBattleWon) {
      data.floor5.alphaDefeated = true;
    }

    if (this.alphaDefeated) {
      data.floor5.alphaDefeated = true;
    }

    if (this.alphaLootCollected) {
      data.floor5.alphaLootCollected = true;
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

  showAlphaGroup() {
    if (this.alpha) {
      this.alpha.setVisible(true);
    }

    if (this.alphaRunner) {
      this.alphaRunner.setVisible(true);
    }

    if (this.alphaWalker) {
      this.alphaWalker.setVisible(true);
    }
  }

  hideAlphaGroup() {
    if (this.alpha) {
      this.alpha.setVisible(false);
    }

    if (this.alphaRunner) {
      this.alphaRunner.setVisible(false);
    }

    if (this.alphaWalker) {
      this.alphaWalker.setVisible(false);
    }
  }

  startAlphaCutscene() {
    if (this.alphaDefeated) {
      this.showEmptyHallwayAfterBoss();
      return;
    }

    this.canMove = false;
    this.showAlphaGroup();

    const dialogueData = this.cache.json.get("dialogue-floor5-alpha");

    if (!dialogueData) {
      this.playAlphaAlertAndStartBattle();
      return;
    }

    this.startDialogue(dialogueData.lines, () => {
      this.hideDialogueUI();
      this.playAlphaAlertAndStartBattle();
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
        id: "floor5-alpha-runtime-dialogue",
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

  playAlphaAlertAndStartBattle() {
    this.agroIcon.setVisible(true);
    this.agroIcon.setAlpha(0);
    this.agroIcon.y = this.alpha.y - this.alpha.displayHeight - 45;

    this.tweens.add({
      targets: this.agroIcon,
      alpha: 1,
      y: this.agroIcon.y - 18,
      duration: 180,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(700, () => {
          this.startAlphaBattle();
        });
      },
    });
  }

  async saveAlphaEncountered() {
    const data = await loadGameData();

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    const enemiesToSave = ["alpha", "runner", "walker"];

    enemiesToSave.forEach((enemyId) => {
      if (!data.encounteredEnemies.includes(enemyId)) {
        data.encounteredEnemies.push(enemyId);
      }
    });

    await saveGameData(data);
  }

  async startAlphaBattle() {
    if (this.alphaBattleStarted) {
      return;
    }

    this.alphaBattleStarted = true;
    this.canMove = false;

    await this.saveAlphaEncountered();

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
      area: "floor5",
      chapterName: "floor5-boss",
      enemies: [
        {
          id: "alpha",
          count: 1,
        },
        {
          id: "runner",
          count: 1,
        },
        {
          id: "walker",
          count: 1,
        },
      ],

      battleReturnScene: "Floor5StartHallway",
      battleReturnData: {
        alphaDefeated: true,
        alphaLootPending: true,
      },

      battleLoseScene: "Floor5StartHallway",
      battleLoseData: {},
    });
  }

  showEmptyHallwayAfterBoss() {
    this.alphaDefeated = true;
    this.canMove = true;
    this.updateObjectiveHeader("Find the stairs");
    this.hideAlphaGroup();

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
      targetFloor: 6,
      nextScene: "Floor6StartHallway",
      nextChapter: "floor6-starthallway",
      floorTitleText: "FLOOR 6",
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
