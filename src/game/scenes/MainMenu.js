import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

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

    this.layout();

    this.scale.on("resize", this.layout, this);

    this.events.once("shutdown", () => {
      this.scale.off("resize", this.layout, this);
    });

    this.input.once("pointerdown", () => {
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
