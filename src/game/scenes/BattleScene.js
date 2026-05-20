import Phaser, { Scene } from "phaser";
import { mobs } from "../mob_data";
import { characters, chapterTeams } from "../character_data";
import {
  battleWeapons,
  battleConsumables,
  battleArmors,
} from "../battle_item_data";
import { getBattleArea } from "../battle_area_data";
import { loadGameData, saveGameData, resetForFirstBattleDefeat } from "../db";

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

  playSkillVisualEffect(skill, targetDisplay, outcome = null) {
    // no outcome by dewfault
    if (!skill) {
      return;
    }

    if (!skill.effectId) {
      return;
    }

    // actual outcome vals
    let healAmount = skill.heal || 0;
    let staminaAmount = skill.staminaRecover || 0;

    if (outcome) {
      healAmount = outcome.heal || healAmount;
      staminaAmount = outcome.staminaRecover || staminaAmount;
    }

    BattleEffects.play(this, skill.effectId, targetDisplay, {
      heal: healAmount,
      staminaRecover: staminaAmount,
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

    return {
      id: `enemy-${mob.id}-${index}`,
      baseId: mob.id,
      team: "enemy",
      name: this.getRandomZombieDisplayName(),
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

    // extra / fallabck / basics in case missings data
    if (skills.length === 0) {
      skills.push({
        id: `${mob.id}_attack`,
        name: "ATTACK",
        description: "Basic enemy attack.",
        staminaCost: 10,
        target: "enemy",
        damage: 10,
        staminaDamage: 5,
        effectId: null,
        attackType: "melee",
        ranged: false,
      });
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

    // THROUGH EVERY SKILL
    enemy.skills.forEach((skill) => {
      const staminaCost = Number(skill.staminaCost || 0);

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

  // Creates both center displays and side/team target displays for every unit.
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

  // Creates the visual container for one unit, including name, status, bars, sprite, and targeting input.
  createUnitDisplay(unit, x, y, mode) {
    const display = {};

    display.mode = mode;
    display.baseX = x;
    display.baseY = y;

    display.root = this.add.container(x, y);
    display.root.setDepth(mode === "center" ? 40 : 38);

    const barW = ui.barcenterW;
    const barH = ui.barcenterH;

    const nameFont = ui.centerNameFont;
    const targetHeight = 300;

    display.barW = barW;
    display.barH = barH;

    // Relative offsets place UI elements above the sprite inside the unit container.
    const statusY = -430;
    const nameY = -392;
    const hpY = -350;
    const stY = -326;

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
      fontSize: mode === "center" ? "11px" : "10px",
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
      fontSize: mode === "center" ? "13px" : "9px",
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
      fontSize: mode === "center" ? "13px" : "9px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    display.stText.setOrigin(0.5);

    // Fall back to the unit icon if the configured battle sprite texture is missing.
    let spriteKey = unit.spriteKey;

    if (!this.textures.exists(spriteKey)) {
      spriteKey = unit.icon;
    }

    display.sprite = this.add.image(0, 0, spriteKey);
    display.sprite.setOrigin(0.5, 1);

    const scale = targetHeight / display.sprite.height;
    display.sprite.setScale(scale);

    display.sprite.setInteractive({ useHandCursor: false });

    // During targeting, hovering a sprite gives pointer feedback and highlights the possible target.
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

  // Safely toggles a unit display container.
  setDisplayVisible(display, visible) {
    if (!display) {
      return;
    }

    display.root.setVisible(visible);
  }

  // Creates the fixed-screen container used for compact left/right rosters.
  sideRosterMaker() {
    this.sideRoot = this.add.container(0, 0);
    this.sideRoot.setDepth(160);
    this.sideRoot.setScrollFactor(0);
    this.sideRoot.setVisible(true);
  }

  // Rebuilds side rosters from current unit state whenever health/active status changes.
  updateSideRosters() {
    this.sideRoot.removeAll(true);

    this.createRosterSide("player", this.playerUnits, 50, 190);
    this.createRosterSide("enemy", this.enemyUnits, main_width - 315, 190);
  }

  // Draws one team's side roster, including active/dead labels and mini resource bars.
  createRosterSide(team, units, startX, startY) {
    const orderedUnits = this.getOrderedRosterUnits(team, units);

    orderedUnits.forEach((unit, index) => {
      const y = startY + index * 88;

      // Active unit is highlighted separately from normal living and dead roster entries.
      const isActive =
        ((team === "player" && this.activePlayerUnit === unit) ||
          (team === "enemy" && this.activeEnemyUnit === unit)) &&
        unit.alive;

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
        const iconY = y + 30;
        const textRightX = iconX - 70;
        const barW = 150;
        const barX = textRightX - barW;

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

  // Shows off-center targetable teammates/enemies only when the camera is on that side view.
  updateTargetTeamDisplays(view) {
    this.playerUnits.forEach((unit) => {
      if (unit.teamDisplay) {
        let show = false;

        if (view === "left") {
          if (unit.alive) {
            if (unit !== this.activePlayerUnit) {
              show = true;
            }
          }
        }

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

  // Refreshes every unit's alive/dead state, bars, rosters, and active-unit references.
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

  // Builds a colored bottom-bar sentence describing a skill action.
  showSkillActionMessage(user, skill, target) {
    this.bottomRoot.setVisible(true);
    this.bottomRoot.removeAll(true);

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

      x += part.width + 8;
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

  // Applies health-based unit state changes and refreshes that unit's displays.
  updateUnitVisual(unit) {
    // Death clears combat-only statuses and fades the unit display.
    if (unit.hp <= 0) {
      unit.hp = 0;
      unit.stamina = 0;
      unit.alive = false;
      unit.intent = null;
      unit.exhausted = false;
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

  // Updates HP/stamina bar widths, numeric labels, and visible status text for one display.
  updateDisplayBars(unit, display) {
    if (!display) {
      return;
    }

    const hpRatio = Math.max(0, unit.hp) / unit.maxHp;
    const staminaRatio = Math.max(0, unit.stamina) / unit.maxStamina;

    display.hpFill.displayWidth = display.barW * hpRatio;
    display.stFill.displayWidth = display.barW * staminaRatio;

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

    // Enemy center/target displays reveal their intended target so the player can plan around it.
    if (unit.team === "enemy") {
      if (display === unit.centerDisplay || this.currentView === "right") {
        this.ensureEnemyIntent(unit);

        if (unit.intent) {
          const target = this.getUnitById(unit.intent.targetId);

          if (target) {
            display.statusText.setText(`ATTACKING ${target.name}`);
          }
        }
      }
    }
    this.refreshDisplayStatusIcons(unit, display);
  }

  // Placeholder for future status icons; currently clears any existing icon.
  refreshDisplayStatusIcons(unit, display) {
    if (!display) {
      return;
    }

    if (display.statusIcon) {
      display.statusIcon.destroy();
      display.statusIcon = null;
    }
  }

  // Placeholder for side-roster bleed icons; currently disabled.
  addSideBleedIcon(unit, x, y) {
    return null;
  }

  // Visually dims a dead unit display.
  fadeDeadDisplay(display) {
    if (!display) {
      return;
    }

    display.root.setAlpha(0.35);
    display.sprite.clearTint(0x666666);
  }

  // Swaps the active center unit for a team, optionally sliding the old/new displays in and out.
  showCenterUnit(unit, team, animate) {
    if (!unit) {
      return;
    }

    const display = unit.centerDisplay;

    if (!display) {
      return;
    }

    // Player and enemy center slots animate in opposite horizontal directions.
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

  // Builds alternating player/enemy turn order, sorted by each side's speed.
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

    // The fastest unit between the two sides decides which side starts the alternating order.
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

  // Clears legacy turn-order text; the current UI draws turn order inside the bottom panel.
  makeListofturnOrders() {
    if (this.turnOrderText) {
      this.turnOrderText.destroy();
      this.turnOrderText = null;
    }
  }

  // Chooses an enemy's intended target while avoiding the same target twice when possible.
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

    enemy.lastTargetId = target.id;
    return target;
  }

  // Inserts any earned extra player turns directly after that unit's normal turn.
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

  // Lazily creates an enemy intent if one is missing and there are valid player targets.
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

    const alivePlayers = this.getAlivePlayers();

    if (!alivePlayers || alivePlayers.length === 0) {
      return;
    }

    const enemyIndex = this.enemyUnits.indexOf(enemy);
    const target = this.chooseEnemyIntentTarget(
      enemy,
      enemyIndex,
      alivePlayers,
    );

    enemy.intent = {
      skill: this.getEnemyChosenSkill(enemy),
      targetId: target ? target.id : null,
    };
  }

  // Preselects each living enemy's skill and target for the upcoming round.
  whoEnemyGonnaKill() {
    const alivePlayers = this.getAlivePlayers();

    this.enemyUnits.forEach((enemy, index) => {
      if (enemy.alive) {
        const skill = this.getEnemyChosenSkill(enemy);
        const target = this.chooseEnemyIntentTarget(enemy, index, alivePlayers);

        enemy.intent = {
          skill,
          targetId: target ? target.id : null,
        };
      }
    });
  }

  // Advances battle flow to the next living unit, starts new rounds, and hands control to player/enemy logic.
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

    // When everyone has acted, begin a new round and refresh stamina, intents, and turn order.
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

    // Apply statuses that activate exactly at the start of this unit's turn.
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

      // Exhausted units lose their action and recover stamina instead.
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

  // Gives all living units a small stamina recovery at the end of each round.
  recoverAllUnitsAtRoundEnd() {
    this.allUnits.forEach((unit) => {
      if (unit.alive) {
        unit.stamina = Math.min(unit.maxStamina, unit.stamina + 8);
      }
    });
  }

  // Clears previous highlights and tints the unit whose turn is active.
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

  // Shows the player's available actions for the active unit.
  showPlayerTurn(unit) {
    this.showMessage("");
    this.drawBottomBarForUnit(unit);
  }

  // Executes an enemy turn using its stored intent, with fallbacks for invalid/dead targets.
  runEnemyTurn(enemy) {
    if (!enemy.intent) {
      const alivePlayers = this.getAlivePlayers();
      const target = this.chooseEnemyIntentTarget(enemy, 0, alivePlayers);

      enemy.intent = {
        skill: this.getEnemyChosenSkill(enemy),
        targetId: target ? target.id : null,
      };
    }

    const skill = enemy.intent.skill;
    let target = this.getUnitById(enemy.intent.targetId);

    if (!target) {
      target = this.getLowestHpAlivePlayer();
    }

    if (!target) {
      this.endTurn();
      return;
    }

    if (!target.alive) {
      target = this.getLowestHpAlivePlayer();
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

    // If the enemy cannot afford its chosen skill, it spends the turn recovering instead.
    if (enemy.stamina < skill.staminaCost) {
      enemy.stamina = Math.min(enemy.maxStamina, enemy.stamina + 30);
      this.showMessage(`${enemy.name} is too tired and recovers stamina.`);
      enemy.intent = null;
      this.updateAllUnitVisuals();

      this.time.delayedCall(850, () => {
        this.endTurn();
      });

      return;
    }

    // Move the camera to whichever panel contains the chosen target before animating the skill.
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

  // Slides the camera and bottom UI between center, ally-targeting, and enemy-targeting views.
  slideToView(view, onComplete, duration = 300) {
    let targetScroll = scroll_cam.center;

    if (view === "left") {
      targetScroll = scroll_cam.left;
    }

    if (view === "right") {
      targetScroll = scroll_cam.right;
    }

    this.currentView = view;

    // Side rosters are only shown in the main center view so target views stay uncluttered.
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

  // Creates the container that holds player action buttons and battle messages.
  makeBarOnBottom() {
    this.bottomRoot = this.add.container(worldthing.center, 0);
    this.bottomRoot.setDepth(500);
    this.bottomRoot.setVisible(false);
  }

  // Hides and clears action UI plus any open popups/tooltips.
  hideBottomBar() {
    this.bottomRoot.setVisible(false);
    this.bottomRoot.removeAll(true);
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
  }

  // Draws all available player actions for the current unit: skills, rest, weapons, and bag.
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

    // Character skills are shown as large action buttons.
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

    // Rest is represented as a normal self-targeting skill object so it can reuse skill flow.
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
        staminaRecover: 35,
      };

      this.beginSkillTarget(unit, restSkill);
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

    // Equipped weapons open a popup of weapon-specific skills.
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

  // Returns living units sorted by speed; useful for predicting future order.
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

  // Gets the next few living units after the current turn, wrapping into a simulated next round if needed.
  getUpcomingTurnUnits(count) {
    const upcoming = [];

    for (let i = this.turnIndex + 1; i < this.turnOrder.length; i += 1) {
      const unit = this.turnOrder[i];

      if (unit) {
        if (unit.alive) {
          upcoming.push(unit);
        }
      }

      if (upcoming.length >= count) {
        return upcoming;
      }
    }

    // Temporarily recalculate next round order, then restore the real current order afterward.
    const savedTurnOrder = this.turnOrder;
    const savedTurnIndex = this.turnIndex;

    this.whichTurnNow();

    this.turnOrder.forEach((unit) => {
      if (upcoming.length < count) {
        if (unit.alive) {
          upcoming.push(unit);
        }
      }
    });

    this.turnOrder = savedTurnOrder;
    this.turnIndex = savedTurnIndex;

    return upcoming;
  }

  // Draws the small bottom-right panel that previews upcoming turns.
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
        "Turn order decides who goes next. It is affected by speed.",
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

  // Replaces the bottom action UI with a single battle narration message.
  showBattleActionMessage(message) {
    this.bottomRoot.setVisible(true);
    this.bottomRoot.removeAll(true);

    // Keeps the bottom message locked to the current camera view.
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

  // Replaces the bottom action UI with instructions for choosing a target.
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

  // Creates the bag button, using an icon when available and text fallback otherwise.
  makeInventoryButton(x, y, w, h) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    if (this.textures.exists("classroom-bag")) {
      const icon = this.add.image(0, 0, "classroom-bag");
      icon.setOrigin(0.5);
      icon.setScale(46 / icon.height);
      objects.push(icon);
    } else {
      const text = this.add.text(0, 0, "BAG", {
        fontFamily: "DogicaBold",
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      });
      text.setOrigin(0.5);
      objects.push(text);
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

  // Creates a reusable rectangular bottom-bar button with hover styling.
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

    text.setOrigin(0.5);

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

    root.add([bg, text, hit]);
    this.bottomRoot.add(root);

    return {
      root,
      bg,
      text,
      hit,
    };
  }

  // Creates a weapon icon button that opens that weapon's skill list.
  makeWeaponButton(x, y, w, h, weapon) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    if (weapon.icon) {
      if (this.textures.exists(weapon.icon)) {
        const icon = this.add.image(0, 0, weapon.icon);
        icon.setOrigin(0.5);
        icon.setScale(48 / icon.height);
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

  // Creates an invisible full-screen click zone behind popups so outside clicks close them.
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

  // Destroys the outside-click popup closer if it exists.
  clearPopupCloseZone() {
    if (this.popupCloseZone) {
      this.popupCloseZone.destroy();
      this.popupCloseZone = null;
    }
  }

  // Opens a popup listing the selected weapon's skills.
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

      this.skillPopup.add([btn, label, hit]);
    });
  }

  // Creates one consumable inventory slot with icon, quantity label, and input zone.
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

  // Opens a grid popup of usable consumables from the battle inventory snapshot.
  showConsumablePopup(unit, x) {
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();
    this.createPopupCloseZone();

    const items = this.getConsumableEntries();

    const slotSize = 70;
    const gap = 12;

    // Grid size adapts to the number of items but caps at five columns.
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

  // Keeps popups horizontally inside the visible viewport.
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

  // Normalizes saved consumables into consistent { id, qty } entries.
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

  // Starts skill targeting, auto-selecting the target when there is only one valid option.
  beginSkillTarget(user, skill) {
    this.clearSkillPopup();
    this.clearConsumablePopup();
    this.clearTooltip();

    // Prevent the action before entering target mode if the user cannot pay the stamina cost.
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
      const aliveEnemies = this.getAliveEnemies();

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
      const alivePlayers = this.getAlivePlayers();

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

  // Converts a consumable item into a temporary skill-like object and starts ally targeting.
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
      staminaRecover: item.staminaRecover || 0,
      effectId: item.effectId || null,
      staminaRecoverPercent: item.staminaRecoverPercent || 0,
      extraTurnNextRound: item.extraTurnNextRound || false,
      overexertNextTurn: item.overexertNextTurn || false,
      baitNextRound: item.baitNextRound || false,
      consumableId: item.id,
    };

    const alivePlayers = this.getAlivePlayers();

    if (alivePlayers.length === 1) {
      this.tryUseSelectedSkillOn(alivePlayers[0]);
      return;
    }

    this.showMessage("");
    this.showTargetPrompt(`Choose a survivor to use ${item.name} on.`);
    this.slideToView("left");
  }

  // Validates the clicked target, runs the selected skill, and ends the active unit's turn.
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

    // Run the actual skill after the camera is showing the correct target panel.
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

  // Decides which camera view contains the target being acted on.
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

  // Returns the display currently visible for a unit based on active center slots and side views.
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

  // Chooses whether a skill should use melee movement animation or resolve in place.
  performSkillWithAnimation(user, skill, target, enemyUsed, onComplete) {
    // Only damaging, non-ranged skills move the attacker across the screen.
    const hasDamage =
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

    const shouldMove = hasDamage && !ranged;

    const userDisplay = this.getVisibleDisplayForUnit(user);
    const targetDisplay = this.getVisibleDisplayForUnit(target);

    if (!shouldMove) {
      const outcome = this.useSkill(user, skill, target, enemyUsed);

      if (outcome) {
        this.playSkillVisualEffect(skill, targetDisplay, outcome);
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

  // Moves the attacker toward the target, resolves the skill at impact time, then returns them.
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
            this.playSkillVisualEffect(skill, targetDisplay);
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

  // Shows a temporary falling damage number near the target display.
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

  // Plays damage feedback: floating damage text, white flash, knockback, and tilt.
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

  // Applies the actual gameplay effects of a skill: cost, damage, healing, shields, items, and status flags.
  useSkill(user, skill, target, enemyUsed) {
    const staminaCost = Number(skill.staminaCost || 0);

    // Some consumables mark the target to pay future stamina costs with HP next turn.
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
        staminaRecover: 0,
        overexert: true,
      };
    }

    // Overexertion converts this skill's stamina cost into HP cost, but never kills the user directly.
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

    // Shield effects store reduction and hit count on the target, then finish without damage.
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
        staminaRecover: 0,
        shield: true,
      };
    }

    // Damage is based on skill damage, user damage, target defense, reductions, and shields.
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

    // Stamina damage can exhaust a target, causing it to lose its next action.
    const staminaDamage = Number(skill.staminaDamage || 0);

    if (staminaDamage > 0) {
      target.stamina -= staminaDamage;

      if (target.stamina <= 0) {
        target.stamina = 0;
        target.exhausted = true;
      }
    }

    // Track actual restored values after caps so visual effects can show accurate results.
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

    const staminaRecover = Number(skill.staminaRecover || 0);

    if (staminaRecover > 0) {
      const beforeStamina = target.stamina;

      target.stamina += staminaRecover;

      if (target.stamina > target.maxStamina) {
        target.stamina = target.maxStamina;
      }

      actualStaminaRecover = target.stamina - beforeStamina;
    }

    const staminaRecoverPercent = Number(skill.staminaRecoverPercent || 0);

    if (staminaRecoverPercent > 0) {
      const beforeStamina = target.stamina;
      const amount = Math.ceil(target.maxStamina * staminaRecoverPercent);

      target.stamina += amount;

      if (target.stamina > target.maxStamina) {
        target.stamina = target.maxStamina;
      }

      actualStaminaRecover += target.stamina - beforeStamina;
    }

    if (skill.extraTurnNextRound) {
      target.extraTurnNextRound = true;
    }

    // Bait forces enemies to target this unit for the next round.
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
      staminaRecover: actualStaminaRecover,
    };
  }
  // Rewrites all living enemy intents so they attack the provided bait target.
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
  // Activates delayed status flags at the beginning of a unit's turn.
  applyStartOfTurnEffects(unit) {
    if (!unit) {
      return;
    }

    if (unit.overexertNextTurn) {
      unit.overexertNextTurn = false;
      unit.overexertActive = true;
    }
  }
  // Removes one consumable use from the temporary battle inventory.
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

  // Saves updated consumable quantities back to persistent game data after victory.
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
      console.warn("Could not commit battle consumables.", error);
    });
  }

  // Clears the active skill/user selection after the action completes or is cancelled.
  clearSelectedSkill() {
    this.selectedSkill = null;
    this.selectedUser = null;
  }

  // Closes the weapon skill popup and its outside-click close zone.
  clearSkillPopup() {
    if (this.skillPopup) {
      this.skillPopup.destroy(true);
      this.skillPopup = null;
    }

    this.clearPopupCloseZone();
  }

  // Closes the consumable popup and its outside-click close zone.
  clearConsumablePopup() {
    if (this.consumablePopup) {
      this.consumablePopup.destroy(true);
      this.consumablePopup = null;
    }

    this.clearPopupCloseZone();
  }

  // Shows a fixed-screen tooltip, clamped upward so it does not collide with the bottom bar.
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

  // Destroys the current tooltip if one is open.
  clearTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy(true);
      this.tooltip = null;
    }
  }

  // Creates the small top-center message area used for warnings and short combat messages.
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

  // Updates the top-center message and hides its background when the message is empty.
  showMessage(message) {
    if (this.messageText) {
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

  // Returns living player units.
  getAlivePlayers() {
    const alive = [];

    this.playerUnits.forEach((unit) => {
      if (unit.alive) {
        alive.push(unit);
      }
    });

    return alive;
  }

  // Returns living enemy units.
  getAliveEnemies() {
    const alive = [];

    this.enemyUnits.forEach((unit) => {
      if (unit.alive) {
        alive.push(unit);
      }
    });

    return alive;
  }

  // Finds the living player with the lowest HP for enemy fallback targeting.
  getLowestHpAlivePlayer() {
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

  // Finds the first living player in team order.
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

  // Finds the first living enemy in team order.
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

  // Resolves an enemy intent's stored target id back into the live unit object.
  getEnemyIntentTarget(enemy) {
    if (!enemy) {
      return null;
    }

    if (!enemy.intent) {
      return null;
    }

    return this.getUnitById(enemy.intent.targetId);
  }

  // Finds any battle unit by its unique battle id.
  getUnitById(id) {
    let found = null;

    this.allUnits.forEach((unit) => {
      if (unit.id === id) {
        found = unit;
      }
    });

    return found;
  }

  // Ends the current unit's turn, clears UI state, checks for battle end, and schedules the next turn.
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

    this.time.delayedCall(250, () => {
      this.startNextTurn();
    });
  }

  // Checks whether either team has been wiped out and triggers the correct end sequence.
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
      this.playerDIES();
      return true;
    }

    if (!enemyAlive) {
      this.endBattle(true);
      return true;
    }

    return false;
  }

  // Displays the battle result overlay and persists consumable usage if the player won.
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
  }

  // Plays a short black-screen wipe reveal at battle start.
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

