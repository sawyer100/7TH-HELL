import Phaser, { Scene } from "phaser";
import { battleConsumables } from "../battle_item_data";
import { loadGameData, saveGameData } from "../db";

const main_width = 1600;
const main_height = 900;

export class ReusableLootClassroom extends Scene {
  constructor() {
    super("ReusableLootClassroom");
  }

  init(data) {
    this.roomId = "floor2-room";
    this.returnScene = "Floor2StartHallway";
    this.hallwayReturnX = null;
    this.fromBattle = false;
    this.zombieCleared = false;

    this.savedLootDrops = null;
    this.enemySetup = [];
    this.startWithZombie = false;

    this.doorConfigIndex = null;

    if (data) {
      if (data.roomId) {
        this.roomId = data.roomId;
      }

      if (typeof data.doorConfigIndex === "number") {
        this.doorConfigIndex = data.doorConfigIndex;
      }

      if (data.hasZombie) {
        this.startWithZombie = true;
      }

      if (Array.isArray(data.enemySetup)) {
        this.enemySetup = data.enemySetup;
      }

      if (data.returnScene) {
        this.returnScene = data.returnScene;
      }

      if (data.fromBattle) {
        this.fromBattle = true;
      }

      if (data.zombieCleared) {
        this.zombieCleared = true;
      }


      if (typeof data.hallwayReturnX === "number") {
        this.hallwayReturnX = data.hallwayReturnX;
      }

      if (Array.isArray(data.lootDrops)) {
        this.savedLootDrops = data.lootDrops;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.canMove = true;
    this.leavingRoom = false;
    this.collectingThing = false;

    this.lootObjects = [];
    this.activePromptTarget = null;

    this.zombieType = null;

    this.hasZombie = false;

    if (this.startWithZombie) {
      this.hasZombie = true;
    }

    if (this.zombieCleared) {
      this.hasZombie = false;
    }

    this.zombieType = this.getDisplayZombieTypeFromEnemySetup();

    this.canMove = true;

    if (this.hasZombie) {
      this.canMove = false;
    }

    this.createWorld();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createKeys();

    this.updateObjectiveHeader("Search Classroom");

    this.input.keyboard.on("keydown-ESC", () => {
      this.openPauseMenu();
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.game.canvas.style.cursor = "default";
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

        if (this.hasZombie) {
          this.startZombieEncounterIntro();
        }
      },
    });
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

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

    const doorPoint = this.nativeYes(350, 96);

    this.doorX = doorPoint.x;
    this.doorY = doorPoint.y;
    this.doorBounds = this.nativeRectToWorld(318, 82, 56, 45);

    this.exitDoor = this.add.rectangle(
      this.doorX,
      this.doorY,
      this.doorBounds.width,
      this.doorBounds.height,
      0x00ff00,
      0,
    );

    this.exitDoor.setOrigin(0.5);
    this.exitDoor.setDepth(2);

    this.exitDoor.setVisible(false);

    this.setupReusableClassroomCollision();

    const kimStart = this.nativeYes(260, 150);

    this.kim = this.add.image(kimStart.x, kimStart.y, "id-card-kim");
    this.kim.setOrigin(0.5, 1);

    this.kim.setDepth(40);
    this.kim.setScale(250 / this.kim.height);

    const merylStart = this.nativeYes(340, 132);

    this.meryl = this.add.image(merylStart.x, merylStart.y, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);

    this.meryl.setScale(250 / this.meryl.height);

    // put meryl at the door cause she useless
    this.merylDoorX = merylStart.x;
    this.merylDoorY = merylStart.y;

    const bagStart = this.nativeYes(232, 176);

    this.lootBag = this.add.image(bagStart.x, bagStart.y, "student-backpack-1");

    this.lootBag.setOrigin(0.5, 1);


    this.lootBag.setDepth(15);

    this.lootBag.setScale(105 / this.lootBag.height);
    this.lootBag.setVisible(true);

    this.lootBagOpened = false;

    if (this.savedLootDrops) {
      let alreadyOpened = false;

      this.savedLootDrops.forEach((drop) => {
        if (drop.sourceBagId === "bag1") {
          alreadyOpened = true;
        }
      });

      this.lootBagOpened = alreadyOpened;
    } else {
      this.savedLootDrops = [];
    }

    if (this.lootBagOpened) {
      this.lootBag.setVisible(false);
      this.spawnSavedLootDrops(false);
    }

    if (this.hasZombie) {
      const zombieStart = this.nativeYes(275, 340);

      this.zombie = this.add.image(
        zombieStart.x,
        zombieStart.y,
        this.getZombieSpriteKey(this.zombieType),
      );

      this.zombie.setOrigin(0.5, 1);
      this.zombie.setDepth(38);

      this.zombie.setScale(260 / this.zombie.height);

      if (this.zombieType === "brute") {
        this.zombie.setScale(390 / this.zombie.height);
      }

      this.agroIcon = this.add.image(
        this.zombie.x,
        this.zombie.y - this.zombie.displayHeight - 45,
        "agro-icon",
      );

      this.agroIcon.setOrigin(0.5);
      this.agroIcon.setDepth(3100);
      this.agroIcon.setAlpha(0);
      this.agroIcon.setVisible(false);

      this.agroIcon.setScale(90 / this.agroIcon.height);
    }
  }

  nativeYes(nativeX, nativeY) {
    return {
      x: this.roomX + nativeX * this.roomScaleX,
      y: this.roomY + nativeY * this.roomScaleY,
    };
  }

  nativeRectToWorld(nativeX, nativeY, nativeW, nativeH) {
    const point = this.nativeYes(nativeX, nativeY);

    return new Phaser.Geom.Rectangle(
      point.x,
      point.y,
      nativeW * this.roomScaleX,
      nativeH * this.roomScaleY,
    );
  }

  setupReusableClassroomCollision() {
    this.walkBounds = this.nativeRectToWorld(10, 82, 360, 274);

    const deskRects = [
      { x: 45, y: 120, w: 68, h: 65 },
      { x: 155, y: 120, w: 68, h: 65 },
      { x: 274, y: 120, w: 68, h: 65 },

      { x: 45, y: 201, w: 68, h: 55 },
      { x: 155, y: 201, w: 68, h: 55 },
      { x: 274, y: 201, w: 68, h: 55 },

      { x: 45, y: 279, w: 68, h: 65 },
      { x: 155, y: 279, w: 68, h: 65 },
      { x: 274, y: 279, w: 68, h: 65 },
    ];

    this.solidAreas = deskRects.map((rect) => {
      return this.nativeRectToWorld(rect.x, rect.y, rect.w, rect.h);
    });

    this.showCollisionDebug = false;

    if (this.showCollisionDebug) {
      const graphics = this.add.graphics();
      graphics.setDepth(5000);
      graphics.lineStyle(3, 0xff0000, 0.75);
      graphics.strokeRectShape(this.walkBounds);

      this.solidAreas.forEach((rect) => {
        graphics.strokeRectShape(rect);
      });

      graphics.lineStyle(3, 0x00ff00, 0.75);
      graphics.strokeRectShape(this.doorBounds);
    }
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

  getDisplayZombieTypeFromEnemySetup() {
    let displayType = "walker";

    this.enemySetup.forEach((entry) => {
      if (!entry) {
        return;
      }

      let enemyId = null;

      if (typeof entry === "string") {
        enemyId = entry;
      } else if (entry.id) {
        enemyId = entry.id;
      }

      if (enemyId === "brute") {
        displayType = "brute";
      } else if (enemyId === "runner") {
        if (displayType !== "brute") {
          displayType = "runner";
        }
      }
    });

    return displayType;
  }

  async saveSpecialEncounteredEnemies() {
    if (!Array.isArray(this.enemySetup)) {
      this.enemySetup = [];

    }

    const data = await loadGameData();

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    this.enemySetup.forEach((entry) => {
      if (!entry) {
        return;
      }

      let enemyId = null;

      if (typeof entry === "string") {
        enemyId = entry;
      } else if (entry.id) {
        enemyId = entry.id;

      }

      if (enemyId !== "runner") {
        if (enemyId !== "brute") {
          return;
        }
      }

      if (!data.encounteredEnemies.includes(enemyId)) {
        data.encounteredEnemies.push(enemyId);
      }
    });

    await saveGameData(data);
  }

  getZombieSpriteKey(zombieType) {
    if (zombieType === "runner") {
      return "knowledge-runner-left";
    }

    if (zombieType === "brute") {
      return "knowledge-brute-left";
    }

    return "knowledge-walker-left";
  }

  generateLootBagDrops() {
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
        dropId: `${this.roomId}-bag1-drop-${i}`,
        sourceBagId: "bag1",
        type: "consumable",
        id,
        qty: 1,
        collected: false,
      });
    }

