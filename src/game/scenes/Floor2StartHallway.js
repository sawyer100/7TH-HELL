import Phaser, { Scene } from "phaser";
import { loadGameData, saveGameData } from "../db";
import { DialogueRunner } from "./DialogueRunner";

const main_width = 1600;
const main_height = 900;
const hallway_segments = 5;
const world_width = main_width * hallway_segments;

export class Floor2StartHallway extends Scene {
  constructor() {
    super("Floor2StartHallway");
  }

  init(data) {
    this.justVisitedRoomId = null;
    this.startAtX = null;
    this.returnedFromGuardBattleWon = false;

    if (data) {
      if (typeof data.startX === "number") {
        this.startAtX = data.startX;
      }
      if (data.visitedRoomId) {
        this.justVisitedRoomId = data.visitedRoomId;
      }

      if (data.guardBattleWon) {
        this.returnedFromGuardBattleWon = true;
      }
    }
  }

  create() {
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);

    this.ready = true;
    this.enteringDoor = false;
    this.guardCutsceneRunning = false;
    this.guardBattleStarted = false;
    this.guardLootSpawned = false;
    this.currentInteractable = null;
    this.guardLootDrops = [];

    this.guardBattleWon = false;
    this.guardGunCollected = false;
    this.crowbarCollected = false;

    if (!Array.isArray(this.registry.get("floor2VisitedRooms"))) {
      this.registry.set("floor2VisitedRooms", []);
    }

    if (this.justVisitedRoomId) {
      const visitedRooms = this.registry.get("floor2VisitedRooms");

      if (!visitedRooms.includes(this.justVisitedRoomId)) {
        visitedRooms.push(this.justVisitedRoomId);
      }

      this.registry.set("floor2VisitedRooms", visitedRooms);
    }

    if (this.returnedFromGuardBattleWon) {
      this.guardBattleWon = true;
      this.canMove = true;
      this.registry.set("floor2GuardBattleWon", true);
    }

    if (this.registry.get("floor2GuardBattleWon")) {
      this.guardBattleWon = true;
    }

    if (this.registry.get("floor2GuardGunCollected")) {
      this.guardGunCollected = true;
    }

    this.canMove = this.guardBattleWon;

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

    this.doorConfigs = this.setupFloor2DoorConfigs();

    this.createWorld();
    this.createCinemaBorders();
    this.createDialogueBox();
    this.createPauseButton();
    this.createObjectiveHeader();
    this.createInteractionPrompt();
    this.createKeys();

    this.updateObjectiveHeader("Search Floor 2");

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
    this.entryBlack.setScrollFactor(0);
    this.entryBlack.setAlpha(1);

