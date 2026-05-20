import { Scene } from "phaser";

//make sure we get all the assets before we start game, put them in preloader
export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    this.load.setPath("assets");
    // pause button
    this.load.image("pause-button", "scenes/other/pause-button.png");

    // TITLE SCENE
    // design extraas
    this.load.image("title-line-design", "scenes/title-screen/line-design.png");

    //alarm design
    this.load.image("alarm-pixel", "scenes/title-screen/alarm-pixel.png");

    //title logo title scene
    this.load.image("title-logo", "scenes/title-screen/logo.png");

    // hallway background
    this.load.image("title-hallway", "scenes/title-screen/hallway.png");
    // shadow gradient
    this.load.image("title-gradient", "scenes/title-screen/gradient.png");
    //border
    this.load.image("title-border", "scenes/title-screen/border.png");

    // button background (title scene) & hover
    this.load.image("title-button-bg", "scenes/title-screen/button-bg.png");
    this.load.image(
      "title-button-bg-hover",
      "scenes/title-screen/button-bg-hover.png",
    );

    // about + credits overlay
    this.load.image(
      "page-overlay-pattern",
      "scenes/title-screen/color-pattern.png",
    );
    this.load.svg("credits-page-logo", "scenes/title-screen/team-logo.svg");

    //MOBS
    //MOBS
    //MOBS
    //MOBS
    // KNOWLEDGE LOG - WALKER
    this.load.image("knowledge-walker-icon", "monsters/walker/icon.png");
    this.load.image("knowledge-walker-front", "monsters/walker/front.png");
    this.load.image("knowledge-walker-right", "monsters/walker/right.png");
    this.load.image("knowledge-walker-back", "monsters/walker/back.png");
    this.load.image("knowledge-walker-left", "monsters/walker/left.png");

    // KNOWLEDGE LOG - RUNNER
    this.load.image("knowledge-runner-icon", "monsters/runner/icon.png");
    this.load.image("knowledge-runner-front", "monsters/runner/front.png");
    this.load.image("knowledge-runner-right", "monsters/runner/right.png");
    this.load.image("knowledge-runner-back", "monsters/runner/back.png");
    this.load.image("knowledge-runner-left", "monsters/runner/left.png");

    // KNOWLEDGE LOG - BRUTE
    this.load.image("knowledge-brute-icon", "monsters/brute/icon.png");
    this.load.image("knowledge-brute-front", "monsters/brute/front.png");
    this.load.image("knowledge-brute-right", "monsters/brute/right.png");
    this.load.image("knowledge-brute-back", "monsters/brute/back.png");
    this.load.image("knowledge-brute-left", "monsters/brute/left.png");

    // KNOWLEDGE LOG - BOSS
    this.load.image("knowledge-boss-icon", "monsters/boss/icon.png");
    this.load.image("knowledge-boss-front", "monsters/boss/front.png");
    this.load.image("knowledge-boss-right", "monsters/boss/right.png");
    this.load.image("knowledge-boss-back", "monsters/boss/back.png");
    this.load.image("knowledge-boss-left", "monsters/boss/left.png");

    // knowedlge log UI
    this.load.image(
      "knowledge-header-pattern",
      "scenes/knowledge-log/header-pattern.png",
    );

    this.load.image("knowledge-brain", "scenes/knowledge-log/brain.png");

    this.load.image(
      "knowledge-header-box",
      "scenes/knowledge-log/header-box.png",
    );

    // INTRODUCTION POTION SCENE
    this.load.image(
      "intro-potion-character",
      "scenes/introductionpotion/character.png",
    );

    this.load.image(
      "intro-potion-potion",
      "scenes/introductionpotion/potion.png",
    );

    this.load.image("dialogue-box", "scenes/other/dialogue-box.png");

    // DIALOGUE
    this.load.json(
      "dialogue-introduction-potion",
      "dialogues/introductionpotion/dialogue.json",
    );

    // ID CARD SCENE
    this.load.image(
      "id-card-card-background",
      "scenes/id-card/card-background.png",
    );
    this.load.image("id-card-card", "scenes/id-card/id-card.png");
    this.load.image("id-card-door-open", "scenes/id-card/door-open.png");
    this.load.image("id-card-background", "scenes/id-card/background.png");
    this.load.image("id-card-full-door", "scenes/id-card/full-door.png");
    this.load.image("id-card-door-open", "scenes/id-card/door-open.png");
    this.load.image("id-card-locker", "scenes/id-card/locker.png");
    this.load.image("id-card-kim", "scenes/id-card/kim.png");
    this.load.image("id-card-meryl", "scenes/id-card/meryl.png");

    // FIGHT CPOST HALLWAY IMAGES
    this.load.image(
      "background-center",
      "scenes/id-card/background-center.png",
    );
    this.load.image("background-left", "scenes/id-card/background-left.png");
    this.load.image("background-right", "scenes/id-card/background-right.jpg");

    this.load.json("dialogue-id-card", "dialogues/id-card/dialogue.json");

    // CLASSROOM SCENE
    this.load.image("classroom-bag", "scenes/classroom/bag.png");
    this.load.image(
      "classroom-inventory-unlocked",
      "scenes/classroom/inventory-unlocked.png",
    );

    this.load.json("dialogue-classroom", "dialogues/classroom/dialogue.json");

    //dialogue icons top
    this.load.image("classroom-kim-icon", "scenes/classroom/kim-icon.png");
    this.load.image("classroom-meryl-icon", "scenes/classroom/meryl-icon.png");

    // agro / hositle icon
    this.load.image("agro-icon", "scenes/other/agro.png");

    /// fihtt
    this.load.image("versus-v", "scenes/fight-scene/versus-v.png");
    this.load.image("versus-s", "scenes/fight-scene/versus-s.png");
    this.load.image(
      "fight-opening-background",
      "scenes/fight-scene/fight-opening-background.png",
    );

    /// WEPAONS / OTHER ITEMS
    this.load.image("item-baton", "items/item-baton.png");
    this.load.image("item-gun", "items/item-gun.png");
    this.load.image("item-healing-potion", "items/healing-potion.png");

    this.load.image("item-bandage", "items/bandage.png");

    // SKILL EFFECTS
    this.load.image("effect-zombie-maul", "skill-effects/maul.png");
    this.load.image("effect-shield", "skill-effects/shield.png");

    ///
    this.load.image("item-adrenaline-shot", "items/item-adrenaline-shot.png");
    this.load.image("item-baton", "items/item-baton.png");
    this.load.image("item-bike-helmet", "items/item-bike-helmet.png");
    this.load.image("item-crow-bar", "items/item-crow-bar.png");
    this.load.image("item-energy-drink", "items/item-energy-drink.png");
    this.load.image("item-gun", "items/item-gun.png");
    this.load.image("item-pocket-knife", "items/item-pocket-knife.png");
    this.load.image("item-whistle", "items/item-whistle.png");

    this.load.image("item-onigiri", "items/item-onigiri.png");
    this.load.image("item-energy-bar", "items/item-energy-bar.png");
    // STATUS EFFECT ICON
    this.load.image("status-bleeding", "items/status-bleeding.png");
  }

  create() {
    // STAY ALIVEE ALL THE TIME, NOT REPLACING THE MAIN MENU!
    this.scene.launch("KnowledgeLogOverlay");
    this.scene.launch("PauseMenuOverlay");
    this.scene.launch("InventoryIconOverlay");
    this.scene.launch("SettingsOverlay");
    this.scene.launch("InventoryOverlay");
    this.scene.bringToTop("KnowledgeLogOverlay");
    this.scene.bringToTop("PauseMenuOverlay");
    this.scene.bringToTop("SettingsOverlay");
    this.scene.bringToTop("InventoryIconOverlay");
    this.scene.bringToTop("InventoryOverlay");

    // after everything loaded, move to main menu
    this.scene.start("MainMenu");
  }
}
