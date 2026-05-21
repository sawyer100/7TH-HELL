import Phaser, { Scene } from "phaser";
import {
  default_game_settings,
  loadSettings,
  saveSettings,
  loadGameData,
  resetGameData,
} from "../db";

// change image names / keys inside Preloader.js

// the design res
const main_width = 1600;
const main_height = 900;

// RESOLUTOIN OPTIONS FOR SETTINGS
function getRes(res) {
  //TODO: make it check to see if "res" is vaalid, but i dont know how to do it without writing a lot of code

  // if ()
  let w = 1600;

  let h = 900;

  if (res === "960x540") {
    w = 960;
    h = 540;
  } else if (res === "1280x720") {
    w = 1280;
    h = 720;
  } else if (res === "1920x1080") {
    w = 1920;
    h = 1080;
  }

  return { label: res, w: w, h: h };
}

function wholeAndClamp(v) {
  // make a whole number
  var n = parseInt(v);

  // i dont know if !typeof number and isNaN does the same thing, but just in case
  if (!(typeof n === "number")) {
    return 50;
  }
  if (isNaN(n)) {
    return 50;
  }

  if (n < 0) {
    n = 0;
  }

  if (n > 100) {
    n = 100;
  }

  return n;
}

///
// CONFIG AND ELEMENT POSITIONING
//

//!! EDIT SIZE AND WDITH AND POSITOINNIG ALL HERE
const el_pos = {
  logo: { x: 480, y: 342, w: 768, introOffsetY: 45 },

  //title home default
  title_buttons: {
    play: { x: 236, y: 630, w: 311, h: 122, font: 22 },
    settings: { x: 508, y: 639, w: 230, h: 90, font: 15 },
    about: { x: 740, y: 639, w: 230, h: 90, font: 15 },
  },

  // about page
  info_buttons: {
    return: { x: 224, y: 693, w: 272, h: 81, font: 15 },
    credits: { x: 544, y: 693, w: 272, h: 81, font: 15 },
  },

  about: {
    header: { x: 112, y: 180, font: 45, wrap: 1000 },
    body: { x: 112, y: 270, font: 14, wrap: 1088 },
  },

  // credits page
  credits: {
    title: { x: 80, y: 180, font: 45 },
    logo: { x: 240, y: 420, w: 310, h: 310 },
    col1: { x: 544, y: 270 },
    col2: { x: 1008, y: 270 },
    cred_role_font: 17,
    cred_font: 14,
    cred_line_gap: 35,
    credit_gap: 100,
  },

  // SETTINGS
  settings: {
    title: { x: 80, y: 180, font: 45 },
    labelX: 112,
    controlX: 650,
    valueX: 855,
    startY: 290,
    row_gap: 62,
    sliderW: 360,

    buttons: {
      cancel: { x: 300, y: 735, w: 300, h: 78, font: 13 },
      save: { x: 620, y: 735, w: 300, h: 78, font: 13 },
      defaults: { x: 940, y: 735, w: 300, h: 78, font: 13 },
    },
  },

  // smooth radial underneath the pixel alarm forr extra effect
  alarm: {
    x: 1568,
    smoothY: 108,
    pixelY: 99,
    // target of tween for smooth alarm
    tw_smooth: 1600,
    // target of tween for pixel alarm
    tw_pixel: 1040,
  },
};

// CHANGE Z INDEX ALL HERE
const depth = {
  bg: -10,
  hallway: 1,
  rectangle_overlay: 2,
  overlay_pat: 3,
  gradient: 4,
  logo: 5,
  alarm_smooth: 5,
  alarm_px: 6,
  btn_hovering: 6,
  btn_bg: 7,
  btn_txt: 8,
  btn_detect_zone: 9,
  page_txt: 12,
  border: 100,
  extra_line: 101,
  settings_ui: 14,
  settings_dropdown: 30,
};

