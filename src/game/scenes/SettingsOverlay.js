import Phaser, { Scene } from "phaser";
import { default_game_settings, loadSettings, saveSettings } from "../db";

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
};

// CHANGE Z INDEX ALL HERE
const depth = {
  bg: -10,
  rectangle_overlay: 2,
  overlay_pat: 3,
  btn_hovering: 6,
  btn_bg: 7,
  btn_txt: 8,
  btn_detect_zone: 9,
  page_txt: 12,
  settings_ui: 14,
  settings_dropdown: 30,
  blocker: 900,
};

///
// BUILDING SCENE
//
export class SettingsOverlay extends Scene {
  constructor() {
    super("SettingsOverlay");

    this.isOpen = false;
    this.returnToPause = false;
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
              completed();
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

    // close global settings overlay
    this.hideSettingsPage();
  }

  dontSaveNewSetts() {
    this.settsDraft = { ...this.savedSettings };
    this.updateSettCtrls();
    this.closeResOptionMenu();
    this.hideSettingsPage();
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

      const d = 260;

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

  hideSettingsPage() {
    if (!this.isOpen) return;
    if (this.middleOfTrans) return;

    this.middleOfTrans = true;

    this.makeSettingOpsInteracteable(false);
    this.closeResOptionMenu();

    this.fadeOut(this.settings_objs, 180);
    this.fadeOut(this.overlayObjects, 180);

    this.bringBtnSetOut(this.settingsCancelBtns_Pack);
    this.bringBtnSetOut(this.settingsSaveBtns_Pack, 40);
    this.bringBtnSetOut(this.settingsDefaultBtns_Pack, 80);

    this.time.delayedCall(300, () => {
      this.isOpen = false;
      this.pageState = "closed";
      this.middleOfTrans = false;

      this.cameras.main.setVisible(false);
      this.input.enabled = false;
      this.input.setDefaultCursor("default");

      if (this.returnToPause && this.scene.isActive("PauseMenuOverlay")) {
        this.scene.bringToTop("PauseMenuOverlay");
      }

      this.returnToPause = false;
    });
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

  async open(config = {}) {
    if (this.isOpen) return;

    this.isOpen = true;
    this.returnToPause = !!config.returnToPause;

    this.pageState = "closed";
    this.middleOfTrans = false;

    this.cameras.main.setVisible(true);
    this.input.enabled = true;

    await this.loadApplySetts();

    this.scene.bringToTop();
    this.showSettingsPage();
  }

  // =---------------
  //
  // mAKE THE SCENE
  // mAKE THE SCENE
  // mAKE THE SCENE
  create() {
    this.pageState = "closed"; // default page on startup
    this.middleOfTrans = false;

    this.input.setDefaultCursor("default");

    this.savedSettings = this.cleanSettings(default_game_settings);
    this.settsDraft = { ...this.savedSettings };

    this.settingsControls = [];
    this.settings_objs = [];
    this.overlayObjects = [];

    this.settingsResolutionDropdownOpen = false;
    this.settingsResolutionDropdownObjs = [];

    // hide whole overlay scene by default
    this.cameras.main.setVisible(false);
    this.input.enabled = false;

    // DARK BG SCREEN BEHIND SETTINGS
    this.settings_blocker = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
    );
    this.settings_blocker.setOrigin(0, 0);
    this.settings_blocker.setDepth(depth.blocker);
    this.settings_blocker.setAlpha(0);
    this.settings_blocker.setVisible(false);
    this.settings_blocker.setInteractive();
    this.settings_blocker.showAlpha = 0.72;

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
    rooo.setDepth(depth.rectangle_overlay + depth.blocker);
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

    popp.setDepth(depth.overlay_pat + depth.blocker);
    this.page_overlay_pat.setDisplaySize(main_width, main_height);

    this.page_overlay_pat.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.page_overlay_pat.showAlpha = 0.08;

    this.overlayObjects.push(
      this.settings_blocker,
      this.rectangle_overlay_atmos,
      this.page_overlay_pat,
    );

    // SETTINGS BUTTONS
    this.settingsCancelBtns_Pack = this.makeButtons("CANCEL");
    this.settingsSaveBtns_Pack = this.makeButtons("SAVE");
    this.settingsDefaultBtns_Pack = this.makeButtons("DEFAULT");

    // push buttons above blocker
    this.settingsCancelBtns_Pack.zindexes.bg += depth.blocker;
    this.settingsCancelBtns_Pack.zindexes.hover += depth.blocker;
    this.settingsCancelBtns_Pack.zindexes.text += depth.blocker;
    this.settingsCancelBtns_Pack.zindexes.zone += depth.blocker;

    this.settingsSaveBtns_Pack.zindexes.bg += depth.blocker;
    this.settingsSaveBtns_Pack.zindexes.hover += depth.blocker;
    this.settingsSaveBtns_Pack.zindexes.text += depth.blocker;
    this.settingsSaveBtns_Pack.zindexes.zone += depth.blocker;

    this.settingsDefaultBtns_Pack.zindexes.bg += depth.blocker;
    this.settingsDefaultBtns_Pack.zindexes.hover += depth.blocker;
    this.settingsDefaultBtns_Pack.zindexes.text += depth.blocker;
    this.settingsDefaultBtns_Pack.zindexes.zone += depth.blocker;

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

    // SETTINGS TEXT
    this.settingsTitle = this.add.text(
      el_pos.settings.title.x,
      el_pos.settings.title.y,
      "Settings",
      {
        fontFamily: "DogicaBold",
        fontSize: `${el_pos.settings.title.font}px`,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
      },
    );

    this.settingsTitle.setDepth(depth.settings_ui + depth.blocker);
    this.settingsTitle.setAlpha(0);
    this.settingsTitle.setVisible(false);

    this.settings_objs.push(this.settingsTitle);

    const p = el_pos.settings;

    const musicControl = this.makeSettingsSlider(
      "Music Volume",
      "musicVol",
      p.startY,
    );

    const sfxControl = this.makeSettingsSlider(
      "SFX Volume",
      "sfxVol",
      p.startY + p.row_gap,
    );

    const dialogueControl = this.makeSettingsSlider(
      "Dialogue Volume",
      "dialogueVol",
      p.startY + p.row_gap * 2,
    );

    const brightnessControl = this.makeSettingsSlider(
      "Brightness",
      "brightness",
      p.startY + p.row_gap * 3,
    );

    const contrastControl = this.makeSettingsSlider(
      "Contrast",
      "contrast",
      p.startY + p.row_gap * 4,
    );

    const resolutionControl = this.makeSettingsResolutionDropdown(
      p.startY + p.row_gap * 5,
    );

    this.settingsControls.push(
      musicControl,
      sfxControl,
      dialogueControl,
      brightnessControl,
      contrastControl,
      resolutionControl,
    );

    this.settingsControls.forEach((control) => {
      control.objs.forEach((obj) => {
        obj.setDepth(obj.depth + depth.blocker);
        this.settings_objs.push(obj);
      });
    });

    this.settingsResolutionDropdownObjs.forEach((obj) => {
      obj.setDepth(obj.depth + depth.blocker);
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

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.isOpen) {
        this.dontSaveNewSetts();
      }
    });

    this.loadApplySetts();
  }
}
