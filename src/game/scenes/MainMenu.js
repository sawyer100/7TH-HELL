import Phaser, { Scene } from "phaser";

// change image names / keys inside Preloader.js

// the design res
const main_width = 1600;
const main_height = 900;

///
// CONFIG AND ELEMENT POSITIONING
//

// 1600 by 900 mockup coords (no responsive)
// el_pos is the position for an internal game NOT THE POSITION OF THE BROWSER
// scale.FIT in main.js handles rescaling
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

// this is basiclaly like Z index depth = z index
// PURPOSE IS SO WE DONT HAVE TO GO THROUGH HUNDREDS OF LINES OF CODE TO CHANGE Z INDEX
// DO IT ALL HERE
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
  cursor: 9999,
};

///
// BUILDING SCENE
//
export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  //  PREVENT CUROSR ON MOBILE
  isAllowedCursor() {
    const os = this.sys.game.device.os;

    return os.desktop;
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
      alpha: { from: 0.4, to: 0.6 },
      scaleX: { from: sbase * 1, to: sbase * 1.17 },
      scaleY: { from: sbase * 1, to: sbase * 1.17 },
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

  // create's buttons with the "n" label so we dont need to manually create
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

    if (btp.targetY !== undefined) {
      if (btp.targetY !== null) {
        ty = btp.targetY;
      } else {
        ty = btp.bg.y;
      }
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

    return true;
  }

  endPageTrans(delay) {
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

    // hide not-title things
    this.fadeOut(this.about_objs, a);
    this.fadeOut(this.credits_objs, a);

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

  // CHANGING THE CUSTOM CURSOR ICONS
  // CHANGE THE PATH IN PRELOADER.JS NOT HERE
  hover() {
    if (!this.allowedCursor || !this.cursor) return;
    this.cursor.setTexture("cursor-hover");
  }

  not_hover() {
    if (!this.allowedCursor || !this.cursor) return;
    this.cursor.setTexture("cursor-normal");
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
    // -------------------

    this.pageState = "title"; // default page on startup
    this.middleOfTrans = false;

    this.input.setDefaultCursor("none");

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

    // CURSOR NORMAL
    this.allowedCursor = this.isAllowedCursor();
    if (this.allowedCursor) {
      this.input.setDefaultCursor("none");

      this.cursor = this.add;
      this.cursor.image(0, 0, "cursor-normal");
      this.cursor.setOrigin(0, 0);
      this.cursor.setDepth(depth.cursor);
      this.cursor.setScrollFactor(0);
    } else {
      // mobile or somethig that no cursor
      this.input.setDefaultCursor("default");
      this.cursor = null;
    }

    // BUTTON EVENTS
    this.btn_click_and_hover(this.playBtns_Pack, () =>
      console.log("akejewhrwe"),
    );

    this.btn_click_and_hover(this.settBtns_Pack, () =>
      console.log("wejrwekjr"),
    );

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
  }

  // each update make the cursor move to currnt place
  // HOPEFULY THIS IS NOT MEMORY INTESNIVE I DONT KNOW
  //TODO: add fps limit maybe later MAYBE
  update() {
    if (!this.allowedCursor || !this.cursor) return;

    const pointer = this.input.activePointer;
    this.cursor.setPosition(pointer.x, pointer.y);
  }
}
