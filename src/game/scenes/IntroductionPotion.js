import { Scene } from "phaser";
import { DialogueRunner } from "./DialogueRunner";
import { setCurrentChapterName } from "../db";

const main_width = 1600;
const main_height = 900;

export class IntroductionPotion extends Scene {
  constructor() {
    super("IntroductionPotion");
  }

  // all actions in scene
  async runDialogueAction(line) {
    if (line.id === "raisePotion") {
      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.potion,

          y: this.potion.y - 80,
          duration: 450,
          ease: "Cubic.Out",
          onComplete: resolve,
        });
      });

      return;
    }

    if (line.id === "shakePotion") {
      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.potion,
          x: this.potion.x + 8,
          duration: 55,

          yoyo: true,
          repeat: 5,
          ease: "Sine.InOut",
          onComplete: resolve,
        });
      });

      return;
    }

    if (line.id === "drinkPotion") {
      await new Promise((resolve) => {
        this.tweens.add({
          targets: this.potion,
          alpha: 0,
          y: this.potion.y - 120,

          duration: 500,
          ease: "Cubic.In",
          onComplete: resolve,
        });
      });

      return;
    }

    if (line.id === "collapse") {
      await new Promise((resolve) => {
        const strtX = this.character.x;
        const strtY = this.character.y;

        const finalFantasyOmgY = strtY + 350;

        // pee time omg
        const pTime = 1500;

        const timeToFall = 700;

        const shakeStartTime = 700;

        const startBLT = 800;

        const blFadeT = 130;

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

        blackScreen.setDepth(2999);

        blackScreen.setAlpha(0);
        blackScreen.setVisible(true);

        const startFall = () => {
          this.tweens.add({
            targets: this.character,
            y: finalFantasyOmgY,
            duration: timeToFall,
            ease: "Cubic.In",
            onComplete: () => {
              blackScreen.setAlpha(1);

              this.character.setPosition(strtX, finalFantasyOmgY);
              this.character.setAngle(90);

              this.character.setAlpha(1);

              // holy shit
              this.time.delayedCall(2000, () => {
                this.tweens.add({
                  targets: blackScreen,
                  alpha: 0.98,
                  duration: 1500,
                  ease: "Sine.Out",
                  onComplete: () => {
                    this.tweens.add({
                      targets: blackScreen,
                      alpha: 1,
                      duration: 900,
                      ease: "Sine.In",
                      onComplete: () => {
                        this.tweens.add({
                          targets: blackScreen,
                          alpha: 0.9,
                          duration: 1700,
                          ease: "Sine.Out",
                          onComplete: () => {
                            this.tweens.add({
                              targets: blackScreen,
                              alpha: 1,
                              duration: 950,
                              ease: "Sine.In",
                              onComplete: () => {
                                this.tweens.add({
                                  targets: blackScreen,
                                  alpha: 0.75,
                                  duration: 2000,
                                  ease: "Sine.Out",
                                  onComplete: () => {
                                    this.tweens.add({
                                      targets: blackScreen,
                                      alpha: 0,
                                      duration: 2500,
                                      ease: "Sine.Out",
                                      onComplete: () => {
                                        blackScreen.destroy();
                                        resolve();
                                      },
                                    });
                                  },
                                });
                              },
                            });
                          },
                        });
                      },
                    });
                  },
                });
              });
            },
          });

          // sahke
          this.time.delayedCall(shakeStartTime, () => {
            this.cameras.main.shake(760, 0.05);
          });

          // black out screen
          this.time.delayedCall(startBLT, () => {
            this.tweens.add({
              targets: blackScreen,
              alpha: 1,
              duration: blFadeT,
              ease: "Cubic.In",
            });
          });
        };

        // chhar shake in place before dropping/
        this.tweens.add({
          targets: this.character,
          x: {
            from: strtX - 6,
            to: strtX + 6,
          },
          duration: 45,
          yoyo: true,
          repeat: 10,
          ease: "Sine.InOut",
          onComplete: () => {
            this.character.x = strtX;

            this.time.delayedCall(pTime, () => {
              startFall();
            });
          },
        });
      });

      return;
    }

    if (line.id === "goToIdCard") {
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
        blackScreen.setScrollFactor(0);
        blackScreen.setDepth(999999);
        blackScreen.setAlpha(0);

        this.tweens.add({
          targets: blackScreen,
          alpha: 1,
          duration: 800,
          ease: "Sine.In",
          onComplete: resolve,
        });
      });

      // switch to id card chapter
      await setCurrentChapterName("id-card");

      // inc ase poitiner cursor still active
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("IdCard");
      // bing menus
      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");

      this.scene.bringToTop("SettingsOverlay");

      return;
    }

    // console.log("something broke idk")
  }

  playFloorTitle() {
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
      blackScreen.setScrollFactor(0);
      blackScreen.setDepth(999998);
      blackScreen.setAlpha(1);

      const title = this.add.text(main_width / 2, main_height / 2, "FLOOR 1", {
        fontFamily: "DogicaBold",
        fontSize: "46px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      });

      title.setOrigin(0.5);
      title.setScrollFactor(0);
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
                this.tweens.add({
                  targets: blackScreen,
                  alpha: 0,
                  duration: 800,
                  ease: "Sine.Out",
                  onComplete: () => {
                    title.destroy();
                    blackScreen.destroy();
                    resolve();
                  },
                });
              },
            });
          });
        },
      });
    });
  }

  create() {
    this.game.canvas.style.cursor = "default";

    this.bg = this.add.image(
      main_width / 2,
      main_height / 2,
      "intro-potion-lab-background",
    );

    this.bg.setOrigin(0.5);
    this.bg.setDepth(-20);

    const bgScaleX = main_width / this.bg.width;
    const bgScaleY = main_height / this.bg.height;

    let bgScale = bgScaleX;

    if (bgScaleY > bgScaleX) {
      bgScale = bgScaleY;
    }

    this.bg.setScale(bgScale);

    this.tCinB = this.add.rectangle(0, 0, main_width, 125, 0x000000, 1);

    this.tCinB.setOrigin(0, 0);

    this.tCinB.setDepth(2000);

    const b_BorderVH = 115;

    const b_BorderVHEXTRA = 250;

    this.bCinB = this.add.rectangle(
      0,
      main_height - b_BorderVH,
      main_width,
      b_BorderVH + b_BorderVHEXTRA,
      0x000000,
      1,
    );

    this.bCinB.setOrigin(0, 0);
    this.bCinB.setDepth(2000);

    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);
    this.pauseButton.setDepth(3100);

    // omg pee size
    const p_size = 78;

    const p_scale = Math.min(
      p_size / this.pauseButton.width,
      p_size / this.pauseButton.height,
    );

    this.pauseButton.setScale(p_scale);

    this.pauseButton.setInteractive({ useHandCursor: false });

    this.pauseButton.on("pointerover", () => {
      // console.log("Tests")
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

    // character centered
    this.character = this.add.image(
      main_width / 2,
      main_height / 2 + 100,
      "intro-potion-character",
    );

    this.character.setOrigin(0.5);
    this.character.setDepth(5);

    this.character.setScale(1150 / this.character.height);

    const the = main_width / 2 - 160;
    const ok = main_height / 2 + 90;
    this.potion = this.add.image(the, ok, "intro-potion-potion");
    this.potion.setOrigin(0.5);

    this.potion.setDepth(6);

    const potionScale = 220 / this.potion.height;

    this.potion.setScale(potionScale);

    this.dialB = this.add.image(
      main_width / 2,
      main_height - 28,
      "dialogue-box",
    );

    this.dialB.setOrigin(0.5, 1);

    this.dialB.setDepth(3000);

    this.dialB.setScale(1470 / this.dialB.width);

    const dialDat = this.cache.json.get("dialogue-introduction-potion");

    if (!dialDat) {
      // console.log("AJKERWIHRWEROWH")
      console.log("misisng");
      return;
    }

    this.dialogue = new DialogueRunner(this, {
      // config data cusotm
      data: dialDat,
      box: this.dialB,
      boxPadX: 78,
      boxPadY: 34,

      fontSize: 26,

      typeSpeed: 28,

      onAction: async (line) => {
        await this.runDialogueAction(line);
      },

      onDone: () => {
        console.log("ok crazy people");
      },
    });

    this.playFloorTitle().then(() => {
      this.dialogue.start();
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

      if (this.dialogue) {
        this.dialogue.destroy();
        this.dialogue = null;
      }
    });
  }
}
