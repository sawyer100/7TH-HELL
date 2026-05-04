import { Scene } from "phaser";

//make sure we get all the assets before we start game, put them in preloader
export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    this.load.setPath("assets");

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
  }

  create() {
    // STAY ALIVEE ALL THE TIME, NOT REPLACING THE MAIN MENU!
    this.scene.launch("KnowledgeLogOverlay");
    this.scene.bringToTop("KnowledgeLogOverlay");
    // after everything loaded, move to main menu
    this.scene.start("MainMenu");
  }
}