    return drops;
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

    const offsets = [-90, 0, 90, 45];
    let offsetX = 0;

    const localIndex = index % offsets.length;

    if (offsets[localIndex] !== undefined) {
      offsetX = offsets[localIndex];
    }

    const targetX = this.lootBag.x + offsetX;
    const targetY = this.lootBag.y - 55 - Phaser.Math.Between(0, 35);

    let startX = targetX;

    let startY = targetY;
    let startScale = 56 / 100;

    if (animate) {
      startX = this.lootBag.x;
      startY = this.lootBag.y - 80;
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

  startZombieEncounterIntro() {
    this.canMove = false;
    this.hideInteractionPrompt();

    this.time.delayedCall(1000, () => {
      if (!this.agroIcon) {
        this.startZombieFight();
        return;
      }

      this.agroIcon.setVisible(true);

      this.tweens.add({
        targets: this.agroIcon,
        alpha: 1,
        y: this.agroIcon.y - 18,
        duration: 180,
        ease: "Back.Out",
        onComplete: () => {
          this.time.delayedCall(650, () => {
            this.startZombieFight();
          });
        },
      });
    });
  }

  async startZombieFight() {
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
        duration: 450,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    if (!Array.isArray(this.enemySetup)) {
      this.enemySetup = [
        {
          id: "walker",
          count: 1,
        },
      ];
    }

    await this.saveSpecialEncounteredEnemies();

    this.scene.start("FightScene", {
      area: "school-hallway",
      chapterName: "floor2-starthallway",
      enemies: this.enemySetup,

      battleReturnScene: "ReusableLootClassroom",
      battleReturnData: {
        roomId: this.roomId,
        returnScene: this.returnScene,
        hallwayReturnX: this.hallwayReturnX,

        fromBattle: true,
        zombieCleared: true,
        doorConfigIndex: this.doorConfigIndex,
        hasZombie: false,
        enemySetup: this.enemySetup,
        lootDrops: this.savedLootDrops,
      },

      battleLoseScene: "Floor2StartHallway",
      battleLoseData: {
        startX: this.hallwayReturnX,
      },
    });
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
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (this.hasZombie) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.leavingRoom || this.collectingThing) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.canMove) {
      this.moveCharacters(delta);
    }

