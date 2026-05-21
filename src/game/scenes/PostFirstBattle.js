import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import { loadGameData, saveGameData } from "../db";
import { battleConsumables, battleWeapons } from "../battle_item_data";

const main_width = 1600;
const main_height = 900;
const hallway_segments = 3;
const world_width = main_width * hallway_segments;

export class PostFirstBattle extends Scene {
  constructor() {
    super("PostFirstBattle");
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.ready = false;
    this.canMove = false;
    this.dialogueActive = false;
    this.collectingLoot = false;
    this.enteringDoor = false;
    this.schoolAlarmStarted = false;
    this.schoolAlarmTweens = [];
    this.lootObjects = [];
    this.activePromptTarget = null;
    this.doorDialogueStarted = false;
    this.doorDialogueDone = false;
    this.allLootCollected = false;

    this.cameras.main.setBounds(0, 0, world_width, main_height);
    this.cameras.main.scrollX = 0;

    this.createWorld();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createDialogueBox();
    this.startSchoolAlarm();
    this.createCinemaBorders();
    this.createKeys();

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.game.canvas.style.cursor = "default";
      this.stopAlarmTweens();

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });

    this.bootScene();
  }

  async bootScene() {
    await this.ensurePostBattleSaveState();
    await this.prepareLootDrops();

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

    await this.tweenPromise({
      targets: this.entryBlack,
      alpha: 0,
      duration: 800,
      ease: "Sine.Out",
    });

    this.entryBlack.destroy();

    await this.showKnowledgeUnlockedIfNeeded();

    if (this.allLootCollected) {
      if (this.zombie) {
        this.zombie.setVisible(false);
      }

      const dialogueData = this.getPostFirstBattleDialogue();

      this.startDialogue(
        this.makeDialogueFromLines(
          "post-first-battle-all-loot-collected-dialogue",
          dialogueData.allLootCollectedLines,
        ),
        () => {
          this.hideDialogueUI();
          this.ready = true;
          this.canMove = true;
          this.updateObjectiveHeader("Move down the hallway");
        },
      );

      return;
    }

    if (this.zombie) {
      this.zombie.setVisible(true);
      this.zombie.setAlpha(1);
    }

    await this.wait(3000);
    await this.explodeZombieAndSpawnLoot();

    const dialogueData = this.getPostFirstBattleDialogue();

    this.startDialogue(
      this.makeDialogueFromLines(
        "post-first-battle-loot-dialogue",
        dialogueData.lines,
      ),
      () => {
        this.hideDialogueUI();
        this.ready = true;
        this.canMove = true;
        this.updateObjectiveHeader("Collect the loot");
      },
    );
  }

  wait(ms) {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  tweenPromise(config) {
    return new Promise((resolve) => {
      this.tweens.add({
        ...config,
        onComplete: (...args) => {
          if (config.onComplete) {
            config.onComplete(...args);
          }

          resolve();
        },
      });
    });
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
    const third = this.segmentInfo[2];

    this.floorY = first.floorY;

    this.kim = this.add.image(first.left + 585, this.floorY + 8, "id-card-kim");
    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(40);
    this.kim.setScale(335 / this.kim.height);

    this.meryl = this.add.image(
      first.left + 755,
      this.floorY + 8,
      "id-card-meryl",
    );
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);
    this.meryl.setScale(335 / this.meryl.height);

    this.zombie = this.add.image(
      first.left + 1230,
      this.floorY + 8,
      "knowledge-walker-left",
    );
    this.zombie.setOrigin(0.5, 1);
    this.zombie.setDepth(38);
    this.zombie.setScale(360 / this.zombie.height);
    this.zombie.setTint(0x88ff88);
    this.zombie.setVisible(false);
    this.doorWalkX = third.left + 1225;
    this.doorWalkY = third.floorY + 8;

    this.door = this.add.image(
      this.doorWalkX,
      third.background.y + 70,
      "id-card-full-door",
    );
    this.door.setOrigin(0.5, 0);
    this.door.setDepth(18);
    this.door.setScale((main_width / third.background.width) * 1.037);
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

    let lockerX = left + 965;

    if (index === 2) {
      lockerX = left + 850;
    }

    const locker = this.add.image(lockerX, floorY + 8, "id-card-locker");
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
    const topBorderH = 150;
    const bottomBorderH = 92;
    const borderDepth = 2400;

    if (this.topCinemaBorder) {
      this.topCinemaBorder.destroy();
    }

    if (this.bottomCinemaBorder) {
      this.bottomCinemaBorder.destroy();
    }

    this.topCinemaBorder = this.add.rectangle(
      0,
      0,
      main_width,
      topBorderH,
      0x000000,
      1,
    );

    this.topCinemaBorder.setOrigin(0, 0);
    this.topCinemaBorder.setDepth(borderDepth);
    this.topCinemaBorder.setScrollFactor(0);

    this.bottomCinemaBorder = this.add.rectangle(
      0,
      main_height - bottomBorderH,
      main_width,
      bottomBorderH,
      0x000000,
      1,
    );

    this.bottomCinemaBorder.setOrigin(0, 0);
    this.bottomCinemaBorder.setDepth(borderDepth);
    this.bottomCinemaBorder.setScrollFactor(0);
  }

  createPauseButton() {
    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);
    this.pauseButton.setDepth(3100);
    this.pauseButton.setScrollFactor(0);

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

  async ensurePostBattleSaveState() {
    let data = null;

    try {
      data = await loadGameData();
    } catch (error) {
      data = {};
    }

    if (!data.currentStoryState) {
      data.currentStoryState = {};
    }

    data.currentStoryState.chapterName = "post-first-battle";
    data.currentStoryState.chapterObjective = null;
    data.currentStoryState.checkPoint = "post-first-battle";

    data.firstBattleWon = true;
    data.knowledgeLogUnlocked = true;
    data.inventoryUnlocked = true;

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    if (!data.encounteredEnemies.includes("walker")) {
      data.encounteredEnemies.push("walker");
    }

    await saveGameData(data);
    this.gameData = data;
  }

  async prepareLootDrops() {
    let data = null;

    try {
      data = await loadGameData();
    } catch (error) {
      data = this.gameData || {};
    }

    this.gameData = data;

    if (data.firstBattleLootCollected) {
      this.allLootCollected = true;
      this.pendingLootDrops = [];
      return;
    }

    if (!Array.isArray(data.firstBattleLootDrops)) {
      data.firstBattleLootDrops = this.generateFirstBattleLootDrops();
      data.firstBattleLootCollected = false;
      await saveGameData(data);
    }

    this.pendingLootDrops = data.firstBattleLootDrops;
    this.allLootCollected = this.pendingLootDrops.every(
      (drop) => drop.collected,
    );
  }

  generateFirstBattleLootDrops() {
    const drops = [
      {
        type: "weapon",
        id: "baton",
        qty: 1,
        collected: false,
      },
      {
        type: "consumable",
        id: "adrenaline_shot",
        qty: 1,
        collected: false,
      },
    ];

    const consumableIds = Object.keys(battleConsumables).filter((id) => {
      return id !== "adrenaline_shot";
    });

    let whistleChosen = false;

    for (let i = 0; i < 5; i += 1) {
      const pool = consumableIds.filter((id) => {
        if (id === "whistle") {
          return !whistleChosen;
        }

        return true;
      });

      const chosenId = pool[Phaser.Math.Between(0, pool.length - 1)];

      if (chosenId === "whistle") {
        whistleChosen = true;
      }

      drops.push({
        type: "consumable",
        id: chosenId,
        qty: 1,
        collected: false,
      });
    }

    return drops.map((drop, index) => {
      return {
        ...drop,
        dropId: `first-battle-drop-${index}`,
      };
    });
  }

  getLootDefinition(drop) {
    if (drop.type === "weapon") {
      return battleWeapons[drop.id];
    }

    if (drop.type === "consumable") {
      return battleConsumables[drop.id];
    }

    return null;
  }

  async showKnowledgeUnlockedIfNeeded() {
    let data = null;

    try {
      data = await loadGameData();
    } catch (error) {
      data = this.gameData || {};
    }

    if (data.knowledgeUnlockPopupSeen) {
      return;
    }

    await this.showKnowledgeUnlocked();

    data.knowledgeUnlockPopupSeen = true;
    data.knowledgeLogUnlocked = true;

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    if (!data.encounteredEnemies.includes("walker")) {
      data.encounteredEnemies.push("walker");
    }

    await saveGameData(data);
    this.gameData = data;
  }

  showKnowledgeUnlocked() {
    return new Promise((resolve) => {
      const blocker = this.add.rectangle(
        0,
        0,
        main_width,
        main_height,
        0x000000,
        1,
      );

      blocker.setOrigin(0, 0);
      blocker.setDepth(9990);
      blocker.setScrollFactor(0);
      blocker.setAlpha(0);

      const unlocked = this.add.image(
        main_width / 2,
        main_height / 2,
        "knowledge-unlocked",
      );

      unlocked.setOrigin(0.5);
      unlocked.setDepth(9991);
      unlocked.setScrollFactor(0);
      unlocked.setAlpha(0);

      const unlockedScale = 760 / unlocked.height;
      unlocked.setScale(unlockedScale);

      this.tweens.add({
        targets: blocker,
        alpha: 0.55,
        duration: 180,
        ease: "Cubic.Out",
      });

      this.tweens.add({
        targets: unlocked,
        alpha: 1,
        duration: 220,
        ease: "Cubic.Out",
        onComplete: () => {
          this.time.delayedCall(1600, () => {
            this.tweens.add({
              targets: [blocker, unlocked],
              alpha: 0,
              duration: 240,
              ease: "Cubic.In",
              onComplete: () => {
                blocker.destroy();
                unlocked.destroy();
                resolve();
              },
            });
          });
        },
      });
    });
  }

  async explodeZombieAndSpawnLoot() {
    if (!this.zombie) {
      return;
    }

    this.zombie.setVisible(true);
    this.zombie.setAlpha(1);

    const startX = this.zombie.x;
    const startY = this.zombie.y - this.zombie.displayHeight * 0.55;

    this.zombie.clearTint();
    this.zombie.setTintFill(0xffffff);

    this.cameras.main.shake(260, 0.006);

    await this.tweenPromise({
      targets: this.zombie,
      scaleX: this.zombie.scaleX * 1.65,
      scaleY: this.zombie.scaleY * 1.65,
      alpha: 0,
      duration: 260,
      ease: "Back.In",
    });

    this.zombie.setVisible(false);

    const flash = this.add.circle(startX, startY, 28, 0xffffff, 1);
    flash.setDepth(90);
    flash.setBlendMode(Phaser.BlendModes.SCREEN);

    this.tweens.add({
      targets: flash,
      radius: 180,
      alpha: 0,
      duration: 260,
      ease: "Cubic.Out",
      onComplete: () => flash.destroy(),
    });

    this.pendingLootDrops.forEach((drop, index) => {
      if (drop.collected) {
        return;
      }

      this.spawnLootObject(drop, index, startX, startY);
    });

    await this.wait(850);
  }

  spawnLootObject(drop, index, startX, startY) {
    const definition = this.getLootDefinition(drop);

    if (!definition) {
      return;
    }

    if (!definition.icon) {
      return;
    }

    // idk bette srpead postinoining
    const dropOffsets = [-390, -260, -130, 0, 130, 260, 390];

    let offsetX = 0;

    if (dropOffsets[index] !== undefined) {
      offsetX = dropOffsets[index];
    } else {
      offsetX = Phaser.Math.Between(-420, 420);
    }

    const randomJitter = Phaser.Math.Between(-35, 35);

    const targetX = Phaser.Math.Clamp(
      startX + offsetX + randomJitter,
      145,
      main_width - 145,
    );

    const targetY = this.floorY - Phaser.Math.Between(25, 75);

    const icon = this.add.image(startX, startY, definition.icon);
    icon.setOrigin(0.5);

    icon.setDepth(1700 + index);

    icon.setScale(0.18);
    icon.setAngle(Phaser.Math.Between(-25, 25));

    const targetScale = 55 / icon.height;

    const loot = {
      drop,
      sprite: icon,
      name: definition.name || drop.id,
      collected: false,
    };

    this.lootObjects.push(loot);

    this.tweens.add({
      targets: icon,
      x: targetX,
      y: targetY,
      scaleX: targetScale,
      scaleY: targetScale,
      angle: Phaser.Math.Between(-12, 12),
      duration: Phaser.Math.Between(620, 820),
      ease: "Cubic.Out",
      onComplete: () => {
        this.tweens.add({
          targets: icon,
          y: targetY - 34,
          duration: 170,
          yoyo: true,
          repeat: 2,
          ease: "Sine.Out",
        });
      },
    });
  }
  getPostFirstBattleDialogue() {
    return this.cache.json.get("dialogue-post-first-battle");
  }

  makeDialogueFromLines(id, lines) {
    return {
      id,
      lines,
    };
  }
  startDialogue(dialogueData, onDone) {
    if (this.dialogue) {
      this.dialogue.destroy();
      this.dialogue = null;
    }

    this.dialogueActive = true;
    this.canMove = false;
    this.dialogueBox.setVisible(true);
    this.dialogueBox.setAlpha(1);

    this.dialogue = new DialogueRunner(this, {
      data: dialogueData,
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

  update(time, delta) {
    if (!this.ready) {
      return;
    }

    if (this.dialogueActive || this.collectingLoot || this.enteringDoor) {
      this.hideInteractionPrompt();
      this.updateCamera(delta);
      return;
    }

    if (this.canMove) {
      this.moveCharacters(delta);
    }

    this.updateCamera(delta);
    this.updateDoorDialogueTrigger();
    this.updateNearestInteraction();
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
    let maxX = main_width - 120;

    if (this.allLootCollected) {
      maxX = this.doorWalkX + 230;
    }

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

  updateNearestInteraction() {
    this.activePromptTarget = null;

    if (!this.allLootCollected) {
      this.updateLootInteraction();
      return;
    }

    this.updateDoorInteraction();
  }

  updateLootInteraction() {
    let nearest = null;
    let nearestDistance = Infinity;

    this.lootObjects.forEach((loot) => {
      if (loot.collected) {
        return;
      }

      if (!loot.sprite) {
        return;
      }

      if (!loot.sprite.active) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        loot.sprite.x,
        loot.sprite.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = loot;
      }
    });

    if (!nearest || nearestDistance > 135) {
      this.hideInteractionPrompt();
      return;
    }

    this.activePromptTarget = nearest;
    this.showInteractionPrompt(
      nearest.sprite.x,
      nearest.sprite.y - 105,
      "E TO PICK UP",
      nearest.name,
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.collectLoot(nearest);
    }
  }

  updateDoorInteraction() {
    const distance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.doorWalkX,
      this.doorWalkY,
    );

    if (distance > 175 || !this.doorDialogueDone) {
      this.hideInteractionPrompt();
      return;
    }

    this.showInteractionPrompt(
      this.doorWalkX,
      this.doorWalkY - 360,
      "E TO ENTER",
      "Classroom Door",
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.enterDoor();
    }
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

    if (label) {
      this.interactPromptNameText.setText(label);
    } else {
      this.interactPromptNameText.setText("");
    }

    this.interactPromptRoot.setVisible(true);
  }

  hideInteractionPrompt() {
    if (this.interactPromptRoot) {
      this.interactPromptRoot.setVisible(false);
    }
  }

  async collectLoot(loot) {
    if (this.collectingLoot) {
      return;
    }

    if (!loot || loot.collected) {
      return;
    }

    this.collectingLoot = true;
    this.hideInteractionPrompt();
    loot.collected = true;
    loot.drop.collected = true;

    const sprite = loot.sprite;
    sprite.setDepth(5000);

    const targetX = this.cameras.main.scrollX + main_width - 86;
    const targetY = 70;

    await this.tweenPromise({
      targets: sprite,
      x: targetX,
      y: targetY,
      scaleX: 0.08,
      scaleY: 0.08,
      alpha: 0,
      duration: 420,
      ease: "Cubic.InOut",
    });

    sprite.destroy();
    await this.saveCollectedLoot(loot.drop);

    this.allLootCollected = this.lootObjects.every((item) => item.collected);

    if (this.allLootCollected) {
      this.updateObjectiveHeader("Move down the hallway");
    }

    this.collectingLoot = false;
  }

  async saveCollectedLoot(drop) {
    let data = null;

    try {
      data = await loadGameData();
    } catch (error) {
      data = this.gameData || {};
    }

    if (!data.inventory) {
      data.inventory = {};
    }

    if (!Array.isArray(data.inventory.weapons)) {
      data.inventory.weapons = [];
    }

    if (!Array.isArray(data.inventory.armor)) {
      data.inventory.armor = [];
    }

    if (!Array.isArray(data.inventory.consumables)) {
      data.inventory.consumables = [];
    }

    if (!data.inventory.equippedByCharacter) {
      data.inventory.equippedByCharacter = {};
    }

    if (drop.type === "weapon") {
      if (!data.inventory.weapons.includes(drop.id)) {
        data.inventory.weapons.push(drop.id);
      }
    }

    if (drop.type === "consumable") {
      let found = null;

      data.inventory.consumables.forEach((entry) => {
        if (entry && entry.id === drop.id) {
          found = entry;
        }
      });

      if (found) {
        found.qty = Number(found.qty || 0) + Number(drop.qty || 1);
      } else {
        data.inventory.consumables.push({
          id: drop.id,
          qty: Number(drop.qty || 1),
        });
      }
    }

    if (Array.isArray(data.firstBattleLootDrops)) {
      data.firstBattleLootDrops.forEach((savedDrop) => {
        if (savedDrop.dropId === drop.dropId) {
          savedDrop.collected = true;
        }
      });

      data.firstBattleLootCollected = data.firstBattleLootDrops.every(
        (savedDrop) => {
          return savedDrop.collected;
        },
      );
    }

    await saveGameData(data);
    this.gameData = data;
  }

  updateDoorDialogueTrigger() {
    if (!this.allLootCollected) {
      return;
    }

    if (this.doorDialogueStarted) {
      return;
    }

    if (this.kim.x < main_width * 2 + 130) {
      return;
    }

    this.doorDialogueStarted = true;

    const dialogueData = this.getPostFirstBattleDialogue();

    this.startDialogue(
      this.makeDialogueFromLines(
        "post-first-battle-door-dialogue",
        dialogueData.doorLines,
      ),
      () => {
        this.hideDialogueUI();
        this.canMove = true;
        this.doorDialogueDone = true;
        this.updateObjectiveHeader("Enter the classroom");
      },
    );
  }

  async enterDoor() {
    if (this.enteringDoor) {
      return;
    }

    this.enteringDoor = true;
    this.canMove = false;
    this.hideInteractionPrompt();
    this.input.setDefaultCursor("default");

    await new Promise((resolve) => {
      const openDoor = () => {
        if (this.doorOpened) {
          return;
        }

        this.doorOpened = true;
        this.door.setTexture("id-card-door-open");
      };

      this.tweens.add({
        targets: this.kim,
        x: this.doorWalkX - 25,
        y: this.doorWalkY,
        duration: 520,
        ease: "Sine.InOut",
        onComplete: () => {
          openDoor();

          this.tweens.add({
            targets: this.kim,
            x: this.doorWalkX - 5,
            alpha: 0,
            duration: 260,
            ease: "Cubic.In",
            onComplete: () => {
              this.kim.setVisible(false);

              this.tweens.add({
                targets: this.meryl,
                x: this.doorWalkX + 25,
                y: this.doorWalkY,
                duration: 520,
                ease: "Sine.InOut",
                onComplete: () => {
                  this.tweens.add({
                    targets: this.meryl,
                    x: this.doorWalkX + 5,
                    alpha: 0,
                    duration: 260,
                    ease: "Cubic.In",
                    onComplete: () => {
                      this.meryl.setVisible(false);
                      resolve();
                    },
                  });
                },
              });
            },
          });
        },
      });
    });

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
    blackScreen.setScrollFactor(0);
    blackScreen.setAlpha(0);

    await this.tweenPromise({
      targets: blackScreen,
      alpha: 1,
      duration: 650,
      ease: "Cubic.In",
    });

    this.scene.start("NewClassroom");

    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    this.scene.bringToTop("InventoryOverlay");
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
    this.OVERLAYlockdown.setAlpha(0.72);
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
    this.LOCKDOWNRedCircleStuff.setAlpha(0.08);
    this.LOCKDOWNRedCircleStuff.setBlendMode(Phaser.BlendModes.SCREEN);
    this.LOCKDOWNRedCircleStuff.setScrollFactor(0);

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

  stopAlarmTweens() {
    if (this.schoolAlarmTweens) {
      this.schoolAlarmTweens.forEach((tween) => {
        if (tween) {
          tween.stop();
        }
      });
    }

    this.schoolAlarmTweens = [];
  }

  shouldBlockPauseOpen() {
    const closedOverlayFrame = this.registry.get("escClosedOverlayFrame");

    if (closedOverlayFrame === this.game.loop.frame) {
      return true;
    }

    const inventory = this.scene.get("InventoryOverlay");

    if (inventory && inventory.isOpen) {
      return true;
    }

    const knowledgeLog = this.scene.get("KnowledgeLogOverlay");

    if (knowledgeLog && knowledgeLog.isOpen) {
      return true;
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

    if (pauseMenu && pauseMenu.open) {
      pauseMenu.open(this.scene.key);
    }
  }
}
