import { Scene } from "phaser";
import { loadGameData } from "../db";

const main_width = 1600;

export class InventoryIconOverlay extends Scene {
  constructor() {
    super("InventoryIconOverlay");
  }

  create() {
    this.inventoryUnlocked = false;
    this.knowledgeUnlocked = false;

    this.checkTimeThrottle = 0;

    this.iconRoot = this.add.container(0, 0);
    this.iconRoot.setDepth(999500);

    this.inventoryIcon = this.makeTopRightIcon({
      x: main_width - 86,
      y: 70,
      key: "classroom-bag",
      size: 64,
      onClick: () => {
        const inventoryScene = this.scene.get("InventoryOverlay");

        if (inventoryScene) {
          inventoryScene.toggleInventory();
        }
      },
    });

    this.knowledgeIcon = this.makeTopRightIcon({
      x: main_width - 176,
      y: 70,
      key: "knowledge-brain",
      size: 64,
      onClick: () => {
        const knowledgeScene = this.scene.get("KnowledgeLogOverlay");

        if (knowledgeScene) {
          knowledgeScene.toggle();
        }
      },
    });

    this.iconRoot.add([
      this.inventoryIcon.image,
      this.inventoryIcon.hit,
      this.knowledgeIcon.image,
      this.knowledgeIcon.hit,
    ]);

    this.checkUnlocks();
  }

  makeTopRightIcon(config) {
    const image = this.add.image(config.x, config.y, config.key);
    image.setOrigin(0.5);

    const iconScale = config.size / image.height;
    image.setScale(iconScale);
    image.setVisible(false);

    const hit = this.add.zone(config.x, config.y, 96, 96);
    hit.setOrigin(0.5);
    hit.disableInteractive();

    hit.on("pointerover", () => {
      if (!image.visible) {
        return;
      }

      image.setAlpha(0.75);
      this.input.setDefaultCursor("pointer");
    });

    hit.on("pointerout", () => {
      if (!image.visible) {
        return;
      }

      image.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    hit.on("pointerdown", () => {
      if (!image.visible) {
        return;
      }

      if (config.onClick) {
        config.onClick();
      }
    });

    return {
      image,
      hit,
    };
  }

  update(time) {
    if (time - this.checkTimeThrottle > 500) {
      this.checkTimeThrottle = time;
      this.checkUnlocks();
    }

    this.updVis();
  }

  async checkUnlocks() {
    try {
      const data = await loadGameData();

      this.inventoryUnlocked = !!data.inventoryUnlocked;
      this.knowledgeUnlocked = !!data.knowledgeLogUnlocked;
    } catch (error) {
      this.inventoryUnlocked = false;
      this.knowledgeUnlocked = false;
    }
  }

  updVis() {
    let baseAllowed = true;

    const activeScenes = this.scene.manager.getScenes(true);

    for (let i = 0; i < activeScenes.length; i += 1) {
      const scene = activeScenes[i];
      const key = scene.scene.key;

      if (key === "MainMenu") {
        baseAllowed = false;
      }

      if (key === "IntroductionPotion") {
        baseAllowed = false;
      }

      if (key === "IdCard") {
        baseAllowed = false;
      }

      if (key === "FightScene") {
        baseAllowed = false;
      }

      if (key === "BattleScene") {
        baseAllowed = false;
      }

      if (key === "PauseMenuOverlay" && scene.isOpen) {
        baseAllowed = false;
      }

      if (key === "SettingsOverlay" && scene.isOpen) {
        baseAllowed = false;
      }

      if (key === "InventoryOverlay" && scene.isOpen) {
        baseAllowed = false;
      }

      if (key === "KnowledgeLogOverlay" && scene.isOpen) {
        baseAllowed = false;
      }
    }

    this.setIconVisible(
      this.inventoryIcon,
      baseAllowed && this.inventoryUnlocked,
    );
    this.setIconVisible(
      this.knowledgeIcon,
      baseAllowed && this.knowledgeUnlocked,
    );
  }

  setIconVisible(icon, visible) {
    icon.image.setVisible(visible);

    if (visible) {
      icon.hit.setInteractive({ useHandCursor: false });
    } else {
      icon.hit.disableInteractive();
      icon.image.setAlpha(1);
    }
  }
}