    this.tweens.add({
      targets: this.entryBlack,
      alpha: 0,
      duration: 650,
      ease: "Sine.Out",
      onComplete: async () => {
        this.entryBlack.destroy();

        await this.saveFloor2StartHallwayStateToDb();
        await this.loadFloor2GuardStateFromDb();
        await this.loadFloor2CrowbarStateFromDb();
        this.updateGuardObjectsAfterLoad();
        if (this.guardBattleWon) {
          this.canMove = true;
          this.guardCutsceneRunning = false;

          if (this.introBrute) {
            this.introBrute.setVisible(false);
          }

          return;
        }

        this.time.delayedCall(1000, async () => {
          await this.loadFloor2GuardStateFromDb();

          this.updateGuardObjectsAfterLoad();

          if (this.guardBattleWon) {
            this.canMove = true;

            if (this.introBrute) {
              this.introBrute.setVisible(false);
            }

            return;
          }

          this.startGuardIntroCutscene();
        });
      },
    });
  }

  setupFloor2DoorConfigs() {
    const existingConfigs = this.registry.get("floor2DoorConfigs");

    if (Array.isArray(existingConfigs)) {
      if (existingConfigs.length === 3) {
        return existingConfigs;
      }
    }

    const safeDoorIndex = Phaser.Math.Between(0, 2);
    const configs = [];

    for (let i = 0; i < 3; i += 1) {
      const hasZombie = i !== safeDoorIndex;
      let enemies = [];

      if (hasZombie) {
        enemies = this.getRandomFloor2EnemySetup();
      }

      configs.push({
        roomId: `floor2-room-${i + 1}`,
        hasZombie,
        zombieCleared: false,
        enemies,
      });
    }

    this.registry.set("floor2DoorConfigs", configs);

    return configs;
  }

  getRandomFloor2EnemySetup() {
    const options = [
      [
        {
          id: "walker",
          count: 1,
        },
        {
          id: "runner",
          count: 2,
        },
      ],

      [
        {
          id: "runner",
          count: 1,
        },
        {
          id: "brute",
          count: 1,
        },
      ],

      [
        {
          id: "walker",
          count: 1,
        },
        {
          id: "runner",
          count: 1,
        },
      ],

      [
        {
          id: "walker",
          count: 2,
        },
        {
          id: "runner",
          count: 1,
        },
      ],

      [
        {
          id: "brute",
          count: 1,
        },
      ],

      [
        {
          id: "walker",
          count: 2,
        },
        {
          id: "brute",
          count: 1,
        },
      ],

      [
        {
          id: "walker",
          count: 1,
        },
        {
          id: "runner",
          count: 1,
        },
        {
          id: "brute",
          count: 1,
        },
      ],
    ];

    const index = Phaser.Math.Between(0, options.length - 1);

    return JSON.parse(JSON.stringify(options[index]));
  }

  createWorld() {
    this.bg = this.add.rectangle(0, 0, world_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

    this.segmentInfo = [];
    this.classroomDoors = [];

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

    this.createGuardEncounterObjects();
    this.createEndHallwayObjects();
  }

  createEndHallwayObjects() {
    const endSegment = this.segmentInfo[0];

    if (!endSegment) {
      return;
    }

    this.stairwellX = endSegment.left + 110;
    this.stairwellY = endSegment.floorY + 8;

    this.stairwellZone = this.add.rectangle(
      this.stairwellX,
      this.stairwellY - 80,
      120,
      220,
      0x00ff00,
      0,
    );

    this.stairwellZone.setOrigin(0.5);
    this.stairwellZone.setDepth(5);
    this.stairwellZone.setVisible(false);

    this.crowbarX = endSegment.left + 315;
    this.crowbarY = endSegment.floorY - 5;

    this.crowbar = this.add.image(this.crowbarX, this.crowbarY, "item-crow-bar");
    this.crowbar.setOrigin(0.5, 1);
    this.crowbar.setDepth(22);
    this.crowbar.setScale(85 / this.crowbar.height);

    if (this.crowbarCollected) {
      this.crowbar.setVisible(false);
    }
  }

  makeHallwaySegment(index) {
    const x = index * main_width;

    const background = this.add.image(
      x + main_width / 2,
      110,
      "floor2-background-2",
    );

    background.setOrigin(0.5, 0);
    background.setDepth(1);
    background.setScale(main_width / background.width);

    const left = background.x - background.displayWidth * background.originX;

    const bottom =
      background.y + background.displayHeight * (1 - background.originY);

    const floorY = bottom - 45;

    const locker = this.add.image(left + 965, floorY + 8, "floor2-locker-2");
    locker.setOrigin(0.5, 1);
    locker.setDepth(11);
    locker.setScale(335 / locker.height);

    const doorPositions = {
      1: {
        xOffset: 360,
        yOffset: 238,
      },

      2: {
        xOffset: 650,
        yOffset: 238,
      },

      3: {
        xOffset: 460,
        yOffset: 238,
      },
    };

    const doorInfo = doorPositions[index];

    if (doorInfo) {
      const door = this.add.image(
        left + doorInfo.xOffset,
        background.y + doorInfo.yOffset,
        "floor2-door-2",
      );

      door.setOrigin(0.5, 0);
      door.setDepth(18);
      door.setScale((main_width / background.width) * 1.037);

      const doorConfig = this.doorConfigs[index - 1];

      this.classroomDoors.push({
        door,
        roomId: doorConfig.roomId,
        configIndex: index - 1,
        hasZombie: doorConfig.hasZombie,
        zombieCleared: doorConfig.zombieCleared,
        enemies: doorConfig.enemies,
        enterX: door.x,
        enterY: floorY + 8,
      });
    }

    this.segmentInfo.push({
      index,
      left,
      floorY,
      background,
      locker,
    });
  }

  createGuardEncounterObjects() {
    const firstSegment = this.segmentInfo[hallway_segments - 1];

    if (!firstSegment) {
      return;
    }

    this.guardX = firstSegment.left + 500;
    this.guardY = firstSegment.floorY + 65;

    this.guardBody = this.add.image(
      this.guardX,
      this.guardY + 13,
      "floor2-guard",
    );
    this.guardBody.setOrigin(0.5, 1);
    this.guardBody.setDepth(20);
    this.guardBody.setScale(230 / this.guardBody.height);

    this.guardGun = this.add.image(
      this.guardX + 120,
      this.guardY - 18,
      "item-gun",
    );

    this.guardGun.setOrigin(0.5);
    this.guardGun.setDepth(21);
    this.guardGun.setScale(70 / this.guardGun.height);

    this.guardGun.setVisible(false);

    // Only brute now. It starts visible behind the guard.
    this.introBrute = this.add.image(
      this.guardX - 400,
      this.guardY - 32,
      "knowledge-brute-right",
    );

    this.introBrute.setOrigin(0.5, 1);
    this.introBrute.setDepth(16);
    this.introBrute.setScale(450 / this.introBrute.height);
    this.introBrute.setVisible(false);
  }

  createCinemaBorders() {
    const topH = 90;
    const bottomH = 95;

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

  panCameraTo(targetX, targetY, duration, onComplete) {
    this.cameras.main.pan(
      targetX,
      targetY,
      duration,
      Phaser.Math.Easing.Sine.InOut,
    );

    this.time.delayedCall(duration, () => {
      if (onComplete) {
        onComplete();
      }
    });
  }

  async startGuardIntroCutscene() {
    await this.loadFloor2GuardStateFromDb();

    this.updateGuardObjectsAfterLoad();

    if (this.guardBattleWon) {
      this.canMove = true;

      if (this.introBrute) {
        this.introBrute.setVisible(false);
      }

      return;
    }

    if (this.guardCutsceneRunning) {
      return;
    }

    this.guardCutsceneRunning = true;
    this.canMove = false;
    this.hideInteractionPrompt();

    if (this.guardGun) {
      this.guardGun.setVisible(false);
    }

    this.panCameraTo(this.guardX, this.guardY - 120, 1000, () => {
      this.playFloor2GuardDialogue();
    });
  }

  playFloor2GuardDialogue() {
    const dialogueData = this.cache.json.get("dialogue-floor2-guard");

    if (!dialogueData) {
      console.warn("Missing dialogue-floor2-guard.");
      this.spawnGuardIntroZombies();
      return;
    }

    this.dialogueBox.setVisible(true);

    if (this.dialogue) {
      this.dialogue.destroy();
      this.dialogue = null;
    }

    this.dialogue = new DialogueRunner(this, {
      data: dialogueData,
      box: this.dialogueBox,
      boxPadX: 78,
      boxPadY: 34,
      fontSize: 26,
      typeSpeed: 28,
      onDone: () => {
        this.hideDialogueUI();
        this.spawnGuardIntroZombies();
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

  spawnGuardIntroZombies() {
    this.introBrute.setVisible(true);

    // Start behind the guard.
    this.introBrute.x = this.guardX - 330;
    this.introBrute.y = this.guardY - 32;
    this.introBrute.setDepth(16);

    // Move in front visually after it starts moving.
    this.time.delayedCall(180, () => {
      this.introBrute.setDepth(22);
    });

    this.tweens.add({
      targets: this.introBrute,
      x: this.guardX + 15,
      duration: 850,
      ease: "Sine.Out",
      onComplete: () => {
        this.panBackToPlayersThenToZombies();
      },
    });
  }

  panBackToPlayersThenToZombies() {
    this.panCameraTo(this.kim.x, this.kim.y - 130, 700, () => {
      this.time.delayedCall(350, () => {
        this.panCameraTo(this.guardX, this.guardY - 120, 700, () => {
          this.playZombieAlertAndStartBattle();
        });
      });
    });
  }

  playZombieAlertAndStartBattle() {
    this.showAgroIcon(this.introBrute.x + 80, this.introBrute.y - 500);

    this.time.delayedCall(850, () => {
      this.startGuardBattle();
    });
  }

  showAgroIcon(x, y) {
    const icon = this.add.image(x, y, "agro-icon");
    icon.setOrigin(0.5);
    icon.setDepth(5000);
    icon.setScale(90 / icon.height);
    icon.setAlpha(0);

    this.tweens.add({
      targets: icon,
      alpha: 1,
      y: y - 18,
      duration: 180,
      ease: "Back.Out",
      onComplete: () => {
        this.time.delayedCall(450, () => {
          this.tweens.add({
            targets: icon,
            alpha: 0,
            duration: 180,
            ease: "Sine.In",
            onComplete: () => {
              icon.destroy();
            },
          });
        });
      },
    });
  }

  async startGuardBattle() {
    if (this.guardBattleStarted) {
      return;
    }

    this.guardBattleStarted = true;
    this.canMove = false;
    await this.saveSpecialEncounteredEnemies(["brute"]);

    const blackScreen = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      1,
    );

    blackScreen.setOrigin(0, 0);
    blackScreen.setScrollFactor(0);
    blackScreen.setDepth(999999);
    blackScreen.setAlpha(0);

    await new Promise((resolve) => {
      this.tweens.add({
        targets: blackScreen,
        alpha: 1,
        duration: 600,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    this.scene.start("FightScene", {
      area: "school-hallway",
      chapterName: "floor2-starthallway",
      enemies: [
        {
          id: "brute",
          count: 1,
        },
      ],

      battleReturnScene: "Floor2StartHallway",
      battleReturnData: {
        guardBattleWon: true,
        startX: this.guardX,
      },

      battleLoseScene: "Floor2StartHallway",
      battleLoseData: {},
    });
  }

  async saveFloor2StartHallwayStateToDb() {
    const data = await loadGameData();

    if (!data.currentStoryState) {
      data.currentStoryState = {};
    }

    data.currentStoryState.chapterName = "floor2-starthallway";
    data.currentStoryState.chapterObjective = null;
    data.currentStoryState.checkPoint = null;

    if (!data.floor2Guard) {
      data.floor2Guard = {};
    }

    if (this.returnedFromGuardBattleWon) {
      data.floor2Guard.battleWon = true;
    }

    if (this.guardBattleWon) {
      data.floor2Guard.battleWon = true;
    }

    if (this.registry.get("floor2GuardBattleWon")) {
      data.floor2Guard.battleWon = true;
    }

    if (this.guardGunCollected) {
      data.floor2Guard.gunCollected = true;
    }

    if (this.registry.get("floor2GuardGunCollected")) {
      data.floor2Guard.gunCollected = true;
    }

    await saveGameData(data);

    console.log("SAVED FLOOR 2 START HALLWAY STATE:", data.floor2Guard);
  }
  updateGuardObjectsAfterLoad() {
    if (this.introBrute) {
      if (this.guardBattleWon) {
        this.introBrute.setVisible(false);
      } else {
        this.introBrute.x = this.guardX - 400;
        this.introBrute.y = this.guardY - 32;
        this.introBrute.setDepth(16);
        this.introBrute.setVisible(true);
      }
    }

    if (this.guardGun) {
      this.guardGun.setVisible(false);

      if (this.guardBattleWon) {
        if (!this.guardGunCollected) {
          this.guardGun.setVisible(true);
        }
      }
    }
  }
  async loadFloor2CrowbarStateFromDb() {
    const data = await loadGameData();

    if (!data.floor2Hallway) {
      return;
    }

    if (data.floor2Hallway.crowbarCollected) {
      this.crowbarCollected = true;

      if (this.crowbar) {
        this.crowbar.setVisible(false);
      }
    }
  }

  async saveFloor2CrowbarCollectedToDb() {
    const data = await loadGameData();

    if (!data.floor2Hallway) {
      data.floor2Hallway = {};
    }

    data.floor2Hallway.crowbarCollected = true;

    await saveGameData(data);
  }

  async loadFloor2GuardStateFromDb() {
    const data = await loadGameData();
    console.log("LOADED FLOOR 2 GUARD STATE:", data.floor2Guard);
    if (!data.floor2Guard) {
      return;
    }

    if (data.floor2Guard.battleWon) {
      this.guardBattleWon = true;
      this.canMove = true;
      this.registry.set("floor2GuardBattleWon", true);

      if (this.introBrute) {
        this.introBrute.setVisible(false);
      }
    }

    if (data.floor2Guard.gunCollected) {
      this.guardGunCollected = true;
      this.registry.set("floor2GuardGunCollected", true);

      if (this.guardGun) {
        this.guardGun.setVisible(false);
      }
    }
  }

  async saveFloor2GuardBattleWonToDb() {
    this.guardBattleWon = true;
    this.registry.set("floor2GuardBattleWon", true);

    await this.saveFloor2StartHallwayStateToDb();
  }

  async saveFloor2GuardGunCollectedToDb() {
    const data = await loadGameData();

    if (!data.floor2Guard) {
      data.floor2Guard = {};
    }

    data.floor2Guard.gunCollected = true;

    await saveGameData(data);
  }
  async saveSpecialEncounteredEnemies(enemyIds) {
    const data = await loadGameData();

    if (!Array.isArray(data.encounteredEnemies)) {
      data.encounteredEnemies = [];
    }

    enemyIds.forEach((enemyId) => {
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

  spawnGuardLootDrops() {
    if (this.guardLootSpawned) {
      return;
    }

    this.guardLootSpawned = true;
    this.guardLootDrops = [];

    const totalDrops = 6;

    for (let i = 0; i < totalDrops; i += 1) {
      const item = this.getRandomGuardConsumable();
      const dropX = this.guardX - 80 + i * 34;
      const dropY = this.guardY - 10;

      const sprite = this.add.image(dropX, dropY, item.icon);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(25 + i);
      sprite.setScale(62 / sprite.height);

      this.guardLootDrops.push({
        id: item.id,
        icon: item.icon,
        name: item.name,
        sprite,
        collected: false,
      });
    }
  }

  getRandomGuardConsumable() {
    const pool = [
      {
        id: "onigiri",
        name: "Onigiri",
        icon: "item-onigiri",
      },
      {
        id: "bandage",
        name: "Bandage",
        icon: "item-bandage",
      },
      {
        id: "energy_drink",
        name: "Energy Drink",
        icon: "item-energy-drink",
      },
      {
        id: "whistle",
        name: "Whistle",
        icon: "item-whistle",
      },
    ];

    const index = Phaser.Math.Between(0, pool.length - 1);

    return pool[index];
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
    if (this.enteringDoor) {
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

    const minX = 120;
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

    if (this.guardBattleWon) {
      if (!this.guardGunCollected) {
        const gunDistance = Phaser.Math.Distance.Between(
          this.kim.x,
          this.kim.y,
          this.guardGun.x,
          this.guardY,
        );

        if (gunDistance < nearestDistance) {
          nearestDistance = gunDistance;
          nearest = {
            type: "guard-gun",
            x: this.guardGun.x,
            y: this.guardGun.y,
          };
        }
      }

      this.guardLootDrops.forEach((drop, index) => {
        if (drop.collected) {
          return;
        }

        if (!drop.sprite) {
          return;
        }

        const distance = Phaser.Math.Distance.Between(
          this.kim.x,
          this.kim.y,
          drop.sprite.x,
          this.guardY,
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = {
            type: "guard-loot",
            drop,
            index,
            x: drop.sprite.x,
            y: drop.sprite.y,
          };
        }
      });
    }

    if (!this.crowbarCollected) {
      if (this.crowbar) {
        if (this.crowbar.visible) {
          const crowbarDistance = Phaser.Math.Distance.Between(
            this.kim.x,
            this.kim.y,
            this.crowbar.x,
            this.crowbar.y,
          );

          if (crowbarDistance < nearestDistance) {
            nearestDistance = crowbarDistance;

            nearest = {
              type: "crowbar",
              x: this.crowbar.x,
              y: this.crowbar.y,
            };
          }
        }
      }
    }

    if (this.stairwellZone) {
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
    }

    this.classroomDoors.forEach((entry) => {
      const visitedRooms = this.registry.get("floor2VisitedRooms") || [];

      if (visitedRooms.includes(entry.roomId)) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        this.kim.x,
        this.kim.y,
        entry.enterX,
        entry.enterY,
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = {
          type: "classroom-door",
          entry,
          x: entry.enterX,
          y: entry.enterY,
        };
      }
    });

    if (!nearest) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearestDistance > 170) {
      this.hideInteractionPrompt();
      return;
    }

    if (nearest.type === "guard-gun") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 120,
        "E TO PICK UP",
        "Gun",
      );
    }

    if (nearest.type === "guard-loot") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 110,
        "E TO PICK UP",
        nearest.drop.name,
      );
    }

    if (nearest.type === "crowbar") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 115,
        "E TO PICK UP",
        "Crowbar",
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

    if (nearest.type === "classroom-door") {
      this.showInteractionPrompt(
        nearest.x,
        nearest.y - 330,
        "E TO ENTER",
        "Classroom",
      );
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (nearest.type === "guard-gun") {
        this.pickupGuardGun();
        return;
      }

      if (nearest.type === "guard-loot") {
        this.pickupGuardLoot(nearest.drop);
        return;
      }

      if (nearest.type === "crowbar") {
        this.pickupCrowbar();
        return;
      }

      if (nearest.type === "stairwell") {
        this.enterStairwellToFloor3();
        return;
      }

      if (nearest.type === "classroom-door") {
        this.enterReusableClassroom(nearest.entry);
      }
    }
  }

  async pickupGuardGun() {
    if (this.guardGunCollected) {
      return;
    }

    this.guardGunCollected = true;
    this.registry.set("floor2GuardGunCollected", true);
    await this.saveFloor2GuardGunCollectedToDb();
    this.hideInteractionPrompt();

    await this.addUniqueWeaponToSave("gun");
    await this.playLootFlyToInventory(this.guardGun);
  }

  async pickupGuardLoot(drop) {
    if (!drop) {
      return;
    }

    if (drop.collected) {
      return;
    }

    drop.collected = true;
    this.hideInteractionPrompt();

    await this.addConsumableToSave(drop.id, 1);
    await this.playLootFlyToInventory(drop.sprite);
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

      const targetX = this.cameras.main.scrollX + main_width - 78;
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
          sourceSprite.destroy();
          resolve();
        },
      });
    });
  }

  async addUniqueWeaponToSave(weaponId) {
    const data = await loadGameData();

    if (!data.inventory) {
      data.inventory = {};
    }

    if (!Array.isArray(data.inventory.weapons)) {
      data.inventory.weapons = [];
    }

    if (!data.inventory.weapons.includes(weaponId)) {
      data.inventory.weapons.push(weaponId);
    }

    await saveGameData(data);
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

  async pickupCrowbar() {
    if (this.crowbarCollected) {
      return;
    }

    if (!this.crowbar) {
      return;
    }

    this.crowbarCollected = true;
    this.hideInteractionPrompt();

    await this.addUniqueWeaponToSave("crow_bar");
    await this.saveFloor2CrowbarCollectedToDb();
    await this.playLootFlyToInventory(this.crowbar);
  }

  async enterStairwellToFloor3() {
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
      targetFloor: 3,
      nextScene: "Floor3StartHallway",
      nextChapter: "floor3-starthallway",
      floorTitleText: "FLOOR 3",
    });

    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    this.scene.bringToTop("InventoryOverlay");
  }

  async enterReusableClassroom(entry) {
    if (this.enteringDoor) {
      return;
    }

    this.enteringDoor = true;
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

    this.scene.start("ReusableLootClassroom", {
      roomId: entry.roomId,
      returnScene: "Floor2StartHallway",
      hallwayReturnX: entry.enterX,
      doorConfigIndex: entry.configIndex,
      hasZombie: entry.hasZombie && !entry.zombieCleared,
      enemySetup: entry.enemies,
    });

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
