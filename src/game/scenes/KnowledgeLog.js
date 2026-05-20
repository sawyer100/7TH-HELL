// used AI to help make the boiler plate of this code, coudlt figure out how to start this file and make it work. was hard
import Phaser, { Scene } from "phaser";
import { loadGameData } from "../db";
import { mobs, categories } from "../mob_data";

const el_config = {
  design: {
    width: 1600,
    height: 900,
  },

  usage: {
    // basically,
    // we havent added a way to get knowledge log yet in the game so its impossible to test
    // so we have to have a hotkey for dev only or else we cant test it
    hotkey: "K",

    // !! CHANGE TO FALSE LATER AND PROBABLY REMOVE IT
    d_unlocked: true,
    d_allscene: true,

    data_unlockname: "knowledgeLogUnlocked",
    scenes_that_are_allowed: ["Add Some chapter here later"],
    scenes_that_are_NOT_allowed: [
      "MainMenu",
      "PauseMenuOverlay",
      "FightScene",
      "BattleScene",
    ],
  },

  //!! TEMPORARY REMEMBER TO DELETEE LATER
  devEncounteredEnemyIds: ["walker"],

  layout: {
    window: { x: 137, y: 78, w: 1326, h: 745 },

    top_patt: { x: 137, y: 78, w: 1326, h: 123 },

    bar_top: { x: 192, y: 95, w: 1225, h: 90 },
    brain: { x: 223, y: 104, w: 82, h: 72 },
    title: { x: 317, y: 126, font: 30 },

    tabs: { x: 222, y: 266, gap: 135, font: 19 },
    tab_ud: { x: 220, y: 306, w: 295, h: 2 },

    icon_g: {
      x: 225,
      y: 338,
      cellW: 145,
      cellH: 135,
      iconW: 88,
      iconH: 88,
    },

    details: {
      x: 610,
      y: 271,
      nameFont: 30,
      statStartY: 321,

      skillsTitleY: 495,

      // skillTitleFont: 30,
      skillNameFont: 14,
      skillDescFont: 14,

      skillGap: 112,
      descGap: 32,
      descWrap: 32,
    },

    sprite: { x: 1151, y: 239, w: 215, h: 480 },

    side_ctrls: {
      y: 670,
      leftX: 1138,
      labelX: 1265,
      rightX: 1333,
      arrowFont: 55,
      labelFont: 18,
    },

    not_encount: { x: 650, y: 358, w: 360, font: 28 },
    close_this: { x: 222, y: 773, font: 18 },
  },
};

export class KnowledgeLogOverlay extends Scene {
  constructor() {
    super("KnowledgeLogOverlay");

    this.cnfg = el_config;

    // off by default or we cooked
    this.isOpen = false;
    // show the normal mobs first nott the bosses
    this.curr_cat_id = "normal";

    if (categories.length > 0) {
      if (categories[0].id) {
        this.curr_cat_id = categories[0].id;
      }
    }

    this.selectedMobId = null;
    this.sideIndex = 0;
    this.gameData = null;

    this.encounteredEnemyIds = new Set(); // it would be BAD if we had duplicatet mobs 😂
  }