///
// BUILDING SCENE
//
export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  isNewClassroomFullyLooted(gameData) {
    if (!gameData) {
      return false;
    }

    if (!gameData.newClassroom) {
      return false;
    }

    if (!gameData.newClassroom.lootBag1Opened) {
      return false;
    }

    if (!gameData.newClassroom.lootBag2Opened) {
      return false;
    }

    if (!gameData.newClassroom.helmetCollected) {
      return false;
    }

    if (!Array.isArray(gameData.newClassroom.lootDrops)) {
      return false;
    }

    if (gameData.newClassroom.lootDrops.length === 0) {
      return false;
    }

    const theallcollectomg = gameData.newClassroom.lootDrops.every((drop) => {
      return drop.collected;
    });

    if (!theallcollectomg) {
      return false;
    }

    return true;
  }

  async startGameFromSave() {
    if (this.middleOfTrans) return;

    this.game.canvas.style.cursor = "default";

    let gameData = null;

    try {
      gameData = await loadGameData();
    } catch (error) {
      console.warn("can't laodd game data.", error);
    }

    const chapterName =
      gameData?.currentStoryState?.chapterName || "introduction-potion";

    if (chapterName === "introduction-potion") {
      this.scene.start("IntroductionPotion");
      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      return;
    }

    if (chapterName === "id-card") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("IdCard");
      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      return;
    }

    if (chapterName === "test-post-classroom-hallway") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("PostClassroomHallway", {
        fromTestSave: true,
      });

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      return;
    }

    if (chapterName === "post-first-battle") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      if (this.isNewClassroomFullyLooted(gameData)) {
        this.scene.start("PostNewClassroomHallway");
      } else {
        this.scene.start("PostFirstBattle");
      }

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    if (chapterName === "new-classroom") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      if (this.isNewClassroomFullyLooted(gameData)) {
        this.scene.start("PostNewClassroomHallway");
      } else {
        this.scene.start("PostFirstBattle");
      }

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    if (chapterName === "post-new-classroom-hallway") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("PostNewClassroomHallway");

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    if (chapterName === "floor2-starthallway") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("Floor2StartHallway");

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }
    if (chapterName === "floor3-starthallway") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("Floor3StartHallway");

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    if (chapterName === "floor4-starthallway") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("Floor4StartHallway");

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    if (chapterName === "floor-5-boss") {
      this.input.setDefaultCursor("default");

      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = "default";
      }

      this.scene.start("Floor5StartHallway");

      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");
      this.scene.bringToTop("SettingsOverlay");
      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    this.scene.start("IntroductionPotion");
    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
  }

  makeRestartButton() {
    this.restartText = this.add.text(
      main_width - 28,
      main_height - 24,
      "Restart",
      {
        fontFamily: "DogicaBold",
        fontSize: "16px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );

    this.restartText.setOrigin(1, 1);
    this.restartText.setDepth(9999);
    this.restartText.setInteractive({ useHandCursor: false });

    this.restartText.on("pointerover", () => {
      this.restartText.setAlpha(0.7);
      this.input.setDefaultCursor("pointer");
    });

    this.restartText.on("pointerout", () => {
      this.restartText.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    this.restartText.on("pointerdown", () => {
      this.showRestartConfirm();
    });
  }

  showRestartConfirm() {
    if (this.restartConfirmRoot) return;

    this.restartConfirmRoot = this.add.container(0, 0);
    this.restartConfirmRoot.setDepth(200000);

    const blocker = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      0.72,
    );
    blocker.setOrigin(0, 0);
    blocker.setInteractive();

    const box = this.add.rectangle(800, 450, 780, 330, 0x641818, 1);
    box.setOrigin(0.5);

    const outline = this.add.graphics();
    outline.lineStyle(3, 0xffffff, 1);
    outline.strokeRect(410, 285, 780, 330);

    const title = this.add.text(800, 335, "Restart Game?", {
      fontFamily: "DogicaBold",
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
    });
    title.setOrigin(0.5);

    const body = this.add.text(800, 405, "This will reset your game data.", {
      fontFamily: "Dogica",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      align: "center",
    });
    body.setOrigin(0.5);

    const yes = this.add.text(660, 525, "Yes", {
      fontFamily: "DogicaBold",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    yes.setOrigin(0.5);
    yes.setInteractive({ useHandCursor: false });

    const no = this.add.text(940, 525, "No", {
      fontFamily: "DogicaBold",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    no.setOrigin(0.5);
    no.setInteractive({ useHandCursor: false });

    yes.on("pointerover", () => {
      yes.setAlpha(0.7);
      this.input.setDefaultCursor("pointer");
    });

    yes.on("pointerout", () => {
      yes.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    no.on("pointerover", () => {
      no.setAlpha(0.7);
      this.input.setDefaultCursor("pointer");
    });

    no.on("pointerout", () => {
      no.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    yes.on("pointerdown", () => {
      this.confirmRestartGame();
    });

    no.on("pointerdown", () => {
      this.hideRestartConfirm();
    });

    this.restartConfirmRoot.add([blocker, box, outline, title, body, yes, no]);
  }

  hideRestartConfirm() {
    if (!this.restartConfirmRoot) return;

    this.restartConfirmRoot.destroy(true);
    this.restartConfirmRoot = null;
    this.input.setDefaultCursor("default");
  }

  async confirmRestartGame() {
    try {
      await resetGameData();
      this.hideRestartConfirm();
    } catch (error) {
      console.error("Could not reset game data.", error);

      if (this.restartConfirmRoot) {
        const err = this.add.text(800, 590, "Reset failed", {
          fontFamily: "DogicaBold",
          fontSize: "16px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
        });

        err.setOrigin(0.5);
        this.restartConfirmRoot.add(err);
      }
    }
  }

  /// make IMg become width pixels wide and scale height relative to it
  fitImageWidth(img, w) {
    const s = w / img.width;
    img.setScale(s);
    // console.log(s)
    // console.log(img)
    // console.log(w)
  }
  fitImageHeight(img, h) {
    const s = h / img.height;
    img.setScale(s);
  }
  ///

  // ALARM EFFECT

  freshTween() {
    // window.alert("Werwejhrw")
    if (this.t_alarm_smooth) {
      this.t_alarm_smooth.remove();
      // console.log("weirwrj")
    }

    const a = el_pos.alarm.tw_smooth;
    const b = this.alarm_glow_smooth.width;
    const sbase = a / b;

    const c = el_pos.alarm.tw_pixel;
    const d = this.alarm_glow.width;

    const pbase = c / d;

    this.alarm_glow_smooth.setScale(sbase * 0.9);
    this.alarm_glow.setScale(pbase * 1.5);

    // flashing animation for smooth radial glow
    this.t_alarm_smooth = this.tweens.add({
      targets: this.alarm_glow_smooth,
      alpha: { from: 0.4, to: 0.65 },
      scaleX: { from: sbase * 1, to: sbase * 1.18 },
      scaleY: { from: sbase * 1, to: sbase * 1.18 },
      duration: 1300,
      yoyo: true, // tween backward too
      repeat: -1,
      ease: "Sine.Out",
    });
  }

  make_smooth_alarm() {
    // console.log("weiwhiruhwriutgwei")
    const name = "smooth-alarm-red";
    if (this.textures.exists(name)) return;
    // make sure dont re-create exisitn texture

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

  makeAlarm() {
    const screen = Phaser.BlendModes.SCREEN;
    // create radial glow underrneath the pixel glow
    this.make_smooth_alarm();

    this.alarm_glow_smooth = this.add.image(
      el_pos.alarm.x,
      el_pos.alarm.smoothY,
      "smooth-alarm-red", // make_smooth_alarm()'s name
    );

    this.alarm_glow_smooth.setDepth(depth.alarm_smooth);

    this.alarm_glow_smooth.setBlendMode(screen);
    this.alarm_glow_smooth.setAlpha(0.6);
    // make pixelated alarm over smooth radial glow
    this.alarm_glow = this.add.image(
      el_pos.alarm.x,
      el_pos.alarm.pixelY,
      "alarm-pixel",
    );

    const test = 6;
    console.log(depth.alarm_px);

    this.alarm_glow.setDepth(6);

    this.alarm_glow.setBlendMode(screen);
    // this.alarm_glow.setBlendMode(Phaser.BlendModes.COLOR);
    // this.alarm_glow.setBlendMode(Phaser.BlendModes.LIGHTEN);

    this.alarm_glow.setAlpha(0.2);

    // console.log(this.alarm_glow.blendMode)

    this.freshTween();
  }

  // create's buttons with the "n" label so we dont need to manually like 9 buttons
  makeButtons(n) {
    // the green button background
    const hover = this.add.image(0, 0, "title-button-bg-hover");

    // the red button baackground (when u hover over it, this fades, and the green button shows instead (thats the hover effect))
    const bg = this.add.image(0, 0, "title-button-bg");

    const text = this.add.text(0, 0, n, {
      fontFamily: "DogicaBold",
      fontSize: "32px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center",
    });

    hover.setOrigin(0.5);
    bg.setOrigin(0.5);
    const zone = this.add.zone(0, 0, 1, 1);

    text.setOrigin(0.5);
    // zone.willRender

    zone.setOrigin(0.5);
    zone.setDepth(depth.btn_detect_zone);

    hover.setDepth(depth.btn_hovering);
    bg.setDepth(depth.btn_bg);

    text.setDepth(depth.btn_txt);

    hover.setAlpha(0);

    const b = { bg, hover, text, zone };
    // console.log(b.bg)
    // console.log(b.hover)
    // console.log(b.text)
    // console.log(b.zone)

    b.zindexes = {
      bg: depth.btn_bg,
      hover: depth.btn_hovering,
      text: depth.btn_txt,
      zone: depth.btn_detect_zone,
    };

    return b;
  }

  layoutButton(bt, x, y, w, h, fsize) {
    bt.bg.setPosition(x, y);
    // datapacks get made btw
    bt.bg.setDisplaySize(w, h);

    bt.text.setFontSize(`${fsize}px`);
    //hover btns
    bt.hover.setPosition(x, y);
    bt.hover.setDisplaySize(w, h);
    bt.hover.baseScaleY = bt.hover.scaleY;
    bt.hover.baseScaleX = bt.hover.scaleX;

    bt.text.setPosition(x, y);
    bt.zone.setPosition(x, y);

    bt.text.setScale(1);

    bt.zone.setSize(w * 0.8, h * 0.55);
    //for tweening
    bt.targetY = y;
    bt.targetX = x;

    bt.bg.baseScaleX = bt.bg.scaleX;
    bt.bg.baseScaleY = bt.bg.scaleY;
    bt.text.baseScaleX = 1;
    //the
    bt.text.baseScaleY = 1;
  }

  setBtn_PackVisible(btp, visible, interactable = visible) {
    if (!btp) return;

    const d = btp.zindexes;
    if (visible) {
      btp.bg.setDepth(d.bg);
      btp.hover.setDepth(d.hover);
      btp.text.setDepth(d.text);
      btp.zone.setDepth(d.zone);
    } else {
      // so no interfering button behaviours
      btp.bg.setDepth(0);
      btp.hover.setDepth(0);
      btp.text.setDepth(0);
      btp.zone.setDepth(0);
    }

    btp.bg.setVisible(visible);
    btp.hover.setVisible(visible);
    btp.text.setVisible(visible);
    btp.zone.setVisible(visible);

    if (!visible) {
      btp.zone.isHovered = false;
      btp.zone.disableInteractive();
      return;
    }

    if (interactable) {
      btp.zone.setInteractive({ useHandCursor: false });
    } else {
      btp.zone.disableInteractive();
    }
  }

  resetBtnHovering(btp) {
    // window.alert("awfwerw")
    if (!btp) return;
    // window.alert("werewjgjkw")

    this.tweens.killTweensOf(btp.bg);
    this.tweens.killTweensOf(btp.hover);
    this.tweens.killTweensOf(btp.text);

    btp.zone.isHovered = false;
    btp.bg.setAlpha(1);

    btp.hover.setScale(btp.hover.baseScaleX, btp.hover.baseScaleY);
    btp.hover.setAlpha(0);

    btp.bg.setScale(btp.bg.baseScaleX, btp.bg.baseScaleY);

    btp.text.setAlpha(1);
    btp.text.setScale(1);
  }

  bringBtnSetIn(btp, delay = 0) {
    let ty;

    // if (btp.targetY !== undefined) {
    //   if (btp.targetY !== null) {
    //     ty = btp.targetY;
    //   } else {
    //     ty = btp.bg.y;
    //   }
    // } else {
    //   ty = btp.bg.y;
    // }

    // i think this is the same as the code above hopefuly it works?
    if (btp.targetY !== undefined && btp.targetY !== null) {
      ty = btp.targetY;
    } else {
      ty = btp.bg.y;
    }

    //REMOVE CURRENT TWEEN
    this.tweens.killTweensOf(btp.bg);
    this.tweens.killTweensOf(btp.hover);
    this.tweens.killTweensOf(btp.text);
    this.tweens.killTweensOf(btp.zone);

    this.setBtn_PackVisible(btp, true, false);
    this.resetBtnHovering(btp);

    btp.bg.alpha = 0;
    btp.hover.alpha = 0;
    btp.text.alpha = 0;

    const a = 18;
    btp.bg.y = ty + a;
    btp.hover.y = ty + a;
    btp.text.y = ty + a;
    btp.zone.y = ty + a;

    const b = [btp.bg, btp.hover, btp.text, btp.zone];
    const a2 = [btp.bg, btp.text];
    this.tweens.add({
      targets: b,
      y: ty,
      duration: 260,
      ease: "Cubic.Out",
      delay,
      onComplete: () => {
        btp.bg.y = ty;
        btp.hover.y = ty;
        btp.text.y = ty;
        btp.zone.y = ty;

        if (btp.bg.visible) {
          if (!this.middleOfTrans) {
            btp.zone.setInteractive({ useHandCursor: false });
          }
        }
      },
    });

    this.tweens.add({
      targets: a2,
      alpha: 1,
      duration: 260,
      ease: "Cubic.Out",
      delay,
    });

    btp.targetY = ty;
  }

  bringBtnSetOut(btp, delay = 0) {
    let ty;

    if (btp.targetY !== undefined) {
      if (btp.targetY !== null) {
        ty = btp.targetY;
      } else {
        ty = btp.bg.y;
      }
    } else {
      ty = btp.bg.y;
    }

    btp.zone.disableInteractive();

    btp.zone.isHovered = false;

    // REMOVE ANY TWEENING
    this.tweens.killTweensOf(btp.bg);
    this.tweens.killTweensOf(btp.hover);
    this.tweens.killTweensOf(btp.text);

    this.tweens.killTweensOf(btp.zone);

    const tars = [btp.bg, btp.hover, btp.text, btp.zone];
    const tars2 = [btp.bg, btp.hover, btp.text];

    //PUT OUT TWEEN
    this.tweens.add({
      targets: tars,
      y: ty + 18,
      duration: 220,
      ease: "Cubic.In",
      delay,
    });

    this.tweens.add({
      targets: tars2,
      alpha: 0,
      duration: 220,
      ease: "Cubic.In",
      delay,
      onComplete: () => {
        this.setBtn_PackVisible(btp, false);
        btp.bg.y = ty;
        btp.hover.y = ty;
        btp.text.y = ty;
        btp.zone.y = ty;
        this.resetBtnHovering(btp);
      },
    });
  }

  btn_click_and_hover(btp, onClick) {
    const zone = btp.zone;
    const bg = btp.bg;
    const hoverBg = btp.hover;
    const text = btp.text;

    zone.setInteractive({ useHandCursor: false });
    zone.isHovered = false;

    zone.on("pointerover", () => {
      if (this.middleOfTrans) return;
      if (!zone.input || !zone.input.enabled) return;
      if (zone.isHovered) return;

      zone.isHovered = true;
      this.hover();

      this.tweens.killTweensOf(bg);
      this.tweens.killTweensOf(hoverBg);
      this.tweens.killTweensOf(text);

      this.tweens.add({
        targets: [bg, hoverBg],
        scaleX: bg.baseScaleX * 1.04,
        scaleY: bg.baseScaleY * 1.04,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: bg,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });
      this.tweens.add({
        targets: hoverBg,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });
      this.tweens.add({
        targets: text,
        alpha: 0.8,
        scaleX: text.baseScaleX * 0.95,
        scaleY: text.baseScaleY * 0.95,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    zone.on("pointerout", () => {
      if (this.middleOfTrans) return;
      if (!zone.input || !zone.input.enabled) return;
      if (!zone.isHovered) return;

      zone.isHovered = false;
      this.not_hover();

      this.tweens.killTweensOf(bg);
      this.tweens.killTweensOf(hoverBg);
      this.tweens.killTweensOf(text);

      this.tweens.add({
        targets: [bg, hoverBg],
        scaleX: bg.baseScaleX,
        scaleY: bg.baseScaleY,
        duration: 120,
        ease: "Quad.Out",
      });

      this.tweens.add({
        targets: bg,
        alpha: 1,
        duration: 120,
        ease: "Quad.Out",
      });
      this.tweens.add({
        targets: hoverBg,
        alpha: 0,
        duration: 120,
        ease: "Quad.Out",
      });
      this.tweens.add({
        targets: text,
        alpha: 1,
        scaleX: text.baseScaleX,
        scaleY: text.baseScaleY,
        duration: 120,
        ease: "Quad.Out",
      });
    });

    zone.on("pointerdown", () => {
      if (this.middleOfTrans) return;
      if (!zone.input || !zone.input.enabled) return;
      onClick();
    });
  }

  allBtnPacksCurr() {
    return [
      this.playBtns_Pack,
      this.settBtns_Pack,
      this.abtBtns_Pack,
      this.returnBtns_Pack,
      this.credBtns_Pack,
      //settings
      //!! remove if broken idk test
      this.settingsCancelBtns_Pack,
      this.settingsSaveBtns_Pack,
      this.settingsDefaultBtns_Pack,
    ];
  }

  // some kind of bounding box??
  //https://docs.phaser.io/api-documentation/class/geom-rectangle
  mouseOverDetect(zone) {
    const active = this.input.activePointer;
    const getboundResult = zone.getBounds();
    return Phaser.Geom.Rectangle.Contains(getboundResult, active.x, active.y);
  }

  forceBtnOver(btp, hoved) {
    if (!btp || !btp.bg.visible) return;
    if (!btp.zone.input || !btp.zone.input.enabled) return;

    this.tweens.killTweensOf(btp.bg);
    this.tweens.killTweensOf(btp.hover);
    this.tweens.killTweensOf(btp.text);

    btp.zone.isHovered = hoved;
    const bgX = btp.bg.baseScaleX;
    const hovX = btp.hover.baseScaleX;
    const hovY = btp.hover.baseScaleY;
    const bgY = btp.bg.baseScaleY;

    if (hoved) {
      btp.bg.setScale(btp.bg.baseScaleX * 1.04, btp.bg.baseScaleY * 1.04);
      btp.hover.setScale(
        btp.hover.baseScaleX * 1.04,
        btp.hover.baseScaleY * 1.04,
      );
      btp.bg.setAlpha(0);
      btp.hover.setAlpha(1);
      btp.text.setAlpha(0.8);
      btp.text.setScale(0.95);
    } else {
      btp.bg.setScale(bgX, bgY);
      btp.hover.setScale(hovX, hovY);
      btp.bg.setAlpha(1);
      btp.hover.setAlpha(0);
      btp.text.setAlpha(1);
      btp.text.setScale(1);
    }
  }

  resBtnHoverStates() {
    let cOver = false;
    const all = this.allBtnPacksCurr();

    all.forEach((b) => {
      // SKIP THE VISIBLE AND ENABLED BUTTONS
      if (!b || !b.bg.visible) return; // if visible bg of button

      if (!b.zone.input || !b.zone.input.enabled) return; // if the input is enabled

      const hovered = this.mouseOverDetect(b.zone);
      this.forceBtnOver(b, hovered);
      if (hovered) cOver = true;
    });

    if (cOver) this.hover();
    else this.not_hover();
  }

  // ---=-----------------
  // START HERE
  // PAGE TRANSITIONS
  // PAGE TRANSITIONS
  // PAGE TRANSITIONS
  fadeIn(el, duration, delay) {
    if (!duration) {
      duration = 240;
    }
    if (!delay) {
      delay = 0;
      // console.log(del)
    }
    if (el) {
      el.forEach((iel) => {
        this.tweens.killTweensOf(iel);
        let targetAlpha = iel.showAlpha;
        this.makeVisible_Zindex(iel, true);

        iel.alpha = 0;

        if (targetAlpha == null) {
          // console.log("yes")
          targetAlpha = 1;
        }
        // if (!targetAlpha) {
        //   console.log("yes")
        // }

        this.tweens.add({
          targets: iel,
          alpha: targetAlpha,
          duration: duration,
          delay: delay,
          ease: "Cubic.Out",
        });
      });
    } else {
      console.log("err");
    }
  }

  makeVisible_Zindex(el, canSee) {
    if (!el) return;
    let ok;
    if (canSee) {
      ok = 1;
    }
    if (!canSee) {
      ok = 0;
    }

    el.default_depth = el.default_depth || el.depth;

    el.setDepth(el.default_depth * ok);
    let truefalse;
    if (ok === 1) {
      truefalse = true;
    } else {
      truefalse = false;
    }
    el.setVisible(truefalse);
  }

  fadeOut(el, duration, delay, completed) {
    let finished = 0;

    if (!duration) {
      duration = 240;
    }
    if (!delay) {
      delay = 0;
      // console.log(del)
    }

    el.forEach((iel) => {
      this.tweens.killTweensOf(iel);

      this.tweens.add({
        targets: iel,
        alpha: 0,
        duration: duration,
        delay: delay,
        ease: "Cubic.In",
        onComplete: () => {
          this.makeVisible_Zindex(iel, false);
          finished = finished + 1;

          if (finished === el.length) {
            if (completed) {
              onComplete();
            }
          }
        },
      });
    });
  }

  startPageTrans(next) {
    // stop changing in middle of change
    if (this.middleOfTrans) return false;
    // sstop change if already on page to change to
    if (this.pageState === next) return false;

    this.middleOfTrans = true;
    const all = this.allBtnPacksCurr();

    all.forEach((b) => {
      if (b) {
        b.zone.disableInteractive();
      } else {
        console.log("idk");
      }
    });

    //allow interaction when using settings page
    this.makeSettingOpsInteracteable(false);

    return true;
  }

  endPageTrans(delay) {
    const ps = this.pageState;
    if (!delay) {
      delay = 500;
    }
    if (typeof delay !== Number) {
      delay = 500;
    }
    this.time.delayedCall(delay, () => {
      this.middleOfTrans = false;
      const all = this.allBtnPacksCurr();

      // TRANSITION ALL THE BUTTONS, THIS DOES ALL THE BUTTONS SAME TIME (IF VISIBLE)
      all.forEach((b) => {
        if (b) {
          // when be visible
          if (b.bg.visible) {
            b.zone.setInteractive({ useHandCursor: false });
          }
        }
      });

      if (ps === "settings") {
        this.makeSettingOpsInteracteable(true);
      }

      this.resBtnHoverStates();
    });
  }

  activeAlarm(yes) {
    this.alarm_glow_smooth.setVisible(yes);
    this.alarm_glow.setVisible(yes);

    const notYes = !yes;

    if (this.t_alarm_smooth) {
      this.t_alarm_smooth.paused = notYes;
    }
  }

  // THE DIFFERNT PAGES TO SHOW BETWEEN PAGE TRANSITIONS
  showTitlePage() {
    // if already on this page or in the middle of a transiton, DONT SWITCH
    if (!this.startPageTrans("title")) return;

    const times = 140;

    // change current page to title
    this.pageState = "title";
    // only title has an alarm anim visible
    this.activeAlarm(true);

    const a = 220;
    const b = 260;

    // hide settings butons intially
    this.setBtn_PackVisible(this.settingsCancelBtns_Pack, false);
    this.setBtn_PackVisible(this.settingsSaveBtns_Pack, false);
    this.setBtn_PackVisible(this.settingsDefaultBtns_Pack, false);

    // hide not-title things
    this.fadeOut(this.about_objs, a);
    this.fadeOut(this.credits_objs, a);

    this.closeResOptionMenu();

    //settigns
    this.fadeOut(this.settings_objs, a);
    //TODO: MAKE THEM FADE OUT FASTER I DONT KNOW WHY THESE STILL LINGER AFTER
    this.bringBtnSetOut(this.settingsCancelBtns_Pack);
    this.bringBtnSetOut(this.settingsSaveBtns_Pack);
    this.bringBtnSetOut(this.settingsDefaultBtns_Pack);

    this.bringBtnSetOut(this.returnBtns_Pack);

    // hide overlay
    this.fadeOut(this.overlayObjects, a);

    this.bringBtnSetOut(this.credBtns_Pack);

    this.makeVisible_Zindex(this.logo, true);
    this.tweens.killTweensOf(this.logo);

    this.tweens.add({
      targets: this.logo,
      alpha: 1,
      duration: b,
      ease: "Cubic.Out",
    });

    // SHOW TITLE PAGE BTUTONS one by one
    this.bringBtnSetIn(this.playBtns_Pack, 60);
    this.bringBtnSetIn(this.settBtns_Pack, times - 40);
    this.bringBtnSetIn(this.abtBtns_Pack, times);

    const t = a + b + a + a + a + 60 + 100 + times;

    this.endPageTrans(500);
  }

  showAboutPage() {
    // NOT THE SAME AS GOING FROM CRED TO ABOUT, this is title -> about
    if (!this.startPageTrans("about")) return;
    this.pageState = "about";

    // NO ALARM ON ABOUT AND CREDIT PAGE
    this.activeAlarm(false);

    const d = 260;

    this.tweens.killTweensOf(this.logo);
    this.tweens.add({
      targets: this.logo,
      alpha: 0,
      duration: 180,
      ease: "Cubic.In",
      onComplete: () => this.makeVisible_Zindex(this.logo, false),
    });

    // remove title screen btns (incase came form title screen)
    this.bringBtnSetOut(this.playBtns_Pack);
    this.bringBtnSetOut(this.settBtns_Pack, 40);

    this.bringBtnSetOut(this.abtBtns_Pack, 80);

    // TECNICALLY YOU DONT NEED THIS
    // BECAUSE TO GET TO CREDITS, YOU NEED TO GO THROUGH TITLE, AND IF YOU ARE IN SETTINGS, YOU MUST GO TO TITLE BEFORE GOING TO CREDITS
    // BUT I WILL ADD IT ANYWAY JSTU INCASE
    this.closeResOptionMenu();
    this.fadeOut(this.settings_objs, 120);
    this.bringBtnSetOut(this.settingsCancelBtns_Pack);
    this.bringBtnSetOut(this.settingsSaveBtns_Pack);
    this.bringBtnSetOut(this.settingsDefaultBtns_Pack);

    // ADD ASTMOPHERIC OVERLAY
    this.fadeIn(this.overlayObjects, d, 80);
    this.fadeIn(this.about_objs, d, 140);

    // HIDE CREDITS IF SHOWN
    this.fadeOut(this.credits_objs, 120);

    // ABOUT BUTTONS
    this.bringBtnSetIn(this.returnBtns_Pack, 180);
    this.bringBtnSetIn(this.credBtns_Pack, 220);

    this.endPageTrans(600);
  }

  showCreditsPage() {
    if (!this.startPageTrans("credits")) return;
    this.pageState = "credits";
    // same reaosning the about page, tehcnically dont need this
    this.closeResOptionMenu();
    this.fadeOut(this.settings_objs, 120);
    this.bringBtnSetOut(this.settingsCancelBtns_Pack);
    this.bringBtnSetOut(this.settingsSaveBtns_Pack);
    this.bringBtnSetOut(this.settingsDefaultBtns_Pack);

    // to get to credits, u need to go alarm -> credits
    this.fadeOut(this.about_objs, 180);
    this.bringBtnSetOut(this.credBtns_Pack);
    this.fadeIn(this.credits_objs, 240, 80);
    this.bringBtnSetIn(this.returnBtns_Pack, 100);

    this.endPageTrans(500);
  }

  showAboutFromCredits() {
    if (!this.startPageTrans("about")) return;

    // TRANSITION BACK TO ABOUT FROM CRED
    // cred -> about
    this.pageState = "about";
    this.fadeOut(this.credits_objs, 180);
    this.fadeIn(this.about_objs, 220, 80);

    // about btns
    this.bringBtnSetIn(this.credBtns_Pack, 100);
    this.bringBtnSetIn(this.returnBtns_Pack, 100);

    this.endPageTrans(500);
  }
  // SETTINGS PAGE
  cleanSettings(data) {
    // exist
    if (!data) {
      data = {};
    }

    const d = default_game_settings;

    // if incorrect settings
    // shoudl be defualt by default and change later if the settings are coiorect values
    let music = d.musicVol;
    let sfx = d.sfxVol;

    let dialogue = d.dialogueVol;
    let bright = d.brightness;
    let cont = d.contrast;
    let res = d.resolution;

    if (!(data.musicVol === undefined)) {
      music = data.musicVol;
    }

    if (!(data.sfxVol === undefined)) {
      sfx = data.sfxVol;
    }

    if (!(data.dialogueVol === undefined)) {
      dialogue = data.dialogueVol;
    }

    if (!(data.brightness === undefined)) {
      bright = data.brightness;
    }

    if (!(data.contrast === undefined)) {
      cont = data.contrast;
    }

    if (!(data.resolution === undefined)) {
      res = data.resolution;
    }

    return {
      musicVol: wholeAndClamp(music),
      sfxVol: wholeAndClamp(sfx),
      dialogueVol: wholeAndClamp(dialogue),
      brightness: wholeAndClamp(bright),
      contrast: wholeAndClamp(cont),
      resolution: getRes(res).label,
    };
  }

  async loadApplySetts() {
    try {
      const loaded = await loadSettings();
      // window.alert("done")
      this.savedSettings = this.cleanSettings(loaded);
      this.settsDraft = { ...this.savedSettings };
      this.updateSettCtrls();
      this.changeSettingsCurrently(this.savedSettings);
    } catch (err) {
      // THE DB.JS WILL PUT A CARD (in index.html) THAT SAYS IF DATABSE FAILED TO READ/LOAD SO WE DONT NEED TO DO ANY ERROR MESSAGE HERE REALLY
      // use defaults
      this.savedSettings = this.cleanSettings(default_game_settings);
      this.settsDraft = { ...this.savedSettings };
      this.updateSettCtrls();
      this.changeSettingsCurrently(this.savedSettings);
      console.log(default_game_settings);
      // console.log("weruwor")
    }
  }

  putFilterScreen(brightness, contrast) {
    // 50 = normal.
    // 0 = low
    // 100 = high like high on drug

    const canvas = this.sys.game.canvas;

    const a = wholeAndClamp(brightness);

    const b = wholeAndClamp(contrast);
    const c = a / 100;
    const d = b / 100;
    const bright = 0.5 + c;

    const cont = 0.5 + d;

    if (canvas) {
      canvas.style.filter = `brightness(${bright}) contrast(${cont})`;
    } else {
      console.log("no canvas??");
      return;
    }
  }

  newResolution(value) {
    const option = getRes(value); // if what the user wants to change to actually is allowed

    if (option) {
      if (this.scale.setGameSize) {
        this.scale.setGameSize(option.w, option.h);
      } else {
        this.scale.resize(option.w, option.h);
      }

      //TODO: not working and zoom properly, fix this later, dont know how though
      const zoom = option.w / main_width;
      this.cameras.main.setViewport(0, 0, option.w, option.h);
      this.cameras.main.setZoom(zoom);
      this.cameras.main.setScroll(0, 0);
    } else {
      return;
    }
  }

  changeSettingsCurrently(settings) {
    const newset = this.cleanSettings(settings);

    this.putFilterScreen(newset.brightness, newset.contrast);
    this.newResolution(newset.resolution);
  }

  async saveNewSetts() {
    const final = this.cleanSettings(this.settsDraft);

    try {
      const saved = await saveSettings(final);
      this.savedSettings = this.cleanSettings(saved);
      this.settsDraft = { ...this.savedSettings };
      this.updateSettCtrls();
      this.changeSettingsCurrently(this.savedSettings);
    } catch (err) {
      console.log("errror savign settings");
      console.log(err);
      // return;
    }

    // return to title page
    this.showTitlePage();
  }

  dontSaveNewSetts() {
    this.settsDraft = { ...this.savedSettings };
    this.updateSettCtrls();
    this.closeResOptionMenu();
    this.showTitlePage();
    // window.alert('welrkwjhrw')
    // console.log(this.settsDraft)
  }

  settingReset() {
    this.settsDraft = this.cleanSettings(default_game_settings);
    this.updateSettCtrls();
    this.closeResOptionMenu();
  }

  showSettingsPage() {
    if (this.startPageTrans("settings")) {
      this.pageState = "settings";
      // take out alarm temp
      this.activeAlarm(false);

      const d = 260;

      this.tweens.killTweensOf(this.logo);

      this.tweens.add({
        targets: this.logo,
        alpha: 0,
        duration: 180,
        ease: "Cubic.In",
        onComplete: () => this.makeVisible_Zindex(this.logo, false),
      });

      this.bringBtnSetOut(this.playBtns_Pack);

      this.bringBtnSetOut(this.settBtns_Pack, 40);

      this.bringBtnSetOut(this.abtBtns_Pack, 80);
      this.bringBtnSetOut(this.returnBtns_Pack);

      //fade credits
      this.fadeOut(this.credits_objs, 120);

      this.bringBtnSetOut(this.credBtns_Pack);

      this.fadeOut(this.about_objs, 120);

      this.fadeIn(this.overlayObjects, d, 80);
      //birng in settings els
      this.fadeIn(this.settings_objs, d, 140);

      // bring in settigns butotns
      this.bringBtnSetIn(this.settingsCancelBtns_Pack, 180);

      this.bringBtnSetIn(this.settingsSaveBtns_Pack, 220);
      this.bringBtnSetIn(this.settingsDefaultBtns_Pack, 260);

      this.endPageTrans(650);
    } else {
      return;
    }
  }

  makeSettingsSlider(label, k, y) {
    const p = el_pos.settings;

    //slider
    const sliderW = p.sliderW;

    const sliderH = 12;

    const left = p.controlX - sliderW / 2;

    ///label
    const label_text = this.add.text(p.labelX, y, label, {
      fontFamily: "Dogica",
      fontSize: `17px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });

    label_text.setOrigin(0, 0.5);

    label_text.setDepth(depth.settings_ui);
    label_text.setVisible(false);

    label_text.setAlpha(0);

    //ths is the line that yuo slide the slider across
    const sliderLine = this.add.rectangle(
      p.controlX,
      y,
      sliderW,
      sliderH,
      0x461919,
    );

    sliderLine.setOrigin(0.5);
    sliderLine.setDepth(depth.settings_ui);

    const fill = this.add.rectangle(left, y, sliderW / 2, sliderH, 0x8a3434);
    const slider_btn = this.add.circle(left + sliderW / 2, y, 14, 0xffffff);

    sliderLine.setAlpha(0);

    sliderLine.setVisible(false);

    slider_btn.setVisible(false);
    fill.setVisible(false);
    slider_btn.setAlpha(0);

    fill.setOrigin(0, 0.5);

    fill.setAlpha(0);

    fill.setDepth(depth.settings_ui + 1);
    slider_btn.setDepth(depth.settings_ui + 2);

    const val_text = this.add.text(p.valueX, y, "50%", {
      fontFamily: "DogicaBold",
      fontSize: "15px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });

    // THE NUMBER INDACTOR OF % PERCANTAGE OF SLIDER
    val_text.setOrigin(0, 0.5);
    val_text.setDepth(depth.settings_ui);

    val_text.setVisible(false);

    val_text.setAlpha(0);

    // DETECTING IF USER MOUSE IN THIS AREA FOR MOVING SLIDER
    const zone = this.add.zone(p.controlX, y, sliderW + 42, 46);
    zone.setOrigin(0.5);

    //top above everything else
    zone.setDepth(depth.settings_ui + 3);
    zone.setVisible(false);

    zone.disableInteractive();

    const updateVisual = () => {
      // between 0 and 100
      const value = wholeAndClamp(this.settsDraft[k]);

      //horoizintoal position of slider/obs
      const px = left + (value / 100) * sliderW;

      //width of filled part of slider bar + 1 pixel wide so  visible
      const tw = (value / 100) * sliderW; //decimal %
      if (tw < 1) {
        fill.width = 1; // MUST BE 1 PIXEL AT LEAST
      } else {
        fill.width = tw;
      }

      slider_btn.setPosition(px, y);

      //show the percetange of slider sett
      val_text.setText(`${value}%`);
    };

    zone.on("pointerdown", (pointer) => {
      // dont work during transitions
      if (this.middleOfTrans) return;

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      let value = ((worldPoint.x - left) / sliderW) * 100;

      this.settsDraft[k] = wholeAndClamp(value);
      updateVisual();
    });

    zone.on("pointermove", (pointer) => {
      // dont work during transitions
      if (this.middleOfTrans) return;

      if (pointer.isDown) {
        const worldPoint = this.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y,
        );
        let value = ((worldPoint.x - left) / sliderW) * 100;

        this.settsDraft[k] = wholeAndClamp(value);
        updateVisual();
      }
    });

    zone.on("pointerover", () => {
      if (this.middleOfTrans) {
        return;
      } else {
        this.hover();
      }
    });

    zone.on("pointerout", () => {
      if (this.middleOfTrans) {
        return;
      } else {
        this.not_hover();
      }
    });

    const objs = [label_text, sliderLine, fill, slider_btn, val_text, zone];

    return {
      k,
      objs,
      updateVisual,
      enable() {
        zone.setInteractive({ useHandCursor: false });
      },
      disable() {
        zone.disableInteractive();
      },
    };
  }

  makeSettingsResolutionDropdown(y) {
    const p = el_pos.settings;
    const boxW = 360;
    const boxH = 52;

    const label_text = this.add.text(p.labelX, y, "Resolution", {
      fontFamily: "Dogica",
      fontSize: `17px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });

    label_text.setOrigin(0, 0.5);

    //zindex
    label_text.setDepth(depth.settings_ui);
    label_text.setVisible(false);

    label_text.setAlpha(0);

    const box = this.add.rectangle(p.controlX, y, boxW, boxH, 0x461919);
    box.setOrigin(0.5);
    box.setDepth(depth.settings_ui);
    box.setVisible(false);
    box.setAlpha(0);

    const selectedText = this.add.text(p.controlX - boxW / 2 + 20, y, "", {
      fontFamily: "DogicaBold",
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });
    selectedText.setOrigin(0, 0.5);
    selectedText.setDepth(depth.settings_ui + 1);
    selectedText.setVisible(false);
    selectedText.setAlpha(0);

    const arrowText = this.add.text(p.controlX + boxW / 2 - 38, y, "v", {
      fontFamily: "DogicaBold",
      fontSize: "14px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });
    arrowText.setOrigin(0.5);
    arrowText.setDepth(depth.settings_ui + 1);
    arrowText.setVisible(false);
    arrowText.setAlpha(0);

    const zone = this.add.zone(p.controlX, y, boxW, boxH);
    zone.setOrigin(0.5);
    zone.setDepth(depth.settings_ui + 2);
    zone.setVisible(false);
    zone.disableInteractive();

    this.settingsResolutionDropdownOpen = false;
    this.settingsResolutionDropdownObjs = [];

    const updateVisual = () => {
      const option = getRes(this.settsDraft.resolution);
      selectedText.setText(option.label);
    };

    zone.on("pointerdown", () => {
      if (this.middleOfTrans) return;
      this.toggleResOptionMenu();
    });

    zone.on("pointerover", () => {
      if (this.middleOfTrans) return;
      this.hover();
    });

    zone.on("pointerout", () => {
      if (this.middleOfTrans) return;
      this.not_hover();
    });

    const makeResRow = (res, index) => {
      const option = getRes(res);
      const rowY = y + boxH + index * boxH;

      const rowBg = this.add.rectangle(p.controlX, rowY, boxW, boxH, 0x2a1010);
      rowBg.setOrigin(0.5);
      rowBg.setDepth(depth.settings_dropdown);
      rowBg.setVisible(false);
      rowBg.setAlpha(0);

      const rowText = this.add.text(
        p.controlX - boxW / 2 + 20,
        rowY,
        option.label,
        {
          fontFamily: "DogicaBold",
          fontSize: "14px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 5,
        },
      );
      rowText.setOrigin(0, 0.5);
      rowText.setDepth(depth.settings_dropdown + 1);
      rowText.setVisible(false);
      rowText.setAlpha(0);

      const rowZone = this.add.zone(p.controlX, rowY, boxW, boxH);
      rowZone.setOrigin(0.5);
      rowZone.setDepth(depth.settings_dropdown + 2);
      rowZone.setVisible(false);
      rowZone.disableInteractive();

      rowZone.on("pointerdown", () => {
        if (this.middleOfTrans) return;

        this.settsDraft.resolution = option.label;
        updateVisual();
        this.closeResOptionMenu();
      });

      rowZone.on("pointerover", () => {
        if (this.middleOfTrans) return;
        this.hover();
      });

      rowZone.on("pointerout", () => {
        if (this.middleOfTrans) return;
        this.not_hover();
      });

      this.settingsResolutionDropdownObjs.push(rowBg, rowText, rowZone);
    };

    makeResRow("960x540", 0);
    makeResRow("1280x720", 1);
    makeResRow("1600x900", 2);
    makeResRow("1920x1080", 3);

    const objs = [label_text, box, selectedText, arrowText, zone];

    return {
      objs,
      updateVisual,
      enable() {
        zone.setInteractive({ useHandCursor: false });
      },
      disable() {
        zone.disableInteractive();
      },
    };
  }

  toggleResOptionMenu() {
    if (this.settingsResolutionDropdownOpen) {
      this.closeResOptionMenu();
    } else {
      this.openResOptionMenu();
    }
  }

  openResOptionMenu() {
    this.settingsResolutionDropdownOpen = true;

    this.settingsResolutionDropdownObjs.forEach((obj) => {
      obj.setVisible(true);
      obj.setAlpha(1);

      if (obj.type === "Zone") {
        obj.setInteractive({ useHandCursor: false });
      }
    });
  }

  closeResOptionMenu() {
    this.settingsResolutionDropdownOpen = false;

    if (!this.settingsResolutionDropdownObjs) return;

    this.settingsResolutionDropdownObjs.forEach((obj) => {
      obj.setVisible(false);
      obj.setAlpha(0);

      if (obj.type === "Zone") {
        obj.disableInteractive();
      }
    });
  }

  makeSettingOpsInteracteable(enabled) {
    if (!this.settingsControls) return;

    this.settingsControls.forEach((control) => {
      if (enabled) {
        control.enable();
      } else {
        control.disable();
      }
    });

    if (!enabled) {
      this.closeResOptionMenu();
    }
  }

  updateSettCtrls() {
    if (!this.settingsControls) return;

    this.settsDraft = this.cleanSettings(this.settsDraft);

    this.settingsControls.forEach((control) => {
      if (control.updateVisual) control.updateVisual();
    });
  }

  // CHANGING THE CUSTOM CURSOR ICONS
  // CHANGE THE PATH IN PRELOADER.JS NOT HERE
  hover() {
    this.input.setDefaultCursor("pointer");
  }

  not_hover() {
    this.input.setDefaultCursor("default");
  }

  // =---------------
  //
  // mAKE THE SCENE
  // mAKE THE SCENE
  // mAKE THE SCENE
  create() {
    // ---------------
    // ALL THE TEXT ON THE SCENE
    // ALL THE TEXT ON THE SCENE

    const aboutheadertext = "What is 7TH HELL?";
    const aboutbodytext = `normal school day hanging out w/ friends. u find a note in ur locker, telling u to meet somewhere. U pull up to the place and Judson is waiting, u dont rlly know the guy that much, just the rumors around him and hes in ur bio class.\n\nJudson confesses that hes liked u since freshman year and wants to take u out. U calmly reject him calmly, but calmly, he's strangely calm about it. Something isnt right. \n\nHow will he react to ur rejection? Will u escape him?`;
    // ALL THE TEXT ON THE SCENE
    // ALL THE TEXT ON THE SCENE
    // !!not all the text on the scene but the most important text at least
    // -------------------

    this.pageState = "title"; // default page on startup
    this.middleOfTrans = false;

    this.input.setDefaultCursor("default");

    //backgorund black
    this.bg = this.add.rectangle(0, 0, main_width, main_height, 0x000000);
    this.bg.setOrigin(0, 0);
    this.bg.setDepth(depth.bg);

    //image of hallway
    this.hallway = this.add.image(
      main_width / 2,
      main_height / 2,
      "title-hallway",
    );
    this.hallway.setOrigin(0.5);
    this.hallway.setDepth(depth.hallway);
    this.hallway.setDisplaySize(main_width, main_height);

    // COLOR filter type overlay on about / credit
    this.rectangle_overlay_atmos = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x625643,
    );
    const rooo = this.rectangle_overlay_atmos;
    rooo.setOrigin(0, 0);
    rooo.setAlpha(0);
    rooo.setVisible(false);
    rooo.setDepth(depth.rectangle_overlay);
    rooo.setBlendMode(Phaser.BlendModes.COLOR);
    rooo.showAlpha = 0.49;

    // SECOND color filter overlay pattern
    this.page_overlay_pat = this.add.image(
      main_width / 2,
      main_height / 2,
      "page-overlay-pattern",
    );
    this.page_overlay_pat.setOrigin(0.5);

    const popp = this.page_overlay_pat;
    popp.setVisible(false);

    popp.setAlpha(0);

    popp.setDepth(depth.overlay_pat);
    this.page_overlay_pat.setDisplaySize(main_width, main_height);

    this.page_overlay_pat.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.page_overlay_pat.showAlpha = 0.08;

    // gradient = the shadowy vigentte effect, it snot really a gradietn im just too lazy to change the name, but im not too lazy to type this message
    const ghshadow = main_height / 2;

    const gwshadow = main_width / 2;
    // shadow
    this.gradient = this.add.image(gwshadow, ghshadow, "title-gradient");

    // BORDERS
    this.border = this.add.image(gwshadow, ghshadow, "title-border");
    this.border.setOrigin(0.5);

    // this.gradient = this.add

    this.gradient.setOrigin(0.5);
    this.gradient.setDepth(depth.gradient);

    this.gradient.setDisplaySize(main_width, main_height);

    this.border.setDisplaySize(main_width, main_height);
    this.border.setDepth(depth.border);

    // create  alarm dedsign
    this.makeAlarm();

    this.line_extra_design = this.add.image(48, 0, "title-line-design");
    const ledd = this.line_extra_design;
    ledd.setOrigin(0.5, 0);

    this.fitImageHeight(ledd, main_height);
    ledd.setBlendMode(Phaser.BlendModes.SCREEN);

    ledd.setDepth(depth.extra_line);

    // 7TH HELL TITLE LOGO
    const testxlogo = el_pos.logo.x / 2;
    // const subtextxlogo = ghshadow -

    const testylogo = el_pos.logo.y / 2;

    const logoxpos = el_pos.logo.x;
    const logoypos = el_pos.logo.y;
    this.logo = this.add.image(logoxpos, logoypos, "title-logo");
    this.logo.setOrigin(0.5);

    this.logo.setDepth(depth.logo);

    this.logo.setAlpha(0);

    this.fitImageWidth(this.logo, el_pos.logo.w);

    // if (this.logo) {
    //   window.alert("yes")
    // }

    // if (!this.logo) {
    //   window.alert("yes")
    // }

    // title btns creation
    this.playBtns_Pack = this.makeButtons("START GAME");
    this.settBtns_Pack = this.makeButtons("SETTINGS");

    // PUT THE BUTTON IN PROPER PLACES
    this.layoutButton(
      this.playBtns_Pack,
      el_pos.title_buttons.play.x,
      el_pos.title_buttons.play.y,
      el_pos.title_buttons.play.w,
      el_pos.title_buttons.play.h,
      el_pos.title_buttons.play.font,
    );

    this.layoutButton(
      this.settBtns_Pack,
      el_pos.title_buttons.settings.x,
      el_pos.title_buttons.settings.y,
      el_pos.title_buttons.settings.w,
      el_pos.title_buttons.settings.h,
      el_pos.title_buttons.settings.font,
    );

    // nav buttons sep
    this.returnBtns_Pack = this.makeButtons("RETURN");

    this.layoutButton(
      this.returnBtns_Pack,
      el_pos.info_buttons.return.x,
      el_pos.info_buttons.return.y,
      el_pos.info_buttons.return.w,
      el_pos.info_buttons.return.h,
      el_pos.info_buttons.return.font,
    );

    this.credBtns_Pack = this.makeButtons("CREDITS");

    this.layoutButton(
      this.credBtns_Pack,
      el_pos.info_buttons.credits.x,
      el_pos.info_buttons.credits.y,
      el_pos.info_buttons.credits.w,
      el_pos.info_buttons.credits.h,
      el_pos.info_buttons.credits.font,
    );

    this.abtBtns_Pack = this.makeButtons("ABOUT"); // abt butns

    this.layoutButton(
      this.abtBtns_Pack,
      el_pos.title_buttons.about.x,
      el_pos.title_buttons.about.y,
      el_pos.title_buttons.about.w,
      el_pos.title_buttons.about.h,
      el_pos.title_buttons.about.font,
    );

    // SETTINGS BUTTONS
    this.settingsCancelBtns_Pack = this.makeButtons("CANCEL");
    this.settingsSaveBtns_Pack = this.makeButtons("SAVE");
    this.settingsDefaultBtns_Pack = this.makeButtons("DEFAULT");

    // hide
    this.setBtn_PackVisible(this.settingsCancelBtns_Pack, false);
    this.setBtn_PackVisible(this.settingsSaveBtns_Pack, false);
    this.setBtn_PackVisible(this.settingsDefaultBtns_Pack, false);

    this.layoutButton(
      this.settingsCancelBtns_Pack,
      el_pos.settings.buttons.cancel.x,
      el_pos.settings.buttons.cancel.y,
      el_pos.settings.buttons.cancel.w,
      el_pos.settings.buttons.cancel.h,
      el_pos.settings.buttons.cancel.font,
    );

    this.layoutButton(
      this.settingsSaveBtns_Pack,
      el_pos.settings.buttons.save.x,
      el_pos.settings.buttons.save.y,
      el_pos.settings.buttons.save.w,
      el_pos.settings.buttons.save.h,
      el_pos.settings.buttons.save.font,
    );

    this.layoutButton(
      this.settingsDefaultBtns_Pack,
      el_pos.settings.buttons.defaults.x,
      el_pos.settings.buttons.defaults.y,
      el_pos.settings.buttons.defaults.w,
      el_pos.settings.buttons.defaults.h,
      el_pos.settings.buttons.defaults.font,
    );

    // ABOUT TEXT

    this.aboutHeader = this.add.text(
      el_pos.about.header.x,
      el_pos.about.header.y,
      aboutheadertext,
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.about.header.font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 7,
        wordWrap: { width: el_pos.about.header.wrap },
      },
    );
    this.aboutHeader.setAlpha(0);
    this.aboutHeader.setVisible(false);

    this.aboutHeader.setDepth(depth.page_txt);

    this.aboutBody = this.add.text(
      el_pos.about.body.x,
      el_pos.about.body.y,
      aboutbodytext,
      {
        color: "#ffffff",
        stroke: "#000000",
        font: `700 ${el_pos.about.body.font}px Dogica`,
        strokeThickness: 6,
        wordWrap: { width: el_pos.about.body.wrap },
        lineSpacing: 11,
      },
    );
    this.aboutBody.setDepth(depth.page_txt);

    const abtBody = this.aboutBody;
    abtBody.setAlpha(0);

    abtBody.setVisible(false);

    this.about_objs = [this.aboutHeader, this.aboutBody];

    //------------------------------
    ///
    /// CREDITS PAGE START HERE
    /// CREDITS PAGE
    /// CREDITS PAGE
    /// CREDITS PAGE

    ///
    const credtx = el_pos.credits.title.x;
    const credty = el_pos.credits.title.y;
    this.creditsTitle = this.add.text(credtx, credty, "Credits", {
      fontFamily: "DogicaBold",
      fontSize: `${el_pos.credits.title.font}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
    });
    const thisCT = this.creditsTitle;
    thisCT.setVisible(false);

    this.creditsLogo = this.add.image(
      el_pos.credits.logo.x,
      el_pos.credits.logo.y,
      "credits-page-logo",
    );

    const thisCL = this.creditsLogo;
    thisCL.setAlpha(0);

    thisCT.setAlpha(0);
    thisCT.setDepth(depth.page_txt);

    thisCL.setDisplaySize(el_pos.credits.logo.w, el_pos.credits.logo.h);
    thisCL.setVisible(false);

    thisCL.setDepth(depth.page_txt);

    thisCL.setOrigin(0.5);

    // this.credit_text = [];

    this.credit_text = [];

    // CREDITS COLUMN 1
    this.c_role_1 = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y,
      "Low-Fidelity Design",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    this.c_role_1.setAlpha(0);
    const crole1 = this.c_role_1;
    crole1.setVisible(false);
    crole1.setDepth(depth.page_txt);

    this.c_role_1_name = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y + el_pos.credits.cred_line_gap,
      "Sam PenaFlorida",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    this.c_role_1_name.setAlpha(0);
    this.c_role_1_name.setDepth(depth.page_txt);

    this.c_role_2 = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y + el_pos.credits.credit_gap,
      "Content Inventory",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    this.c_role_2.setDepth(depth.page_txt);
    this.c_role_2.setAlpha(0);

    this.c_role_2.setVisible(false);

    this.c_role_1_name.setVisible(false);

    this.c_role_2_name = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y +
        el_pos.credits.credit_gap +
        el_pos.credits.cred_line_gap,
      "Justin",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );

    const crole2name = this.c_role_2_name;
    crole2name.setAlpha(0);
    crole2name.setVisible(false);
    crole2name.setDepth(depth.page_txt);

    this.c_role_3 = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y + el_pos.credits.credit_gap * 2,
      "User Script",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole3 = this.c_role_3;
    crole3.setAlpha(0);
    crole3.setVisible(false);
    crole3.setDepth(depth.page_txt);

    this.c_role_3_name = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y +
        el_pos.credits.credit_gap * 2 +
        el_pos.credits.cred_line_gap,
      "Justin",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole3name = this.c_role_3_name;
    crole3name.setAlpha(0);
    crole3name.setVisible(false);
    crole3name.setDepth(depth.page_txt);

    this.c_role_4 = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y + el_pos.credits.credit_gap * 3,
      "User Flow Guidelines",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole4 = this.c_role_4;
    crole4.setAlpha(0);
    crole4.setVisible(false);
    crole4.setDepth(depth.page_txt);

    this.c_role_4_name = this.add.text(
      el_pos.credits.col1.x,
      el_pos.credits.col1.y +
        el_pos.credits.credit_gap * 3 +
        el_pos.credits.cred_line_gap,
      "Justin, Caryl Alago",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole4name = this.c_role_4_name;
    crole4name.setAlpha(0);
    // as

    crole4name.setVisible(false);
    crole4name.setDepth(depth.page_txt);

    // CREDIT COLUMN 2
    this.c_role_5 = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y,
      "Game Visual Assets",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole5 = this.c_role_5;
    crole5.setAlpha(0);
    crole5.setVisible(false);
    crole5.setDepth(depth.page_txt);

    this.c_role_5_name = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y + el_pos.credits.cred_line_gap,
      "Reehan, Roman, Nim",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole5name = this.c_role_5_name;

    crole5name.setAlpha(0);
    crole5name.setVisible(false);
    crole5name.setDepth(depth.page_txt);

    this.c_role_6 = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y + el_pos.credits.credit_gap,
      "High-Fidelity Assets",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole6 = this.c_role_6;

    crole6.setAlpha(0);
    crole6.setVisible(false);
    crole6.setDepth(depth.page_txt);

    this.c_role_6_name = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y +
        el_pos.credits.credit_gap +
        el_pos.credits.cred_line_gap,
      "Caryl Alago",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole6name = this.c_role_6_name;
    crole6name.setAlpha(0);
    crole6name.setVisible(false);
    crole6name.setDepth(depth.page_txt);

    this.c_role_7 = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y + el_pos.credits.credit_gap * 2,
      "Coding & Additional Art",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.credits.cred_role_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );

    const crole7 = this.c_role_7;

    crole7.setAlpha(0);
    crole7.setVisible(false);
    crole7.setDepth(depth.page_txt);

    this.c_role_7_name = this.add.text(
      el_pos.credits.col2.x,
      el_pos.credits.col2.y +
        el_pos.credits.credit_gap * 2 +
        el_pos.credits.cred_line_gap,
      "Derek Lee",
      {
        fontFamily: "Dogica",
        fontSize: `${el_pos.credits.cred_font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      },
    );
    const crole7name = this.c_role_7_name;
    crole7name.setAlpha(0);
    crole7name.setVisible(false);
    crole7name.setDepth(depth.page_txt);

    this.credit_text.push(
      this.c_role_1,
      this.c_role_1_name,
      this.c_role_2,
      this.c_role_2_name,
      this.c_role_3,
      this.c_role_3_name,
      this.c_role_4,
      this.c_role_4_name,
      this.c_role_5,
      this.c_role_5_name,
      this.c_role_6,
      this.c_role_6_name,
      this.c_role_7,
      this.c_role_7_name,
    );

    // credits page objs
    this.credits_objs = [];

    // overlay objs
    this.overlayObjects = [];

    this.credits_objs.push(this.creditsLogo);

    this.credit_text.forEach((obj) => {
      this.credits_objs.push(obj);
    });

    this.credit_text.forEach((obj) => {
      obj.default_depth = obj.depth;
    });
    this.overlayObjects.push(this.page_overlay_pat);
    this.credits_objs.push(this.creditsTitle);

    this.overlayObjects.push(this.rectangle_overlay_atmos);
    // def zindedx/depth
    this.aboutHeader.default_depth = this.aboutHeader.depth;
    this.creditsTitle.default_depth = this.creditsTitle.depth;

    this.aboutBody.default_depth = this.aboutBody.depth;

    this.creditsLogo.default_depth = this.creditsLogo.depth;

    this.rectangle_overlay_atmos.default_depth =
      this.rectangle_overlay_atmos.depth;
    this.page_overlay_pat.default_depth = this.page_overlay_pat.depth;

    this.logo.default_depth = this.logo.depth;

    /// SETTINGS
    this.savedSettings = this.cleanSettings(default_game_settings);
    this.settsDraft = { ...this.savedSettings };

    const sp = el_pos.settings;

    const settingsTitle = this.add.text(sp.title.x, sp.title.y, "Settings", {
      fontFamily: "DogicaBold",
      fontSize: `${sp.title.font}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
    });
    settingsTitle.setOrigin(0, 0.5);
    settingsTitle.setDepth(depth.page_txt);
    settingsTitle.setVisible(false);
    settingsTitle.setAlpha(0);

    const s1 = this.makeSettingsSlider("Music Volume", "musicVol", sp.startY);
    const s2 = this.makeSettingsSlider(
      "SFX Volume",
      "sfxVol",
      sp.startY + sp.row_gap,
    );
    const s3 = this.makeSettingsSlider(
      "Dialogue Volume",
      "dialogueVol",
      sp.startY + sp.row_gap * 2,
    );
    const s4 = this.makeSettingsSlider(
      "Screen Brightness",
      "brightness",
      sp.startY + sp.row_gap * 3,
    );
    const s5 = this.makeSettingsSlider(
      "Contrast",
      "contrast",
      sp.startY + sp.row_gap * 4,
    );
    const s6 = this.makeSettingsResolutionDropdown(sp.startY + sp.row_gap * 5);

    this.settingsControls = [s1, s2, s3, s4, s5, s6];

    // w/ title
    this.settings_objs = [settingsTitle];
    // console.log(this.settings_objs)

    // each control -> main list
    this.settings_objs.push(...s1.objs);
    // console.log(...s1.objs)

    this.settings_objs.push(...s2.objs);
    this.settings_objs.push(...s3.objs);
    this.settings_objs.push(...s4.objs);
    this.settings_objs.push(...s5.objs);
    this.settings_objs.push(...s6.objs);
    // console.log(this.settings_objs)

    // normal browser cursor
    this.input.setDefaultCursor("default");

    // BUTTON EVENTS
    this.btn_click_and_hover(this.playBtns_Pack, () => {
      this.startGameFromSave();
    });

    this.btn_click_and_hover(this.settBtns_Pack, () => {
      this.showSettingsPage();
    });

    this.btn_click_and_hover(this.settingsCancelBtns_Pack, () => {
      this.dontSaveNewSetts();
    });

    this.btn_click_and_hover(this.settingsSaveBtns_Pack, () => {
      this.saveNewSetts();
    });

    this.btn_click_and_hover(this.settingsDefaultBtns_Pack, () => {
      this.settingReset();
    });

    // ABOUT PAGE
    this.btn_click_and_hover(this.abtBtns_Pack, () => this.showAboutPage());
    this.btn_click_and_hover(this.returnBtns_Pack, () => {
      const state = this.pageState;
      // console.log(state)
      if (state === "credits") {
        this.showAboutFromCredits();
      } else {
        this.showTitlePage();
      }
    });

    this.makeRestartButton();

    //CREDITS
    this.btn_click_and_hover(this.credBtns_Pack, () => this.showCreditsPage());

    ///
    this.setBtn_PackVisible(this.playBtns_Pack, false);
    this.setBtn_PackVisible(this.settBtns_Pack, false);
    this.setBtn_PackVisible(this.abtBtns_Pack, false);

    this.setBtn_PackVisible(this.returnBtns_Pack, false);
    this.setBtn_PackVisible(this.credBtns_Pack, false);

    // intro
    this.logo.setPosition(
      el_pos.logo.x,
      el_pos.logo.y + el_pos.logo.introOffsetY,
    );
    this.tweens.add({
      targets: this.logo,
      x: el_pos.logo.x,
      y: el_pos.logo.y,
      alpha: 1,
      duration: 900,
      ease: "Cubic.Out",
    });
    // this.logo.setDepth(10)

    this.bringBtnSetIn(this.playBtns_Pack, 120);
    this.bringBtnSetIn(this.settBtns_Pack, 180);

    this.bringBtnSetIn(this.abtBtns_Pack, 240);

    this.time.delayedCall(600, () => this.resBtnHoverStates());

    // LOAD SETTTINGS
    this.loadApplySetts();
  }
}
