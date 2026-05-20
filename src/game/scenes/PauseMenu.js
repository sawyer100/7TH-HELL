import { Scene } from "phaser";

const main_width = 1600;
const main_height = 900;

const allh = 110;

export class PauseMenuOverlay extends Scene {
  constructor() {
    super("PauseMenuOverlay");

    this.isOpen = false;

    this.pausedSceneKey = null;
  }

  create() {
    //pause menu
    this.root = this.add.container(0, 0);
    this.root.setVisible(false);

    this.root.setDepth(999999); //i dont know if theres a limti but its probably ok

    this.input.keyboard.on("keydown-ESC", () => {
      const blockedFrame = this.registry.get("blockPauseFrame");

      if (blockedFrame === this.game.loop.frame) {
        return;
      }

      const inventory = this.scene.get("InventoryOverlay");
      const knowledgeLog = this.scene.get("KnowledgeLogOverlay");

      if (inventory) {
        if (inventory.isOpen) {
          return;
        }
      }

      if (knowledgeLog) {
        if (knowledgeLog.isOpen) {
          return;
        }
      }

      if (this.isOpen) {
        this.close();
      }
    });
  }
  shouldBlockOpen() {
    const blockedFrame = this.registry.get("blockPauseFrame");

    if (blockedFrame === this.game.loop.frame) {
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
  open(sceneKey) {
    if (this.shouldBlockOpen()) {
      return;
    }

    if (this.isOpen) return;

    this.isOpen = true;
    this.pausedSceneKey = sceneKey;

    if (sceneKey) {
      this.scene.pause(sceneKey);
    }

    this.root.setVisible(true);

    this.scene.bringToTop();

    this.render();
  }

  close() {
    if (!this.isOpen) return;
    const rrrr = this.pausedSceneKey;

    this.isOpen = false;
    this.pausedSceneKey = null;

    this.root.setVisible(false);

    this.root.removeAll(true);

    this.input.setDefaultCursor("default");

    if (rrrr) {
      this.scene.resume(rrrr);
    }
  }

  leaveGame() {
    const sceneToStop = this.pausedSceneKey;

    this.isOpen = false;
    this.pausedSceneKey = null;

    this.root.setVisible(false);
    this.root.removeAll(true);

    //sometimes theres a bug where it keeps the pointer cursor
    this.input.setDefaultCursor("default");
    if (sceneToStop) {
      this.scene.resume(sceneToStop);
      this.scene.stop(sceneToStop);
    }

    this.scene.launch("MainMenu");

    /// add popup menus
    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
  }

  render() {
    this.root.removeAll(true);

    const grayman = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      0.9,
    );

    grayman.setOrigin(0, 0);

    grayman.setDepth(1);

    grayman.setInteractive();
    grayman.setAlpha(0);

    this.root.add(grayman);

    this.resBtnHove = this.add.image(0, 0, "title-button-bg-hover");
    this.bg_resBtn = this.add.image(0, 0, "title-button-bg");

    this.res_btnText = this.add.text(0, 0, "RESUME", {
      fontFamily: "DogicaBold",
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center",
    });

    this.resZone = this.add.zone(0, 0, 1, 1);
    this.res_btnText.setOrigin(0.5);

    this.resBtnHove.setOrigin(0.5);

    this.bg_resBtn.setOrigin(0.5);

    this.resZone.setOrigin(0.5);

    this.res_btnText.setDepth(8);
    this.resZone.setDepth(9);
    this.resBtnHove.setDepth(6);

    this.bg_resBtn.setDepth(7);

    this.bg_resBtn.setPosition(330, 340);
    this.resBtnHove.setPosition(330, 340);

    this.bg_resBtn.setDisplaySize(320, allh);

    this.resBtnHove.setDisplaySize(320, allh);

    this.res_btnText.setPosition(330, 340);
    this.res_btnText.setScale(1);

    this.res_btnText.setFontSize("27px");

    this.resZone.setSize(320 * 0.85, allh * 0.65);

    this.resZone.setPosition(330, 340);
    this.resBtnHove.baseScaleX = this.resBtnHove.scaleX;

    this.bg_resBtn.baseScaleY = this.bg_resBtn.scaleY;

    this.resBtnHove.baseScaleY = this.resBtnHove.scaleY;
    this.bg_resBtn.baseScaleX = this.bg_resBtn.scaleX;

    this.res_btnText.baseScaleX = 1;

    this.res_btnText.baseScaleY = 1;

    this.resumeBtnTargetX = 330;

    this.resBtnHove.setAlpha(0);

    this.resumeBtnTargetY = 340;

    this.root.add([
      this.resBtnHove,
      this.bg_resBtn,
      this.res_btnText,
      this.resZone,
    ]);

    this.setts_BtnHove = this.add.image(0, 0, "title-button-bg-hover");

    this.setts_BtnBg = this.add.image(0, 0, "title-button-bg");

    this.settsBText = this.add.text(0, 0, "SETTINGS", {
      fontFamily: "DogicaBold",
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center",
    });

    this.settsBZONe = this.add.zone(0, 0, 1, 1);

    this.setts_BtnHove.setOrigin(0.5);

    this.setts_BtnBg.setOrigin(0.5);

    this.setts_BtnBg.setDepth(7);

    this.settsBText.setOrigin(0.5);

    this.settsBText.setDepth(8);
    this.settsBZONe.setOrigin(0.5);
    this.setts_BtnHove.setDepth(6);

    this.setts_BtnBg.setDisplaySize(320, allh);

    this.settsBZONe.setDepth(9);
    this.setts_BtnBg.setPosition(330, 465);

    this.setts_BtnHove.setPosition(330, 465);
    this.setts_BtnHove.setDisplaySize(320, allh);
    this.settsBText.setPosition(330, 465);

    this.settsBText.setFontSize("24px");

    this.settsBText.setScale(1);

    this.settsBZONe.setPosition(330, 465);

    this.settsBZONe.setSize(320 * 0.85, allh * 0.65);

    this.setts_BtnBg.baseScaleX = this.setts_BtnBg.scaleX;

    this.setts_BtnBg.baseScaleY = this.setts_BtnBg.scaleY;

    this.setts_BtnHove.baseScaleX = this.setts_BtnHove.scaleX;

    this.setts_BtnHove.baseScaleY = this.setts_BtnHove.scaleY;

    this.settsBText.baseScaleX = 1;

    this.settsBText.baseScaleY = 1;

    this.settsTx = 330;
    this.settsTY = 465;

    this.setts_BtnHove.setAlpha(0);

    this.root.add([
      this.setts_BtnHove,
      this.setts_BtnBg,
      this.settsBText,
      this.settsBZONe,
    ]);

    this.q_BtnHove = this.add.image(0, 0, "title-button-bg-hover");
    this.quitBtnBg = this.add.image(0, 0, "title-button-bg");

    this.q_BtnText = this.add.text(0, 0, "QUIT", {
      fontFamily: "DogicaBold",
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center",
    });
    this.q_BZone = this.add.zone(0, 0, 1, 1);

    this.q_BtnHove.setOrigin(0.5);

    this.quitBtnBg.setOrigin(0.5);
    this.q_BtnText.setOrigin(0.5);

    this.q_BtnHove.setDepth(6);
    this.q_BZone.setOrigin(0.5);
    this.quitBtnBg.setDepth(7);

    this.q_BtnText.setDepth(8);

    this.q_BZone.setDepth(9);

    this.quitBtnBg.setPosition(330, 590);

    this.q_BtnHove.setPosition(330, 590);

    this.quitBtnBg.setDisplaySize(320, allh);

    this.q_BtnHove.setDisplaySize(320, allh);

    this.q_BtnText.setPosition(330, 590);

    this.q_BtnText.setFontSize("27px");

    this.q_BtnText.setScale(1);

    this.q_BZone.setPosition(330, 590);
    this.q_BZone.setSize(320 * 0.85, allh * 0.65);

    this.quitBtnBg.baseScaleX = this.quitBtnBg.scaleX;

    this.quitBtnBg.baseScaleY = this.quitBtnBg.scaleY;

    this.q_BtnHove.baseScaleX = this.q_BtnHove.scaleX;

    this.q_BtnHove.baseScaleY = this.q_BtnHove.scaleY;

    this.q_BtnText.baseScaleX = 1;

    this.q_BtnText.baseScaleY = 1;

    this.quitTX = 330;

    this.quitTY = 590;

    this.q_BtnHove.setAlpha(0);

    this.root.add([
      this.q_BtnHove,
      this.quitBtnBg,
      this.q_BtnText,
      this.q_BZone,
    ]);

    this.resZone.setInteractive({ useHandCursor: false });

    this.resZone.isHovered = false;

    this.resZone.on("pointerover", () => {
      if (!this.resZone.input) return;

      if (!this.resZone.input.enabled) return;
      if (this.resZone.isHovered) return;

      this.resZone.isHovered = true;
      this.input.setDefaultCursor("pointer");

      //reset anim

      this.tweens.killTweensOf(this.bg_resBtn);

      this.tweens.killTweensOf(this.resBtnHove);

      this.tweens.killTweensOf(this.res_btnText);

      // anim
      this.tweens.add({
        targets: [this.bg_resBtn, this.resBtnHove],
        scaleX: this.bg_resBtn.baseScaleX * 1.04,
        scaleY: this.bg_resBtn.baseScaleY * 1.04,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.bg_resBtn,
        alpha: 0,

        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.resBtnHove,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.res_btnText,
        alpha: 0.8,

        scaleX: 0.95,

        scaleY: 0.95,

        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.resZone.on("pointerout", () => {
      if (!this.resZone.input) return;
      if (!this.resZone.input.enabled) return;

      if (!this.resZone.isHovered) return;

      this.resZone.isHovered = false;

      this.input.setDefaultCursor("default");

      this.tweens.killTweensOf(this.bg_resBtn);
      this.tweens.killTweensOf(this.resBtnHove);

      this.tweens.killTweensOf(this.res_btnText);

      this.tweens.add({
        targets: [this.bg_resBtn, this.resBtnHove],
        scaleX: this.bg_resBtn.baseScaleX,
        scaleY: this.bg_resBtn.baseScaleY,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.bg_resBtn,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.resBtnHove,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.res_btnText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.resZone.on("pointerdown", () => {
      // console.log("CLICKEDDDED")
      this.close();
    });

    this.settsBZONe.setInteractive({ useHandCursor: false });

    this.settsBZONe.isHovered = false;

    this.settsBZONe.on("pointerover", () => {
      if (!this.settsBZONe.input) return;

      if (!this.settsBZONe.input.enabled) return;
      if (this.settsBZONe.isHovered) return;

      this.settsBZONe.isHovered = true;
      this.input.setDefaultCursor("pointer");

      this.tweens.killTweensOf(this.setts_BtnBg);

      this.tweens.killTweensOf(this.setts_BtnHove);

      this.tweens.killTweensOf(this.settsBText);

      this.tweens.add({
        targets: [this.setts_BtnBg, this.setts_BtnHove],
        scaleX: this.setts_BtnBg.baseScaleX * 1.04,
        scaleY: this.setts_BtnBg.baseScaleY * 1.04,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.setts_BtnBg,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.setts_BtnHove,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.settsBText,
        alpha: 0.8,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.settsBZONe.on("pointerout", () => {
      // console.log("workwrkw")
      if (!this.settsBZONe.input) return;

      if (!this.settsBZONe.input.enabled) return;
      if (!this.settsBZONe.isHovered) return;

      this.settsBZONe.isHovered = false;
      this.input.setDefaultCursor("default");

      this.tweens.killTweensOf(this.setts_BtnBg);
      this.tweens.killTweensOf(this.setts_BtnHove);

      this.tweens.killTweensOf(this.settsBText);

      this.tweens.add({
        targets: [this.setts_BtnBg, this.setts_BtnHove],
        scaleX: this.setts_BtnBg.baseScaleX,
        scaleY: this.setts_BtnBg.baseScaleY,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.setts_BtnBg,

        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.setts_BtnHove,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.settsBText,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.settsBZONe.on("pointerdown", () => {
      if (!this.scene.isActive("SettingsOverlay")) {
        // console.log("test/")
        this.scene.launch("SettingsOverlay");
      }

      const settings = this.scene.get("SettingsOverlay");

      if (settings) {
        if (settings.open) {
          settings.open({ returnToPause: true });
        }
      }
    });

    this.q_BZone.setInteractive({ useHandCursor: false });

    this.q_BZone.isHovered = false;

    this.q_BZone.on("pointerover", () => {
      if (!this.q_BZone.input) return;

      if (!this.q_BZone.input.enabled) return;
      if (this.q_BZone.isHovered) return;

      this.q_BZone.isHovered = true;
      this.input.setDefaultCursor("pointer");

      this.tweens.killTweensOf(this.quitBtnBg);

      this.tweens.killTweensOf(this.q_BtnHove);
      this.tweens.killTweensOf(this.q_BtnText);

      this.tweens.add({
        targets: [this.quitBtnBg, this.q_BtnHove],
        scaleX: this.quitBtnBg.baseScaleX * 1.04,
        scaleY: this.quitBtnBg.baseScaleY * 1.04,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.quitBtnBg,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.q_BtnHove,
        alpha: 1,
        duration: 120,

        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.q_BtnText,
        alpha: 0.8,
        scaleX: 0.95,
        scaleY: 0.95,

        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.q_BZone.on("pointerout", () => {
      if (!this.q_BZone.input) return;
      if (!this.q_BZone.input.enabled) return;

      if (!this.q_BZone.isHovered) return;

      this.q_BZone.isHovered = false;

      this.input.setDefaultCursor("default");

      this.tweens.killTweensOf(this.quitBtnBg);

      this.tweens.killTweensOf(this.q_BtnHove);
      this.tweens.killTweensOf(this.q_BtnText);

      this.tweens.add({
        targets: [this.quitBtnBg, this.q_BtnHove],
        scaleX: this.quitBtnBg.baseScaleX,
        scaleY: this.quitBtnBg.baseScaleY,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.quitBtnBg,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.q_BtnHove,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: this.q_BtnText,
        alpha: 1,

        scaleX: 1,
        scaleY: 1,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    this.q_BZone.on("pointerdown", () => {
      this.leaveGame();
    });

    this.tweens.killTweensOf(this.bg_resBtn);
    this.tweens.killTweensOf(this.resBtnHove);

    this.tweens.killTweensOf(this.res_btnText);
    this.tweens.killTweensOf(this.resZone);

    this.bg_resBtn.setPosition(this.resumeBtnTargetX, this.resumeBtnTargetY);
    this.resBtnHove.setPosition(this.resumeBtnTargetX, this.resumeBtnTargetY);
    this.res_btnText.setPosition(this.resumeBtnTargetX, this.resumeBtnTargetY);
    this.resZone.setPosition(this.resumeBtnTargetX, this.resumeBtnTargetY);
    this.bg_resBtn.setAlpha(0);
    // this.bg_resBtn.setAlpha(0);
    //
    this.resBtnHove.setAlpha(0);

    this.res_btnText.setAlpha(0);

    this.tweens.killTweensOf(this.setts_BtnBg);

    this.tweens.killTweensOf(this.setts_BtnHove);

    this.tweens.killTweensOf(this.settsBText);
    this.tweens.killTweensOf(this.settsBZONe);

    this.setts_BtnBg.setPosition(this.settsTx, this.settsTY);
    this.setts_BtnHove.setPosition(
      this.settsTx,

      this.settsTY,
    );
    this.settsBText.setPosition(this.settsTx, this.settsTY);
    this.settsBZONe.setPosition(this.settsTx, this.settsTY);

    this.setts_BtnBg.setAlpha(0);
    this.setts_BtnHove.setAlpha(0);

    this.settsBText.setAlpha(0);

    this.tweens.killTweensOf(this.quitBtnBg);

    this.tweens.killTweensOf(this.q_BtnHove);
    this.tweens.killTweensOf(this.q_BtnText);

    this.tweens.killTweensOf(this.q_BZone);

    this.quitBtnBg.setPosition(this.quitTX, this.quitTY);
    this.q_BtnHove.setPosition(this.quitTX, this.quitTY);

    this.q_BtnText.setPosition(this.quitTX, this.quitTY);

    this.q_BZone.setPosition(this.quitTX, this.quitTY);

    this.quitBtnBg.setAlpha(0);

    this.q_BtnHove.setAlpha(0);

    this.q_BtnText.setAlpha(0);

    this.tweens.add({
      targets: grayman,
      alpha: 0.9,
      duration: 180,
      ease: "Cubic.Out",
      onComplete: () => {
        this.tweens.killTweensOf(this.bg_resBtn);

        this.tweens.killTweensOf(this.resBtnHove);
        this.tweens.killTweensOf(this.res_btnText);

        this.bg_resBtn.setPosition(
          this.resumeBtnTargetX,

          this.resumeBtnTargetY,
        );
        this.resBtnHove.setPosition(
          this.resumeBtnTargetX,
          this.resumeBtnTargetY,
        );
        this.res_btnText.setPosition(
          this.resumeBtnTargetX,

          this.resumeBtnTargetY,
        );

        this.resZone.setPosition(this.resumeBtnTargetX, this.resumeBtnTargetY);

        this.bg_resBtn.setScale(
          this.bg_resBtn.baseScaleX,

          this.bg_resBtn.baseScaleY,
        );
        this.resBtnHove.setScale(
          this.resBtnHove.baseScaleX,
          this.resBtnHove.baseScaleY,
        );

        this.res_btnText.setScale(1);

        this.resBtnHove.setAlpha(0);

        this.tweens.add({
          targets: this.bg_resBtn,
          alpha: 1,
          duration: 220,

          delay: 0,
          ease: "Cubic.Out",
        });

        this.tweens.add({
          targets: this.res_btnText,
          alpha: 1,
          duration: 220,
          delay: 0,
          ease: "Cubic.Out",
        });

        this.tweens.killTweensOf(this.setts_BtnBg);
        this.tweens.killTweensOf(this.setts_BtnHove);
        // console.log("kdone")
        // this.tweens.killTweensOf(this.setts_BtnHove);
        //
        this.tweens.killTweensOf(this.settsBText);

        this.setts_BtnBg.setPosition(this.settsTx, this.settsTY);
        this.setts_BtnHove.setPosition(this.settsTx, this.settsTY);
        this.settsBText.setPosition(this.settsTx, this.settsTY);
        this.settsBZONe.setPosition(this.settsTx, this.settsTY);

        this.setts_BtnBg.setScale(
          this.setts_BtnBg.baseScaleX,

          this.setts_BtnBg.baseScaleY,
        );
        this.setts_BtnHove.setScale(
          this.setts_BtnHove.baseScaleX,
          this.setts_BtnHove.baseScaleY,
        );
        this.settsBText.setScale(1);

        this.setts_BtnHove.setAlpha(0);

        this.tweens.add({
          targets: this.setts_BtnBg,

          alpha: 1,
          duration: 220,
          delay: 80,
          ease: "Cubic.Out",
        });

        this.tweens.add({
          targets: this.settsBText,
          alpha: 1,
          duration: 220,

          delay: 80,
          ease: "Cubic.Out",
        });

        this.tweens.killTweensOf(this.quitBtnBg);

        this.tweens.killTweensOf(this.q_BtnHove);
        this.tweens.killTweensOf(this.q_BtnText);

        this.quitBtnBg.setPosition(this.quitTX, this.quitTY);

        this.q_BtnHove.setPosition(this.quitTX, this.quitTY);
        this.q_BtnText.setPosition(this.quitTX, this.quitTY);

        this.q_BZone.setPosition(this.quitTX, this.quitTY);

        this.quitBtnBg.setScale(
          this.quitBtnBg.baseScaleX,

          this.quitBtnBg.baseScaleY,
        );
        this.q_BtnHove.setScale(
          this.q_BtnHove.baseScaleX,

          this.q_BtnHove.baseScaleY,
        );
        this.q_BtnText.setScale(1);

        this.q_BtnHove.setAlpha(0);

        this.tweens.add({
          targets: this.quitBtnBg,

          alpha: 1,
          duration: 220,
          delay: 160,
          ease: "Cubic.Out",
        });

        this.tweens.add({
          targets: this.q_BtnText,
          alpha: 1,
          duration: 220,

          delay: 160,
          ease: "Cubic.Out",
        });
      },
    });
  }
}
