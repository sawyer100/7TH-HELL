import { Scene } from "phaser";
import { mobs } from "../mob_data";
import { characters, chapterTeams } from "../character_data";

const main_width = 1600;
const main_height = 900;
// 4 = 4;

const areaData = {
  "school-hallway": {
    openingBackground: "fight-opening-background",
  },
};

export class FightScene extends Scene {
  constructor() {
    super("FightScene");
  }

  init(data) {
    this.area = "school-hallway";
    this.chapterName = "post-classroom-hallway";
    this.enemySetup = [];

    this.battleReturnScene = null;
    this.battleReturnData = null;
    
    this.battleLoseScene = null;
    this.battleLoseData = null;

    if (data) {
      if (data.area) {
        this.area = data.area;
      }

      if (data.chapterName) {
        this.chapterName = data.chapterName;
      }

      if (data.enemies) {
        this.enemySetup = data.enemies;
      }

      if (data.battleReturnScene) {
        this.battleReturnScene = data.battleReturnScene;
      }

      if (data.battleReturnData) {
        this.battleReturnData = data.battleReturnData;
      }

      if (data.battleLoseScene) {
        this.battleLoseScene = data.battleLoseScene;
      }

      if (data.battleLoseData) {
        this.battleLoseData = data.battleLoseData;
      }
    }
  }

  create() {
    // nor
    this.game.canvas.style.cursor = "default";

    let playerIds = chapterTeams[this.chapterName];

    // need kim defautl
    if (!playerIds) {
      playerIds = ["kim"];
    }

    this.playerTeam = [];

    playerIds.forEach((id) => {
      const character = characters[id];

      if (character) {
        this.playerTeam.push(character);
      }
    });

    this.enemyTeam = [];

    this.enemySetup.forEach((entry) => {
      // hodler
      let enemyId = null;

      let count = 1;

      if (typeof entry === "string") {
        enemyId = entry; // JUST 'ZOMBIE" FOR EXAMPLE ITLL WORK //!! proably remove this later
      } else {
        if (entry) {
          if (entry.id) {
            enemyId = entry.id;
          }

          if (entry.count) {
            count = entry.count; // if it's obejct iwth count, example zombie + amoutn of zombies is 2
          }
        }
      }

      let mob = null;

      for (let i = 0; i < mobs.length; i += 1) {
        // in mob data .js is there a mob that  matcches this enemy id
        if (mobs[i].id === enemyId) {
          mob = mobs[i];
        }
      }

      if (mob) {
        // if multple counts of the same mob ad it mulitple times yes
        for (let i = 0; i < count; i += 1) {
          this.enemyTeam.push(mob);
        }
      }
    });

    this.playerTeam = this.playerTeam.slice(0, 4);
    this.enemyTeam = this.enemyTeam.slice(0, 4);

    this.battleStartClicked = false;

    this.makeOpeningAnimation();
  }

  makeOpeningAnimation() {
    this.battlePlaceholder = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x145c22,
      1,
    );
    this.battlePlaceholder.setOrigin(0, 0);

    this.battlePlaceholder.setDepth(-10);
    this.battlePlaceholder.setVisible(false);

    const area = areaData[this.area] || areaData["school-hallway"];

    this.openingBg = this.add.image(
      main_width / 2,
      main_height / 2,
      area.openingBackground,
    );
    this.openingBg.setOrigin(0.5);

    this.openingBg.setDepth(1);

    const bgScale = Math.max(
      main_width / this.openingBg.width,
      main_height / this.openingBg.height,
    );
    this.openingBg.setScale(bgScale);

    this.topBlack = this.add.rectangle(
      0,
      0,
      main_width,
      main_height / 2,
      0x000000,
      1,
    );

    this.topBlack.setOrigin(0, 0);

    this.topBlack.setDepth(100);

    this.bottomBlack = this.add.rectangle(
      0,
      main_height / 2,
      main_width,
      main_height / 2,
      0x000000,
      1,
    );
    this.bottomBlack.setOrigin(0, 0);

    this.bottomBlack.setDepth(100);

    this.vSymbol = this.add.image(-250, main_height / 2 - 50, "versus-v");
    this.vSymbol.setOrigin(0.5);

    this.vSymbol.setDepth(200);
    this.vSymbol.setScale(1.3);

    this.vSymbol.setAlpha(1);

    this.sSymbol = this.add.image(
      main_width + 250,
      main_height / 2 + 115,
      "versus-s",
    );

    this.sSymbol.setOrigin(0.5);

    this.sSymbol.setDepth(200);

