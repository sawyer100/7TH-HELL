import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import {
  setCurrentChapterName,
  setChapterObjective,
  setInventoryUnlocked,
} from "../db";

const main_width = 1600;
const main_height = 900;

export class Classroom extends Scene {
  constructor() {
    super("Classroom");
  }

  create() {
    //defualt  cursor
    this.game.canvas.style.cursor = "default";
    setCurrentChapterName("classroom").catch((error) => {
      console.log("werwl");
    });

    setInventoryUnlocked(false).catch((error) => {
      console.log("werew");
    });

    this.canMove = false;
    this.dialogueActive = false;
    this.objectiveMode = null;
    this.collectingBag = false;
    this.endingScene = false;
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(-20);

    // palce holder because we dont have classroom background rn
    this.roomX = 420;
    this.roomY = 0;

    this.roomW = 760;
    this.roomH = main_height;
    this.roomBg = this.add.rectangle(
      this.roomX,
      this.roomY,
      this.roomW,
      this.roomH,
      0x8b0000,
      1,
    );

    this.roomBg.setOrigin(0, 0);

    this.roomBg.setDepth(1);

    // temporarry door
    this.doorX = this.roomX + this.roomW - 130;
    this.doorY = 70;

    this.doorTarget = this.add.rectangle(
      this.doorX,
      this.doorY,
      190,
      95,
      0x3b0000,
      1,
    );

    this.doorTarget.setOrigin(0.5);
    this.doorTarget.setDepth(2);

    this.doorLabel = this.add.text(this.doorX, this.doorY, "DOOR", {
      fontFamily: "DogicaBold",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    this.doorLabel.setOrigin(0.5);
    this.doorLabel.setDepth(3);

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
    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);

    this.pauseButton.setDepth(3100);

    // const pauseSize = 78;

    const pScaleX = 78 / this.pauseButton.width;
    const pScaleY = 78 / this.pauseButton.height;
    let pScaleOver = pScaleX;

    if (pScaleY < pScaleX) {
      pScaleOver = pScaleY;
    }

    this.pauseButton.setScale(pScaleOver);
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

    this.kim = this.add.image(
      this.roomX + this.roomW / 2,
      main_height - 190,
      "id-card-kim",
    );

    this.kim.setOrigin(0.5, 1);

    this.kim.setDepth(20);

    // const kimScale = 250 / this.kim.height;
    this.kim.setScale(250 / this.kim.height);

    this.meryl = this.add.image(this.doorX - 105, 165, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);

    this.meryl.setDepth(20);

    // const merylScale = 250 / this.meryl.height;

    this.meryl.setScale(250 / this.meryl.height);

    // Bag in the corner of the room.
    this.bag = this.add.image(
      this.roomX + 120,
      main_height - 135,
      "classroom-bag",
    );

    this.bag.setOrigin(0.5, 1);
    this.bag.setDepth(15);

    const bagScale = 120 / this.bag.height;
    this.bag.setScale(bagScale);

    this.interactPrompt = this.add.text(this.bag.x, this.bag.y - 150, "E", {
      fontFamily: "DogicaBold",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    });

    this.interactPrompt.setOrigin(0.5);

    this.interactPrompt.setDepth(3300);
    this.interactPrompt.setVisible(false);

    // WASD KEYB INDS
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.dialogueBox = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialogueBox.setOrigin(0.5, 1);
    this.dialogueBox.setDepth(3000);

    const portraitHeight = 340;

    const dialogueBoxScale = 1470 / this.dialogueBox.width;
    this.kimlIconThe = this.add.image(
      main_width / 2 - 520,
      main_height - 110,
      "classroom-kim-icon",
    );

    this.kimlIconThe.setOrigin(0.5, 1);

    this.kimlIconThe.setDepth(2999);

    this.merylIconThe = this.add.image(
      main_width / 2 - 520,
      main_height - 110,
      "classroom-meryl-icon",
    );
    this.kimlIconThe.setScale(portraitHeight / this.kimlIconThe.height);
    this.kimlIconThe.setVisible(false);
    this.merylIconThe.setScale(portraitHeight / this.merylIconThe.height);

    this.merylIconThe.setOrigin(0.5, 1);
    this.merylIconThe.setDepth(2999);

    this.merylIconThe.setVisible(false);

    this.dialogueBox.setScale(dialogueBoxScale);

    // load dialogue data
    this.dialogueData = this.cache.json.get("dialogue-classroom");

    // star inotr dialogue data
    this.startDialogue(this.dialogueData.lines, () => {
      if (this.objectiveMode === "findBag") {
        this.hideDialogueUI();
        this.canMove = true;
      }
    });

    //fade
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

    //cnea up after shutduowwn
    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");
      this.hideDialoguePortraits();

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });
  }

  update(time, delta) {
    this.updateDialoguePortrait();

    /// sopt input fomr gamapely
    if (this.dialogueActive) {
      this.interactPrompt.setVisible(false);
      return;
    }

    if (!this.canMove) {
      this.interactPrompt.setVisible(false);
      return;
    }

    if (this.collectingBag) {
      this.interactPrompt.setVisible(false);
      return;
    }

    // moving character
    this.charmoving(delta);

    this.updateBagInteraction();
    this.updateDoorLeave();
  }

  charmoving(delta) {
    const speed = 380;
    const dt = delta / 1000;

    let dx = 0;
    let dy = 0;

    if (this.aKey.isDown) {
      dx = dx - 1;
    }

    if (this.dKey.isDown) {
      dx = dx + 1;
    }

    if (this.wKey.isDown) {
      dy = dy - 1;
    }

    if (this.sKey.isDown) {
      dy = dy + 1;
    }

    if (dx !== 0) {
      if (dy !== 0) {
        dx = dx * 0.7071;
        dy = dy * 0.7071;
      }
    }

    this.kim.x += dx * speed * dt;

    this.kim.y += dy * speed * dt;

    const minX = this.roomX + 55;
    const maxX = this.roomX + this.roomW - 55;

    const minY = 115;

    const maxY = main_height - 105;

    this.kim.x = Phaser.Math.Clamp(this.kim.x, minX, maxX);

    this.kim.y = Phaser.Math.Clamp(this.kim.y, minY, maxY);
  }
  updateBagInteraction() {
    if (this.objectiveMode !== "findBag") {
      this.interactPrompt.setVisible(false);
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this.kim.x,
      this.kim.y,
      this.bag.x,
      this.bag.y,
    );

    const closeEnoughLol = dist < 120;

    this.interactPrompt.setVisible(closeEnoughLol);

    if (closeEnoughLol) {
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.collectBag();
      }
    }
  }

  updateDoorLeave() {
    // only leaveing works when leave room objective
    if (this.objectiveMode !== "leaveRoom") {
      return;
    }

    if (this.endingScene) {
      return;
    }

    let nearDoor = false;

    if (this.kim.y < 145) {
      if (this.kim.x > this.doorX - 130) {
        if (this.kim.x < this.doorX + 130) {
          nearDoor = true;
        }
      }
    }

    if (!nearDoor) {
      return;
    }

    this.endClassroomScene();
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

  updateObjectiveHeader(text) {
    // no objective hadaer if no obejcrive curernlty
    if (!text) {
      this.objectiveHeader.setVisible(false);
      this.objectiveHeader.setText("");
      return;
    }

    this.objectiveHeader.setText(`Objective: ${text}`);

    this.objectiveHeader.setVisible(true);
  }

  startDialogue(lines, onDone) {
    // rmeov eold dialogue runnerb  before starting a new dilaogue runne rblock
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
        id: "classroom-runtime-dialogue",
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

  updateDialoguePortrait() {
    // before it creatged dont do anythign
    if (!this.kimlIconThe) {
      return;
    }

    if (!this.merylIconThe) {
      return;
    }

    //  must be in dialogeu
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
      this.kimlIconThe.setVisible(true);
      this.merylIconThe.setVisible(false);
      return;
    }

    if (speaker === "Meryl") {
      this.kimlIconThe.setVisible(false);
      this.merylIconThe.setVisible(true);
      return;
    }

    this.hideDialoguePortraits();
  }

  hideDialoguePortraits() {
    if (this.kimlIconThe) {
      this.kimlIconThe.setVisible(false);
    }

    if (this.merylIconThe) {
      this.merylIconThe.setVisible(false);
    }
  }

  hideDialogueUI() {
    // hide box
    if (this.dialogueBox) {
      this.dialogueBox.setVisible(false);
    }

    // hide text
    if (this.dialogue) {
      if (this.dialogue.textObj) {
        this.dialogue.textObj.setVisible(false);
      }
    }

    // hide arrow
    if (this.dialogue) {
      if (this.dialogue.nextArrow) {
        this.dialogue.nextArrow.setVisible(false);
      }
    }

    if (this.dialogue) {
      if (this.dialogue.arrNextThing) {
        this.dialogue.arrNextThing.setVisible(false);
      }
    }

    if (this.dialogue) {
      if (this.dialogue.hitZone) {
        this.dialogue.hitZone.disableInteractive();
      }
    }

    if (this.dialogue) {
      if (this.dialogue.hitThing) {
        this.dialogue.hitThing.disableInteractive();
      }
    }

    this.hideDialoguePortraits();
  }

  async runDialogueAction(line) {
    // bag object
    if (line.id === "startFindBagObjective") {
      this.objectiveMode = "findBag";
      this.updateObjectiveHeader("Find Bag");

      // new oebjctive save
      try {
        await setChapterObjective("Find Bag", null);
      } catch (error) {
        console.log("wejkwre");
      }

      return;
    }

    if (line.id === "startLeaveRoomObjective") {
      this.objectiveMode = "leaveRoom";
      this.updateObjectiveHeader("Leave Classroom");

      try {
        await setChapterObjective("Leave Classroom", null);
      } catch (error) {
        console.warn("Could not save Leave Classroom objective.", error);
      }

      // movement only afrter dialogue finishes
      this.canMove = true;

      return;
    }

    console.log("EWkrnewurhw broekn");
  }

  async collectBag() {
    if (this.collectingBag) {
      return;
    }

    this.collectingBag = true;

    this.canMove = false;
    this.interactPrompt.setVisible(false);

    if (this.bag) {
      this.bag.setVisible(false);
    }

    try {
      await setInventoryUnlocked(true);
      await setChapterObjective(null, null);
    } catch (error) {
      console.log("Ewkrjkwhrw");
    }

    // show unlocked
    await this.showInventoryUnlocked();

    let afterBagLines = null;

    if (this.dialogueData) {
      afterBagLines = this.dialogueData.afterBagLines;
    }

    if (!afterBagLines) {
      afterBagLines = [
        {
          type: "say",
          speaker: "Kim",
          text: "Got it.",
        },
        {
          type: "say",
          speaker: "Meryl",
          text: "Come on.",
        },
        {
          type: "say",
          speaker: "Meryl",
          text: "Let's get out of here.",
        },
        {
          type: "action",
          id: "startLeaveRoomObjective",
        },
      ];
    }

    this.collectingBag = false;

    this.startDialogue(afterBagLines, () => {
      if (this.objectiveMode === "leaveRoom") {
        this.hideDialogueUI();
        this.canMove = true;
      }
    });
  }

  showInventoryUnlocked() {
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
      blocker.setAlpha(0);

      // Inventory unlocked image.
      const unlocked = this.add.image(
        main_width / 2,
        main_height / 2,
        "classroom-inventory-unlocked",
      );

      unlocked.setOrigin(0.5);
      unlocked.setDepth(9991);
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

  async endClassroomScene() {
    // no dpucliate scene ending
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

    this.scene.start("PostClassroomHallway");

    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    // console.log("eoned")
  }
}
