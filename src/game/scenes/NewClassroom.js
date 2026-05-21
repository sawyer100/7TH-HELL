import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import {
  loadGameData,
  saveGameData,
  setCurrentChapterName,
  setChapterObjective,
} from "../db";
import { battleConsumables, battleArmors } from "../battle_item_data";

const main_width = 1600;
const main_height = 900;

export class NewClassroom extends Scene {
  constructor() {
    super("NewClassroom");
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    setCurrentChapterName("new-classroom").catch((error) => {
      console.warn("Could not save new classroom chapter.", error);
    });

    this.canMove = false;
    this.dialogueActive = false;
    this.collectingThing = false;
    this.endingScene = false;

    this.objectiveMode = null;
    this.lootBag1Opened = false;
    this.lootBag2Opened = false;
    this.helmetCollected = false;
    this.lootObjects = [];
    this.activePromptTarget = null;
    this.afterEverythingDialogueShown = false;
    this.bagOpenDialogueShown = false;

    this.createWorld();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createDialogueBox();
    this.createKeys();

    this.dialogueData = this.cache.json.get("dialogue-new-classroom");

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.hideDialoguePortraits();

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });

    this.bootScene();
  }

  async bootScene() {
    await this.loadNewClassroomState();

    if (this.backpackTextureKey1) {
      this.lootBag1.setTexture(this.backpackTextureKey1);
    }

    if (this.backpackTextureKey2) {
      this.lootBag2.setTexture(this.backpackTextureKey2);
    }

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

    if (this.helmetCollected) {
      this.helmet.setVisible(false);
    } else {
      this.helmet.setVisible(true);
    }

    if (this.lootBag1Opened) {
      this.lootBag1.setVisible(false);
    } else {
      this.lootBag1.setVisible(true);
    }

    if (this.lootBag2Opened) {
      this.lootBag2.setVisible(false);
    } else {
      this.lootBag2.setVisible(true);
    }

    this.spawnSavedLootDrops(false);
    if (this.isEverythingCollected()) {
      this.objectiveMode = "leaveRoom";
      this.afterEverythingDialogueShown = true;
      this.updateObjectiveHeader("Leave Classroom");
      this.canMove = true;
      this.hideDialogueUI();
      return;
    }

    this.startDialogue(this.dialogueData.lines, () => {
      if (this.objectiveMode === "searchRoom") {
        this.hideDialogueUI();
        this.canMove = true;
      }
    });
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

    // New classroom uses the same classroom artwork instead of a plain color.
    // Make sure this key is loaded before the scene starts.
    this.roomY = 0;
    this.roomH = main_height;

    const roomTexture = this.textures.get("classroom-new-background");
    const roomSource = roomTexture.getSourceImage();
    this.roomNativeW = roomSource.width;
    this.roomNativeH = roomSource.height;

    const roomScale = this.roomH / this.roomNativeH;
    this.roomW = this.roomNativeW * roomScale;
    this.roomX = (main_width - this.roomW) / 2;

    this.roomBg = this.add.image(
      this.roomX,
      this.roomY,
      "classroom-new-background",
    );

    this.roomBg.setOrigin(0, 0);
    this.roomBg.setScale(roomScale);
    this.roomBg.setDepth(1);

    this.roomScaleX = this.roomBg.displayWidth / this.roomNativeW;
    this.roomScaleY = this.roomBg.displayHeight / this.roomNativeH;

    // Invisible door trigger at the top-right side of the classroom.
    const doorPoint = this.nativeToWorld(350, 96);
    this.doorX = doorPoint.x;
    this.doorY = doorPoint.y;
    this.doorBounds = this.nativeRectToWorld(318, 82, 56, 45);

    this.doorTarget = this.add.rectangle(
      this.doorX,
      this.doorY,
      this.doorBounds.width,
      this.doorBounds.height,
      0x00ff00,
      0,
    );

    this.doorTarget.setOrigin(0.5);
    this.doorTarget.setDepth(2);
    this.doorTarget.setVisible(false);

    this.setupNewClassroomCollision();

    const kimStart = this.nativeToWorld(136, 342);
    this.kim = this.add.image(kimStart.x, kimStart.y, "id-card-kim");

    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(20);
    this.kim.setScale(250 / this.kim.height);

    const merylStart = this.nativeToWorld(340, 116);
    this.meryl = this.add.image(merylStart.x, merylStart.y, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(20);
    this.meryl.setScale(250 / this.meryl.height);

    // Loot bag 1 is beside the top row, desk 2.
    const lootBag1Start = this.nativeToWorld(232, 176);
    this.lootBag1 = this.add.image(
      lootBag1Start.x,
      lootBag1Start.y,
      "student-backpack-1",
    );

    this.lootBag1.setOrigin(0.5, 1);
    this.lootBag1.setDepth(15);
    this.lootBag1.setScale(100 / this.lootBag1.height);
    this.lootBag1.setVisible(false);

    // Loot bag 2 is beside the bottom row, desk 1.
    const lootBag2Start = this.nativeToWorld(34, 338);
    this.lootBag2 = this.add.image(
      lootBag2Start.x,
      lootBag2Start.y,
      "student-backpack-1",
    );

    this.lootBag2.setOrigin(0.5, 1);
    this.lootBag2.setDepth(15);
    this.lootBag2.setScale(125 / this.lootBag2.height);
    this.lootBag2.setVisible(false);

    // Helmet is beside the bottom row, desk 3, near the corner.
    const helmetStart = this.nativeToWorld(352, 338);
    this.helmet = this.add.image(
      helmetStart.x,
      helmetStart.y,
      "item-bike-helmet",
    );

    this.helmet.setOrigin(0.5, 1);
    this.helmet.setDepth(16);
    this.helmet.setScale(95 / this.helmet.height);
    this.helmet.setVisible(false);
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

    const portraitHeight = 340;

    this.kimIcon = this.add.image(
      main_width / 2 - 520,
      main_height - 110,
      "classroom-kim-icon",
    );

    this.kimIcon.setOrigin(0.5, 1);
    this.kimIcon.setDepth(2999);
    this.kimIcon.setScale(portraitHeight / this.kimIcon.height);
    this.kimIcon.setVisible(false);

    this.merylIcon = this.add.image(
      main_width / 2 - 520,
      main_height - 110,
      "classroom-meryl-icon",
    );

    this.merylIcon.setOrigin(0.5, 1);
    this.merylIcon.setDepth(2999);
    this.merylIcon.setScale(portraitHeight / this.merylIcon.height);
    this.merylIcon.setVisible(false);
  }

  createKeys() {
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    this.updateDialoguePortrait();

    if (this.dialogueActive) {
      this.hideInteractionPrompt();
      return;
    }

    if (!this.canMove) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.collectingThing) {
      this.hideInteractionPrompt();
      return;
    }

    this.moveCharacter(delta);
    this.updateNearestInteraction();
    this.updateDoorLeave();
  }

  nativeToWorld(nativeX, nativeY) {
    return {
      x: this.roomX + nativeX * this.roomScaleX,
      y: this.roomY + nativeY * this.roomScaleY,
    };
  }

  nativeRectToWorld(nativeX, nativeY, nativeW, nativeH) {
    const point = this.nativeToWorld(nativeX, nativeY);

    return new Phaser.Geom.Rectangle(
      point.x,
      point.y,
      nativeW * this.roomScaleX,
      nativeH * this.roomScaleY,
    );
  }

  setupNewClassroomCollision() {
    this.walkBounds = this.nativeRectToWorld(10, 82, 360, 274);

    const deskRects = [
      // top 
      { x: 45, y: 120, w: 68, h: 65 },
      { x: 155, y: 120, w: 68, h: 65 },
      { x: 274, y: 120, w: 68, h: 65 },

      // middle rwos
      { x: 45, y: 201, w: 68, h: 55 },
      { x: 155, y: 201, w: 68, h: 55 },
      { x: 274, y: 201, w: 68, h: 55 },

      // bottom guys
      { x: 45, y: 279, w: 68, h: 65 },
      { x: 155, y: 279, w: 68, h: 65 },
      { x: 274, y: 279, w: 68, h: 65 },
    ];

    this.solidAreas = deskRects.map((rect) => {
      return this.nativeRectToWorld(rect.x, rect.y, rect.w, rect.h);
    });

  }

  getKimFeetBounds(x, y) {
    const footWidth = 46;
    const footHeight = 24;

    return new Phaser.Geom.Rectangle(
      x - footWidth / 2,
      y - footHeight,
      footWidth,
      footHeight,
    );
  }

  isKimBlockedAt(x, y) {
    const feet = this.getKimFeetBounds(x, y);

    if (feet.left < this.walkBounds.left) {
      return true;
    }

    if (feet.right > this.walkBounds.right) {
      return true;
    }

    if (feet.top < this.walkBounds.top) {
      return true;
    }

    if (feet.bottom > this.walkBounds.bottom) {
      return true;
    }

    for (const rect of this.solidAreas) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(feet, rect)) {
        return true;
      }
    }

    return false;
  }

  moveCharacter(delta) {
    const speed = 380;
    const dt = delta / 1000;

    let dx = 0;
    let dy = 0;

    if (this.aKey.isDown) {
      dx -= 1;
    }

    if (this.dKey.isDown) {
      dx += 1;
    }

    if (this.wKey.isDown) {
      dy -= 1;
    }

    if (this.sKey.isDown) {
      dy += 1;
    }

    if (dx !== 0) {
      if (dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }
    }

    const oldX = this.kim.x;
    const oldY = this.kim.y;

    this.kim.x += dx * speed * dt;

    if (this.isKimBlockedAt(this.kim.x, this.kim.y)) {
      this.kim.x = oldX;
    }

    this.kim.y += dy * speed * dt;

    if (this.isKimBlockedAt(this.kim.x, this.kim.y)) {
      this.kim.y = oldY;
    }
  }

  updateNearestInteraction() {
    this.activePromptTarget = null;

    let nearest = null;
    let nearestDistance = Infinity;

    if (!this.lootBag1Opened) {
      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        this.lootBag1.x,
        this.lootBag1.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          type: "bag",
          bagId: "bag1",
          sprite: this.lootBag1,
        };
      }
    }

    if (!this.lootBag2Opened) {
      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        this.lootBag2.x,
        this.lootBag2.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          type: "bag",
          bagId: "bag2",
          sprite: this.lootBag2,
        };
      }
    }

    if (!this.helmetCollected) {
      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        this.helmet.x,
        this.helmet.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          type: "helmet",
          sprite: this.helmet,
        };
      }
    }

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
        nearest = {
          type: "loot",
          loot,
          sprite: loot.sprite,
        };
      }
    });

    if (!nearest || nearestDistance > 130) {
      this.hideInteractionPrompt();
      return;
    }

    this.activePromptTarget = nearest;

    let promptName = "";

    if (nearest.type === "bag") {
      promptName = "Student Backpack";
    }

    if (nearest.type === "helmet") {
      promptName = "Bike Helmet";
    }

    if (nearest.type === "loot") {
      promptName = nearest.loot.name;
    }

    this.showInteractionPrompt(
      nearest.sprite.x,
      nearest.sprite.y - 120,
      "E TO PICK UP",
      promptName,
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.useNearestInteraction(nearest);
    }
  }

  useNearestInteraction(target) {
    if (target.type === "bag") {
      this.openLootBag(target.bagId, target.sprite);
      return;
    }

    if (target.type === "helmet") {
      this.collectHelmet();
      return;
    }

    if (target.type === "loot") {
      this.collectDroppedLoot(target.loot);
    }
  }

  updateDoorLeave() {
    if (this.objectiveMode !== "leaveRoom") {
      return;
    }

    if (this.endingScene) {
      return;
    }

    let nearDoor = false;

    if (this.doorBounds) {
      nearDoor = Phaser.Geom.Rectangle.Contains(
        this.doorBounds,
        this.kim.x,
        this.kim.y,
      );
    }

    if (!nearDoor) {
      return;
    }

    this.showInteractionPrompt(
      this.doorX,
      this.doorY + 95,
      "E TO ENTER",
      "Classroom Door",
    );

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.endNewClassroomScene();
    }
  }

  chooseStudentBackpackTexture() {
    const backpackTextures = [
      "student-backpack-1",
      "student-backpack-2",
      "student-backpack-3",
    ];

    const index = Phaser.Math.Between(0, backpackTextures.length - 1);

    return backpackTextures[index];
  }

  async loadNewClassroomState() {
    let data = null;

    try {
      data = await loadGameData();
    } catch (error) {
      data = {};
    }

    if (!data.newClassroom) {
      data.newClassroom = {};
    }

    if (!Array.isArray(data.newClassroom.lootDrops)) {
      data.newClassroom.lootDrops = [];
    }

    if (!data.newClassroom.backpackTextureKey1) {
      data.newClassroom.backpackTextureKey1 =
        this.chooseStudentBackpackTexture();
    }

    if (!data.newClassroom.backpackTextureKey2) {
      data.newClassroom.backpackTextureKey2 =
        this.chooseStudentBackpackTexture();
    }

    await saveGameData(data);

    this.gameData = data;
    this.newClassroomState = data.newClassroom;

    this.lootBag1Opened = !!data.newClassroom.lootBag1Opened;
    this.lootBag2Opened = !!data.newClassroom.lootBag2Opened;
    this.helmetCollected = !!data.newClassroom.helmetCollected;
    this.bagOpenDialogueShown = !!data.newClassroom.bagOpenDialogueShown;

    this.savedLootDrops = data.newClassroom.lootDrops;

    this.backpackTextureKey1 = data.newClassroom.backpackTextureKey1;
    this.backpackTextureKey2 = data.newClassroom.backpackTextureKey2;
  }

  async saveNewClassroomState() {
    let data = this.gameData;

    if (!data) {
      data = await loadGameData();
    }

    if (!data.newClassroom) {
      data.newClassroom = {};
    }

    data.newClassroom.lootBag1Opened = this.lootBag1Opened;
    data.newClassroom.lootBag2Opened = this.lootBag2Opened;
    data.newClassroom.helmetCollected = this.helmetCollected;
    data.newClassroom.bagOpenDialogueShown = this.bagOpenDialogueShown;
    data.newClassroom.lootDrops = this.savedLootDrops || [];

    data.newClassroom.backpackTextureKey1 = this.backpackTextureKey1;
    data.newClassroom.backpackTextureKey2 = this.backpackTextureKey2;

    await saveGameData(data);

    this.gameData = data;
    this.newClassroomState = data.newClassroom;
  }

  generateLootBagDrops(bagId) {
    const possibleIds = Object.keys(battleConsumables);

    const shuffled = [];

    possibleIds.forEach((id) => {
      shuffled.push(id);
    });

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Phaser.Math.Between(0, i);
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    const drops = [];
    const amount = 4;

    for (let i = 0; i < amount; i += 1) {
      const id = shuffled[i];

      drops.push({
        dropId: `new-classroom-${bagId}-drop-${i}`,
        sourceBagId: bagId,
        type: "consumable",
        id,
        qty: 1,
        collected: false,
      });
    }

    return drops;
  }
  getBagSpriteById(bagId) {
    if (bagId === "bag1") {
      return this.lootBag1;
    }

    if (bagId === "bag2") {
      return this.lootBag2;
    }

    return this.lootBag1;
  }

  isBagOpenedById(bagId) {
    if (bagId === "bag1") {
      return this.lootBag1Opened;
    }

    if (bagId === "bag2") {
      return this.lootBag2Opened;
    }

    return false;
  }

  spawnSavedLootDrops(animate) {
    this.lootObjects.forEach((loot) => {
      if (loot.sprite) {
        loot.sprite.destroy();
      }
    });

    this.lootObjects = [];

    if (!this.savedLootDrops) {
      return;
    }

    this.savedLootDrops.forEach((drop, index) => {
      if (drop.collected) {
        return;
      }

      if (!this.isBagOpenedById(drop.sourceBagId)) {
        return;
      }

      this.spawnDroppedLootObject(drop, index, animate);
    });
  }

  spawnDroppedLootObject(drop, index, animate) {
    const item = battleConsumables[drop.id];

    if (!item) {
      return;
    }

    if (!item.icon) {
      return;
    }

    const bagSprite = this.getBagSpriteById(drop.sourceBagId);

    const offsets = [-90, 0, 90];
    let offsetX = 0;

    const localIndex = index % offsets.length;

    if (offsets[localIndex] !== undefined) {
      offsetX = offsets[localIndex];
    }

    const targetX = bagSprite.x + offsetX;
    const targetY = bagSprite.y - 55 - Phaser.Math.Between(0, 35);

    let startX = targetX;
    let startY = targetY;
    let startScale = 30 / 100;

    if (animate) {
      startX = bagSprite.x;
      startY = bagSprite.y - 80;
      startScale = 0.15;
    }

    const sprite = this.add.image(startX, startY, item.icon);
    sprite.setOrigin(0.5);
    sprite.setDepth(25 + index);
    sprite.setScale(startScale);

    const targetScale = 56 / sprite.height;

    const loot = {
      drop,
      sprite,
      name: item.name || drop.id,
      collected: false,
    };

    this.lootObjects.push(loot);

    if (animate) {
      this.tweens.add({
        targets: sprite,
        x: targetX,
        y: targetY,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: 420,
        ease: "Back.Out",
      });
    } else {
      sprite.setScale(targetScale);
    }
  }

  async openLootBag(bagId, bagSprite) {
    if (this.collectingThing) {
      return;
    }

    if (bagId === "bag1") {
      if (this.lootBag1Opened) {
        return;
      }
    }

    if (bagId === "bag2") {
      if (this.lootBag2Opened) {
        return;
      }
    }

    this.collectingThing = true;
    this.canMove = false;
    this.hideInteractionPrompt();

    if (bagId === "bag1") {
      this.lootBag1Opened = true;
    }

    if (bagId === "bag2") {
      this.lootBag2Opened = true;
    }

    bagSprite.setVisible(false);

    let alreadyGenerated = false;

    this.savedLootDrops.forEach((drop) => {
      if (drop.sourceBagId === bagId) {
        alreadyGenerated = true;
      }
    });

    if (!alreadyGenerated) {
      const newDrops = this.generateLootBagDrops(bagId);

      newDrops.forEach((drop) => {
        this.savedLootDrops.push(drop);
      });
    }

    await this.saveNewClassroomState();

    this.spawnSavedLootDrops(true);

    this.collectingThing = false;
    if (!this.bagOpenDialogueShown) {
      this.bagOpenDialogueShown = true;
      await this.saveNewClassroomState();

      let afterBagLines = this.dialogueData.afterBagOpenedLines;

      this.startDialogue(afterBagLines, () => {
        this.hideDialogueUI();
        this.canMove = true;
      });

      return;
    }

    this.canMove = true;
  }
  async collectHelmet() {
    if (this.collectingThing) {
      return;
    }

    if (this.helmetCollected) {
      return;
    }

    this.collectingThing = true;
    this.hideInteractionPrompt();

    const sprite = this.helmet;
    sprite.setDepth(5000);

    await this.flySpriteToInventory(sprite);

    this.helmetCollected = true;
    sprite.setVisible(false);

    await this.addArmorToInventory("bike_helmet");
    await this.saveNewClassroomState();

    this.collectingThing = false;
    this.checkEverythingCollected();
  }

  async collectDroppedLoot(loot) {
    if (this.collectingThing) {
      return;
    }

    if (!loot) {
      return;
    }

    if (loot.collected) {
      return;
    }

    this.collectingThing = true;
    this.hideInteractionPrompt();

    loot.collected = true;
    loot.drop.collected = true;

    const sprite = loot.sprite;
    sprite.setDepth(5000);

    await this.flySpriteToInventory(sprite);

    sprite.destroy();

    await this.addConsumableToInventory(loot.drop.id, loot.drop.qty);

    this.savedLootDrops.forEach((savedDrop) => {
      if (savedDrop.dropId === loot.drop.dropId) {
        savedDrop.collected = true;
      }
    });

    await this.saveNewClassroomState();

    this.collectingThing = false;
    this.checkEverythingCollected();
  }

  flySpriteToInventory(sprite) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets: sprite,
        x: main_width - 86,
        y: 70,
        scaleX: 0.08,
        scaleY: 0.08,
        alpha: 0,
        duration: 420,
        ease: "Cubic.InOut",
        onComplete: resolve,
      });
    });
  }

  async addArmorToInventory(armorId) {
    let data = this.gameData;

    if (!data) {
      data = await loadGameData();
    }

    if (!data.inventory) {
      data.inventory = {};
    }

    if (!Array.isArray(data.inventory.armor)) {
      data.inventory.armor = [];
    }

    if (!data.inventory.armor.includes(armorId)) {
      data.inventory.armor.push(armorId);
    }

    await saveGameData(data);
    this.gameData = data;
  }

  async addConsumableToInventory(itemId, qty) {
    let data = this.gameData;

    if (!data) {
      data = await loadGameData();
    }

    if (!data.inventory) {
      data.inventory = {};
    }

    if (!Array.isArray(data.inventory.consumables)) {
      data.inventory.consumables = [];
    }

    let amount = Number(qty);

    if (Number.isNaN(amount)) {
      amount = 1;
    }

    if (amount <= 0) {
      amount = 1;
    }

    let found = null;

    data.inventory.consumables.forEach((entry) => {
      if (entry) {
        if (entry.id === itemId) {
          found = entry;
        }
      }
    });

    if (found) {
      found.qty = Number(found.qty || 0) + amount;
    } else {
      data.inventory.consumables.push({
        id: itemId,
        qty: amount,
      });
    }

    await saveGameData(data);
    this.gameData = data;
  }

  isEverythingCollected() {
    if (!this.lootBag1Opened) {
      return false;
    }

    if (!this.lootBag2Opened) {
      return false;
    }

    if (!this.helmetCollected) {
      return false;
    }

    if (!this.savedLootDrops) {
      return false;
    }

    if (this.savedLootDrops.length === 0) {
      return false;
    }

    const allBagLootCollected = this.savedLootDrops.every((drop) => {
      return drop.collected;
    });

    if (!allBagLootCollected) {
      return false;
    }

    return true;
  }

  checkEverythingCollected() {
    if (!this.isEverythingCollected()) {
      return;
    }

    if (this.afterEverythingDialogueShown) {
      return;
    }

    this.afterEverythingDialogueShown = true;
    this.canMove = false;

    setCurrentChapterName("post-new-classroom-hallway").catch((error) => {});

    this.startDialogue(this.dialogueData.afterEverythingCollectedLines, () => {
      this.hideDialogueUI();
      this.canMove = true;
    });
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
        id: "new-classroom-runtime-dialogue",
        lines,
      },

      box: this.dialogueBox,
      boxPadX: 78,
      boxPadY: 34,
      fontSize: 26,
      typeSpeed: 28,

      onAction: async (line) => {
        await this.runDialogueAction(line);
      },

      onDone: () => {
        this.dialogueActive = false;
        this.hideDialoguePortraits();

        if (onDone) {
          onDone();
        }
      },
    });

    this.dialogue.start();
  }

  async runDialogueAction(line) {
    if (line.id === "startSearchObjective") {
      this.objectiveMode = "searchRoom";
      this.updateObjectiveHeader("Search Classroom");

      try {
        await setChapterObjective("Search Classroom", null);
      } catch (error) {
        console.warn("Could not save objective.", error);
      }

      return;
    }

    if (line.id === "startCollectObjective") {
      this.objectiveMode = "collectLoot";
      this.updateObjectiveHeader("Collect Items");

      try {
        await setChapterObjective("Collect Items", null);
      } catch (error) {
        console.warn("Could not save objective.", error);
      }

      return;
    }

    if (line.id === "startLeaveObjective") {
      this.objectiveMode = "leaveRoom";
      this.updateObjectiveHeader("Leave Classroom");

      try {
        await setChapterObjective("Leave Classroom", null);
      } catch (error) {
        console.warn("Could not save objective.", error);
      }

      this.canMove = true;
    }
  }

  updateDialoguePortrait() {
    if (!this.kimIcon) {
      return;
    }

    if (!this.merylIcon) {
      return;
    }

    if (!this.dialogueActive) {
      this.hideDialoguePortraits();
      return;
    }

    if (!this.dialogue) {
      this.hideDialoguePortraits();
      return;
    }

    if (!this.dialogue.lines) {
      this.hideDialoguePortraits();
      return;
    }

    const currentLine = this.dialogue.lines[this.dialogue.index];

    if (!currentLine) {
      this.hideDialoguePortraits();
      return;
    }

    if (currentLine.type !== "say") {
      this.hideDialoguePortraits();
      return;
    }

    const speaker = currentLine.speaker;

    if (speaker === "Kim") {
      this.kimIcon.setVisible(true);
      this.merylIcon.setVisible(false);
      return;
    }

    if (speaker === "Meryl") {
      this.kimIcon.setVisible(false);
      this.merylIcon.setVisible(true);
      return;
    }

    this.hideDialoguePortraits();
  }

  hideDialoguePortraits() {
    if (this.kimIcon) {
      this.kimIcon.setVisible(false);
    }

    if (this.merylIcon) {
      this.merylIcon.setVisible(false);
    }
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

    this.hideDialoguePortraits();
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

  async endNewClassroomScene() {
    if (this.endingScene) {
      return;
    }

    this.endingScene = true;
    this.canMove = false;

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
    this.game.canvas.style.cursor = "default";

    this.scene.start("PostNewClassroomHallway");

    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    this.scene.bringToTop("InventoryOverlay");
  }
}
