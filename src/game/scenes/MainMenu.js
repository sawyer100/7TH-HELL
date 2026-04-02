import { Scene } from "phaser";

// create main menu as a scene
export class MainMenu extends Scene {
  // call this the MainMenu so phaser knows how to identify it
  constructor() {
    super("MainMenu");
  }

  //create method runs when the scene starts and all needed assets for it are already loaded
  create() {
    this.background = this.add.image(0, 0, "background").setOrigin(0, 0);

    this.logo = this.add.image(0, 0, "logo").setOrigin(0.5);

    this.titleText = this.add
      .text(0, 0, "Main Menu", {
        fontFamily: "Arial Black",
        fontSize: 38,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    // this method places / resizes things based on ur screen size
    this.layout();

    // checks if screen gets resized and updates with layout()
    this.scale.on("resize", this.layout, this);

    // remove the listner for screen resizing after you exit the scene (cleanup)
    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layout, this);
    });

    //starts the game when the player clicks
    this.input.once("pointerdown", () => {
      //switches to the scene Game
      this.scene.start("Game");
    });
  }

  layout() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.background.setDisplaySize(width, height);

    this.logo.setPosition(width * 0.5, height * 0.35);

    this.titleText.setPosition(width * 0.5, height * 0.6);
  }
}
