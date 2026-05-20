import { Scene } from "phaser";
import { loadGameData } from "../db";

const main_width = 1600;

export class InventoryIconOverlay extends Scene {
  constructor() {
    super("InventoryIconOverlay");
  }

  create() {
    this.inventoryUnlocked = false;

    // makes sure dont check loadGameData all the time
    this.checkTimeThrottle = 0;

    this.iconRoot = this.add.container(0, 0);

    this.iconRoot.setDepth(999500);

    this.iconRoot.setVisible(false);

    this.iconImage = this.add.image(main_width - 86, 70, "classroom-bag");
    this.iconImage.setOrigin(0.5);

    // display ehigth 64px
    const bagScale = 64 / this.iconImage.height;
    this.iconImage.setScale(bagScale);

    this.iconHit = this.add.zone(main_width - 86, 70, 96, 96);
    this.iconHit.setOrigin(0.5);

    this.iconRoot.add([this.iconImage, this.iconHit]);

    this.iconHit.on("pointerover", () => {
      // no hover effects when hiddedn icon
      if (!this.iconRoot.visible) {
        return;
      }

      this.iconImage.setAlpha(0.75);

      this.input.setDefaultCursor("pointer");
    });

    this.iconHit.on("pointerout", () => {
      if (!this.iconRoot.visible) {
        return;
      }

      this.iconImage.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    this.iconHit.on("pointerdown", () => {
      // doenst work when  not viislbde
      if (!this.iconRoot.visible) {
        return;
      }

      const inventoryScene = this.scene.get("InventoryOverlay");

      // OPEN INVENTORY MENU
      if (inventoryScene) {
        inventoryScene.toggleInventory();
      }
    });

    this.checkIfInvUnlock();
  }

  update(time) {
    if (time - this.checkTimeThrottle > 500) {
      this.checkTimeThrottle = time;
      this.checkIfInvUnlock();
    }

    // Visibility depends not only on unlock status, but also on other active scenes.
    this.updVis();
  }

  async checkIfInvUnlock() {
    try {
      const data = await loadGameData();

      if (data) {
        if (data.inventoryUnlocked) {
          this.inventoryUnlocked = true;
        } else {
          this.inventoryUnlocked = false;
        }
      }
    } catch (error) {
      this.inventoryUnlocked = false;
    }
  }

  updVis() {
    let shouldShow = this.inventoryUnlocked;

    // all scenes on phsaer right now
    const activeScenes = this.scene.manager.getScenes(true);

    for (let i = 0; i < activeScenes.length; i += 1) {
      // tthe scene that you should open it on, and the list of active scenes
      const key = activeScenes[i].scene.key;

      // Hide on scenes where inventory access should not be available.
      if (key === "MainMenu") {
        shouldShow = false;
      }

      if (key === "IntroductionPotion") {
        shouldShow = false;
      }

      if (key === "IdCard") {
        shouldShow = false;
      }

      if (key === "PauseMenuOverlay") {
        const pauseScene = activeScenes[i];

        if (pauseScene.isOpen) {
          shouldShow = false;
        }
      }

      if (key === "SettingsOverlay") {
        const settingsScene = activeScenes[i];

        if (settingsScene.isOpen) {
          shouldShow = false;
        }
      }

      if (key === "FightScene") {
        shouldShow = false;
      }

      if (key === "BattleScene") {
        shouldShow = false;
      }
    }

    this.iconRoot.setVisible(shouldShow);

    if (shouldShow) {
      this.iconHit.setInteractive({ useHandCursor: false });
    } else {
      this.iconHit.disableInteractive();

      this.iconImage.setAlpha(1);
    }
  }
}
