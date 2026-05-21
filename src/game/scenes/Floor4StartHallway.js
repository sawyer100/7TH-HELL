import Phaser, { Scene } from "phaser";
import { loadGameData, saveGameData } from "../db";
import { battleConsumables } from "../battle_item_data";

const main_width = 1600;
const main_height = 900;
const hallway_segments = 5;
const world_width = main_width * hallway_segments;

export class Floor4StartHallway extends Scene {
  constructor() {
    super("Floor4StartHallway");
  }

  init(data) {
    this.startAtX = null;

    if (data) {
      if (typeof data.startX === "number") {
        this.startAtX = data.startX;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.canMove = true;
    this.enteringRoom = false;
    this.enteringStairwell = false;
    this.currentInteractable = null;
    this.restockComplete = false;

    this.cameras.main.setBounds(0, 0, world_width, main_height);

    if (this.startAtX === null) {
      this.cameras.main.scrollX = world_width - main_width;
    } else {
      this.cameras.main.scrollX = Phaser.Math.Clamp(
        this.startAtX - main_width / 2,
        0,
        world_width - main_width,
      );
    }

    this.createWorld();
    this.createCinemaBorders();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createKeys();

    this.updateObjectiveHeader("Restock and find the stairs");

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
    this.entryBlack.setScrollFactor(0);
    this.entryBlack.setAlpha(1);

    this.tweens.add({
      targets: this.entryBlack,
      alpha: 0,
      duration: 650,
      ease: "Sine.Out",
      onComplete: async () => {
        this.entryBlack.destroy();
        await this.saveFloor4ChapterToDb();
        await this.loadFloor4StateFromDb();
        this.updateRoomDoorVisibility();
      },
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

    const last = this.segmentInfo[hallway_segments - 1];
    this.floorY = last.floorY;

    let kimStartX = world_width - 250;

    if (this.startAtX !== null) {
      kimStartX = this.startAtX;
    }

    this.kim = this.add.image(kimStartX, this.floorY + 8, "id-card-kim");
    this.kim.setOrigin(0.5, 1);

    this.kim.setDepth(40);
    this.kim.setScale(335 / this.kim.height);

    let merylStartX = kimStartX + 150;
    merylStartX = Phaser.Math.Clamp(merylStartX, 120, world_width - 80);

    this.meryl = this.add.image(merylStartX, this.floorY + 8, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);

    this.meryl.setScale(335 / this.meryl.height);

    this.createRestockRoomDoor();
    this.createEndStairwellExit();
  }

  makeHallwaySegment(index) {
    const x = index * main_width;

    let background = null;

    if (this.textures.exists("floor2-background-2")) {
      background = this.add.image(
        x + main_width / 2,
        110,
        "floor2-background-2",
      );
      background.setOrigin(0.5, 0);
      background.setDepth(1);

      background.setScale(main_width / background.width);
    } else {
      background = this.add.rectangle(
        x + main_width / 2,
        main_height / 2,
        main_width,
        main_height,
        0x050505,
        1,
      );
      background.setOrigin(0.5);
      background.setDepth(1);
    }

    let left = x;
    let bottom = 760;

    if (background.displayWidth) {
      left = background.x - background.displayWidth * background.originX;
      bottom =
        background.y + background.displayHeight * (1 - background.originY);
    }

    const floorY = bottom - 45;

    if (this.textures.exists("floor2-locker-2")) {
      const locker = this.add.image(left + 965, floorY + 8, "floor2-locker-2");
      locker.setOrigin(0.5, 1);

      locker.setDepth(11);
      locker.setScale(335 / locker.height);
    }

    this.segmentInfo.push({
      index,
      left,
      floorY,
      background,
    });
  }

  createRestockRoomDoor() {
    const segment = this.segmentInfo[2];

    if (!segment) {
      return;
    }

    this.roomDoorX = segment.left + 650;
    this.roomDoorY = segment.floorY + 8;

    if (this.textures.exists("floor2-door-2")) {
      this.roomDoor = this.add.image(
        this.roomDoorX,
        segment.floorY - 345,
        "floor2-door-2",
      );

      this.roomDoor.setOrigin(0.5, 0);
      this.roomDoor.setDepth(18);
      this.roomDoor.setScale(2.25);
    } else {
      this.roomDoor = this.add.rectangle(
        this.roomDoorX,
        this.roomDoorY - 182,
        90,
        250,
        0x284b2c,
        1,
      );

      this.roomDoor.setDepth(18);
    }
  }

  createEndStairwellExit() {
    const endSegment = this.segmentInfo[0];

    if (!endSegment) {
      return;
    }

    this.stairwellX = endSegment.left + 120;

    this.stairwellY = endSegment.floorY + 8;

    this.stairwellZone = this.add.rectangle(
      this.stairwellX,
      this.stairwellY - 80,
      135,
      230,
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

    this.topBorder.setScrollFactor(0);


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
    this.bottomBorder.setScrollFactor(0);
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

  createKeys() {
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (this.enteringRoom) {
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
    this.updateCamera(delta);
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

    const minX = 90;
    const maxX = world_width - 120;

    nextKimX = Phaser.Math.Clamp(nextKimX, minX, maxX);

    this.kim.x = nextKimX;
    this.kim.y = this.floorY + 8;

    const followTargetX = this.kim.x + 150;
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
    let nearest = null;
    let nearestDistance = Infinity;

    if (!this.restockComplete) {
      const roomDistance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        this.roomDoorX,
        this.roomDoorY,
      );

      if (roomDistance < nearestDistance) {
        nearestDistance = roomDistance;
        nearest = {
          type: "room",
          x: this.roomDoorX,
          y: this.roomDoorY,
        };
      }
    }

    const stairwellDistance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,

      this.stairwellX,
      this.stairwellY,
    );

    if (stairwellDistance < nearestDistance) {
      nearestDistance = stairwellDistance;
      nearest = {
        type: "stairwell",
        x: this.stairwellX,
        y: this.stairwellY,
      };
    }

    if (!nearest) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearestDistance > 170) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearest.type === "room") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 330,
        "E TO ENTER",
        "Restock Room",
      );
    }

    if (nearest.type === "stairwell") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 280,
        "E TO ENTER",
        "Stairwell",
      );
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearest.type === "room") {
        this.enterRestockRoom();
        return;
      }

