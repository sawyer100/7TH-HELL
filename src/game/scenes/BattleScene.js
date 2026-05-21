import Phaser, { Scene } from "phaser";
import { mobs } from "../mob_data";
import { characters, chapterTeams } from "../character_data";
import {
  battleWeapons,
  battleConsumables,
  battleArmors,
} from "../battle_item_data";
import { getBattleArea } from "../battle_area_data";
import {
  loadGameData,
  saveGameData,
  resetForFirstBattleDefeat,
  recordFirstBattleWin,
} from "../db";

import { BattleEffects } from "../battle_effects";

const main_width = 1600;
const main_height = 900;

// const team_size_max = 4;

// wider so cam can slide
const worldthing = {
  left: 0,
  center: main_width,
  right: main_width * 2,
};

// HOW FAR THE CAMERA MOVES HWEN CHOOSING TARGETS
// const shift_x_stuff = 285;

const scroll_cam = {
  left: worldthing.center - 285,
  center: worldthing.center,
  right: worldthing.center + 285,
};
const plr_color_n = "#66aaff";

const color_hpbar = 0xff4a65;
const stambar_clr = 0x4af0ff;
const enemy_color_n = "#ff6666";

// values for timing
const atk_traveldurr = 210;
const kb_durr = 130;
// omg getting flashed in public 😱
const flash_g = 80;

// Fixed tooltip positions for action and item popups.
const tooltipXaction = 520;
const itemXtooltip = 520;
const actionyTooltip = 500;
const itemYtooltip = 500;

//
// const atk_return_durr = 240;

const dmgindicatortime = 1200;

const dmgindciatorfalldistance = 18;

const zombienamelist = [
  "AIDEN",
  "NOAH",
  "LIAM",
  "LIHAN",
  "MASON",
  "ETHAN",
  "LOGAN",
  "CALEB",
  "JACOB",
  "OWEN",
  "RYAN",
  "DYLAN",
  "LUKE",
  "JACK",
  "ELI",
  "NATE",
  "COLE",
  "ALEX",
  "ASH",
  "AXEL",
  "BLAKE",
  "CHASE",
  "EDDIE",
  "FINN",
  "GAVIN",
  "IAN",
  "JACE",
  "JUDE",
  "KAI",
  "LEO",
  "MAX",
  "MILO",
  "NASH",
  "OLIVER",
  "OLIVIA",
  "KARINA",
  "SILAS",
  "LEON",
  "SPEED",
  "ISHAN",
  "SUMNER",
  "CALDING",
  "SALORE",
  "ANNA",
  "ARI",
  "NICOLE",
  "WOLF",
  "VEER",
  "GUPTA",
  "THEO",
  "WYATT",
  "ZANE",
  "ZAIN",
  "IVORY",
  "BADU",
  "SAWYER",
  "CAPTAIN",
  "GISELLE",
  "WINTER",
  "KATARINA",
  "STELLA",
  "RAT",
  "TEXAS",
  "LURCO",
  "AMIYA",
  "HEART",
];

const ui = {
  teamGapX: 185,
  //
  bar_y_bottom: 700,

  centerPlayerX: worldthing.center + 560,
  centerEnemyX: worldthing.center + 1040,
  bar_h_bottom: 200,
  centerSpriteY: 690, // character psotinoing vertically up and down

  teamSpriteY: 690, // also character posiontionig
  barcenterW: 190,
  barcenterH: 12,
  // teambarW: 190,
  // teamBarH: 12,

  centerNameFont: "22px",
  // teamfontn: "22px",
};

export class BattleScene extends Scene {
  constructor() {
    super("BattleScene");
  }

  // get battle data before create / other things int he scene
  // defaults if no data
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
    // random jack
    this.game.canvas.style.cursor = "default";
    this.input.setTopOnly(true);
    this.gameData = null;
    this.consumableInventory = [];
    this.selectedSkill = null;
    this.selectedUser = null;
    this.skillPopup = null;
    this.consumablePopup = null;
    this.tooltip = null;
    this.popupCloseZone = null;
    this.roundNumber = 1;
    this.turnIndex = 0;
    this.battleEnded = false;

    // improtant for roaster viewing
    this.currentView = "center";
    //
    this.activePlayerUnit = null;
    this.activeEnemyUnit = null;

    //
    this.cameras.main.setBounds(0, 0, main_width * 3, main_height);
    this.cameras.main.scrollX = scroll_cam.center;

    loadGameData()
      .then((data) => {
        this.gameData = data;

        if (data) {
          if (data.inventory) {
            if (data.inventory.consumables) {
              this.consumableInventory = JSON.parse(
                JSON.stringify(data.inventory.consumables),
              );
            }
          }
        }

        this.startBattle();
      })
      .catch((error) => {
        console.log(error);
        this.startBattle();
      });