    this.updateNearestInteraction();
  }

  moveCharacters(delta) {
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

    if (!this.hasZombie) {
      if (!this.lootBagOpened) {
        const bagDistance = Phaser.Math.Distance.Between(
          this.kim.x,
          this.kim.y,
          this.lootBag.x,
          this.lootBag.y,
        );

        if (bagDistance < nearestDistance) {
          nearestDistance = bagDistance;
          nearest = {
            type: "bag",
            sprite: this.lootBag,
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
    }

    let nearDoor = false;

    if (this.doorBounds) {
      nearDoor = Phaser.Geom.Rectangle.Contains(
        this.doorBounds,
        this.kim.x,
        this.kim.y,
      );
    }

    if (nearDoor) {
      nearestDistance = 0;
      nearest = {
        type: "door",
        sprite: this.exitDoor,
      };
    }

    if (!nearest || nearestDistance > 145) {
      this.hideInteractionPrompt();
      return;
    }

    this.activePromptTarget = nearest;

    if (nearest.type === "door") {
      this.showInteractionPrompt(
        this.doorX,
        this.doorY + 95,
        "E TO EXIT",
        "Hallway",
      );
    }

    if (nearest.type === "bag") {
      this.showInteractionPrompt(
        nearest.sprite.x,
        nearest.sprite.y - 120,
        "E TO PICK UP",
        "Student Backpack",
      );
    }

    if (nearest.type === "loot") {
      this.showInteractionPrompt(
        nearest.sprite.x,
        nearest.sprite.y - 110,
        "E TO PICK UP",
        nearest.loot.name,
      );
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.useNearestInteraction(nearest);
    }
  }

  async openLootBag() {
    if (this.collectingThing) {
      return;
    }

    if (this.lootBagOpened) {
      return;
    }

    if (this.hasZombie) {
      return;
    }

    this.collectingThing = true;
    this.canMove = false;
    this.hideInteractionPrompt();

    this.lootBagOpened = true;
    this.lootBag.setVisible(false);

    if (!Array.isArray(this.savedLootDrops)) {
      this.savedLootDrops = [];
    }

    if (this.savedLootDrops.length === 0) {
      this.savedLootDrops = this.generateLootBagDrops();
    }

    this.spawnSavedLootDrops(true);

    this.collectingThing = false;
    this.canMove = true;
  }

  useNearestInteraction(target) {
    if (target.type === "bag") {
      this.openLootBag();
      return;
    }

    if (target.type === "loot") {
      this.collectDroppedLoot(target.loot);
      return;
    }

    if (target.type === "door") {
      this.leaveClassroom();
    }
  }

  async collectDroppedLoot(loot) {
    if (this.collectingThing) {
      return;
    }

    this.collectingThing = true;
    this.hideInteractionPrompt();

    const drop = loot.drop;

    await this.addConsumableToSave(drop.id, drop.qty || 1);

    drop.collected = true;
    loot.collected = true;

    this.savedLootDrops.forEach((savedDrop) => {
      if (savedDrop.dropId === drop.dropId) {
        savedDrop.collected = true;
      }
    });

    if (loot.sprite) {
      await this.playLootFlyToInventory(loot.sprite);
    }

    this.collectingThing = false;
  }

  playLootFlyToInventory(sourceSprite) {
    return new Promise((resolve) => {
      if (!sourceSprite) {
        resolve();
        return;
      }

      const textureKey = sourceSprite.texture.key;

      const flyIcon = this.add.image(
        sourceSprite.x,
        sourceSprite.y,
        textureKey,
      );
      flyIcon.setOrigin(0.5);

      flyIcon.setDepth(5000);
      flyIcon.setScale(sourceSprite.scaleX);

      sourceSprite.setVisible(false);

      const targetX = main_width - 78;
      const targetY = 86;

      this.tweens.add({
        targets: flyIcon,
        x: targetX,
        y: targetY,
        scaleX: flyIcon.scaleX * 0.35,
        scaleY: flyIcon.scaleY * 0.35,
        alpha: 0,
        duration: 520,
        ease: "Cubic.InOut",
        onComplete: () => {
          flyIcon.destroy();

          if (sourceSprite) {
            sourceSprite.destroy();
          }

          resolve();
        },
      });
    });
  }

  async addConsumableToSave(itemId, qty) {
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
        if (entry.id === itemId) {
          found = entry;
        }
      }
    });

    if (found) {
      found.qty = Number(found.qty || 0) + qty;
    } else {
      data.inventory.consumables.push({
        id: itemId,
        qty,
      });
    }

    await saveGameData(data);
  }

  async leaveClassroom() {
    if (this.leavingRoom) {
      return;
    }

    this.leavingRoom = true;
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
        duration: 450,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    const returnData = {};

    returnData.visitedRoomId = this.roomId;

    if (this.hallwayReturnX !== null) {
      returnData.startX = this.hallwayReturnX;
    }

    this.scene.start(this.returnScene, returnData);

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