  create() {
    // window.alert("TEST RUNNING YESS WORKIGN")
    this.root = this.add.container(0, 0);
    this.root.setVisible(false);

    // put the entie overlay above evreyrthing
    this.root.setDepth(999999);

    // will add a butotn to open later TOO but using hotkey for now
    this.input.keyboard.on("keydown-K", () => {
      // window.alert("OEPNIEINEN")
      this.toggle();
    });

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.isOpen) {
        this.registry.set("blockPauseFrame", this.game.loop.frame);
        this.close();
      }
    });

    this.scale.on("resize", () => {
      this.resizeScreen();
    });

    // ALSO RESIZES, BUT ONLY WHEN PHASER FIRES RESEIZE EVENT ITS DIFFERENT
    this.resizeScreen();
  }

  resizeScreen() {
    // console.log("wekrw")
    if (this.root) {
      // console.log("wejfkwqer  wkjer uwerhuow  oir")
      const gameW = this.scale.width;

      const gameH = this.scale.height;
      const d = this.cnfg.design;

      const the = Math.min(gameW / d.width, gameH / d.height);
      const a = Math.floor((gameW - d.width * the) / 2);

      const b = Math.floor((gameH - d.height * the) / 2);

      this.root.setScale(the);
      this.root.setPosition(a, b);
    } else {
      return;
    }
  }

  async refreshGameData() {
    //get data
    try {
      this.gameData = await loadGameData();
    } catch (error) {
      this.gameData = {};
    }

    const gotitSucccessfuly = new Set(this.cnfg.devEncounteredEnemyIds || []);
    let saved = null;

    if (this.gameData) {
      saved = this.gameData.encounteredEnemies;
    }

    if (Array.isArray(saved)) {
      saved.forEach((enemy) => {
        if (typeof enemy === "string") {
          gotitSucccessfuly.add(enemy);
          return;
        }

        if (enemy) {
          if (enemy.id) {
            gotitSucccessfuly.add(enemy.id);
          }

          if (enemy.enemyId) {
            gotitSucccessfuly.add(enemy.enemyId);
          }

          if (enemy.key) {
            gotitSucccessfuly.add(enemy.key);
          }
        }
      });
    }

    this.encounteredEnemyIds = gotitSucccessfuly;
  }

  mob_InCat() {
    const l = [];

    mobs.forEach((m) => {
      if (m.category === this.curr_cat_id) {
        l.push(m);
      }
    });

    return l;
  }

  firstMob_InCat() {
    const l = this.mob_InCat();

    // first mob
    let first = null;

    l.forEach((m) => {
      if (!first) {
        if (this.encounteredEnemyIds.has(m.id)) {
          first = m;
          // console.log(first)
        }
      }
    });

    // returnt hte first mob
    if (first) {
      // console.log("work")
      return first;
    }

    if (l.length > 0) {
      return l[0];
    }

    return null;
  }

  // IT CHNAGES A LOT SO RE RENDERING GOOD
  render() {
    // CLEAN THE ENTIRE GUI
    this.root.removeAll(true);
    const d = this.cnfg.design;

    const l = this.cnfg.layout;
    //

    if (!this.selectedMobId) {
      const first_mob = this.firstMob_InCat();

      if (first_mob) {
        this.selectedMobId = first_mob.id;
      } else {
        this.selectedMobId = null;
      }
    }

    let mob_curr = null;

    const mobs_In_Cat = this.mob_InCat();

    mobs_In_Cat.forEach((m) => {
      if (!mob_curr) {
        if (m.id === this.selectedMobId) {
          mob_curr = m;
        }
      }
    });

    if (!mob_curr) {
      mob_curr = this.firstMob_InCat();
    }

    // DARK BG SCREEN BEHIND KNOWLEDEG LOG
    const blocker = this.add.rectangle(0, 0, d.width, d.height, 0x111114, 0.96);
    blocker.setOrigin(0, 0);

    // RECTANGLE BEHIND THE LOG CONTENT
    const w_bg = this.add.rectangle(
      l.window.x,
      l.window.y,
      l.window.w,
      l.window.h,
      0x070909,
      1,
    );

    w_bg.setOrigin(0, 0);
    this.root.add(blocker);

    this.root.add(w_bg);
    blocker.setInteractive();
    const t_patt_bg = this.add.rectangle(
      l.top_patt.x,
      l.top_patt.y,
      l.top_patt.w,
      l.top_patt.h,
      0x4a1518,
      1,
    );

    t_patt_bg.setOrigin(0, 0);

    //  PATTERN around the header
    const pattern = this.add.tileSprite(
      l.top_patt.x,
      l.top_patt.y,
      l.top_patt.w,
      l.top_patt.h,
      "knowledge-header-pattern",
    );
    pattern.setOrigin(0, 0);

    // OCLOR DOGE
    pattern.setBlendMode(Phaser.BlendModes.COLOR_DODGE);
    this.root.add(t_patt_bg);

    pattern.setAlpha(0.35);

    // design GUI pixel
    const headerBox = this.add.image(
      l.bar_top.x,
      l.bar_top.y,
      "knowledge-header-box",
    );
    headerBox.setOrigin(0, 0);
    headerBox.setDisplaySize(l.bar_top.w, l.bar_top.h);
    this.root.add(headerBox);

    this.root.add(pattern);

    // BRIAN ICON
    {
      const box_brain_icon = l.brain;

      // omg bra
      const bra = this.add.image(
        box_brain_icon.x + box_brain_icon.w / 2,
        box_brain_icon.y + box_brain_icon.h / 2,
        "knowledge-brain",
      );

      const src = this.textures.get("knowledge-brain").getSourceImage();
      const s = Math.min(
        box_brain_icon.w / src.width,
        box_brain_icon.h / src.height,
      );

      bra.setOrigin(0.5);

      bra.setScale(s);
      this.root.add(bra);
    }

    const title = this.add.text(l.title.x, l.title.y, "Monster Knowledge", {
      fontFamily: "DogicaBold",
      fontSize: `${l.title.font}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    title.setOrigin(0, 0);
    this.root.add(title);

    categories.forEach((category, index) => {
      let tab_clr = "#7e7e86";

      // HIGHLIGHTED CURRENTLY SELCTE ICON
      if (category.id === this.curr_cat_id) {
        tab_clr = "#ffffff";
      }

      const tab = this.add.text(
        l.tabs.x + l.tabs.gap * index,
        l.tabs.y,
        category.label,
        {
          fontFamily: "DogicaBold",
          fontSize: `${l.tabs.font}px`,
          color: tab_clr,

          stroke: "#000000",

          strokeThickness: 4,
        },
      );

      tab.setOrigin(0, 0);

      tab.setInteractive({ useHandCursor: false });

      // clickin on tab
      tab.on("pointerdown", () => {
        this.curr_cat_id = category.id;

        const first_mob = this.firstMob_InCat();

        if (first_mob) {
          this.selectedMobId = first_mob.id;
        } else {
          this.selectedMobId = null;
        }

        this.sideIndex = 0;

        // update log ui
        this.render();
      });

      /// CURSOR ICONS
      tab.on("pointerover", () => {
        tab.setAlpha(0.75);

        this.input.setDefaultCursor("pointer");
      });

      tab.on("pointerout", () => {
        tab.setAlpha(1);
        this.input.setDefaultCursor("default");
      });

      this.root.add(tab);
    });

    // under line
    const tab_ud = this.add.rectangle(
      l.tab_ud.x,
      l.tab_ud.y,
      l.tab_ud.w,
      l.tab_ud.h,
      0xffffff,
      1,
    );
    tab_ud.setOrigin(0, 0);
    this.root.add(tab_ud);

    /// MAKE THE MOB ICON GGRID
    mobs_In_Cat.forEach((mob, i) => {
      // current mob + their number index i
      let x = l.icon_g.x;

      let y = l.icon_g.y;

      if (i === 1) {
        x = l.icon_g.x + l.icon_g.cellW;
      }

      if (i === 2) {
        y = l.icon_g.y + l.icon_g.cellH;
      }

      if (i === 3) {
        x = l.icon_g.x + l.icon_g.cellW;

        y = l.icon_g.y + l.icon_g.cellH;
      }

      if (i === 4) {
        y = l.icon_g.y + l.icon_g.cellH * 2;
      }

      if (i === 5) {
        x = l.icon_g.x + l.icon_g.cellW;
        y = l.icon_g.y + l.icon_g.cellH * 2;
      }

      if (i === 6) {
        y = l.icon_g.y + l.icon_g.cellH * 3;
      }

      if (i === 7) {
        x = l.icon_g.x + l.icon_g.cellW;
        y = l.icon_g.y + l.icon_g.cellH * 3;
      }

      // click area for each icon
      const hit = this.add.zone(x, y, l.icon_g.iconW, l.icon_g.iconH);

      hit.setOrigin(0, 0);

      hit.setInteractive({ useHandCursor: false });
      hit.on("pointerdown", () => {
        console.log("click");
        this.selectedMobId = mob.id;
        this.sideIndex = 0;
        // re ddraw after click
        this.render();
      });

      hit.on("pointerover", () => this.input.setDefaultCursor("pointer"));

      hit.on("pointerout", () => this.input.setDefaultCursor("default"));

      // attach zone tot icons for click detect
      this.root.add(hit);

      // does mob been encounter before
      if (this.encounteredEnemyIds.has(mob.id)) {
        // also thsi is a Set not array

        const icon = this.add.image(
          x + l.icon_g.iconW / 2,
          y + l.icon_g.iconH / 2,
          mob.icon,
        );

        icon.setOrigin(0.5);

        const src = this.textures.get(mob.icon).getSourceImage(); // get icon img

        const the = l.icon_g.iconW / src.width;

        icon.setScale(the);
        //attach icon
        this.root.add(icon);
      } else {
        // NOT ENCOUNTER
        const hiddenIcon = this.add.container(0, 0);

        const bg = this.add.rectangle(
          x,
          y,
          l.icon_g.iconW,
          l.icon_g.iconH,
          0x000000,
          1,
        );

        bg.setOrigin(0, 0);

        const mark = this.add.text(
          x + l.icon_g.iconW / 2,
          y + l.icon_g.iconH / 2,
          "?",
          {
            fontSize: "54px",
            stroke: "#000000",

            color: "#7e7e86",

            fontFamily: "DogicaBold",

            strokeThickness: 4,
          },
        );

        mark.setOrigin(0.5);

        //A
        hiddenIcon.add([bg, mark]);
        this.root.add(hiddenIcon);
      }

      if (mob_curr) {
        if (mob_curr.id === mob.id) {
          const g = this.add.graphics();
          g.lineStyle(2, 0xffffff, 1);
          g.strokeRect(x - 8, y - 8, l.icon_g.iconW + 16, l.icon_g.iconH + 16);
          this.root.add(g);
        }
      }
    });

    let see_notencounter = false;

    if (!mob_curr) {
      see_notencounter = true;
    } else {
      if (!this.encounteredEnemyIds.has(mob_curr.id)) {
        see_notencounter = true;
      }
    }

    if (see_notencounter) {
      const n = l.not_encount;

      const not_encount = this.add.text(n.x, n.y, "Not Encountered", {
        fontFamily: "DogicaBold",
        fontSize: `${n.font}px`,
        color: "#ffffff",

        stroke: "#000000",
        strokeThickness: 4,
      });

      not_encount.setOrigin(0, 0);

      this.root.add(not_encount);
    } else {
      const m_name = this.add.text(
        l.details.x,
        l.details.y,
        `Type: ${mob_curr.name}`,
        {
          fontSize: `${l.details.nameFont}px`,
          color: "#ff5fac",

          fontFamily: "DogicaBold",
          stroke: "#000000",
          strokeThickness: 4,
        },
      );

      m_name.setOrigin(0, 0);

      this.root.add(m_name);

      let m_stats = {};

      if (mob_curr.stats) {
        m_stats = mob_curr.stats;
      }

      Object.entries(m_stats).forEach(([key, value], index) => {
        // const k = key;
        // const v = value;
        // const f = 18
        const stat = this.add.text(
          l.details.x,

          l.details.statStartY + 45 * index,
          `${key}: ${value}`,
          {
            fontFamily: "DogicaBold",

            fontSize: "18px",
            color: "#ffffff",

            strokeThickness: 4,
            stroke: "#000000",
          },
        );

        stat.setOrigin(0, 0);
        /// add statts
        this.root.add(stat);
      });

      const skill_title = this.add.text(
        l.details.x,
        l.details.skillsTitleY,
        "SKILLS",
        {
          fontFamily: "DogicaBold",
          fontSize: "30px",
          color: "#ff5fac",
          stroke: "#000000",

          strokeThickness: 4,
        },
      );

      skill_title.setOrigin(0, 0);

      this.root.add(skill_title);

      let m_skills = [];

      if (mob_curr.skills) {
        m_skills = mob_curr.skills;
      }

      m_skills.forEach((skill, index) => {
        const baseY = l.details.skillsTitleY + 60 + index * l.details.skillGap;

        const skill_name = this.add.text(l.details.x + 5, baseY, skill.name, {
          fontFamily: "DogicaBold",

          fontSize: "14px",
          color: "#55ffab",

          stroke: "#000000",

          strokeThickness: 4,
        });

        skill_name.setOrigin(0, 0);

        const words = String(skill.description || "").split(" ");

        const lines = [];

        let line = "";
        this.root.add(skill_name);

        words.forEach((word) => {
          let test = word;

          if (line) {
            test = `${line} ${word}`;
          }

          if (test.length > l.details.descWrap) {
            if (line) lines.push(line);
            line = word;
          } else {
            line = test;
          }
        });

        if (line) lines.push(line);

        const skill_desc = this.add.text(
          l.details.x + 15,
          baseY + l.details.descGap,
          lines.join("\n"),
          {
            fontSize: `${l.details.skillDescFont}px`,
            color: "#ffffff",
            stroke: "#000000",
            fontFamily: "Dogica",

            strokeThickness: 4,
          },
        );
        skill_desc.setOrigin(0, 0);

        this.root.add(skill_desc);
      });

      let frontSpriteKey = null;

      let rightSpriteKey = null;
      let backSpriteKey = null;

      let leftSpriteKey = null;

      let side = "front"; // front facing for the 4 way view

      let side_textlabel = "FRONT";

      if (this.sideIndex === 1) {
        side = "right";
        side_textlabel = "RIGHT";
      }

      if (this.sideIndex === 2) {
        side = "back";
        side_textlabel = "BACK";
      }

      if (this.sideIndex == 3) {
        side = "left";
        side_textlabel = "LEFT";
      }

      let sprite_key = null;

      // console.log(side)
      // console.log(side_textlabel)
      if (mob_curr.sprites) {
        frontSpriteKey = mob_curr.sprites.front || null;

        rightSpriteKey = mob_curr.sprites.right || null;
        backSpriteKey = mob_curr.sprites.back || null;
        leftSpriteKey = mob_curr.sprites.left || null;
      }

      if (side === "left") {
        sprite_key = leftSpriteKey;
      }
      if (side === "front") {
        sprite_key = frontSpriteKey;
      }
      if (side === "back") {
        sprite_key = backSpriteKey;
      }

      if (side === "right") {
        sprite_key = rightSpriteKey;
      }

      if (!sprite_key) {
        sprite_key = frontSpriteKey;
      }

      let maxW = 0;
      let maxH = 0;

      if (frontSpriteKey) {
        const frontSource = this.textures.get(frontSpriteKey).getSourceImage();

        if (frontSource.width > maxW) {
          maxW = frontSource.width;
        }

        if (frontSource.height > maxH) {
          maxH = frontSource.height;
        }
      }

      if (rightSpriteKey) {
        const rightSource = this.textures.get(rightSpriteKey).getSourceImage();

        if (rightSource.width > maxW) {
          maxW = rightSource.width;
        }

        if (rightSource.height > maxH) {
          maxH = rightSource.height;
        }
      }

      if (backSpriteKey) {
        const backSource = this.textures.get(backSpriteKey).getSourceImage();

        if (backSource.width > maxW) {
          maxW = backSource.width;
        }

        if (backSource.height > maxH) {
          maxH = backSource.height;
        }
      }

      if (leftSpriteKey) {
        const leftSource = this.textures.get(leftSpriteKey).getSourceImage();

        if (leftSource.width > maxW) {
          maxW = leftSource.width;
        }

        if (leftSource.height > maxH) {
          maxH = leftSource.height;
        }
      }

      const the1 = l.sprite.x + l.sprite.w / 2;

      const the2 = l.sprite.y + l.sprite.h / 2;
      const sprite = this.add.image(the1, the2, sprite_key);

      sprite.setOrigin(0.5);

      sprite.setScale(Math.min(l.sprite.w / maxW, l.sprite.h / maxH));

      this.root.add(sprite);

      // CONTROLS FOR CHANGE VIEW (LEFT))
      const arrow_l = this.add.text(l.side_ctrls.leftX, l.side_ctrls.y, "<", {
        fontSize: `${l.side_ctrls.arrowFont}px`,

        fontFamily: "DogicaBold",
        color: "#ffffff",
        // stroke: "#000000",
        stroke: "#000000",
        strokeThickness: 4,
      });

      arrow_l.setOrigin(0, 0);

      arrow_l.setInteractive({ useHandCursor: false });

      // re draw with new side 9(NEW VIEW)
      arrow_l.on("pointerdown", () => {
        this.sideIndex = this.sideIndex - 1;

        if (this.sideIndex < 0) {
          this.sideIndex = 3;
        }

        this.render();
      });

      // hovering
      arrow_l.on("pointerover", () => {
        arrow_l.setAlpha(0.75);
        this.input.setDefaultCursor("pointer");
      });

      arrow_l.on("pointerout", () => {
        arrow_l.setAlpha(1);
        this.input.setDefaultCursor("default");
      });

      // attach
      this.root.add(arrow_l);

      const label_side = this.add.text(
        l.side_ctrls.labelX,

        l.side_ctrls.y + 16,
        side_textlabel,
        {
          align: "center",

          fontFamily: "DogicaBold",
          fontSize: `${l.side_ctrls.labelFont}px`,
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
        },
      );

      label_side.setOrigin(0.5, 0);

      this.root.add(label_side);

      const arrow_r = this.add.text(l.side_ctrls.rightX, l.side_ctrls.y, ">", {
        fontSize: `${l.side_ctrls.arrowFont}px`,

        fontFamily: "DogicaBold",
        color: "#ffffff",
        // stroke: "#000000",
        stroke: "#000000",
        strokeThickness: 4,
      });

      arrow_r.setOrigin(0, 0);

      //C  LOSE

      arrow_r.setInteractive({ useHandCursor: false });

      // re draw with new side 9(NEW VIEW)
      arrow_r.on("pointerdown", () => {
        this.sideIndex = this.sideIndex + 1;

        if (this.sideIndex > 3) {
          this.sideIndex = 0;
        }

        this.render();
      });

      // hovering
      arrow_r.on("pointerover", () => {
        arrow_r.setAlpha(0.75);
        this.input.setDefaultCursor("pointer");
      });

      arrow_r.on("pointerout", () => {
        arrow_r.setAlpha(1);
        this.input.setDefaultCursor("default");
      });

      this.root.add(arrow_r);
    }

    const close_this = this.add.text(
      l.close_this.x,
      l.close_this.y,
      "ESC to close",
      {
        stroke: "#000000",
        fontSize: `${l.close_this.font}px`,
        color: "#ffffff",

        strokeThickness: 4,
        fontFamily: "DogicaBold",
      },
    );

    close_this.setOrigin(0, 0);
    close_this.setInteractive({ useHandCursor: false });

    close_this.on("pointerdown", () => this.close());

    close_this.on("pointerover", () => {
      close_this.setAlpha(0.75);
      this.input.setDefaultCursor("pointer");
    });

    close_this.on("pointerout", () => {
      close_this.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    this.root.add(close_this);

    this.resizeScreen();
  }

  async open() {
    await this.refreshGameData();

    let unlocked = false;

    if (this.cnfg.usage.d_unlocked) {
      unlocked = true;
    } else {
      const p = this.cnfg.usage.data_unlockname;

      if (p) {
        let value = this.gameData;
        const pathParts = p.split(".");

        pathParts.forEach((key) => {
          if (value) {
            value = value[key];
          }
        });

        if (value) {
          unlocked = true;
        }
      }
    }

    if (!unlocked) return;

    let scene_allowed = false;

    const activeScenes = this.scene.manager.getScenes(true);
    const activeSceneKeys = [];
    const blockedScenes = this.cnfg.usage.scenes_that_are_NOT_allowed || [];
    const allowedScenes = this.cnfg.usage.scenes_that_are_allowed || [];

    let blockedNow = false;

    activeScenes.forEach((scene) => {
      activeSceneKeys.push(scene.scene.key);

      if (blockedScenes.includes(scene.scene.key)) {
        if (scene.scene.key === "PauseMenuOverlay") {
          if (scene.isOpen) {
            blockedNow = true;
          }
        } else if (scene.scene.key === "SettingsOverlay") {
          if (scene.isOpen) {
            blockedNow = true;
          }
        } else {
          blockedNow = true;
        }
      }
    });

    if (blockedNow) {
      scene_allowed = false;
    } else {
      if (this.cnfg.usage.d_allscene) {
        scene_allowed = true;
      } else {
        activeSceneKeys.forEach((key) => {
          if (allowedScenes.includes(key)) {
            scene_allowed = true;
          }
        });
      }
    }

    // only if can open on curr scene
    if (scene_allowed) {
      this.isOpen = true;

      this.root.setVisible(true);
      this.scene.bringToTop(); // shold be done in preloader already, but not sure how this works

      this.render();
    } else {
      return;
    }
  }

  close() {
    this.isOpen = false;
    this.root.setVisible(false);
    this.input.setDefaultCursor("default");
  }

  async toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      await this.open();
    }
  }

  //  for the indexdb we need async for these
}