    // clena cursor and alarm thing when shutdonw
    this.events.once("shutdown", () => {
      this.input.setDefaultCursor("default");

      this.game.canvas.style.cursor = "default";

      this.stopAlarmTweens();
    });
  }

  startBattle() {
    this.areaData = getBattleArea(this.area);

    this.createBattleBackground();

    if (this.areaData.alarm) {
      this.createAlarmEffect();
    }

    this.allUnits = [];
    // this is for things like order and status updates and etc

    // slice 4 for max team sizee 4
    this.playerUnits = this.buildPlayerUnits().slice(0, 4);

    this.playerUnits.forEach((unit) => {
      this.allUnits.push(unit);
    });
    this.enemyUnits = this.buildEnemyUnits().slice(0, 4);

    this.enemyUnits.forEach((unit) => {
      this.allUnits.push(unit);
    });

    this.makeUnitDisplaysEverthing();
    this.sideRosterMaker();
    this.makeBarOnBottom();

    this.msgTextMake();

    this.pauseBtn();

    // what survior the zombie will target
    this.whoEnemyGonnaKill();

    this.whichTurnNow();
    this.makeListofturnOrders();

    this.updateAllUnitVisuals();
    //C ETNER

    // shows which guys start at the center
    this.activePlayerUnit = this.getFirstAlivePlayer();
    // this.updateAllUnitVisuals();

    this.activeEnemyUnit = this.getFirstAliveEnemy();

    this.showCenterUnit(this.activePlayerUnit, "player", false);

    this.showCenterUnit(this.activeEnemyUnit, "enemy", false);

    this.updateSideRosters();
    this.updateTargetTeamDisplays("center");

    this.blackSwipeWipeWipeWipe();

    this.time.delayedCall(300, () => {
      this.startNextTurn();
    });
  }

  pauseBtn() {
    if (this.pauseButton) {
      this.pauseButton.destroy();
    }

    this.pauseButton = this.add.image(88, 68, "pause-button");
    this.pauseButton.setOrigin(0.5);

    this.pauseButton.setDepth(999800);
    this.pauseButton.setScrollFactor(0);

    const aa = 78 / this.pauseButton.width;
    const bb = 78 / this.pauseButton.height;

    let the = aa;

    if (bb < aa) {
      the = bb;
    }

    this.pauseButton.setScale(the);

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

  shouldBlockPauseOpen() {
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

  //makes the background w/ the 3 panels/views
  createBattleBackground() {
    this.bgColor = this.add.rectangle(
      0,
      0,
      main_width * 3,
      main_height,
      this.areaData.backgroundColor,
      1,
    );

    this.bgColor.setOrigin(0, 0);

    this.bgColor.setDepth(1);

    // the 3 diff views/panels of the battle scene
    const centerKey =
      this.areaData.battleBackgroundCenter || this.areaData.battleBackground;
    const leftKey = this.areaData.battleBackgroundLeft || centerKey;
    this.battleBGmaker(worldthing.left, leftKey);

    const rightKey = this.areaData.battleBackgroundRight || centerKey;

    this.battleBGmaker(worldthing.center, centerKey);

    this.battleBGmaker(worldthing.right, rightKey);

    this.darkener = this.add.rectangle(
      0,
      0,
      main_width * 3,
      main_height,
      0x000000,
      0.18,
    );

    // the darkenss effec tlike dark tint thing

    this.darkener.setOrigin(0, 0);
    this.darkener.setDepth(3);
  }

  battleBGmaker(panelX, key) {
    if (!key) {
      return;
    }

    // if (!this.textures.exists(key)) {
    //   return;
    // }

    const bg = this.add.image(
      panelX + main_width / 2,
      13, // background up and down height change this here edit yes ok
      key,
    );
    bg.setOrigin(0.5, 0);
    bg.setDepth(2);

    const bgScale = main_width / bg.width;

    bg.setScale(bgScale);
  }

  // if this is tthe first fight they play or not
  thisFirstTime() {
    if (this.isFirstBattle) {
      return true;
    }

    if (this.chapterName === "post-classroom") {
      return true;
    }

    if (this.chapterName === "post-classroom-hallway") {
      return true;
    }

    return false;
  }

  async playerDIES() {
    if (this.battleEnded) {
      return;
    }

    this.battleEnded = true;

    this.input.setDefaultCursor("default");

    if (this.hideBottomBar) {
      this.hideBottomBar();
    }

    this.closeSkillPopup?.();
    this.closeConsumablePopup?.();

    this.clearTooltip?.();

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

    const deathText = this.add.text(
      main_width / 2,
      main_height / 2,
      "EVERYBODY DIED.",
      {
        fontFamily: "DogicaBold",
        fontSize: "34px",
        color: "#ffffff",

        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      },
    );

    deathText.setOrigin(0.5);
    deathText.setDepth(1000000);

    deathText.setScrollFactor(0);

    deathText.setAlpha(0);

    await new Promise((resolve) => {
      this.tweens.add({
        targets: blackScreen,
        alpha: 1,
        duration: 650,
        ease: "Cubic.In",
        onComplete: resolve,
      });
    });

    await new Promise((resolve) => {
      this.tweens.add({
        targets: deathText,
        alpha: 1,
        duration: 260,
        ease: "Cubic.Out",
        onComplete: resolve,
      });
    });

    await new Promise((resolve) => {
      this.time.delayedCall(2000, resolve);
    });

    // Fback to intial place
    if (this.thisFirstTime()) {
      await resetForFirstBattleDefeat();

      this.scene.stop("BattleScene");

      this.scene.start("IdCard");
      this.scene.bringToTop("KnowledgeLogOverlay");
      this.scene.bringToTop("PauseMenuOverlay");

      this.scene.bringToTop("SettingsOverlay");

      this.scene.bringToTop("InventoryIconOverlay");
      this.scene.bringToTop("InventoryOverlay");

      return;
    }

    // later non first battles can restart checkpoint / game herer
  }

  playSkillVisualEffect(
    skill,
    targetDisplay,
    outcome = null,
    userDisplay = null,
    onImpact = null,
  ) {
    if (!skill) {
      return;
    }

    if (!skill.effectId) {
      return;
    }

    let healAmount = skill.heal || 0;
    let staminaAmount = skill.stamRec || 0;

    if (outcome) {
      healAmount = outcome.heal || healAmount;
      staminaAmount = outcome.stamRec || staminaAmount;
    }

    BattleEffects.play(this, skill.effectId, targetDisplay, {
      heal: healAmount,
      stamRec: staminaAmount,
      attackerDisplay: userDisplay,
      onImpact,
    });
  }

  createAlarmEffect() {
    this.stopAlarmTweens();

    this.schoolAlarmTweens = [];

    this.OVERLAYlockdown = this.add.rectangle(
      0,
      0,
      main_width * 3,
      main_height,
      0x330000,
      1,
    );

    this.OVERLAYlockdown.setOrigin(0, 0);
    this.OVERLAYlockdown.setDepth(90);
    this.OVERLAYlockdown.setAlpha(0.68);
    this.OVERLAYlockdown.setBlendMode(Phaser.BlendModes.MULTIPLY);

    this.LOCKDOWNRedCircleStuff = this.add.rectangle(
      0,
      0,
      main_width * 3,
      main_height,
      0x9a0000,
      1,
    );

    this.LOCKDOWNRedCircleStuff.setOrigin(0, 0);
    this.LOCKDOWNRedCircleStuff.setDepth(91);
    this.LOCKDOWNRedCircleStuff.setAlpha(0.05);
    this.LOCKDOWNRedCircleStuff.setBlendMode(Phaser.BlendModes.SCREEN);

    this.schoolAlarmTweens.push(
      this.tweens.add({
        targets: this.LOCKDOWNRedCircleStuff,
        alpha: {
          from: 0.05,
          to: 0.12,
        },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      }),
    );

    this.leftAlarm = this.makeAlarmSide(worldthing.center + 105, 125, 950, 620);
    this.rightAlarm = this.makeAlarmSide(
      worldthing.center + main_width - 105,
      125,
      950,
      620,
    );

    [this.leftAlarm, this.rightAlarm].forEach((alarm) => {
      alarm.smooth.setVisible(true);
      alarm.pixel.setVisible(true);

      this.schoolAlarmTweens.push(
        this.tweens.add({
          targets: alarm.smooth,
          alpha: {
            from: 0.18,
            to: 0.38,
          },
          scaleX: {
            from: alarm.smoothBaseScale,
            to: alarm.smoothBaseScale * 1.12,
          },
          scaleY: {
            from: alarm.smoothBaseScale,
            to: alarm.smoothBaseScale * 1.12,
          },
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.Out",
        }),
      );

      this.schoolAlarmTweens.push(
        this.tweens.add({
          targets: alarm.pixel,
          alpha: {
            from: 0.1,
            to: 0.24,
          },
          scaleX: {
            from: alarm.pixelBaseScale,
            to: alarm.pixelBaseScale * 1.06,
          },
          scaleY: {
            from: alarm.pixelBaseScale,
            to: alarm.pixelBaseScale * 1.06,
          },
          duration: 520,
          yoyo: true,
          repeat: -1,
          ease: "Sine.InOut",
        }),
      );
    });

    this.cameras.main.shake(140, 0.003);
  }

  stopAlarmTweens() {
    if (this.schoolAlarmTweens) {
      this.schoolAlarmTweens.forEach((tween) => {
        if (tween) {
          tween.stop();
        }
      });
    }

    this.schoolAlarmTweens = [];

    if (this.OVERLAYlockdown) {
      this.OVERLAYlockdown.destroy();
      this.OVERLAYlockdown = null;
    }

    if (this.LOCKDOWNRedCircleStuff) {
      this.LOCKDOWNRedCircleStuff.destroy();
      this.LOCKDOWNRedCircleStuff = null;
    }

    if (this.leftAlarm) {
      if (this.leftAlarm.smooth) {
        this.leftAlarm.smooth.destroy();
      }

      if (this.leftAlarm.pixel) {
        this.leftAlarm.pixel.destroy();
      }

      this.leftAlarm = null;
    }

    if (this.rightAlarm) {
      if (this.rightAlarm.smooth) {
        this.rightAlarm.smooth.destroy();
      }

      if (this.rightAlarm.pixel) {
        this.rightAlarm.pixel.destroy();
      }

      this.rightAlarm = null;
    }
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
    smooth.setDepth(92);
    smooth.setBlendMode(screen);
    smooth.setAlpha(0);
    smooth.setVisible(false);

    const pixel = this.add.image(x, y - 6, "alarm-pixel");
    pixel.setOrigin(0.5);
    pixel.setDepth(93);
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

  WarmorBonus(armorIds) {
    const bonus = {
      defense: 0,
      damageReductionPercent: 0,
    };

    armorIds.forEach((armorId) => {
      const armor = battleArmors[armorId];

      if (!armor) {
        return;
      }

      bonus.defense += Number(armor.defense || 0);
      bonus.damageReductionPercent += Number(armor.damageReductionPercent || 0);
    });

    if (bonus.damageReductionPercent > 0.75) {
      bonus.damageReductionPercent = 0.75; // cap
    }

    return bonus;
  }

  buildPlayerUnits() {
    let ids = chapterTeams[this.chapterName];

    if (!ids) {
      ids = ["kim"];
    }

    const units = [];

    ids.forEach((id, index) => {
      const c = characters[id];

      if (c) {
        const stats = c.stats || {};
        const equipment = this.getCharacterEquipment(id, c);
        const armorBonus = this.WarmorBonus(equipment.armor);

        // unit store stats
        const unit = {
          id: `player-${id}`,
          baseId: id,
          team: "player",
          name: c.name,
          icon: c.icon,
          spriteKey: c.sprite,

          maxHp: Number(stats.HP || 80),
          hp: Number(stats.HP || 80),

          maxStamina: Number(stats.STAM || 100),
          stamina: Number(stats.STAM || 100),

          speed: Number(stats.SPD || 50),
          damage: Number(stats.DMG || 8),
          defense: Number(stats.DEF || 0) + armorBonus.defense,
          damageReductionPercent: armorBonus.damageReductionPercent,

          weaponIds: equipment.weapons,
          armorIds: equipment.armor,
          characterSkills: c.characterSkills || [],

          shieldHits: 0,
          shieldReduction: 0,

          alive: true,
          exhausted: false,
          intent: null,
          visualIndex: index,

          overexertNextTurn: false,
          overexertActive: false,

          extraTurnNextRound: false,
          baitNextRound: false,
          baitTurns: 0,

          bleedDamage: 0,
          bleedTurns: 0,
        };

        units.push(unit);
      }
    });

    return units;
  }

  getCharacterEquipment(characterId, characterData) {
    // look for equip weapon/armor from saves OR use defaults
    let weapons = characterData.defaultWeaponIds || [];

    let armor = characterData.defaultArmorIds || [];

    if (this.gameData) {
      if (this.gameData.inventory) {
        if (this.gameData.inventory.equippedByCharacter) {
          const saved =
            this.gameData.inventory.equippedByCharacter[characterId];

          if (saved) {
            if (saved.weapons) {
              weapons = saved.weapons;
            }

            if (saved.armor) {
              armor = saved.armor;
            }
          }
        }
      }
    }

    const valid_wps = [];

    for (let i = 0; i < weapons.length; i++) {
      const weaponId = weapons[i];

      if (battleWeapons[weaponId]) {
        valid_wps.push(weaponId);
      }
    }

    weapons = valid_wps.slice(0, 1);

    armor = armor.slice(0, 1);

    return {
      weapons,
      armor,
    };
  }

  getRandomZombieDisplayName() {
    const availableNames = [];

    zombienamelist.forEach((name) => {
      if (!this.usedZombieDisplayNames.includes(name)) {
        availableNames.push(name);
      }
    });

    if (availableNames.length === 0) {
      const fallbackName = `ZOMBIE ${this.usedZombieDisplayNames.length + 1}`;
      this.usedZombieDisplayNames.push(fallbackName);
      return fallbackName;
    }

    const randomIndex = Math.floor(Math.random() * availableNames.length);

    const chosenName = availableNames[randomIndex];

    this.usedZombieDisplayNames.push(chosenName);

    return chosenName;
  }

  buildEnemyUnits() {
    this.usedZombieDisplayNames = [];

    const units = [];

    // either plain mob id string
    // or object w/ idcount
    this.enemySetup.forEach((entry) => {
      let enemyId = null;
      let count = 1;

      if (typeof entry === "string") {
        enemyId = entry;
      } else {
        if (entry) {
          if (entry.id) {
            enemyId = entry.id;
          }

          if (entry.count) {
            count = entry.count;
          }
        }
      }

      const mob = this.getMobById(enemyId);

      if (mob) {
        for (let i = 0; i < count; i += 1) {
          const unit = this.enemymakernow(mob, units.length);
          units.push(unit);
        }
      }
    });

    if (units.length === 0) {
      const walker = this.getMobById("walker");

      if (walker) {
        units.push(this.enemymakernow(walker, 0));
      }
    }

    return units;
  }

  enemymakernow(mob, index) {
    const stats = mob.stats || {};

    let hp = parseFloat(String(stats.HP || "").replace("%", ""));

    if (Number.isNaN(hp)) {
      hp = 100;
    }

    let stamina = parseFloat(String(stats.STAM || "").replace("%", ""));

    if (Number.isNaN(stamina)) {
      stamina = 80;
    }

    let speed = parseFloat(String(stats.SPD || "").replace("%", ""));

    if (Number.isNaN(speed)) {
      speed = 60;
    }

    let defense = parseFloat(String(stats.DEF || "").replace("%", ""));

    if (Number.isNaN(defense)) {
      defense = 0;
    }

    let enemyName = this.getRandomZombieDisplayName();

    if (mob.id === "dombis") {
      enemyName = "DOMBIS";
    }

    if (mob.id === "alpha") {
      enemyName = "ALPHA";
    }

    return {
      id: `enemy-${mob.id}-${index}`,
      baseId: mob.id,
      team: "enemy",
      name: enemyName,
      mobTypeName: mob.name,
      icon: mob.icon,
      spriteKey: this.getEnemySpriteKey(mob),

      maxHp: hp,
      hp,

      maxStamina: stamina,
      stamina,

      speed,
      damage: 0,
      defense,

      skills: this.getEnemySkills(mob),

      alive: true,
      exhausted: false,
      intent: null,
      visualIndex: index,

      bleedDamage: 0,
      bleedTurns: 0,
    };
  }

  getTeamNameColor(team) {
    if (team === "player") {
      return plr_color_n;
    }

    return enemy_color_n;
  }

  // basil ay liek who alive adn wh ont alive
  getOrderedRosterUnits(team, units) {
    let activeUnit = null;
    const activeAlive = []; // a

    if (team === "player") {
      activeUnit = this.activePlayerUnit;
    } else {
      activeUnit = this.activeEnemyUnit;
    }

    const alive = [];

    const dead = [];

    units.forEach((unit) => {
      if (unit === activeUnit && unit.alive) {
        activeAlive.push(unit);
      } else if (unit.alive) {
        alive.push(unit);
      } else {
        dead.push(unit);
      }
    });

    return [...activeAlive, ...alive, ...dead];
  }

  addDeadX(parent, x, y) {
    const slash1 = this.add.rectangle(x, y, 46, 5, 0xff2222, 1);
    slash1.setAngle(45);

    const slash2 = this.add.rectangle(x, y, 46, 5, 0xff2222, 1);
    slash2.setAngle(-45);

    // make an X

    parent.add([slash1, slash2]);
  }

  getEnemySpriteKey(mob) {
    if (mob.sprites) {
      if (mob.sprites.left) {
        return mob.sprites.left;
      }

      if (mob.sprites.front) {
        return mob.sprites.front;
      }
    }

    return mob.icon;
  }

  getEnemySkills(mob) {
    const skills = [];

    if (mob.skills) {
      mob.skills.forEach((skill, index) => {
        skills.push({
          id: skill.id || `${mob.id}_skill_${index}`,
          name: skill.name || "ATTACK",
          description: skill.description || "Enemy attack.",
          staminaCost: Number(skill.staminaCost || 10),
          target: skill.target || "enemy",
          damage: Number(skill.damage || 10),
          staminaDamage: Number(skill.staminaDamage || 0),
          effectId: skill.effectId || null,
          attackType: skill.attackType || "melee",
          ranged: skill.ranged || false,
          weight: Number(skill.weight || 1),
        });
      });
    }

    if (skills.length === 0) {
      /// handle later idk
      console.log("no skll lol");
    }

    return skills;
  }

  getEnemyChosenSkill(enemy) {
    if (!enemy) {
      return null;
    }

    if (enemy.skills.length === 0) {
      return null;
    }

    // skilsl that can be affored basedd off stamina RIHGT NOW
    const usableSkills = [];

    enemy.skills.forEach((skill) => {
      // const ok = skill.staminaCost
      // const staminaCost = Number(ok);
      const staminaCost = Number(skill.staminaCost);

      // use if enough  staina
      if (staminaCost <= enemy.stamina) {
        usableSkills.push(skill);
      }
    });

    let choices = enemy.skills;

    // affordable
    if (usableSkills.length > 0) {
      choices = usableSkills;
    }

    // weighitng
    let totalWeight = 0;

    choices.forEach((skill) => {
      let skillWeight = Number(skill.weight || 1);

      // use 1 so the skill wontbreak later.
      if (Number.isNaN(skillWeight)) {
        skillWeight = 1;
      }

      if (skillWeight <= 0) {
        skillWeight = 1;
      }

      totalWeight += skillWeight;
    });

    let roll = Math.random() * totalWeight;

    // roll = 0.5 * 100 = 50

    // skill 1 weight 35

    // skill 2 weight 65

    // 50 - 35 =  25, above 0 so skip

    // 25 (roll from previous ccalculation) - 65 = under 0 so choose skill 2

    for (let i = 0; i < choices.length; i += 1) {
      const skill = choices[i];

      let skillWeight = Number(skill.weight || 1);

      if (Number.isNaN(skillWeight)) {
        skillWeight = 1;
      }

      if (skillWeight <= 0) {
        skillWeight = 1;
      }

      roll -= skillWeight;

      if (roll <= 0) {
        return skill;
      }
    }

    return choices[0];
  }

  getMobById(id) {
    let found = null;

    mobs.forEach((mob) => {
      if (mob.id === id) {
        found = mob;
      }
    });

    return found;
  }

  makeUnitDisplaysEverthing() {
    // console.log("werewr")
    this.playerUnits.forEach((unit, index) => {
      const teamX = ui.centerPlayerX - 420 + index * ui.teamGapX;
      //sa
      const teamY = ui.teamSpriteY;

      unit.centerDisplay = this.createUnitDisplay(
        unit,
        ui.centerPlayerX,
        ui.centerSpriteY,
        "center",
      );

      unit.teamDisplay = this.createUnitDisplay(unit, teamX, teamY, "team");

      this.setDisplayVisible(unit.centerDisplay, false);

      this.setDisplayVisible(unit.teamDisplay, false);
    });

    this.enemyUnits.forEach((unit, index) => {
      const teamX = ui.centerEnemyX + 250 + index * ui.teamGapX;

      const teamY = ui.teamSpriteY;

      unit.centerDisplay = this.createUnitDisplay(
        unit,
        ui.centerEnemyX,
        ui.centerSpriteY,
        "center",
      );

      unit.teamDisplay = this.createUnitDisplay(unit, teamX, teamY, "team");

      this.setDisplayVisible(unit.centerDisplay, false);

      this.setDisplayVisible(unit.teamDisplay, false);
    });
  }

  // status thing above charcacters/units
  createUnitDisplay(unit, x, y, mode) {
    const display = {};

    display.mode = mode;
    display.baseX = x;

    display.baseY = y;

    display.root = this.add.container(x, y);

    let depth = 38;

    if (mode === "center") {
      depth = 40;
    }

    display.root.setDepth(depth);

    const barW = ui.barcenterW;

    const barH = ui.barcenterH;

    const nameFont = ui.centerNameFont;

    display.barW = barW;
    display.barH = barH;

    /// relative offset forr status containers above units
    let statusY = -430;
    let nameY = -392;
    let hpY = -350;
    let stY = -326;

    if (unit.baseId === "brute") {
      statusY = -565;
      nameY = -527;
      hpY = -485;
      stY = -461;
    }
    if (unit.baseId === "dombis") {
      statusY = -650;
      nameY = -612;
      hpY = -570;
      stY = -546;
    }

    if (unit.baseId === "alpha") {
      statusY = 500; // inteniotaly lower than head
      nameY = -682;
      hpY = -640;
      stY = -616;
    }
    display.nameText = this.add.text(0, nameY, unit.name, {
      fontFamily: "DogicaBold",
      fontSize: nameFont,
      color: this.getTeamNameColor(unit.team),
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    });

    display.nameText.setOrigin(0.5);

    display.statusText = this.add.text(0, statusY, "", {
      fontFamily: "DogicaBold",
      fontSize: "11px",
      color: "#99ccff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
    });

    display.statusText.setOrigin(0.5);

    display.hpBg = this.add.rectangle(0, hpY, barW, barH, 0x220000, 1);

    display.hpBg.setOrigin(0.5);

    display.hpFill = this.add.rectangle(
      -barW / 2,
      hpY,
      barW,
      barH,
      color_hpbar,
      1,
    );

    display.hpFill.setOrigin(0, 0.5);

    display.hpText = this.add.text(0, hpY - 3, "", {
      fontFamily: "DogicaBold",
      fontSize: "13px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    display.hpText.setOrigin(0.5);

    display.stBg = this.add.rectangle(0, stY, barW, barH, 0x001b22, 1);

    display.stBg.setOrigin(0.5);

    display.stFill = this.add.rectangle(
      -barW / 2,
      stY,
      barW,
      barH,
      stambar_clr,
      1,
    );
    display.stFill.setOrigin(0, 0.5);

    display.stText = this.add.text(0, stY - 3, "", {
      fontFamily: "DogicaBold",
      fontSize: "13px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    display.stText.setOrigin(0.5);

    let spriteKey = unit.spriteKey;

    display.sprite = this.add.image(0, 0, spriteKey);

    display.sprite.setOrigin(0.5, 1);

    let thh = 300;

    if (unit.baseId === "brute") {
      thh = thh * 1.5;
    }
    if (unit.baseId === "dombis") {
      thh = thh * 1.8;
    }
    if (unit.baseId === "alpha") {
      thh = thh * 2.8;
    }

    const scale = thh / display.sprite.height;

    display.sprite.setScale(scale);

    display.sprite.setInteractive({ useHandCursor: false });

    display.sprite.on("pointerover", () => {
      if (this.selectedSkill) {
        this.input.setDefaultCursor("pointer");
        display.sprite.setTint(0xb5b5b5);
      }
    });

    display.sprite.on("pointerout", () => {
      this.input.setDefaultCursor("default");

      if (unit.alive) {
        display.sprite.clearTint();
      }
    });

    display.sprite.on("pointerdown", () => {
      this.tryUseSelectedSkillOn(unit);
    });

    display.root.add([
      display.nameText,
      display.statusText,
      display.hpBg,
      display.hpFill,
      display.hpText,
      display.stBg,
      display.stFill,
      display.stText,
      display.sprite,
    ]);

    return display;
  }

  // toggle nuit dplsay container
  setDisplayVisible(display, visible) {
    if (!display) {
      return;
    }

    display.root.setVisible(visible);
  }

  sideRosterMaker() {
    this.sideRoot = this.add.container(0, 0);
    this.sideRoot.setDepth(160);
    this.sideRoot.setScrollFactor(0);
    this.sideRoot.setVisible(true);
  }

  // rebuidl roster whenrever health or smth changes
  updateSideRosters() {
    this.sideRoot.removeAll(true);

    this.createRosterSide("player", this.playerUnits, 50, 190);

    this.createRosterSide("enemy", this.enemyUnits, main_width - 315, 190);
  }

  createRosterSide(team, units, startX, startY) {
    const orderedUnits = this.getOrderedRosterUnits(team, units);
    // console.log("aaaaaaaa")

    orderedUnits.forEach((unit, index) => {
      const y = startY + index * 88;

      // different highlitght for center units
      let isActive = false;

      if (unit.alive) {
        if (team === "player") {
          if (this.activePlayerUnit === unit) {
            isActive = true;
          }
        }

        if (team === "enemy") {
          if (this.activeEnemyUnit === unit) {
            isActive = true;
          }
        }
      }

      const isDead = !unit.alive;
      const nameColor = this.getTeamNameColor(unit.team);

      let borderColor = 0xb0b0b0;

      if (isActive) {
        borderColor = 0x33ddff;
      }

      if (team === "player") {
        const iconX = startX + 30;

        const iconY = y + 30;

        const textX = startX + 82;
        const barX = startX + 82;

        const barW = 135;

        const iconBorder = this.add.rectangle(
          iconX,
          iconY,
          58,
          58,
          0x000000,
          0,
        );

        iconBorder.setOrigin(0.5);

        iconBorder.setStrokeStyle(4, borderColor, 1);

        const icon = this.add.image(iconX, iconY, unit.icon);

        icon.setOrigin(0.5);
        icon.setScale(46 / icon.height);

        if (isDead) {
          icon.setAlpha(0.6);
        }

        this.sideRoot.add([iconBorder, icon]);

        if (isDead) {
          this.addDeadX(this.sideRoot, iconX, iconY);

          const nameText = this.add.text(textX, y + 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "14px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
          });

          const deadText = this.add.text(textX, y + 24, "DEAD", {
            fontFamily: "DogicaBold",
            fontSize: "13px",
            color: "#ff4444",
            stroke: "#000000",
            strokeThickness: 4,
          });

          this.sideRoot.add([nameText, deadText]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textX + nameText.width + 18,
            y + 10,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        } else if (isActive) {
          const smallName = this.add.text(textX, y - 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "11px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
          });

          const activeText = this.add.text(textX, y + 20, "ACTIVE", {
            fontFamily: "DogicaBold",
            fontSize: "16px",
            color: "#ffffff",
            stroke: "#000000",

            strokeThickness: 4,
          });

          this.sideRoot.add([smallName, activeText]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textX + smallName.width + 18,
            y + 7,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        } else {
          const nameText = this.add.text(textX, y + 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "14px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
          });

          const hp = this.add.rectangle(barX, y + 38, barW, 8, color_hpbar, 1);

          hp.setOrigin(0, 0.5);

          hp.displayWidth = barW * (Math.max(0, unit.hp) / unit.maxHp);

          const st = this.add.rectangle(barX, y + 54, barW, 8, stambar_clr, 1);

          st.setOrigin(0, 0.5);
          st.displayWidth =
            barW * (Math.max(0, unit.stamina) / unit.maxStamina);

          this.sideRoot.add([nameText, hp, st]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textX + nameText.width + 18,
            y + 12,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        }
      }

      if (team === "enemy") {
        const iconX = startX + 245;
        const barW = 150;
        const iconY = y + 30;

        const textRightX = iconX - 70;

        const barX = textRightX - barW;

        let iconBoxSize = 58;
        let iconImageSize = 46;

        if (unit.baseId === "brute") {
          iconBoxSize = 84;
          iconImageSize = 69;
        }

        const iconBorder = this.add.rectangle(
          iconX,
          iconY,
          iconBoxSize,
          iconBoxSize,
          0x000000,
          0,
        );
        iconBorder.setOrigin(0.5);

        iconBorder.setStrokeStyle(4, borderColor, 1);

        const icon = this.add.image(iconX, iconY, unit.icon);
        icon.setOrigin(0.5);

        icon.setScale(iconImageSize / icon.height);

        if (isDead) {
          icon.setAlpha(0.6);
        }

        this.sideRoot.add([iconBorder, icon]);

        if (isDead) {
          this.addDeadX(this.sideRoot, iconX, iconY);

          const nameText = this.add.text(textRightX, y + 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "14px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
            align: "right",
          });
          nameText.setOrigin(1, 0);

          const deadText = this.add.text(textRightX, y + 24, "DEAD", {
            fontFamily: "DogicaBold",
            fontSize: "13px",
            color: "#ff4444",
            stroke: "#000000",
            strokeThickness: 4,
            align: "right",
          });
          deadText.setOrigin(1, 0);

          this.sideRoot.add([nameText, deadText]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textRightX - nameText.width - 18,
            y + 10,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        } else if (isActive) {
          const smallName = this.add.text(textRightX, y - 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "11px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
            align: "right",
          });
          smallName.setOrigin(1, 0);

          const activeText = this.add.text(textRightX, y + 20, "ACTIVE", {
            fontFamily: "DogicaBold",
            fontSize: "16px",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4,
            align: "right",
          });
          activeText.setOrigin(1, 0);

          this.sideRoot.add([smallName, activeText]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textRightX - smallName.width - 18,
            y + 7,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        } else {
          const nameText = this.add.text(textRightX, y + 2, unit.name, {
            fontFamily: "DogicaBold",
            fontSize: "14px",
            color: nameColor,
            stroke: "#000000",
            strokeThickness: 4,
            align: "right",
          });
          nameText.setOrigin(1, 0);

          const hp = this.add.rectangle(barX, y + 38, barW, 8, color_hpbar, 1);

          hp.setOrigin(0, 0.5);
          hp.displayWidth = barW * (Math.max(0, unit.hp) / unit.maxHp);

          const st = this.add.rectangle(barX, y + 54, barW, 8, stambar_clr, 1);
          st.setOrigin(0, 0.5);

          st.displayWidth =
            barW * (Math.max(0, unit.stamina) / unit.maxStamina);

          this.sideRoot.add([nameText, hp, st]);

          const bleedIcon = this.addSideBleedIcon(
            unit,
            textRightX - nameText.width - 18,
            y + 12,
          );

          if (bleedIcon) {
            this.sideRoot.add(bleedIcon);
          }
        }
      }
    });
  }

  // shwo non cneter targetable guys owhen camera is on their side view
  updateTargetTeamDisplays(view) {
    this.playerUnits.forEach((unit) => {
      if (unit.teamDisplay) {
        let show = false;

        // i fon left side show alive guys
        if (view === "left") {
          if (unit.alive) {
            if (unit !== this.activePlayerUnit) {
              // sip the active center player (not part of roster)
              show = true;
            }
          }
        }

        // makae rster
        this.setDisplayVisible(unit.teamDisplay, show);
      }
    });

    this.enemyUnits.forEach((unit) => {
      if (unit.teamDisplay) {
        let show = false;

        if (view === "right") {
          if (unit.alive) {
            if (unit !== this.activeEnemyUnit) {
              show = true;
            }
          }
        }

        this.setDisplayVisible(unit.teamDisplay, show);
      }
    });
  }

  // refresh unit alive or dead state / other stuff
  updateAllUnitVisuals() {
    this.allUnits.forEach((unit) => {
      this.updateUnitVisual(unit);
    });

    if (this.activePlayerUnit && !this.activePlayerUnit.alive) {
      this.activePlayerUnit = this.getFirstAlivePlayer();
    }

    if (this.activeEnemyUnit && !this.activeEnemyUnit.alive) {
      this.activeEnemyUnit = this.getFirstAliveEnemy();
    }

    this.updateSideRosters();
  }

  // sklll acctno botom bar
  // used during skills
  showSkillActionMessage(user, skill, target) {
    this.bottomRoot.setVisible(true);
    this.bottomRoot.removeAll(true); // remove other first

    this.bottomRoot.x = this.cameras.main.scrollX;

    if (this.messageText) {
      this.messageText.setText("");
    }

    const bg = this.add.rectangle(
      0,
      ui.bar_y_bottom,
      main_width,
      ui.bar_h_bottom,
      0x000000,
      0.92,
    );
    bg.setOrigin(0, 0);

    this.bottomRoot.add(bg);

    let x = 60;
    const y = ui.bar_y_bottom + 82;

    const addPart = (text, color) => {
      const part = this.add.text(x, y, text, {
        fontFamily: "DogicaBold",
        fontSize: "25px",
        color,
        stroke: "#000000",
        strokeThickness: 5,
        align: "left",
      });

      part.setOrigin(0, 0.5);

      this.bottomRoot.add(part);

      x += part.width + 8; // insstaed of just a normla sentnaace it has diff parts for colors
    };

    addPart(user.name, this.getTeamNameColor(user.team));
    addPart(" used ", "#ffffff");

    addPart(skill.name, "#ffffff");

    if (target) {
      addPart(" on ", "#ffffff");
      addPart(target.name, this.getTeamNameColor(target.team));
    }

    addPart(".", "#ffffff");
  }

  updateUnitVisual(unit) {
    // clear status and fade dead losers
    if (unit.hp <= 0) {
      unit.hp = 0;
      unit.stamina = 0;
      unit.alive = false;
      unit.intent = null;

      unit.exhausted = false;
      // unit.exhausted =
      unit.shieldHits = 0;

      unit.shieldReduction = 0;

      this.updateDisplayBars(unit, unit.centerDisplay);

      this.updateDisplayBars(unit, unit.teamDisplay);

      this.fadeDeadDisplay(unit.centerDisplay);

      this.fadeDeadDisplay(unit.teamDisplay);
    } else {
      unit.alive = true;

      this.updateDisplayBars(unit, unit.centerDisplay);

      this.updateDisplayBars(unit, unit.teamDisplay);

      if (unit.centerDisplay) {
        unit.centerDisplay.root.setAlpha(1);
      }

      if (unit.teamDisplay) {
        unit.teamDisplay.root.setAlpha(1);
      }
    }
  }

  updateDisplayBars(unit, display) {
    if (!display) {
      return;
    }

    /// fo r bars
    const rats = Math.max(0, unit.hp) / unit.maxHp;

    const staminarat = Math.max(0, unit.stamina) / unit.maxStamina;

    display.hpFill.displayWidth = display.barW * rats;

    display.stFill.displayWidth = display.barW * staminarat;

    display.hpText.setText(`${Math.max(0, unit.hp)}/${unit.maxHp}`);

    display.stText.setText(`${Math.max(0, unit.stamina)}/${unit.maxStamina}`);

    if (unit.shieldHits) {
      if (unit.shieldHits > 0) {
        display.statusText.setText("SHIELDED");
      } else {
        display.statusText.setText("");
      }
    } else {
      display.statusText.setText("");
    }

    if (unit.team === "enemy") {
      if (display === unit.centerDisplay || this.currentView === "right") {
        this.ensureEnemyIntent(unit);

        if (unit.intent) {
          const target = this.gettheIDofUnit(unit.intent.targetId);

          if (target) {
            display.statusText.setText(`ATTACKING ${target.name}`);
          }
        }
      }
    }
    this.refreshDisplayStatusIcons(unit, display);
  }

  // clears eexisting icon
  refreshDisplayStatusIcons(unit, display) {
    if (!display) {
      return;
    }

    if (display.statusIcon) {
      display.statusIcon.destroy();
      display.statusIcon = null;
    }
  }

  // bleed icons //!!(not being used right now but keep)
  addSideBleedIcon(unit, x, y) {
    return null;
  }

  fadeDeadDisplay(display) {
    if (!display) {
      return;
    }

    display.root.setAlpha(0);
    display.sprite.clearTint(0x666666);
  }

  // swapa center unit with roaster unit
  showCenterUnit(unit, team, animate) {
    if (!unit) {
      return;
    }

    const display = unit.centerDisplay;

    if (!display) {
      return;
    }

    // annimate in OPPOSite Horiztnoal driectoinxs
    let previous = this.activePlayerUnit;

    let exitOffset = -220;

    let enterOffset = -220;

    if (team === "enemy") {
      previous = this.activeEnemyUnit;
      exitOffset = 220;
      enterOffset = 220;
    }

    if (previous) {
      if (previous !== unit) {
        if (previous.centerDisplay) {
          const oldDisplay = previous.centerDisplay;

          if (animate) {
            this.tweens.add({
              targets: oldDisplay.root,
              alpha: 0,
              x: oldDisplay.baseX + exitOffset,
              duration: 220,
              ease: "Cubic.In",
              onComplete: () => {
                this.setDisplayVisible(oldDisplay, false);
                oldDisplay.root.setAlpha(1);
                oldDisplay.root.setPosition(oldDisplay.baseX, oldDisplay.baseY);
              },
            });
          } else {
            this.setDisplayVisible(oldDisplay, false);
            oldDisplay.root.setPosition(oldDisplay.baseX, oldDisplay.baseY);
          }
        }
      }
    }

    if (team === "player") {
      this.activePlayerUnit = unit;
    } else {
      this.activeEnemyUnit = unit;
    }

    this.setDisplayVisible(display, true);

    if (animate) {
      display.root.setAlpha(0);
      display.root.setPosition(display.baseX + enterOffset, display.baseY);

      this.tweens.add({
        targets: display.root,
        alpha: 1,
        x: display.baseX,
        duration: 260,
        ease: "Cubic.Out",
      });
    } else {
      display.root.setAlpha(1);
      display.root.setPosition(display.baseX, display.baseY);
    }

    this.updateAllUnitVisuals();
  }

  // make turn order
  whichTurnNow() {
    const players = [];

    const enemies = [];

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        players.push(unit);
      }
    });

    this.enemyUnits.forEach((unit) => {
      if (unit.alive) {
        enemies.push(unit);
      }
    });

    players.sort((a, b) => {
      return b.speed - a.speed;
    });

    enemies.sort((a, b) => {
      return b.speed - a.speed;
    });

    // fasetst unuit between the two decides

    let playerStarts = true;

    if (enemies.length > 0) {
      if (players.length > 0) {
        if (enemies[0].speed > players[0].speed) {
          playerStarts = false;
        }
      }
    }

    const order = [];

    let playerIndex = 0;
    let enemyIndex = 0;

    while (playerIndex < players.length || enemyIndex < enemies.length) {
      if (playerStarts) {
        if (playerIndex < players.length) {
          order.push(players[playerIndex]);
          playerIndex += 1;
        }

        if (enemyIndex < enemies.length) {
          order.push(enemies[enemyIndex]);
          enemyIndex += 1;
        }
      } else {
        if (enemyIndex < enemies.length) {
          order.push(enemies[enemyIndex]);
          enemyIndex += 1;
        }

        if (playerIndex < players.length) {
          order.push(players[playerIndex]);
          playerIndex += 1;
        }
      }
    }

    this.turnOrder = order;
    this.turnIndex = 0;
  }

  makeListofturnOrders() {
    if (this.turnOrderText) {
      this.turnOrderText.destroy();
      this.turnOrderText = null;
    }
  }

  chooseEnemyIntentTarget(enemy, enemyIndex, alivePlayers) {
    if (!alivePlayers) {
      return null;
    }

    if (alivePlayers.length === 0) {
      return null;
    }

    if (alivePlayers.length === 1) {
      enemy.lastTargetId = alivePlayers[0].id;
      return alivePlayers[0];
    }

    let index = (this.roundNumber + enemyIndex) % alivePlayers.length;
    let target = alivePlayers[index];

    if (enemy.lastTargetId) {
      if (target.id === enemy.lastTargetId) {
        index += 1;

        if (index >= alivePlayers.length) {
          index = 0;
        }

        target = alivePlayers[index];
      }
    }

    enemy.lastTargetId = target.id; // save last target so yuo dont pick the same guy twice
    return target;
  }

  applyExtraTurnsToTurnOrder() {
    const extraUnits = [];

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        if (unit.extraTurnNextRound) {
          extraUnits.push(unit);
          unit.extraTurnNextRound = false;
        }
      }
    });

    extraUnits.forEach((unit) => {
      const index = this.turnOrder.indexOf(unit);

      if (index >= 0) {
        this.turnOrder.splice(index + 1, 0, unit);
      } else {
        this.turnOrder.push(unit);
      }
    });
  }

  ensureEnemyIntent(enemy) {
    if (!enemy) {
      return;
    }

    if (!enemy.alive) {
      return;
    }

    if (enemy.intent) {
      return;
    }

    const alivePlayers = this.whoAliveRightNow();

    const enemyIndex = this.enemyUnits.indexOf(enemy);

    if (!alivePlayers || alivePlayers.length === 0) {
      return;
    }

    const target = this.chooseEnemyIntentTarget(
      enemy,
      enemyIndex,
      alivePlayers,
    );

    let targetId = null;

    if (target) {
      targetId = target.id;
    }

    enemy.intent = {
      skill: this.getEnemyChosenSkill(enemy),
      targetId,
    };
  }

  whoEnemyGonnaKill() {
    const alivePlayers = this.whoAliveRightNow();

    this.enemyUnits.forEach((enemy, index) => {
      if (enemy.alive) {
        const skill = this.getEnemyChosenSkill(enemy);
        const target = this.chooseEnemyIntentTarget(enemy, index, alivePlayers);

        let targetId = null;

        if (target) {
          targetId = target.id;
        }

        enemy.intent = {
          skill,
          targetId,
        };
      }
    });
  }

  // advance battle flwo
  startNextTurn() {
    if (this.battleEnded) {
      return;
    }

    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
    this.clearSelectedSkill();

    this.updateAllUnitVisuals();

    if (this.checkBattleEnd()) {
      return;
    }

    // aftter evryeboy has done smth, new round and refresh stamina intents and order
    if (this.turnIndex >= this.turnOrder.length) {
      this.roundNumber += 1;
      this.recoverAllUnitsAtRoundEnd();
      this.whoEnemyGonnaKill();
      this.whichTurnNow();
      this.applyExtraTurnsToTurnOrder();

      this.makeListofturnOrders();
    }

    const unit = this.turnOrder[this.turnIndex];

    if (!unit) {
      this.turnIndex += 1;
      this.startNextTurn();
      return;
    }

    if (!unit.alive) {
      this.turnIndex += 1;
      this.startNextTurn();
      return;
    }

    // Apply statuses that activate at eneymy turn start
    this.currentUnit = unit;
    this.applyStartOfTurnEffects(unit);

    if (unit.team === "player") {
      const enemy = this.getFirstAliveEnemy();

      this.showCenterUnit(unit, "player", true);

      if (enemy) {
        this.showCenterUnit(enemy, "enemy", false);
      }
    } else {
      const visiblePlayer = this.activePlayerUnit || this.getFirstAlivePlayer();

      this.showCenterUnit(unit, "enemy", true);

      if (visiblePlayer) {
        this.showCenterUnit(visiblePlayer, "player", false);
      }
    }

    this.slideToView("center", () => {
      this.highlightCurrentUnit(unit);

      if (unit.exhausted) {
        unit.exhausted = false;
        unit.stamina = Math.min(unit.maxStamina, unit.stamina + 35);
        this.showMessage(`${unit.name} is exhausted and recovers stamina.`);
        this.updateAllUnitVisuals();

        this.time.delayedCall(850, () => {
          this.endTurn();
        });

        return;
      }

      unit.stamina = Math.min(unit.maxStamina, unit.stamina + 8);

      if (unit.team === "player") {
        this.showPlayerTurn(unit);
      } else {
        this.hideBottomBar();

        this.time.delayedCall(550, () => {
          this.runEnemyTurn(unit);
        });
      }
    });
  }

  // recover stamina each round
  recoverAllUnitsAtRoundEnd() {
    this.allUnits.forEach((unit) => {
      if (unit.alive) {
        unit.stamina = Math.min(unit.maxStamina, unit.stamina + 8); // dont go higher than max stamina
      }
    });
  }

  // clear highlights
  highlightCurrentUnit(unit) {
    this.allUnits.forEach((u) => {
      if (u.centerDisplay) {
        u.centerDisplay.sprite.clearTint();
      }

      if (u.teamDisplay) {
        u.teamDisplay.sprite.clearTint();
      }
    });

    if (unit.centerDisplay) {
      unit.centerDisplay.sprite.setTint(0xffffaa);
    }

    if (unit.teamDisplay) {
      unit.teamDisplay.sprite.setTint(0xffffaa);
    }
  }

  // show avialbale actions for next guy
  showPlayerTurn(unit) {
    this.showMessage("");
    this.drawBottomBarForUnit(unit);
  }

  runEnemyTurn(enemy) {
    if (!enemy.intent) {
      const alivePlayers = this.whoAliveRightNow();

      const target = this.chooseEnemyIntentTarget(enemy, 0, alivePlayers);

      let targetId = null;

      if (target) {
        targetId = target.id;
      }

      enemy.intent = {
        skill: this.getEnemyChosenSkill(enemy),
        targetId,
      };
    }

    const skill = enemy.intent.skill;

    let target = this.gettheIDofUnit(enemy.intent.targetId);

    // targets the lowest hp fall back
    if (!target) {
      target = this.playerLowestHP();
    }

    if (!target) {
      this.endTurn();
      return;
    }

    if (!target.alive) {
      target = this.playerLowestHP();
    }

    if (!target) {
      this.endTurn();
      return;
    }

    if (target.baitTurns) {
      if (target.baitTurns > 0) {
        target.baitTurns -= 1;
      }
    }

    this.showCenterUnit(enemy, "enemy", true);

    // spend turn instead of using a skkill if no stamina
    if (enemy.stamina < skill.staminaCost) {
      enemy.stamina = Math.min(enemy.maxStamina, enemy.stamina + 30);
      this.showMessage(`${enemy.name} is too tired and recovers stamina.`);
      enemy.intent = null;
      this.updateAllUnitVisuals();

      this.time.delayedCall(1550, () => {
        this.endTurn();
      });

      return;
    }

    // move cam to t he panel of the target
    const targetView = this.getAttackViewForTarget(target);
    this.showBattleActionMessage(`${enemy.name} used ${skill.name}.`);

    this.slideToView(
      targetView,
      () => {
        this.performSkillWithAnimation(enemy, skill, target, true, () => {
          enemy.intent = null;

          this.slideToView(
            "center",
            () => {
              this.time.delayedCall(250, () => {
                this.endTurn();
              });
            },
            150,
          );
        });
      },
      150,
    );
  }

  // slide the caemra and bottom ui  between center to the 2 diff veiws
  slideToView(view, onComplete, duration = 300) {
    let targetScroll = scroll_cam.center;

    if (view === "left") {
      targetScroll = scroll_cam.left;
    }

    if (view === "right") {
      targetScroll = scroll_cam.right;
    }

    this.currentView = view;

    // side rosters are only shown in main center so target is not clutteedrd
    if (view === "center") {
      this.sideRoot.setVisible(true);
    } else {
      this.sideRoot.setVisible(false);
    }

    this.updateTargetTeamDisplays(view);

    if (this.bottomRoot) {
      this.tweens.add({
        targets: this.bottomRoot,
        x: targetScroll,
        duration,
        ease: "Cubic.InOut",
      });
    }

    this.tweens.add({
      targets: this.cameras.main,
      scrollX: targetScroll,
      duration,
      ease: "Cubic.InOut",
      onComplete: () => {
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  // holds player action btns and battle mgs
  makeBarOnBottom() {
    this.bottomRoot = this.add.container(worldthing.center, 0);
    this.bottomRoot.setDepth(500);
    this.bottomRoot.setVisible(false);
  }

  // hide and clear acito UI and any othe popups/tooltips that are open
  hideBottomBar() {
    this.bottomRoot.setVisible(false);
    this.bottomRoot.removeAll(true);
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
  }

  // all availbale plaeyr actions for current unit make them her
  drawBottomBarForUnit(unit) {
    this.bottomRoot.setVisible(true);
    this.bottomRoot.removeAll(true);

    const bg = this.add.rectangle(
      0,
      ui.bar_y_bottom,
      main_width,
      ui.bar_h_bottom,
      0x000000,
      0.92,
    );
    bg.setOrigin(0, 0);
    this.bottomRoot.add(bg);

    const turnText = this.add.text(
      58,
      ui.bar_y_bottom + 35,
      `${unit.name}'S TURN`,
      {
        fontFamily: "DogicaBold",
        fontSize: "20px",
        color: this.getTeamNameColor(unit.team),
        stroke: "#000000",
        strokeThickness: 5,
        align: "left",
      },
    );

    turnText.setOrigin(0, 0.5);

    this.bottomRoot.add(turnText);

    const buttonY = ui.bar_y_bottom + 115;

    const buttonH = 70;

    const buttonGap = 24;

    let nextLeft = 58;

    // char skills large action butns
    unit.characterSkills.forEach((skill) => {
      const buttonW = 250;
      const centerX = nextLeft + buttonW / 2;

      const skillButton = this.makeBottomButton(
        centerX,
        buttonY,
        buttonW,
        buttonH,
        skill.name,
      );

      skillButton.hit.on("pointerdown", () => {
        this.beginSkillTarget(unit, skill);
      });

      skillButton.hit.on("pointerover", () => {
        this.showTooltip(
          `${skill.description}\nSTAMINA: ${skill.staminaCost}`,
          tooltipXaction,
          actionyTooltip,
        );
      });

      skillButton.hit.on("pointerout", () => {
        this.clearTooltip();
      });

      nextLeft += buttonW + buttonGap;
    });

    // rest is self target skill obj
    const restW = 170;

    const restX = nextLeft + restW / 2;

    const restButton = this.makeBottomButton(
      restX,
      buttonY,
      restW,
      buttonH,
      "REST",
    );

    restButton.hit.on("pointerdown", () => {
      const restSkill = {
        id: "rest",
        name: "REST",
        description: "Recover 35 stamina. Uses the turn.",
        staminaCost: 0,
        target: "self",
        damage: 0,
        staminaDamage: 0,
        heal: 0,
        stamRec: 35,
      };

      this.beginSkillTarget(unit, restSkill); // on itself
    });

    restButton.hit.on("pointerover", () => {
      this.showTooltip(
        "Recover 35 stamina. Uses the turn.",
        tooltipXaction,
        actionyTooltip,
      );
    });

    restButton.hit.on("pointerout", () => {
      this.clearTooltip();
    });

    nextLeft += restW + buttonGap;

    // equppepd weapon popup for wpn skills
    unit.weaponIds.forEach((weaponId) => {
      const weapon = battleWeapons[weaponId];

      if (weapon) {
        const buttonSize = 70;

        const centerX = nextLeft + buttonSize / 2;

        const button = this.makeWeaponButton(
          centerX,
          buttonY,
          buttonSize,
          buttonSize,
          weapon,
        );

        button.hit.on("pointerdown", () => {
          this.showWeaponSkillPopup(unit, weapon, centerX);
        });

        nextLeft += buttonSize + buttonGap;
      }
    });

    const bagSize = 70;
    const bagX = nextLeft + bagSize / 2;

    const bagButton = this.makeInventoryButton(bagX, buttonY, bagSize, bagSize);

    bagButton.hit.on("pointerdown", () => {
      this.showConsumablePopup(unit, bagX);
    });

    this.drawTurnOrderPanel();
  }

  // returns living units sorted by speed for prediting future orderr
  getSortedAliveTurnOrder() {
    const order = [];

    this.allUnits.forEach((unit) => {
      if (unit.alive) {
        order.push(unit);
      }
    });

    order.sort((a, b) => {
      if (b.speed !== a.speed) {
        return b.speed - a.speed;
      }

      if (a.team === "player") {
        return -1;
      }

      return 1;
    });

    return order;
  }

  // get next living units after curr turn
  getUpcomingTurnUnits(count) {
    const upcoming = [];

    // starts at the current turn + 1
    for (let i = this.turnIndex + 1; i < this.turnOrder.length; i += 1) {
      const unit = this.turnOrder[i];

      if (unit) {
        if (unit.alive) {
          upcoming.push(unit);
        }
      }

      // return now if we have enough units fonud
      if (upcoming.length >= count) {
        return upcoming;
      }
    }

    // the current round did not have enough so we are here

    // save the current turn because we have to calculate the NEXT round
    const savedTurnOrder = this.turnOrder;
    const savedTurnIndex = this.turnIndex;

    //calcualte turn order as new round starting
    this.whichTurnNow();

    // add the units from the next round into the new upcoming if we dont have enough count
    this.turnOrder.forEach((unit) => {
      // at enough count, stop because we have enough now
      if (upcoming.length < count) {
        if (unit.alive) {
          upcoming.push(unit);
        }
      }
    });

    // restore actual current turn //!! withotu this, the ui would actuall change the real battle turnn
    this.turnOrder = savedTurnOrder;
    this.turnIndex = savedTurnIndex;

    return upcoming;
  }

  drawTurnOrderPanel() {
    const panelX = main_width - 280;

    const panelY = ui.bar_y_bottom + 30;

    const title = this.add.text(panelX, panelY, "TURN ORDER", {
      fontFamily: "DogicaBold",
      fontSize: "15px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    title.setAlpha(0.8);

    this.bottomRoot.add(title);

    const helpBox = this.add.rectangle(
      panelX + 170,
      panelY + 9,
      26,
      26,
      0x111111,
      1,
    );

    helpBox.setOrigin(0.5);

    helpBox.setStrokeStyle(2, 0xffffff, 0.85);

    const helpText = this.add.text(panelX + 170, panelY + 9, "?", {
      fontFamily: "DogicaBold",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    helpText.setOrigin(0.5);

    const helpHit = this.add.zone(panelX + 170, panelY + 9, 32, 32);
    helpHit.setOrigin(0.5);

    helpHit.setInteractive({ useHandCursor: false });

    helpHit.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
      this.showTooltip(
        "Turn order decides who goes next. It is affected by speed of survivor/zombie.",
        main_width - 260,
        ui.bar_y_bottom - 110,
      );
    });

    helpHit.on("pointerout", () => {
      this.input.setDefaultCursor("default");
      this.clearTooltip();
    });

    this.bottomRoot.add([helpBox, helpText, helpHit]);

    const upcoming = this.getUpcomingTurnUnits(3);

    upcoming.forEach((unit, index) => {
      const line = this.add.text(
        panelX + 15,
        panelY + 42 + index * 28,
        unit.name,
        {
          fontFamily: "Dogica",
          fontSize: "14px",
          color: this.getTeamNameColor(unit.team),
          stroke: "#000000",
          strokeThickness: 3,
        },
      );

      line.setAlpha(0.8);

      this.bottomRoot.add(line);
    });
  }

  // replca bototm action UI with action msg
  showBattleActionMessage(message) {
    this.bottomRoot.setVisible(true);

    this.bottomRoot.removeAll(true);

    // keeps bottom msg locked in current cam view
    this.bottomRoot.x = this.cameras.main.scrollX;

    if (this.messageText) {
      this.messageText.setText("");
    }

    const bg = this.add.rectangle(
      0,
      ui.bar_y_bottom,
      main_width,
      ui.bar_h_bottom,
      0x000000,
      0.92,
    );

    bg.setOrigin(0, 0);

    const text = this.add.text(60, ui.bar_y_bottom + 82, message, {
      fontFamily: "DogicaBold",
      fontSize: "25px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "left",
    });

    text.setOrigin(0, 0.5);

    this.bottomRoot.add([bg, text]);
  }

  //replace bototm action UI iwth instruction for choosing target
  showTargetPrompt(message) {
    this.bottomRoot.setVisible(true);

    this.bottomRoot.removeAll(true);

    const bg = this.add.rectangle(
      0,
      ui.bar_y_bottom,
      main_width,
      ui.bar_h_bottom,
      0x000000,
      0.92,
    );
    bg.setOrigin(0, 0);

    const text = this.add.text(90, ui.bar_y_bottom + 70, message, {
      fontFamily: "DogicaBold",
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "left",
    });
    text.setOrigin(0, 0.5);

    this.bottomRoot.add([bg, text]);
  }

  // create bag btn
  makeInventoryButton(x, y, w, h) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    const icon = this.add.image(0, 0, "classroom-bag");
    icon.setOrigin(0.5);

    icon.setScale(46 / icon.height);
    objects.push(icon);

    const hit = this.add.zone(0, 0, w, h);

    hit.setOrigin(0.5);

    hit.setInteractive({ useHandCursor: false });

    hit.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
      bg.setStrokeStyle(3, 0xff3333, 1);
    });

    hit.on("pointerout", () => {
      this.input.setDefaultCursor("default");
      bg.setStrokeStyle(3, 0xb5b5b5, 1);
    });

    objects.push(hit);
    root.add(objects);
    this.bottomRoot.add(root);

    return {
      root,
      bg,
      hit,
    };
  }

  // bottom bar w/ hover styling (resuable omg)
  makeBottomButton(x, y, w, h, label) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);

    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: "DogicaBold",
      fontSize: "13px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
    });

    const hit = this.add.zone(0, 0, w, h);

    text.setOrigin(0.5);

    hit.setOrigin(0.5);

    hit.setInteractive({ useHandCursor: false });

    hit.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
      bg.setStrokeStyle(3, 0xff3333, 1);
    });

    hit.on("pointerout", () => {
      this.input.setDefaultCursor("default");
      bg.setStrokeStyle(3, 0xb5b5b5, 1);
    });

    root.add([bg, text, hit]);
    this.bottomRoot.add(root);

    return {
      root,
      bg,
      text,
      hit,
    };
  }

  // wpn icon tha topens that wpns skill lsit
  makeWeaponButton(x, y, w, h, weapon) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);

    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    if (weapon.icon) {
      const icon = this.add.image(0, 0, weapon.icon);
      icon.setOrigin(0.5);

      icon.setScale(48 / icon.height);
      objects.push(icon);
    }

    const hit = this.add.zone(0, 0, w, h);
    hit.setOrigin(0.5);

    hit.setInteractive({ useHandCursor: false });

    hit.on("pointerover", () => {
      this.input.setDefaultCursor("pointer");
      bg.setStrokeStyle(3, 0xff3333, 1);
    });

    hit.on("pointerout", () => {
      this.input.setDefaultCursor("default");
      bg.setStrokeStyle(3, 0xb5b5b5, 1);
    });

    objects.push(hit);
    root.add(objects);
    this.bottomRoot.add(root);

    return {
      root,
      bg,
      hit,
    };
  }

  // invisible screen click zone behid popups so outside clisk close popopsup
  createPopupCloseZone() {
    this.clearPopupCloseZone();

    this.popupCloseZone = this.add.zone(
      worldthing.center + main_width / 2,
      main_height / 2,
      main_width,
      main_height,
    );

    this.popupCloseZone.setDepth(550);
    this.popupCloseZone.setInteractive({ useHandCursor: false });

    this.popupCloseZone.on("pointerdown", () => {
      this.clearSkillPopup();

      this.clearConsumablePopup();
      this.clearTooltip();
    });
  }

  // destroy outside click thing if popup closed
  clearPopupCloseZone() {
    if (this.popupCloseZone) {
      this.popupCloseZone.destroy();
      this.popupCloseZone = null;
    }
  }

  // opens popup listing the selcted wepaons ksill
  showWeaponSkillPopup(unit, weapon, x) {
    this.clearSkillPopup();

    this.clearConsumablePopup();
    this.clearTooltip();

    this.createPopupCloseZone();

    const skills = weapon.skills || [];
    const popupW = 260;
    const popupH = 34 + skills.length * 58;
    const popupTopY = ui.bar_y_bottom - popupH - 18;
    // Clamp popup position so it stays inside the screen edges.
    const popupX = this.clampPopupX(x, popupW);

    this.skillPopup = this.add.container(worldthing.center + popupX, popupTopY);
    this.skillPopup.setDepth(600);

    const bg = this.add.rectangle(
      0,
      popupH / 2,
      popupW,
      popupH,
      0x000000,
      0.96,
    );
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);
    bg.setInteractive({ useHandCursor: false });

    bg.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
    });

    this.skillPopup.add(bg);

    // make the skills optoins
    skills.forEach((skill, index) => {
      const itemY = 34 + index * 58;

      const btn = this.add.rectangle(0, itemY, 225, 44, 0x111111, 1);
      btn.setOrigin(0.5);
      btn.setStrokeStyle(2, 0x777777, 1);

      const label = this.add.text(0, itemY, skill.name, {
        fontFamily: "DogicaBold",
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      });

      label.setOrigin(0.5);

      const hit = this.add.zone(0, itemY, 225, 44);
      hit.setOrigin(0.5);

      hit.setInteractive({ useHandCursor: false });

      hit.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
        btn.setStrokeStyle(2, 0xff3333, 1);
        this.showTooltip(
          `${skill.description}\nSTAMINA: ${skill.staminaCost}`,
          tooltipXaction,
          actionyTooltip,
        );
      });

      hit.on("pointerout", () => {
        this.input.setDefaultCursor("default");
        btn.setStrokeStyle(2, 0x777777, 1);
        this.clearTooltip();
      });

      hit.on("pointerdown", () => {
        this.beginSkillTarget(unit, skill);
      });

      // ptu in popup menu
      this.skillPopup.add([btn, label, hit]);
    });
  }

  makeConsumableSlot(x, y, size, item, qty) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, size, size, 0x222222, 1);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    if (item.icon) {
      if (this.textures.exists(item.icon)) {
        const icon = this.add.image(0, 0, item.icon);
        icon.setOrigin(0.5);
        icon.setScale(46 / icon.height);
        objects.push(icon);
      } else {
        const missing = this.add.text(0, 0, "?", {
          fontFamily: "DogicaBold",
          fontSize: "20px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 4,
        });
        missing.setOrigin(0.5);
        objects.push(missing);
      }
    }

    const qtyText = this.add.text(size / 2 - 7, size / 2 - 19, String(qty), {
      fontFamily: "DogicaBold",
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
    });
    qtyText.setOrigin(1, 0);

    objects.push(qtyText);

    const hit = this.add.zone(0, 0, size, size);
    hit.setOrigin(0.5);
    hit.setInteractive({ useHandCursor: false });

    hit.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
    });

    objects.push(hit);

    root.add(objects);
    this.consumablePopup.add(root);

    return {
      root,
      bg,
      hit,
    };
  }

  // open grid popup of usable consumbales from invntory
  showConsumablePopup(unit, x) {
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
    this.createPopupCloseZone();

    const items = this.getConsumableEntries();

    const slotSize = 70;
    const gap = 12;

    let cols = items.length;

    if (cols < 1) {
      cols = 1;
    }

    if (cols > 5) {
      cols = 5;
    }

    let rows = Math.ceil(items.length / cols);

    if (rows < 1) {
      rows = 1;
    }

    const popupW = cols * slotSize + (cols - 1) * gap + 34;

    const popupH = rows * slotSize + (rows - 1) * gap + 34;

    const popupTopY = ui.bar_y_bottom - popupH - 18;

    const popupX = this.clampPopupX(x, popupW);

    this.consumablePopup = this.add.container(
      worldthing.center + popupX,
      popupTopY,
    );

    this.consumablePopup.setDepth(600);

    const bg = this.add.rectangle(
      0,
      popupH / 2,
      popupW,
      popupH,
      0x000000,
      0.96,
    );

    bg.setOrigin(0.5);

    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    bg.setInteractive({ useHandCursor: false });

    bg.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
    });

    this.consumablePopup.add(bg);

    if (items.length === 0) {
      const emptyText = this.add.text(0, popupH / 2, "NO ITEMS", {
        fontFamily: "DogicaBold",
        fontSize: "14px",
        color: "#777777",
        stroke: "#000000",
        strokeThickness: 4,
      });

      emptyText.setOrigin(0.5);

      this.consumablePopup.add(emptyText);
      return;
    }

    items.forEach((entry, index) => {
      // example
      // items = [
      //   thing1, index 0
      //   thing 2, index 1
      //   thing 3, index 2
      //   thing 4, index 3
      // ]
      // grid goes like
      // index 0 index 1 index 2
      // index 3 etc

      // if cols = 3 then

      // indedx 0 is col 0 row 0
      // index 1 is col 1 row 0
      // inex 2 is col 2 row 0
      // index 3 is col 0 row 1
      // index 4 is col 0 row 2

      // % cols wraps back to 0 after 3
      // mah..floor gives row

      const item = battleConsumables[entry.id];

      if (!item) {
        return;
      }

      const col = index % cols;
      const row = Math.floor(index / cols);

      const totalGridW = cols * slotSize + (cols - 1) * gap;

      const slotX = -totalGridW / 2 + slotSize / 2 + col * (slotSize + gap);
      const slotY = 17 + slotSize / 2 + row * (slotSize + gap);

      const slot = this.makeConsumableSlot(
        slotX,
        slotY,
        slotSize,
        item,
        entry.qty,
      );

      slot.hit.on("pointerdown", () => {
        this.beginConsumableTarget(unit, item);
      });

      slot.hit.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
        slot.bg.setStrokeStyle(3, 0xff3333, 1);
        this.showTooltip(
          `${item.name} x${entry.qty}\n${item.description}`,
          itemXtooltip,
          itemYtooltip,
        );
      });

      slot.hit.on("pointerout", () => {
        this.input.setDefaultCursor("default");
        slot.bg.setStrokeStyle(3, 0xb5b5b5, 1);
        this.clearTooltip();
      });
    });
  }

  // keeps popups horoitnaoly inside the visible viewport
  clampPopupX(x, popupW) {
    let popupX = x;

    const minX = popupW / 2 + 20;
    const maxX = main_width - popupW / 2 - 20;

    if (popupX < minX) {
      popupX = minX;
    }

    if (popupX > maxX) {
      popupX = maxX;
    }

    return popupX;
  }

  getConsumableEntries() {
    const entries = [];

    this.consumableInventory.forEach((entry) => {
      if (typeof entry === "string") {
        entries.push({
          id: entry,
          qty: 1,
        });
      } else {
        if (entry) {
          if (entry.id) {
            entries.push({
              id: entry.id,
              qty: Number(entry.qty || 1),
            });
          }
        }
      }
    });

    return entries;
  }

  beginSkillTarget(user, skill) {
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();

    // no action befire entering target moded if u dont have enguohs stamina
    if (user.stamina < skill.staminaCost) {
      this.showMessage(`${user.name} does not have enough stamina.`);
      return;
    }

    this.selectedUser = user;
    this.selectedSkill = skill;

    if (skill.target === "self") {
      this.tryUseSelectedSkillOn(user);
      return;
    }

    if (skill.target === "enemy") {
      const aliveEnemies = this.zombieAliveGuys();

      if (aliveEnemies.length === 1) {
        this.tryUseSelectedSkillOn(aliveEnemies[0]);
        return;
      }

      this.showMessage("");
      this.showTargetPrompt(`Choose a zombie to use ${skill.name} on.`);
      this.slideToView("right");
      return;
    }

    if (skill.target === "ally") {
      const alivePlayers = this.whoAliveRightNow();

      if (alivePlayers.length === 1) {
        this.tryUseSelectedSkillOn(alivePlayers[0]);
        return;
      }

      this.showMessage("");
      this.showTargetPrompt(`Choose a survivor for ${skill.name}.`);
      this.slideToView("left");
      return;
    }
  }

  beginConsumableTarget(user, item) {
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();

    this.selectedUser = user;
    this.selectedSkill = {
      id: item.id,
      name: item.name,
      description: item.description,
      staminaCost: 0,
      target: item.target,
      damage: 0,
      staminaDamage: 0,
      heal: item.heal || 0,
      stamRec: item.stamRec || 0,
      effectId: item.effectId || null,
      recovStamP: item.recovStamP || 0,
      extraTurnNextRound: item.extraTurnNextRound || false,
      overexertNextTurn: item.overexertNextTurn || false,
      baitNextRound: item.baitNextRound || false,
      consumableId: item.id,
    };

    const alivePlayers = this.whoAliveRightNow();

    if (alivePlayers.length === 1) {
      this.tryUseSelectedSkillOn(alivePlayers[0]);
      return;
    }

    this.showMessage("");

    this.showTargetPrompt(`Choose a survivor to use ${item.name} on.`);
    this.slideToView("left");
  }

  // validate clicked target, runs skill, and ends unit's turn
  tryUseSelectedSkillOn(target) {
    if (!this.selectedSkill) {
      return;
    }

    if (!this.selectedUser) {
      return;
    }

    if (!target.alive) {
      return;
    }

    if (this.selectedSkill.target === "enemy") {
      if (target.team !== "enemy") {
        this.showMessage("Choose a zombie.");
        return;
      }
    }

    if (this.selectedSkill.target === "ally") {
      if (target.team !== "player") {
        this.showMessage("Choose a survivor.");
        return;
      }
    }

    const user = this.selectedUser;

    const skill = this.selectedSkill;

    const targetView = this.getAttackViewForTarget(target);

    this.showBattleActionMessage(`${user.name} used ${skill.name}.`);

    // run actual sill before the cam is showing target panel (the 3 views ting)
    const doAction = () => {
      this.performSkillWithAnimation(user, skill, target, false, () => {
        this.clearSelectedSkill();

        this.slideToView(
          "center",
          () => {
            this.time.delayedCall(250, () => {
              this.endTurn();
            });
          },
          150,
        );
      });
    };

    if (this.currentView !== targetView) {
      this.slideToView(targetView, doAction, 150);
    } else {
      doAction();
    }
  }

  // whicih cam view has the target being acted on
  getAttackViewForTarget(target) {
    if (target.team === "player") {
      if (target === this.activePlayerUnit) {
        return "center";
      }

      return "left";
    }

    if (target.team === "enemy") {
      if (target === this.activeEnemyUnit) {
        return "center";
      }

      return "right";
    }

    return "center";
  }

  // retunr the display currently visible fofr unit based on active center slots and side viewx
  getVisibleDisplayForUnit(unit) {
    if (unit.team === "player") {
      if (unit === this.activePlayerUnit) {
        return unit.centerDisplay;
      }

      if (this.currentView === "left") {
        return unit.teamDisplay;
      }
    }

    if (unit.team === "enemy") {
      if (unit === this.activeEnemyUnit) {
        return unit.centerDisplay;
      }

      if (this.currentView === "right") {
        return unit.teamDisplay;
      }
    }

    return unit.centerDisplay;
  }

  // shuld skill use mlee movement animatoin
  // or reolve in place
  performSkillWithAnimation(user, skill, target, enemyUsed, onComplete) {
    //only range, non range skills move the  attcker/
    const has_dmg =
      Number(skill.damage || 0) > 0 || Number(skill.staminaDamage || 0) > 0;

    let ranged = false;

    if (skill.ranged) {
      ranged = true;
    }

    if (skill.isRanged) {
      ranged = true;
    }

    if (skill.attackType === "ranged") {
      ranged = true;
    }

    const shouldMove = has_dmg && !ranged;

    const userDisplay = this.getVisibleDisplayForUnit(user);

    const targetDisplay = this.getVisibleDisplayForUnit(target);

    if (!shouldMove) {
      if (skill.effectId === "dombis-spit") {
        this.playSkillVisualEffect(
          skill,
          targetDisplay,
          null,
          userDisplay,
          () => {
            const outcome = this.useSkill(user, skill, target, enemyUsed);
            this.playHitEffect(target, outcome, targetDisplay);

            if (onComplete) {
              this.time.delayedCall(550, onComplete);
            }
          },
        );

        return;
      }
      if (skill.effectId === "alpha-long-slap") {
        this.playSkillVisualEffect(
          skill,
          targetDisplay,
          null,
          userDisplay,
          () => {
            const outcome = this.useSkill(user, skill, target, enemyUsed);
            this.playHitEffect(target, outcome, targetDisplay);

            if (onComplete) {
              this.time.delayedCall(650, onComplete);
            }
          },
        );

        return;
      }
      const outcome = this.useSkill(user, skill, target, enemyUsed);

      if (outcome) {
        this.playSkillVisualEffect(skill, targetDisplay, outcome, userDisplay);
      }

      this.playHitEffect(target, outcome, targetDisplay);

      if (onComplete) {
        this.time.delayedCall(350, onComplete);
      }

      return;
    }
    if (!userDisplay || !targetDisplay) {
      const outcome = this.useSkill(user, skill, target, enemyUsed);
      this.playHitEffect(target, outcome, targetDisplay);

      if (onComplete) {
        this.time.delayedCall(350, onComplete);
      }

      return;
    }

    this.playMeleeAttackAnimation(
      user,
      skill,
      target,
      userDisplay,
      targetDisplay,
      enemyUsed,
      onComplete,
    );
  }

  // move attacker to targt
  playMeleeAttackAnimation(
    user,
    skill,
    target,
    userDisplay,
    targetDisplay,
    enemyUsed,
    onComplete,
  ) {
    const attackerRoot = userDisplay.root;

    const startX = attackerRoot.x;

    const startY = attackerRoot.y;

    let attackX = targetDisplay.root.x;
    const attackY = targetDisplay.root.y;

    if (user.team === "player") {
      attackX = targetDisplay.root.x - 105;
    }

    if (user.team === "enemy") {
      attackX = targetDisplay.root.x + 105;
    }

    this.tweens.killTweensOf(attackerRoot);

    this.tweens.add({
      targets: attackerRoot,
      x: attackX,
      y: attackY,
      duration: atk_traveldurr,
      ease: "Quad.Out",
      onComplete: () => {
        this.time.delayedCall(450, () => {
          const outcome = this.useSkill(user, skill, target, enemyUsed);

          if (outcome) {
            this.playSkillVisualEffect(
              skill,
              targetDisplay,
              outcome,
              userDisplay,
            );
          }
          this.playHitEffect(target, outcome, targetDisplay);

          this.time.delayedCall(190, () => {
            this.tweens.add({
              targets: attackerRoot,
              x: startX,
              y: startY,
              duration: 240,
              ease: "Quad.InOut",
              onComplete: () => {
                if (onComplete) {
                  onComplete();
                }
              },
            });
          });
        });
      },
    });
  }

  // shwo temp faling damge numb near target display
  spawnDamageIndicator(display, damageAmount) {
    const randomX = Phaser.Math.Between(-70, 70);
    const randomY = Phaser.Math.Between(-255, -170);

    const text = this.add.text(
      display.root.x + randomX,
      display.root.y + randomY,
      `-${damageAmount}`,
      {
        fontFamily: "DogicaBold",
        fontSize: "20px",
        color: "#ff4a65",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      },
    );

    text.setOrigin(0.5);

    text.setDepth(260);

    this.tweens.add({
      targets: text,
      y: text.y + dmgindciatorfalldistance,
      alpha: 0,
      duration: dmgindicatortime,
      ease: "Sine.In",
      onComplete: () => {
        text.destroy();
      },
    });
  }

  playHitEffect(target, outcome, forcedDisplay) {
    if (!outcome) {
      return;
    }

    const didDamage = Number(outcome.damage || 0) > 0;
    const didStaminaDamage = Number(outcome.staminaDamage || 0) > 0;

    if (!didDamage && !didStaminaDamage) {
      return;
    }

    const display = forcedDisplay || this.getVisibleDisplayForUnit(target);

    if (!display) {
      return;
    }

    if (!display.sprite) {
      return;
    }

    if (didDamage) {
      this.spawnDamageIndicator(display, Number(outcome.damage || 0));
    }

    const sprite = display.sprite;
    const startX = sprite.x;
    const startAngle = sprite.angle;

    // Knockback direction depends on which team was hit.
    let knockbackX = 34;
    let tilt = 10;

    if (target.team === "player") {
      knockbackX = -34;
      tilt = -10;
    }

    this.tweens.killTweensOf(sprite);

    sprite.setTintFill(0xffffff);

    this.time.delayedCall(flash_g, () => {
      if (target.alive) {
        sprite.clearTint();
      }
    });

    this.time.delayedCall(flash_g * 2, () => {
      sprite.setTintFill(0xffffff);
    });

    this.time.delayedCall(flash_g * 3, () => {
      if (target.alive) {
        sprite.clearTint();
      }
    });

    this.tweens.add({
      targets: sprite,
      x: startX + knockbackX,
      angle: tilt,
      duration: kb_durr,
      yoyo: true,
      ease: "Quad.Out",
      onComplete: () => {
        sprite.x = startX;
        sprite.angle = startAngle;

        if (target.alive) {
          sprite.clearTint();
        }
      },
    });
  }

  // applies the actual gampleya effect of skiill
  useSkill(user, skill, target, enemyUsed) {
    const staminaCost = Number(skill.staminaCost || 0);

    // some consumlbels amrk the target to pay future staina costs with hp next turn (adrenaline)
    if (skill.overexertNextTurn) {
      target.overexertNextTurn = true;

      if (skill.consumableId) {
        this.removeConsumable(skill.consumableId);
      }

      this.updateAllUnitVisuals();

      return {
        damage: 0,
        staminaDamage: 0,
        heal: 0,
        stamRec: 0,
        overexert: true,
      };
    }

    if (user.overexertActive) {
      const hpCost = Math.ceil(staminaCost / 2);

      if (hpCost > 0) {
        user.hp = Math.max(1, user.hp - hpCost);
      }

      user.overexertActive = false;
    } else {
      user.stamina -= staminaCost;

      if (user.stamina < 0) {
        user.stamina = 0;
      }
    }

    if (skill.shield) {
      target.shieldReduction = skill.shield.damageReduction;
      target.shieldHits = skill.shield.hits;

      if (skill.consumableId) {
        this.removeConsumable(skill.consumableId);
      }

      this.updateAllUnitVisuals();

      return {
        damage: 0,
        staminaDamage: 0,
        heal: 0,
        stamRec: 0,
        shield: true,
      };
    }

    let damage = Number(skill.damage || 0);

    if (damage > 0) {
      damage += Math.floor(user.damage / 2);

      if (target.defense) {
        damage -= target.defense;
      }

      if (target.damageReductionPercent) {
        damage = Math.ceil(damage * (1 - target.damageReductionPercent));
      }

      if (damage < 1) {
        damage = 1;
      }

      if (target.shieldHits) {
        if (target.shieldHits > 0) {
          damage = Math.ceil(damage * (1 - target.shieldReduction));
          target.shieldHits -= 1;

          if (target.shieldHits <= 0) {
            target.shieldReduction = 0;
          }
        }
      }

      target.hp -= damage;
    }

    // exhcaustion
    const staminaDamage = Number(skill.staminaDamage || 0);

    if (staminaDamage > 0) {
      target.stamina -= staminaDamage;

      if (target.stamina <= 0) {
        target.stamina = 0;
        target.exhausted = true;
      }
    }

    // actual restored vals after caps so visual efects can show accurate results
    let actualHeal = 0;

    let actualStaminaRecover = 0;

    const heal = Number(skill.heal || 0);

    if (heal > 0) {
      const beforeHp = target.hp;

      target.hp += heal;

      if (target.hp > target.maxHp) {
        target.hp = target.maxHp;
      }

      actualHeal = target.hp - beforeHp;
    }

    const stamRec = Number(skill.stamRec || 0);

    if (stamRec > 0) {
      const beforeStamina = target.stamina;

      target.stamina += stamRec;

      if (target.stamina > target.maxStamina) {
        target.stamina = target.maxStamina;
      }

      actualStaminaRecover = target.stamina - beforeStamina;
    }

    const recovStamP = Number(skill.recovStamP || 0);

    if (recovStamP > 0) {
      const beforeStamina = target.stamina;
      const amount = Math.ceil(target.maxStamina * recovStamP);

      target.stamina += amount;

      if (target.stamina > target.maxStamina) {
        target.stamina = target.maxStamina;
      }

      actualStaminaRecover += target.stamina - beforeStamina;
    }

    if (skill.extraTurnNextRound) {
      target.extraTurnNextRound = true;
    }

    // baits
    if (skill.baitNextRound) {
      target.baitTurns = 1;
      this.forceEnemyIntentsToTarget(target);
    }

    if (skill.consumableId) {
      this.removeConsumable(skill.consumableId);
    }

    this.updateAllUnitVisuals();

    if (enemyUsed) {
      this.cameras.main.shake(90, 0.003);
    } else {
      this.cameras.main.shake(70, 0.002);
    }

    return {
      damage,
      staminaDamage,
      heal: actualHeal,
      stamRec: actualStaminaRecover,
    };
  }

  // rewrite all intents curently so they attack the bait target
  forceEnemyIntentsToTarget(target) {
    if (!target) {
      return;
    }

    if (!target.alive) {
      return;
    }

    this.enemyUnits.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      const skill = this.getEnemyChosenSkill(enemy);

      enemy.intent = {
        skill,
        targetId: target.id,
      };
    });

    this.updateAllUnitVisuals();
  }

  // delaye status flags at beginning of units turn
  applyStartOfTurnEffects(unit) {
    if (!unit) {
      return;
    }

    if (unit.overexertNextTurn) {
      unit.overexertNextTurn = false;
      unit.overexertActive = true;
    }
  }

  // removes on cosnumle from temp inventory
  removeConsumable(id) {
    for (let i = 0; i < this.consumableInventory.length; i += 1) {
      const entry = this.consumableInventory[i];

      if (typeof entry === "string") {
        if (entry === id) {
          this.consumableInventory.splice(i, 1);

          return;
        }
      } else {
        if (entry) {
          if (entry.id === id) {
            entry.qty = Number(entry.qty || 1) - 1;

            if (entry.qty <= 0) {
              this.consumableInventory.splice(i, 1);
            }

            return;
          }
        }
      }
    }
  }

  commitBattleConsumablesToDb() {
    if (!this.gameData) {
      return Promise.resolve();
    }

    if (!this.gameData.inventory) {
      this.gameData.inventory = {};
    }

    this.gameData.inventory.consumables = JSON.parse(
      JSON.stringify(this.consumableInventory),
    );

    return saveGameData(this.gameData).catch((error) => {
      console.log(error);
    });
  }

  // celars activeksill/user selection after action comepltesl / cancel
  clearSelectedSkill() {
    this.selectedSkill = null;
    this.selectedUser = null;
  }

  // closes wepaon skill popup
  clearSkillPopup() {
    if (this.skillPopup) {
      this.skillPopup.destroy(true);
      this.skillPopup = null;
    }

    this.clearPopupCloseZone();
  }

  // closes consumbel popup and outsclick click zone
  clearConsumablePopup() {
    if (this.consumablePopup) {
      this.consumablePopup.destroy(true);
      this.consumablePopup = null;
    }

    this.clearPopupCloseZone();
  }

  showTooltip(text, x, y) {
    this.clearTooltip();

    let safeY = y;

    if (safeY > ui.bar_y_bottom - 115) {
      safeY = ui.bar_y_bottom - 115;
    }

    this.tooltip = this.add.container(x, safeY);

    this.tooltip.setDepth(650);
    this.tooltip.setScrollFactor(0);

    const bg = this.add.rectangle(0, 0, 410, 105, 0x000000, 0.98);
    bg.setOrigin(0.5);

    bg.setStrokeStyle(2, 0xffffff, 0.9);

    const label = this.add.text(-190, -40, text, {
      fontFamily: "Dogica",
      fontSize: "13px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
      wordWrap: {
        width: 370,
      },
    });

    label.setOrigin(0, 0);

    this.tooltip.add([bg, label]);
  }

  clearTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy(true);
      this.tooltip = null;
    }
  }

  msgTextMake() {
    this.messageBg = this.add.rectangle(
      main_width / 2,
      132,
      520,
      48,
      0x000000,
      0.55,
    );
    this.messageBg.setOrigin(0.5);
    this.messageBg.setDepth(175);

    this.messageBg.setScrollFactor(0);
    this.messageBg.setVisible(false);

    this.messageText = this.add.text(main_width / 2, 110, "", {
      fontFamily: "DogicaBold",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center",
    });

    this.messageText.setOrigin(0.5, 0);

    this.messageText.setDepth(180);
    this.messageText.setScrollFactor(0);
  }

  // top center mssage
  showMessage(message) {
    // console.log(message)
    if (this.messageText) {
      // console.log("hit")
      this.messageText.setText(message);
    }

    if (this.messageBg) {
      if (message) {
        this.messageBg.setVisible(true);
      } else {
        this.messageBg.setVisible(false);
      }
    }
  }

  whoAliveRightNow() {
    const alive = [];

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        alive.push(unit);
      }
    });

    return alive;
  }

  zombieAliveGuys() {
    const alive = [];

    this.enemyUnits.forEach((unit) => {
      if (unit.alive) {
        alive.push(unit);
      }
    });

    return alive;
  }

  playerLowestHP() {
    let chosen = null;

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        if (!chosen) {
          chosen = unit;
        } else {
          if (unit.hp < chosen.hp) {
            chosen = unit;
          }
        }
      }
    });

    return chosen;
  }

  getFirstAlivePlayer() {
    let chosen = null;

    this.playerUnits.forEach((unit) => {
      if (!chosen) {
        if (unit.alive) {
          chosen = unit;
        }
      }
    });

    return chosen;
  }

  getFirstAliveEnemy() {
    let chosen = null;

    this.enemyUnits.forEach((unit) => {
      if (!chosen) {
        if (unit.alive) {
          chosen = unit;
        }
      }
    });

    return chosen;
  }

  // getEnemyIntentTarget(enemy) {
  //   if (!enemy) {
  //     return null;
  //   }

  //   if (!enemy.intent) {
  //     return null;
  //   }

  //   return this.gettheIDofUnit(enemy.intent.targetId);
  // }

  gettheIDofUnit(id) {
    let f = null;

    this.allUnits.forEach((a) => {
      if (a.id === id) {
        f = a;
      }
    });

    return f;
  }

  // end current unit turn and clear ui state
  endTurn() {
    if (this.battleEnded) {
      return;
    }

    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
    this.clearSelectedSkill();

    this.hideBottomBar();

    this.updateAllUnitVisuals();

    if (this.checkBattleEnd()) {
      return;
    }

    this.turnIndex += 1;

    // next turn

    this.time.delayedCall(250, () => {
      this.startNextTurn();
    });
  }

  checkBattleEnd() {
    let playerAlive = false;
    let enemyAlive = false;

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        playerAlive = true;
      }
    });

    this.enemyUnits.forEach((unit) => {
      if (unit.alive) {
        enemyAlive = true;
      }
    });

    if (!playerAlive) {
      this.endBattle(false);
      return true;
    }

    if (!enemyAlive) {
      this.endBattle(true);
      return true;
    }

    return false;
  }

  async endBattle(playerWon) {
    this.battleEnded = true;
    this.hideBottomBar();

    let text = "DEFEAT";

    if (playerWon) {
      text = "VICTORY";
      await this.commitBattleConsumablesToDb();
    }

    const overlay = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x000000,
      0.72,
    );

    overlay.setOrigin(0, 0);
    overlay.setDepth(800);
    overlay.setScrollFactor(0);

    const result = this.add.text(main_width / 2, main_height / 2, text, {
      fontFamily: "DogicaBold",
      fontSize: "52px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 7,
    });

    result.setOrigin(0.5);
    result.setDepth(801);
    result.setScrollFactor(0);

    this.showMessage("");

    this.time.delayedCall(1200, async () => {
      if (playerWon) {
        // new/FLOOR 2 battsles uese thi
        if (this.battleReturnScene) {
          this.scene.start(this.battleReturnScene, this.battleReturnData || {});
          return;
        }

        // OLD FIRST STORY BATTLE uses this.
        if (this.thisFirstTime()) {
          await recordFirstBattleWin();

          this.scene.start("PostFirstBattle");

          this.scene.bringToTop("KnowledgeLogOverlay");
          this.scene.bringToTop("PauseMenuOverlay");
          this.scene.bringToTop("SettingsOverlay");

          this.scene.bringToTop("InventoryIconOverlay");
          this.scene.bringToTop("InventoryOverlay");

          return;
        }
      }

      if (!playerWon) {
        // NEW/FLOOR 2 losses use this.
        if (this.battleLoseScene) {
          this.scene.start(this.battleLoseScene, this.battleLoseData || {});
          return;
        }

        if (this.thisFirstTime()) {
          await resetForFirstBattleDefeat();

          this.scene.start("IdCard");

          this.scene.bringToTop("KnowledgeLogOverlay");
          this.scene.bringToTop("PauseMenuOverlay");
          this.scene.bringToTop("SettingsOverlay");
          this.scene.bringToTop("InventoryIconOverlay");
          this.scene.bringToTop("InventoryOverlay");

          return;
        }
      }
    });
  }

  playBattleResultFade(text) {
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
      blackScreen.setDepth(999999);
      blackScreen.setScrollFactor(0);
      blackScreen.setAlpha(0);

      const resultText = this.add.text(main_width / 2, main_height / 2, text, {
        fontFamily: "DogicaBold",
        fontSize: "42px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 7,
        align: "center",
      });

      resultText.setOrigin(0.5);
      resultText.setDepth(1000000);
      resultText.setScrollFactor(0);
      resultText.setAlpha(0);

      this.tweens.add({
        targets: blackScreen,
        alpha: 1,
        duration: 650,
        ease: "Cubic.In",
        onComplete: () => {
          this.tweens.add({
            targets: resultText,
            alpha: 1,
            duration: 260,
            ease: "Cubic.Out",
            onComplete: () => {
              this.time.delayedCall(1700, resolve);
            },
          });
        },
      });
    });
  }

  blackSwipeWipeWipeWipe() {
    this.blackReveal = this.add.rectangle(
      0,
      main_height,
      main_width,
      main_height,
      0x000000,
      1,
    );

    this.blackReveal.setOrigin(0, 1);
    this.blackReveal.setDepth(9999);

    this.blackReveal.setScrollFactor(0);

    this.tweens.add({
      targets: this.blackReveal,
      y: 0,
      displayHeight: 0,
      duration: 220,
      ease: "Cubic.Out",
      onComplete: () => {
        this.blackReveal.destroy();
      },
    });
  }
}