      if (nearest.type === "stairwell") {
        this.enterStairwellToFloor5();
      }
    }
  }

  async enterRestockRoom() {
    if (this.enteringRoom) {
      return;
    }

    this.enteringRoom = true;
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
    blackScreen.setScrollFactor(0);
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

    this.scene.start("Floor4RestockClassroom", {
      returnScene: "Floor4StartHallway",
      hallwayReturnX: this.roomDoorX,
    });
  }

  async enterStairwellToFloor5() {
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

    blackScreen.setScrollFactor(0);
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
      targetFloor: 5,
      nextScene: "Floor5StartHallway",
      nextChapter: "floor5-starthallway",
      floorTitleText: "FLOOR 5",
    });
  }

  async loadFloor4StateFromDb() {
    const data = await loadGameData();

    if (!data.floor4) {
      return;
    }

    if (data.floor4.restockComplete) {
      this.restockComplete = true;
    }
  }

  async saveFloor4ChapterToDb() {
    const data = await loadGameData();

    if (!data.currentStoryState) {
      data.currentStoryState = {};
    }

    data.currentStoryState.chapterName = "floor4-starthallway";

    data.currentStoryState.chapterObjective = null;
    data.currentStoryState.checkPoint = null;

    if (!data.floor4) {
      data.floor4 = {};
    }

    await saveGameData(data);
  }

  updateRoomDoorVisibility() {
    if (!this.roomDoor) {
      return;
    }

    if (this.restockComplete) {
      this.roomDoor.setAlpha(1);
    } else {
      this.roomDoor.setAlpha(1);
    }
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

export class Floor4RestockClassroom extends Scene {
  constructor() {
    super("Floor4RestockClassroom");
  }

  init(data) {
    this.returnScene = "Floor4StartHallway";
    this.hallwayReturnX = null;

    if (data) {
      if (data.returnScene) {
        this.returnScene = data.returnScene;
      }

      if (typeof data.hallwayReturnX === "number") {
        this.hallwayReturnX = data.hallwayReturnX;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.canMove = true;
    this.collectingThing = false;
    this.leavingRoom = false;
    this.bagsOpened = {};
    this.bags = [];
    this.restockDrops = [];

    this.lootObjects = [];
    this.solidAreas = [];
    this.showCollisionDebug = true;

    this.createWorld();
    this.createCinemaBorders();
    this.createPauseButton();
    this.createInteractionPrompt();
    this.createKeys();

    this.loadFloor4RestockStateFromDb().then(() => {
      this.updateBagVisibility();
      this.spawnSavedRestockDrops(false);
    });

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
      duration: 450,
      ease: "Sine.Out",
      onComplete: () => {
        this.entryBlack.destroy();
      },
    });
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x071426, 1);
    this.bg.setOrigin(0, 0);

    this.bg.setDepth(-20);

    if (this.textures.exists("classroom-new-background")) {
      this.roomBg = this.add.image(
        main_width / 2,
        main_height / 2,
        "classroom-new-background",
      );

      this.roomBg.setOrigin(0.5);
      this.roomBg.setDepth(1);

      const scaleX = main_width / this.roomBg.width;
      const scaleY = main_height / this.roomBg.height;

      let bgScale = scaleX;

      if (scaleY > scaleX) {
        bgScale = scaleY;
      }

      this.roomBg.setScale(bgScale);
      this.roomBg.setTint(0x8eaaff);
    } else {
      const roomRect = this.add.rectangle(
        main_width / 2,
        main_height / 2,
        1320,
        680,
        0x223355,
        1,
      );

      roomRect.setDepth(1);
    }

    this.floorY = 705;

    this.doorX = main_width - 245;
    this.doorY = 245;

    this.exitDoorZone = this.add.rectangle(
      this.doorX,
      this.doorY,
      150,
      220,
      0x00ff00,
      0,
    );

    this.exitDoorZone.setDepth(5);
    this.exitDoorZone.setVisible(false);

    this.kim = this.add.image(1130, 525, "id-card-kim");
    this.kim.setOrigin(0.5, 1);
    this.kim.setDepth(40);
    this.kim.setScale(265 / this.kim.height);

    this.meryl = this.add.image(1280, 525, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);
    this.meryl.setDepth(39);

    this.meryl.setScale(265 / this.meryl.height);

    this.setupDeskCollision();
    this.createRestockBags();
  }
  setupDeskCollision() {
    this.walkBounds = new Phaser.Geom.Rectangle(95, 155, main_width - 190, 590);

    this.solidAreas = [
      // top row desks
      new Phaser.Geom.Rectangle(165, 185, 285, 260),
      new Phaser.Geom.Rectangle(645, 185, 285, 260),
      new Phaser.Geom.Rectangle(1125, 185, 285, 260),

      // bottom row desks
      new Phaser.Geom.Rectangle(165, 545, 285, 200),
      new Phaser.Geom.Rectangle(645, 545, 285, 200),
      new Phaser.Geom.Rectangle(1125, 545, 285, 200),
    ];

    if (this.showCollisionDebug) {
      const graphics = this.add.graphics();
      graphics.setDepth(6000);

      graphics.lineStyle(3, 0x00ff00, 0.65);
      graphics.strokeRectShape(this.walkBounds);

      graphics.lineStyle(3, 0xff0000, 0.75);

      this.solidAreas.forEach((rect) => {
        graphics.strokeRectShape(rect);
      });
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

    if (!Phaser.Geom.Rectangle.ContainsRect(this.walkBounds, feet)) {
      return true;
    }

    for (const rect of this.solidAreas) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(feet, rect)) {
        return true;
      }
    }

    return false;
  }
  createRestockBags() {
    const configs = [
      {
        id: "bag1",
        x: main_width / 2 - 240,
        y: this.floorY - 120,
        key: "student-backpack-1",
        label: "Student Backpack",
      },
      {
        id: "bag2",
        x: main_width / 2,
        y: this.floorY - 30,
        key: "student-backpack-2",
        label: "Student Backpack",
      },
      {
        id: "bag3",
        x: main_width / 2 + 250,
        y: this.floorY - 135,
        key: "student-backpack-3",
        label: "Student Backpack",
      },
    ];

    configs.forEach((config) => {
      let sprite = null;

      if (this.textures.exists(config.key)) {
        sprite = this.add.image(config.x, config.y, config.key);
      } else {
        sprite = this.add.rectangle(config.x, config.y, 82, 92, 0x755530, 1);
      }

      sprite.setOrigin(0.5, 1);
      sprite.setDepth(20);

      if (sprite.height) {
        sprite.setScale(112 / sprite.height);
      }

      this.bags.push({
        id: config.id,
        label: config.label,
        sprite,
      });
    });
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

    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  update(time, delta) {
    if (this.collectingThing) {
      this.hideInteractionPrompt();
      return;
    }

    if (this.leavingRoom) {
      this.hideInteractionPrompt();
      return;
    }

    if (!this.canMove) {
      this.hideInteractionPrompt();
      return;
    }

    this.moveKim(delta);
    this.updateNearestInteraction();
  }

  moveKim(delta) {
    const speed = 340;
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
    let nearest = null;
    let nearestDistance = Infinity;

    this.bags.forEach((bag) => {
      if (this.bagsOpened[bag.id]) {
        return;
      }

      if (!bag.sprite) {
        return;
      }

      if (!bag.sprite.visible) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        bag.sprite.x,
        bag.sprite.y,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          type: "bag",
          bag,
          x: bag.sprite.x,
          y: bag.sprite.y,
        };
      }
    });

    this.lootObjects.forEach((loot) => {
      if (loot.collected) {
        return;
      }

      if (!loot.sprite) {
        return;
      }

      if (!loot.sprite.visible) {
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
          x: loot.sprite.x,
          y: loot.sprite.y,
        };
      }
    });

    const doorDistance = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.doorX,
      this.doorY,
    );

    if (doorDistance < nearestDistance) {
      nearestDistance = doorDistance;
      nearest = {
        type: "door",
        x: this.doorX,
        y: this.doorY,
      };
    }

    if (!nearest) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearestDistance > 175) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearest.type === "bag") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 130,
        "E TO OPEN",
        nearest.bag.label,
      );
    }

    if (nearest.type === "loot") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 115,
        "E TO PICK UP",
        nearest.loot.name,
      );
    }

    if (nearest.type === "door") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y + 130,
        "E TO EXIT",
        "Hallway",
      );
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearest.type === "bag") {
        this.openRestockBag(nearest.bag);
        return;
      }

      if (nearest.type === "loot") {
        this.collectRestockLoot(nearest.loot);
        return;
      }

      if (nearest.type === "door") {
        this.leaveRoom();
      }
    }
  }

  async openRestockBag(bag) {
    if (this.collectingThing) {
      return;
    }

    if (this.bagsOpened[bag.id]) {
      return;
    }

    this.collectingThing = true;
    this.canMove = false;
    this.hideInteractionPrompt();

    this.bagsOpened[bag.id] = true;

    if (bag.sprite) {
      bag.sprite.setVisible(false);
    }

    const drops = this.generateRestockBagDrops(bag.id);

    drops.forEach((drop) => {
      this.restockDrops.push(drop);
    });

    this.spawnRestockLootObjectsForBag(bag, drops, true);
    await this.saveFloor4RestockStateToDb();

    this.collectingThing = false;
    this.canMove = true;
  }

  generateRestockBagDrops(bagId) {
    const ids = Object.keys(battleConsumables);
    const drops = [];

    for (let i = 0; i < 3; i += 1) {
      const randomIndex = Phaser.Math.Between(0, ids.length - 1);
      const id = ids[randomIndex];
      const item = battleConsumables[id];

      if (item) {
        drops.push({
          dropId: `floor4-${bagId}-drop-${i}`,
          sourceBagId: bagId,
          type: "consumable",
          id,
          qty: 1,
          collected: false,
        });
      }
    }

    return drops;
  }
  spawnSavedRestockDrops(animate) {
    this.lootObjects.forEach((loot) => {
      if (loot.sprite) {
        loot.sprite.destroy();
      }
    });

    this.lootObjects = [];

    this.restockDrops.forEach((drop, index) => {
      if (drop.collected) {
        return;
      }

      const bag = this.getBagById(drop.sourceBagId);

      if (!bag) {
        return;
      }

      this.spawnRestockLootObject(bag, drop, index, animate);
    });
  }

  spawnRestockLootObjectsForBag(bag, drops, animate) {
    drops.forEach((drop, index) => {
      if (drop.collected) {
        return;
      }

      this.spawnRestockLootObject(bag, drop, index, animate);
    });
  }

  spawnRestockLootObject(bag, drop, index, animate) {
    const item = battleConsumables[drop.id];

    if (!item) {
      return;
    }

    if (!item.icon) {
      return;
    }

    const offsets = [-82, 0, 82];
    let offsetX = 0;

    if (offsets[index % offsets.length] !== undefined) {
      offsetX = offsets[index % offsets.length];
    }

    const targetX = bag.sprite.x + offsetX;
    const targetY = bag.sprite.y - 70 - Phaser.Math.Between(0, 40);

    let startX = targetX;
    let startY = targetY;
    let startScale = 56 / 100;

    if (animate) {
      startX = bag.sprite.x;
      startY = bag.sprite.y - 85;
      startScale = 0.15;
    }

    const sprite = this.add.image(startX, startY, item.icon);
    sprite.setOrigin(0.5);
    sprite.setDepth(35 + index);
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

  getBagById(bagId) {
    let found = null;

    this.bags.forEach((bag) => {
      if (bag.id === bagId) {
        found = bag;
      }
    });

    return found;
  }

  async collectRestockLoot(loot) {
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
    this.canMove = false;
    this.hideInteractionPrompt();

    loot.collected = true;
    loot.drop.collected = true;

    this.restockDrops.forEach((drop) => {
      if (drop.dropId === loot.drop.dropId) {
        drop.collected = true;
      }
    });

    await this.addConsumableToSave(loot.drop.id, loot.drop.qty || 1);
    await this.playRewardFlyToInventory(loot.sprite, loot.drop.id, 0);

    if (loot.sprite) {
      loot.sprite.destroy();
    }

    await this.saveFloor4RestockStateToDb();

    this.collectingThing = false;
    this.canMove = true;
  }

  playRewardFlyToInventory(sourceSprite, itemId, index) {
    return new Promise((resolve) => {
      if (!sourceSprite) {
        resolve();
        return;
      }

      const item = battleConsumables[itemId];

      if (!item) {
        resolve();
        return;
      }

      const startX = sourceSprite.x;
      const startY = sourceSprite.y;

      const flyIcon = this.add.image(startX, startY, item.icon);
      
      flyIcon.setOrigin(0.5);
      flyIcon.setDepth(5000);


      flyIcon.setScale(52 / flyIcon.height);
      flyIcon.setAlpha(1);

      const targetX = main_width - 78;
      const targetY = 86;

      this.tweens.add({
        targets: flyIcon,
        x: targetX,
        y: targetY,
        scaleX: flyIcon.scaleX * 0.35,
        scaleY: flyIcon.scaleY * 0.35,
        alpha: 0,
        duration: 440,
        delay: index * 90,
        ease: "Cubic.InOut",
        onComplete: () => {
          flyIcon.destroy();
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

  async loadFloor4RestockStateFromDb() {
    const data = await loadGameData();

    if (!data.floor4) {
      return;
    }

    if (data.floor4.bagsOpened) {
      this.bagsOpened = data.floor4.bagsOpened;
    }

    if (Array.isArray(data.floor4.restockDrops)) {
      this.restockDrops = data.floor4.restockDrops;
    }
  }

  async saveFloor4RestockStateToDb() {
    const data = await loadGameData();

    if (!data.floor4) {
      data.floor4 = {};
    }

    data.floor4.bagsOpened = this.bagsOpened;
    data.floor4.restockDrops = this.restockDrops;

    let allOpened = true;

    this.bags.forEach((bag) => {
      if (!this.bagsOpened[bag.id]) {
        allOpened = false;
      }
    });

    let allCollected = true;

    this.restockDrops.forEach((drop) => {
      if (!drop.collected) {
        allCollected = false;
      }
    });

    if (allOpened) {
      if (allCollected) {
        data.floor4.restockComplete = true;
      }
    }

    await saveGameData(data);
  }

  updateBagVisibility() {
    this.bags.forEach((bag) => {
      if (this.bagsOpened[bag.id]) {
        if (bag.sprite) {
          bag.sprite.setVisible(false);
        }
      }
    });
  }

  async leaveRoom() {
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

    if (this.hallwayReturnX !== null) {
      returnData.startX = this.hallwayReturnX;
    }

    this.scene.start(this.returnScene, returnData);
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
