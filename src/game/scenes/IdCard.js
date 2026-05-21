import Phaser, { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import { setCurrentChapterName } from "../db";

const main_width = 1600;
const main_height = 900;

export class IdCard extends Scene {
  constructor() {
    super("IdCard");
  }

  fadeTargets(targets, alpha, duration, ease) {
    return new Promise((resolve) => {
      this.tweens.add({
        targets,
        alpha,
        duration,
        ease,
        onComplete: resolve,
      });
    });
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

    const pixel = this.add.image(x, y - 6, "alarm-pixel");

    pixel.setOrigin(0.5);
    pixel.setDepth(1501);
    pixel.setBlendMode(screen);
    pixel.setAlpha(0);
    pixel.setVisible(false);

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

    // const YofAlarm = 125;
    // const LXAlarm = 105;
    // const rightXAlarm = main_width - 105;

    // const the = 1250;

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

  // when the aciotn for the id card shwos, make a seprate dialogue
  // that shwo sup during the card scene
  // /because normally it wont show up
  dialogueONCardScene(lines) {
    return new Promise((resolve) => {
      const box = this.add.image(
        main_width / 2,
        main_height - 28,
        "dialogue-box",
      );

      box.setOrigin(0.5, 1);
      box.setDepth(10010);

      box.setAlpha(0);

      const boxScale = 1470 / box.width;
      box.setScale(boxScale);

      const boxLeft = box.x - box.displayWidth * box.originX;

      const boxTop = box.y - box.displayHeight * box.originY;
      const boxW = box.displayWidth;
      const boxH = box.displayHeight;

      const textObj = this.add.text(boxLeft + 78, boxTop + 34, "", {
        fontFamily: "Dogica",
        fontSize: "26px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
        wordWrap: { width: boxW - 78 * 2 - 80 },
        lineSpacing: 10,
      });

      textObj.setOrigin(0, 0);

      textObj.setDepth(10011);
      textObj.setAlpha(0);

      const nextArrow = this.add.text(
        boxLeft + boxW - 54,
        boxTop + boxH - 38,
        ">",
        {
          fontFamily: "DogicaBold",
          fontSize: "32px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
        },
      );

      nextArrow.setOrigin(0.5);
      nextArrow.setDepth(10012);

      nextArrow.setAlpha(0);
      nextArrow.setVisible(false);

      const zone = this.add.zone(
        boxLeft + boxW / 2,
        boxTop + boxH / 2,
        boxW,
        boxH,
      );

      zone.setOrigin(0.5);

      let fullText = "";
      zone.setDepth(10013);
      zone.setInteractive({ useHandCursor: false });

      let index = 0;

      let typedIndex = 0;
      let typeTimer = null;

      let isTyping = false;

      const cleanTimer = () => {
        if (typeTimer) {
          typeTimer.remove(false);
          typeTimer = null;
        }
      };

      const finishTyping = () => {
        cleanTimer();
        isTyping = false;
        textObj.setText(fullText);
        nextArrow.setVisible(true);
        nextArrow.setAlpha(1);
      };

      const startLine = () => {
        cleanTimer();

        const line = lines[index];

        if (line.speaker) {
          fullText = `${line.speaker}: ${line.text}`;
        } else {
          fullText = line.text;
        }

        typedIndex = 0;
        isTyping = true;

        textObj.setText("");

        nextArrow.setVisible(false);
        nextArrow.setAlpha(0);

        typeTimer = this.time.addEvent({
          delay: 28,
          loop: true,
          callback: () => {
            typedIndex += 1;
            textObj.setText(fullText.substring(0, typedIndex));

            if (typedIndex >= fullText.length) {
              finishTyping();
            }
          },
        });
      };

      const closeDialogue = () => {
        cleanTimer();
        zone.disableInteractive();

        this.tweens.add({
          targets: [box, textObj, nextArrow],
          alpha: 0,
          duration: 180,
          ease: "Cubic.In",
          onComplete: () => {
            box.destroy();
            textObj.destroy();
            nextArrow.destroy();
            zone.destroy();
            this.input.setDefaultCursor("default");
            resolve();
          },
        });
      };

      const press = () => {
        if (isTyping) {
          finishTyping();
          return;
        }

        index += 1;

        if (index >= lines.length) {
          closeDialogue();
          return;
        }

        startLine();
      };

      zone.on("pointerdown", press);

      zone.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
      });

      zone.on("pointerout", () => {
        this.input.setDefaultCursor("default");
      });

      this.tweens.add({
        targets: [box, textObj],
        alpha: 1,
        duration: 220,
        ease: "Cubic.Out",
        onComplete: startLine,
      });
    });
  }

  // tells the dialoguerunner that tthe aciton reovles so it can go back to the NEXT line int he .json each one has to be a promise or it wont work
  async runDialogueAction(line) {
    if (line.id === "showIDCard") {
      await new Promise((resolve) => {
        const targets = [];

        if (this.dialogueBox) {
          targets.push(this.dialogueBox);
        }

        if (this.dialogue) {
          if (this.dialogue.textObj) {
            targets.push(this.dialogue.textObj);
          }

          if (this.dialogue.hitZone) {
            this.dialogue.hitZone.disableInteractive();
          }

          if (this.dialogue.nextArrow) {
            this.dialogue.nextArrow.setVisible(false);
            this.dialogue.nextArrow.setAlpha(1);
          }
        }

        if (targets.length === 0) {
          resolve();
          return;
        }

        this.tweens.add({
          targets,
          alpha: 0,
          duration: 180,
          ease: "Cubic.In",
          onComplete: () => {
            targets.forEach((obj) => {
              obj.setVisible(false);
            });

            if (this.dialogue) {
              if (this.dialogue.nextArrow) {
                this.dialogue.nextArrow.setVisible(false);
                this.dialogue.nextArrow.setAlpha(1);
              }
            }

            resolve();
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

      blackScreen.setAlpha(0);

      await this.fadeTargets(blackScreen, 1, 500, "Cubic.In");

      const cardBackground = this.add.image(
        main_width / 2,
        main_height / 2,
        "id-card-card-background",
      );

      cardBackground.setOrigin(0.5);

      cardBackground.setDepth(9000);

      const cardBackgroundScale = Math.max(
        main_width / cardBackground.width,
        main_height / cardBackground.height,
      );

      cardBackground.setScale(cardBackgroundScale);

      const card = this.add.image(
        main_width / 2,
        main_height / 2 - 35,
        "id-card-card",
      );

      card.setOrigin(0.5);
      card.setDepth(9001);

      const cardScale = 650 / card.width;
      card.setScale(cardScale);

      await this.fadeTargets(blackScreen, 0, 650, "Sine.Out");

      await new Promise((resolve) => {
        this.time.delayedCall(2000, resolve);
      });

      await this.dialogueONCardScene([
        {
          speaker: "Meryl",
          text: "It's not that bad.",
        },
        {
          speaker: "Meryl",
          text: "I don't think you can retake it though.",
        },
      ]);

      await this.fadeTargets(blackScreen, 1, 500, "Cubic.In");

      cardBackground.destroy();
      card.destroy();

      if (this.dialogue) {
        if (this.dialogue.textObj) {
          this.dialogue.textObj.setText("");
        }

        if (this.dialogue.nextArrow) {
          this.dialogue.nextArrow.setVisible(false);
          this.dialogue.nextArrow.setAlpha(1);
        }
      }

      if (this.dialogueBox) {
        this.dialogueBox.setVisible(true);
        this.dialogueBox.setAlpha(1);
      }

      if (this.dialogue) {
        if (this.dialogue.textObj) {
          this.dialogue.textObj.setVisible(true);
          this.dialogue.textObj.setAlpha(1);
        }

        if (this.dialogue.hitZone) {
          this.dialogue.hitZone.setInteractive({ useHandCursor: false });
        }
      }

      await this.fadeTargets(blackScreen, 0, 650, "Sine.Out");

      blackScreen.destroy();

      return;
    }

    if (line.id === "schoolAlarm") {
      this.startSchoolAlarm();
      return;
    }

    if (line.id === "studentRunningBy") {
      // ill create temp black boxes  movintg by
      // noa ssets for acutralr unnign by students exsit yet
      await new Promise((resolve) => {
        this.studentRunCount += 1;

        const goesLeft = this.studentRunCount === 1;

        let startX = main_width + 520;
        let endX = -620;

        if (!goesLeft) {
          startX = -520;
          endX = main_width + 620;
        }

        const group = this.add.container(startX, this.floorY + 18);
        group.setDepth(40);

        const makeBoxStudent = (x, y, w, h, alpha) => {
          const box = this.add.rectangle(x, y, w, h, 0x080808, alpha);
          box.setOrigin(0.5, 1);
          group.add(box);
          return box;
        };

        makeBoxStudent(0, 0, 120, 345, 0.92);

        makeBoxStudent(-125, -8, 105, 315, 0.78);
        makeBoxStudent(130, -2, 130, 365, 0.88);

        makeBoxStudent(260, -16, 100, 300, 0.72);

        makeBoxStudent(-255, -6, 125, 335, 0.82);
        makeBoxStudent(370, -10, 110, 320, 0.76);

        if (goesLeft) {
          makeBoxStudent(260, -30, 300, 180, 0.24);
          makeBoxStudent(440, -45, 370, 150, 0.15);

          makeBoxStudent(610, -55, 420, 125, 0.09);
        } else {
          makeBoxStudent(-260, -30, 300, 180, 0.24);
          makeBoxStudent(-440, -45, 370, 150, 0.15);
          makeBoxStudent(-610, -55, 420, 125, 0.09);
        }

        this.tweens.add({
          targets: group,
          x: endX,
          duration: 980,
          ease: "Cubic.InOut",
          onComplete: () => {
            group.destroy(true);
            resolve();
          },
        });
      });

      return;
    }

    if (line.id === "walkIntoDoorAndFadeCharacters") {
      await new Promise((resolve) => {
        const doorX = this.doorWalkX;

        const doorY = this.floorY + 8;

        const openDoor = () => {
          if (this.doorOpened) {
            return;
          }

          this.doorOpened = true;
          this.door.setTexture("id-card-door-open");
        };

        this.tweens.add({
          targets: this.kim,
          x: doorX - 25,
          y: doorY,
          duration: 520,
          ease: "Sine.InOut",
          onComplete: () => {
            openDoor();

            this.tweens.add({
              targets: this.kim,
              x: doorX - 5,
              alpha: 0,
              duration: 260,
              ease: "Cubic.In",
              onComplete: () => {
                this.kim.setVisible(false);

                this.tweens.add({
                  targets: this.meryl,
                  x: doorX + 25,
                  y: doorY,
                  duration: 520,
                  ease: "Sine.InOut",
                  onComplete: () => {
                    this.tweens.add({
                      targets: this.meryl,
                      x: doorX + 5,
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

      return;
    }

    // / moves to the next scene after this action
    if (line.id === "goToClassroom") {
      await new Promise((resolve) => {
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

        this.tweens.add({
          targets: blackScreen,
          alpha: 1,
          duration: 650,
          ease: "Cubic.In",
          onComplete: resolve,
        });
      });

      this.input.setDefaultCursor("default");

      if (this.game) {
        if (this.game.canvas) {
          this.game.canvas.style.cursor = "default";
        }
      }

      // swithc to next scene
      this.scene.start("Classroom");

      // bring back menu
      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");

      return;
    }

    // console.log("something broke idk")
  }

  create() {
    this.game.canvas.style.cursor = "default";

    // reset if player dies in the fight scene cause they are shit at the game
    this.schoolAlarmStarted = false;
    this.schoolAlarmTweens = null;
    this.leftAlarm = null;
    this.rightAlarm = null;
    this.OVERLAYlockdown = null;
    this.LOCKDOWNRedCircleStuff = null;
    this.doorOpened = false;
    this.studentRunCount = 0;

    setCurrentChapterName("id-card").catch((error) => {
      console.log("wegwiuregkhkj broken");
    });

    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000, 1);
    this.bg.setOrigin(0, 0);

    this.bg.setDepth(-20);

    const tb_vh = 110;
    const tb_vhEXTRA = 110;

    this.topCinemaBorder = this.add.rectangle(
      0,
      -tb_vhEXTRA,
      main_width,
      tb_vh + tb_vhEXTRA,
      0x000000,
      1,
    );

    this.topCinemaBorder.setOrigin(0, 0);

    this.topCinemaBorder.setDepth(2000);

    // const bb_vh = 100;
    // const

    const bb_vhEXTRA = 250;

    this.bottomCinemaBorder = this.add.rectangle(
      0,
      main_height - 100,
      main_width,
      100 + bb_vhEXTRA,
      0x000000,
      1,
    );

    this.bottomCinemaBorder.setOrigin(0, 0);

    this.bottomCinemaBorder.setDepth(2000);

    const mancrazy = main_width / 2;

    // const test = 110;
    // const bgwdith = main_width;

    this.background = this.add.image(mancrazy, 110, "id-card-background");

    this.background.setOrigin(0.5, 0);

    this.background.setDepth(1);

    // const bscale = ;

    this.background.setScale(main_width / this.background.width);

    const bgLeft =
      this.background.x -
      this.background.displayWidth * this.background.originX;

    const bgBottom =
      this.background.y +
      this.background.displayHeight * (1 - this.background.originY);

    this.floorY = bgBottom - 45;
    this.doorWalkX = bgLeft + 380;

    this.door = this.add.image(
      this.background.x - 400,
      this.background.y + 70,
      "id-card-full-door",
    );

    this.door.setOrigin(this.background.originX, this.background.originY);
    this.door.setDepth(10);
    const bRUH = main_width / this.background.width;
    this.door.setScale(bRUH * 1.037);

    this.locker = this.add.image(
      bgLeft + 965,
      this.floorY + 8,
      "id-card-locker",
    );

    this.locker.setOrigin(0.5, 1);
    this.locker.setDepth(11);

    this.locker.setScale(335 / this.locker.height);

    this.kim = this.add.image(bgLeft + 585, this.floorY + 8, "id-card-kim");
    this.kim.setOrigin(0.5, 1);

    this.kim.setDepth(20);

    this.kim.setScale(335 / this.kim.height);

    this.meryl = this.add.image(bgLeft + 755, this.floorY + 8, "id-card-meryl");
    this.meryl.setOrigin(0.5, 1);

    this.meryl.setDepth(20);

    // const test2char = 335 / this.meryl.height;
    this.meryl.setScale(335 / this.meryl.height);

    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);

    this.pauseButton.setDepth(3100);

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
      if (!this.scene.isActive("PauseMenuOverlay")) {
        this.scene.launch("PauseMenuOverlay");
      }

      const pauseMenu = this.scene.get("PauseMenuOverlay");

      if (pauseMenu) {
        if (pauseMenu.open) {
          pauseMenu.open(this.scene.key);
        }
      }
    });

    this.dialogueBox = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialogueBox.setOrigin(0.5, 1);

    this.dialogueBox.setDepth(3000);

    const dialogueBoxScale = 1470 / this.dialogueBox.width;
    this.dialogueBox.setScale(dialogueBoxScale);

    const dialogueData = this.cache.json.get("dialogue-id-card");

    this.dialogue = new DialogueRunner(this, {
      data: dialogueData,
      box: this.dialogueBox,

      boxPadX: 78,
      boxPadY: 34,

      fontSize: 26,
      typeSpeed: 28,

      onAction: async (line) => {
        await this.runDialogueAction(line);
      },

      onDone: () => {
        console.log("id-card dialogue finished");
      },
    });

    this.dialogue.start();

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
      if (!this.scene.isActive("PauseMenuOverlay")) {
        this.scene.launch("PauseMenuOverlay");
      }

      const pauseMenu = this.scene.get("PauseMenuOverlay");

      if (pauseMenu) {
        if (pauseMenu.open) {
          pauseMenu.open(this.scene.key);
        }
      }
    });

    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");

      if (this.schoolAlarmTweens) {
        this.schoolAlarmTweens.forEach((tween) => {
          if (tween) {
            tween.stop();
          }
        });

        this.schoolAlarmTweens = null;
      }

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });
  }
}