    this.sSymbol.setScale(1.3);
    this.sSymbol.setAlpha(1);

    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: this.vSymbol,
        x: main_width / 2 - 190,
        duration: 360,
        ease: "Back.Out",
      });

      this.tweens.add({
        targets: this.sSymbol,
        x: main_width / 2 + 190,
        duration: 360,
        ease: "Back.Out",
        onComplete: () => {
          this.cameras.main.shake(120, 0.006);

          this.time.delayedCall(1000, () => {
            this.tweens.add({
              targets: this.vSymbol,
              x: main_width / 2 - 43,
              y: main_height / 2 - 15,
              scaleX: 0.42,
              scaleY: 0.42,
              duration: 520,
              ease: "Cubic.InOut",
            });

            this.tweens.add({
              targets: this.sSymbol,
              x: main_width / 2 + 55,
              y: main_height / 2 + 68,
              scaleX: 0.42,
              scaleY: 0.42,
              duration: 520,
              ease: "Cubic.InOut",
            });

            this.tweens.add({
              targets: this.topBlack,
              displayHeight: 125,
              duration: 520,
              ease: "Cubic.InOut",
            });

            this.tweens.add({
              targets: this.bottomBlack,
              y: main_height - 125,
              displayHeight: 125,
              duration: 520,
              ease: "Cubic.InOut",
              onComplete: () => {
                this.time.delayedCall(160, () => {
                  this.startIconPopIn();
                });
              },
            });
          });
        },
      });
    });
  }

  startIconPopIn() {
    // this.playerIconObjects = [];
    // this.enemyIconObjects = [];

    this.teamHeaderObjects = [];

    this.playerGrid = this.add.graphics();
    this.playerGrid.setDepth(145);

    this.playerGrid.lineStyle(4, 0xb5b5b5, 1);

    for (let i = 0; i < 4; i += 1) {
      let row = 0;
      let col = i;

      if (i >= 2) {
        row = 1;
        col = i - 2;
      }

      this.playerGrid.strokeRect(
        110 + col * (118 + 18),
        360 + row * (118 + 18),
        118,
        118,
      );
    }

    this.enemyGrid = this.add.graphics();
    this.enemyGrid.setDepth(145);

    this.enemyGrid.lineStyle(4, 0xb5b5b5, 1);

    for (let i = 0; i < 4; i += 1) {
      let row = 0;
      let col = i;

      if (i >= 2) {
        row = 1;
        col = i - 2;
      }

      this.enemyGrid.strokeRect(
        1236 + col * (118 + 18),
        360 + row * (118 + 18),
        118,
        118,
      );
    }

    const playerCountText = this.add.text(
      110,
      270,
      `${this.playerTeam.length}/${4}`,
      {
        fontFamily: "DogicaBold",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );

    playerCountText.setOrigin(0, 0);

    playerCountText.setDepth(150);

    const playerTitleText = this.add.text(205, 265, "SURVIVORS", {
      fontFamily: "DogicaBold",
      fontSize: "34px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    playerTitleText.setOrigin(0, 0);
    playerTitleText.setDepth(150);

    const enemyCountText = this.add.text(
      1236,
      270,
      `${this.enemyTeam.length}/${4}`,
      {
        fontFamily: "DogicaBold",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    enemyCountText.setOrigin(0, 0);

    enemyCountText.setDepth(150);

    const enemyTitleText = this.add.text(1331, 265, "ZOMBIES", {
      fontFamily: "DogicaBold",
      fontSize: "34px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    enemyTitleText.setOrigin(0, 0);

    enemyTitleText.setDepth(150);

    this.teamHeaderObjects.push(playerCountText);
    this.teamHeaderObjects.push(playerTitleText);
    this.teamHeaderObjects.push(enemyCountText);
    //
    this.teamHeaderObjects.push(enemyTitleText);

    const maxCount = Math.max(this.playerTeam.length, this.enemyTeam.length);

    for (let i = 0; i < maxCount; i += 1) {
      const delay = i * 180;

      this.time.delayedCall(delay, () => {
        // one by one pop in the surviro team + enemey team iconss
        if (this.playerTeam[i]) {
          this.popIcon("player", this.playerTeam[i], i);
        }

        if (this.enemyTeam[i]) {
          this.popIcon("enemy", this.enemyTeam[i], i);
        }

        // put the start button when dodne
        if (i === maxCount - 1) {
          this.time.delayedCall(500, () => {
            this.startButtonGO();
          });
        }
      });
    }

    // shouldnt happen? but i can have jsut in case
    // if (maxCount === 0) {
    //   this.time.delayedCall(500, () => {
    //     this.startButtonGO();
    //   });
    // }
  }

  popIcon(side, unit, index) {
    let row = 0;

    let col = index;

    if (index >= 2) {
      row = 1;
      col = index - 2;
    }

    let x = 110 + 118 / 2 + col * (118 + 18);

    if (side === "enemy") {
      x = 1236 + 118 / 2 + col * (118 + 18);
    }

    const y = 360 + 118 / 2 + row * (118 + 18);

    const icon = this.add.image(x, y + 12, unit.icon);

    icon.setOrigin(0.5);
    icon.setDepth(150);
    icon.setAlpha(0);

    icon.setScale(0.1);

    const targetScale = 88 / icon.height;

    this.tweens.add({
      targets: icon,
      alpha: 1,
      y: y,
      scaleX: targetScale,

      scaleY: targetScale,
      duration: 220,
      ease: "Back.Out",
    });

    // if (side === "player") {
    //   this.playerIconObjects.push(icon);
    // } else {
    //   this.enemyIconObjects.push(icon);
    // }
  }

  startButtonGO() {
    if (this.startBattleButtonRoot) {
      return;
    }

    this.startBattleButtonRoot = this.add.container(
      main_width / 2,
      main_height / 2 + 243,
    );
    this.startBattleButtonRoot.setDepth(500);

    this.startBattleHover = this.add.image(0, 0, "title-button-bg-hover");
    this.startBattleHover.setOrigin(0.5);

    this.startBattleHover.setDisplaySize(300, 72);

    this.startBattleHover.setAlpha(0);
    this.startBattleBg = this.add.image(0, 0, "title-button-bg");
    this.startBattleBg.setOrigin(0.5);

    this.startBattleBg.setDisplaySize(300, 72);

    this.startBattleText = this.add.text(0, 0, "START BATTLE", {
      fontFamily: "DogicaBold",
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",

      strokeThickness: 5,
      align: "center",
    });
    this.startBattleText.setOrigin(0.5);

    this.startBattleHit = this.add.zone(0, 0, 300, 72);
    this.startBattleHit.setOrigin(0.5);

    this.startBattleHit.setInteractive({ useHandCursor: false });

    this.startBattleButtonRoot.add([
      this.startBattleHover,
      this.startBattleBg,
      this.startBattleText,
      this.startBattleHit,
    ]);

    this.startBattleButtonRoot.setAlpha(0);

    this.startBattleButtonRoot.setScale(0.92);

    this.tweens.add({
      targets: this.startBattleButtonRoot,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: "Back.Out",
    });

    this.startBattleHit.on("pointerover", () => {
      if (this.battleStartClicked) {
        return;
      }

      this.input.setDefaultCursor("pointer");

      this.tweens.killTweensOf(this.startBattleBg);
      this.tweens.killTweensOf(this.startBattleHover);

      this.tweens.killTweensOf(this.startBattleText);

      this.tweens.add({
        targets: this.startBattleBg,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.startBattleHover,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.startBattleText,
        scaleX: 0.95,
        scaleY: 0.95,
        alpha: 0.8,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.startBattleHit.on("pointerout", () => {
      if (this.battleStartClicked) {
        return;
      }

      this.input.setDefaultCursor("default");

      this.tweens.killTweensOf(this.startBattleBg);
      this.tweens.killTweensOf(this.startBattleHover);

      this.tweens.killTweensOf(this.startBattleText);

      this.tweens.add({
        targets: this.startBattleBg,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.startBattleHover,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.startBattleText,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.startBattleHit.on("pointerdown", () => {
      if (this.battleStartClicked) {
        return;
      }

      this.battleStartClicked = true;
      this.input.setDefaultCursor("default");

      this.startBattleHit.disableInteractive();

      this.tweens.add({
        targets: this.startBattleButtonRoot,
        alpha: 0,
        scaleX: 0.92,
        scaleY: 0.92,
        duration: 160,
        ease: "Cubic.In",
        onComplete: () => {
          this.startBattleButtonRoot.destroy(true);
          this.startBattleButtonRoot = null;
          this.startSwipeOmg();
        },
      });
    });
  }

  startSwipeOmg() {
    this.swipe = this.add.rectangle(0, main_height, main_width, 0, 0x000000, 1);
    this.swipe.setOrigin(0, 1);

    this.swipe.setDepth(9999);

    this.tweens.add({
      targets: this.swipe,
      displayHeight: main_height,
      duration: 180,
      ease: "Cubic.In",
      onComplete: () => {
        this.scene.start("BattleScene", {
          area: this.area,
          chapterName: this.chapterName,
          enemies: this.enemySetup,

          battleReturnScene: this.battleReturnScene,
          battleReturnData: this.battleReturnData,
          battleLoseScene: this.battleLoseScene,
          battleLoseData: this.battleLoseData,
        });
      },
    });
  }
}
