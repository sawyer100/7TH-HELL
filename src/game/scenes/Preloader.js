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
    this.load.svg(
      "credits-page-logo",
      "scenes/title-screen/team-logo.svg",
    );
  }

  create() {
    // after everything loaded, move to main menu
    this.scene.start("MainMenu");
  }
}
