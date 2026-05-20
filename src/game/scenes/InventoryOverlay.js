import { Scene } from "phaser";
import { loadGameData, saveGameData } from "../db";
import { normalizeInventoryData } from "../inventory_utils";
import {
  battleWeapons,
  battleConsumables,
  battleArmors,
} from "../battle_item_data";
import { characters, chapterTeams } from "../character_data";

const main_width = 1600;
const main_height = 900;

// same size as knowedlge
const p_x = 137;

const p_y = 78;

const p_w = 1326;
const p_h = 745;
const slot_size = 82;
const slot_gap = 22;

// taab button start position. x is offset from the panelyes
const tab_x_start = p_x + 70;
const tab_y = p_y + 145;

// top left  starting point for the inventory item grisd
const slot_start_x = p_x + 115;

const slot_start_y = p_y + 255;
const char_list_x = p_x + 650;
const char_list_y = p_y + 125;

const char_list_w = 300;

const char_list_h = 72;

// Cchar placementt
const modelpan_x = p_x + 975;

const modelpan_y = p_y + 125;
const modelpan_w = 295;
const modelpan_h = 480;

export class InventoryOverlay extends Scene {
  constructor() {
    super("InventoryOverlay");
  }

  create() {
    this.isOpen = false;

    // which tab we are on in the inventory menu
    this.currentTab = "weapons";
    this.gameData = null;

    this.selected_Char = null;
    this.selected_Entry = null;

    this.selected_Inv_SlotBG = null;

    this.mouse_over_invSlot = false;

    this.mouse_over_invDetails = false;

    this.detailsCloseTimer = null;

    this.currentt_ActtiveInvBnds = null;

    this.currentt_DetailBnds = null;

    this.root = this.add.container(0, 0);
    this.root.setDepth(999900);
    this.root.setVisible(false);

    this.createBaseGui();

    this.input.keyboard.on("keydown-ESC", () => {
      if (this.isOpen) {
        // console.log("reuherthw test test test")
        this.registry.set("blockPauseFrame", this.game.loop.frame);
        this.closeInventory();
      }
    });
  }

  async openInventory() {
    try {
      const data = await loadGameData();
      this.gameData = normalizeInventoryData(data || {}); //safetyy
    } catch (error) {
      console.log("wEIOWJTOWTHWHTOEHWUOHTOUEWH");
      this.gameData = normalizeInventoryData({});
    }

    const survivorIds = this.getInventoryCharacterIds();

    if (!this.selected_Char) {
      this.selected_Char = survivorIds[0] || null;
    }

    // froce abvoe screen
    this.isOpen = true;
    this.root.setVisible(true);

    this.scene.bringToTop("InventoryOverlay");

    this.renderAll();
  }

  closeInventory() {
    this.isOpen = false;
    this.root.setVisible(false);
    this.closeDetailthings();
    this.input.setDefaultCursor("default");
  }

  toggleInventory() {
    if (this.isOpen) {
      // window.alert("hi")
      this.closeInventory();
    } else {
      this.openInventory();
    }
  }

  createBaseGui() {
    const blocker = this.add.rectangle(
      0,
      0,
      main_width,
      main_height,
      0x111114,
      0.96,
    );

    blocker.setOrigin(0, 0);

    blocker.setInteractive({ useHandCursor: false });

    blocker.on("pointerdown", () => {
      this.closeDetailthings();
    });

    // main ivnenotry panel
    const panel = this.add.rectangle(p_x, p_y, p_w, p_h, 0x070909, 1);

    panel.setOrigin(0, 0);
    panel.setStrokeStyle(4, 0xffffff, 0.85);
    panel.setInteractive({ useHandCursor: false });

    // close deaitls
    panel.on("pointerdown", () => {
      this.closeDetailthings();
    });

    const title = this.add.text(p_x + 70, p_y + 54, "INVENTORY", {
      fontFamily: "DogicaBold",
      fontSize: "32px",

      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    });

    // serpeate layers
    this.tabRoot = this.add.container(0, 0);
    this.contentRoot = this.add.container(0, 0);

    this.characterRoot = this.add.container(0, 0);
    this.modelRoot = this.add.container(0, 0);
    this.detailsRoot = this.add.container(0, 0);

    this.escText = this.add.text(p_x + 85, p_y + p_h - 60, "ESC to close", {
      fontFamily: "DogicaBold",
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",

      strokeThickness: 4,
    });

    this.escText.setOrigin(0, 0);

    this.escText.setInteractive({ useHandCursor: false });

    this.escText.on("pointerdown", (pointer, localX, localY, event) => {
      // #nobubbling
      if (event) {
        event.stopPropagation();
      }

      this.closeInventory();
    });

    this.escText.on("pointerover", () => {
      this.escText.setAlpha(0.75);

      this.input.setDefaultCursor("pointer");
    });

    this.escText.on("pointerout", () => {
      this.escText.setAlpha(1);
      this.input.setDefaultCursor("default");
    });

    this.root.add([
      blocker,
      panel,
      title,
      this.tabRoot,
      this.contentRoot,
      this.characterRoot,
      this.modelRoot,
      this.detailsRoot,
      this.escText,
    ]);

    this.makeTabsNOW();
  }

  closeDetailthings() {
    this.noNoDetailClose();

    // if a slot was selcted and has a red outtline
    // remove it and mak eit back to normal color
    if (this.selected_Inv_SlotBG && this.selected_Inv_SlotBG.active) {
      this.selected_Inv_SlotBG.setStrokeStyle(3, 0xb5b5b5, 1);
    }

    // if (this.selected_Inv_SlotBG && this.selected_Inv_SlotBG.active) {
    //   console.log("yes");
    // }

    this.selected_Entry = null;
    this.selected_Inv_SlotBG = null;

    this.mouse_over_invSlot = false;
    this.mouse_over_invDetails = false;
    this.currentt_ActtiveInvBnds = null;

    this.currentt_DetailBnds = null;

    this.clearDetails();
  }

  // redraw anything that depends on current tab selceted char and save data
  renderAll() {
    this.makeTabsNOW();
    this.makeTab();
    this.makeListChars();
    this.makeListCharsModel();

    if (this.escText) {
      this.root.bringToTop(this.escText);
    }
  }

  // reamke + highlight the cateogry thats acctive currently
  makeTabsNOW() {
    // clear
    this.tabRoot.removeAll(true);

    const tabs = [
      { id: "weapons", label: "WEAPONS" },
      { id: "armor", label: "ARMOR" },
      { id: "items", label: "ITEMS" },
    ];

    // weapons and armor and items tabs creation here
    tabs.forEach((tab, index) => {
      const t_width = 150;

      const t_height = 42;
      const t_gap = 24;

      const x = tab_x_start + t_width / 2 + index * (t_width + t_gap);

      const y = tab_y;

      const btn = this.makeTextButton(x, y, t_width, t_height, tab.label, 10);

      btn.hit.on("pointerdown", (pointer, localX, localY, event) => {
        if (event) {
          event.stopPropagation();
        }

        this.closeDetailthings();
        this.currentTab = tab.id;

        // re
        this.renderAll();
      });

      if (tab.id === this.currentTab) {
        btn.bg.setStrokeStyle(4, 0xff3333, 1);
      }

      this.tabRoot.add(btn.root);
    });
  }

  /// clears the tab that is active and renders the tab that just got opened
  makeTab() {
    this.contentRoot.removeAll(true);
    this.clearDetails();

    // must have game data
    if (!this.gameData) {
      return;
    }

    if (this.currentTab === "weapons") {
      this.renderWeaponTab();
    }

    if (this.currentTab === "armor") {
      this.renderArmorTab();
    }

    if (this.currentTab === "items") {
      this.renderItemTab();
    }
  }

  // rneder weapon id
  renderWeaponTab() {
    const weaponIdOkay = this.gameData.inventory.weapons || [];

    if (weaponIdOkay.length === 0) {
      this.renderEmptyText("NO WEAPONS");
      return;
    }

    weaponIdOkay.forEach((weaponId, index) => {
      const weapon = battleWeapons[weaponId]; // fibd weapon

      if (!weapon) {
        return;
      }

      // create the slot
      this.makeInventorySlot({
        index,
        type: "weapon",
        id: weaponId,
        icon: weapon.icon,
        name: weapon.name,
        description: this.getWeaponDescription(weapon),
      });
    });
  }

  renderArmorTab() {
    const armorIds = this.gameData.inventory.armor || [];

    if (armorIds.length === 0) {
      this.renderEmptyText("NO ARMOR");
      return;
    }

    armorIds.forEach((armorId, index) => {
      const armor = battleArmors[armorId];

      if (!armor) {
        return;
      }

      this.makeInventorySlot({
        index,
        type: "armor",
        id: armorId,
        icon: armor.icon,

        name: armor.name,
        description: armor.description || "Armor piece.",
      });
    });
  }

  renderItemTab() {
    const entries = this.gameData.inventory.consumables || [];

    if (entries.length === 0) {
      this.renderEmptyText("NO ITEMS");
      return;
    }

    entries.forEach((entry, index) => {
      const item = battleConsumables[entry.id];

      if (!item) {
        return;
      }

      this.makeInventorySlot({
        index,
        type: "item",
        id: entry.id,
        icon: item.icon,
        name: `${item.name} x${Number(entry.qty || 1)}`,
        description: item.description || "Consumable item.",
        qty: Number(entry.qty || 1),
      });
    });
  }

  makeInventorySlot(config) {
    /// mkaes 4 columbs
    let col = 0;

    let row = 0;

    for (let i = 0; i < config.index; i += 1) {
      col += 1;

      if (col >= 4) {
        col = 0;
        row += 1;
      }
    }

    const x = slot_start_x + col * (slot_size + slot_gap);

    const y = slot_start_y + row * (slot_size + slot_gap);

    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, slot_size, slot_size, 0x111111, 1);

    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    // keep hieghlithed after redraw
    if (this.isSelectedEntry(config)) {
      bg.setStrokeStyle(4, 0xff3333, 1);
    }

    const objects = [bg];

    const icon = this.add.image(0, 0, config.icon);
    icon.setOrigin(0.5);
    icon.setScale(54 / icon.height);

    objects.push(icon);

    if (config.qty) {
      const qtyText = this.add.text(30, 20, String(config.qty), {
        fontFamily: "DogicaBold",
        fontSize: "15px",
        color: "#ffffff",
        stroke: "#000000",

        strokeThickness: 5,
      });
      qtyText.setOrigin(1, 0);

      objects.push(qtyText);
    }

    const hit = this.add.zone(0, 0, slot_size, slot_size);

    hit.setOrigin(0.5);
    hit.setInteractive({ useHandCursor: false });

    /// detail panel open
    hit.on("pointerover", () => {
      this.mouse_over_invSlot = true;
      this.input.setDefaultCursor("pointer");
      this.showdetailsNOW(config, x, y, bg);
    });

    // delay closing so the u can move from the slot to the details popup and it dont disappear
    hit.on("pointerout", () => {
      this.mouse_over_invSlot = false;
      this.input.setDefaultCursor("default");

      if (!this.isSelectedEntry(config)) {
        bg.setStrokeStyle(3, 0xb5b5b5, 1);
      }

      // this is the delay
      this.scheduleDetailsClose();
    });

    // if clickign an inventory slot, dont count it as clicking the panel/background
    // preetyt sure we don need this because switched from pointerdwon behaviour to hover behaviour but keep incase
    hit.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
    });

    objects.push(hit);

    root.add(objects);
    this.contentRoot.add(root);
  }

  showdetailsNOW(config, slotX, slotY, bg) {
    this.noNoDetailClose();

    if (this.selected_Inv_SlotBG) {
      const yes1 = this.selected_Inv_SlotBG; // do  we have slected slot alreday?

      const yes2 = yes1 !== bg; // is it diff from the new slot
      const yes3 = yes1.active; // still active or no

      if (yes2) {
        if (yes3) {
          yes1.setStrokeStyle(3, 0xb5b5b5, 1); // reset to normal
        }
      }
    }

    // which one + their backgorund
    this.selected_Entry = config;
    this.selected_Inv_SlotBG = bg;
    this.currentt_ActtiveInvBnds = {
      x: slotX - slot_size / 2,
      y: slotY - slot_size / 2,
      w: slot_size,
      h: slot_size,
    };

    bg.setStrokeStyle(4, 0xff3333, 1);

    this.showDetails(config, slotX, slotY);
  }

  noNoDetailClose() {
    if (this.detailsCloseTimer) {
      // if there is a timer waitin to close details
      this.detailsCloseTimer.remove(false); // stop it
      this.detailsCloseTimer = null; // reset / clear
    }
  }

  scheduleDetailsClose() {
    this.noNoDetailClose();

    // when u move from the icon to the details, the cursor might not go into the panel instantly, so let the cursor travel for 150ms before close
    this.detailsCloseTimer = this.time.delayedCall(150, () => {
      const pointer = this.input.activePointer;
      const isStillOnSlot = this.pointerIsInBoundsYes(
        pointer,
        this.currentt_ActtiveInvBnds,
      );
      const isStillOnDetails = this.pointerIsInBoundsYes(
        pointer,
        this.currentt_DetailBnds,
      );

      this.mouse_over_invSlot = isStillOnSlot;
      //
      this.mouse_over_invDetails = isStillOnDetails;
      this.detailsCloseTimer = null;

      if (!isStillOnSlot && !isStillOnDetails) {
        this.closeDetailthings();
      }
    });
  }

  // note rq : x = left side, y = top side. w and height create the square w is ho far it goes right and h is how far it goes down
  // check if pointer is inside the dedtails panel
  pointerIsInBoundsYes(pointer, bounds) {
    if (!pointer) {
      return false;
    }

    if (!bounds) {
      return false;
    }

    let x = pointer.x;
    let y = pointer.y;

    //nworld coorndaites if it exists but idk if it exists
    if (pointer.worldX !== undefined) {
      x = pointer.worldX;
    }

    if (pointer.worldY !== undefined) {
      y = pointer.worldY;
    }

    const okleft = bounds.x;

    const okright = bounds.x + bounds.w; // right side (the left side nd the height)
    const oktop = bounds.y;
    const okbotom = bounds.y + bounds.h;

    if (x < okleft) {
      return false;
    }

    if (x > okright) {
      return false;
    }

    if (y < oktop) {
      return false;
    }

    if (y > okbotom) {
      return false;
    }

    return true;
  }

  // is the slot we are looking at currnelty the same as the selceted item rn
  isSelectedEntry(config) {
    if (!this.selected_Entry) {
      // cant select slot because nothign i slected yet
      return false;
    }

    const crazy =
      this.selected_Entry.type === config.type &&
      this.selected_Entry.id === config.id;

    return crazy;
  }

  // panel makeing
  showDetails(entry, slotX = slot_start_x, slotY = slot_start_y) {
    this.clearDetails();

    const w = 430;
    let h = 430;

    if (entry.type === "item") {
      h = 260;
    }
    // item hegihts differrnet because no equip btn

    let x = slotX + slot_size / 2 + 40;

    let y = slotY - 0;

    const panelRight = p_x + p_w - 35;

    const panelBottom = p_y + p_h - 85;

    // put panel on left instead if it overflow on right
    if (x + w > panelRight) {
      x = slotX - slot_size / 2 - w - 28;
    }
    //put panel up if overlfow down
    if (y + h > panelBottom) {
      y = panelBottom - h;
    }

    // dont overlap tab area
    if (y < p_y + 190) {
      y = p_y + 190;
    }

    this.currentt_DetailBnds = { x, y, w, h };

    const bg = this.add.rectangle(x, y, w, h, 0x000000, 0.96);
    bg.setOrigin(0, 0);

    bg.setStrokeStyle(3, 0xffffff, 0.85);
    bg.setInteractive({ useHandCursor: false });

    // cancel close timer if move isside it
    bg.on("pointerover", () => {
      this.mouse_over_invDetails = true;
      this.noNoDetailClose();
    });

    bg.on("pointerout", () => {
      this.mouse_over_invDetails = false;

      this.scheduleDetailsClose();
    });

    // prevent click fro going to background handelr
    bg.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }
    });

    const title = this.add.text(x + 30, y + 38, entry.name, {
      fontFamily: "DogicaBold",
      fontSize: "18px",

      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 5,
      wordWrap: {
        width: w - 60,
      },
    });

    const body = this.add.text(x + 30, y + 108, entry.description, {
      fontFamily: "Dogica",
      fontSize: "13px",
      color: "#dddddd",
      stroke: "#000000",
      strokeThickness: 4,
      wordWrap: {
        width: w - 60,
      },
      lineSpacing: 10,
    });

    this.detailsRoot.add([bg, title, body]);

    // only wpns and armor can be equiped
    if (entry.type === "weapon" || entry.type === "armor") {
      const equipButton = this.makeTextButton(
        x + w / 2,
        y + h - 62,
        280,
        64,
        "EQUIP",
        15,
      );

      equipButton.hit.on("pointerover", () => {
        this.mouse_over_invDetails = true;
        this.noNoDetailClose();
      });

      equipButton.hit.on("pointerout", () => {
        this.mouse_over_invDetails = false;
        this.scheduleDetailsClose();
      });

      //
      equipButton.hit.on("pointerdown", (pointer, localX, localY, event) => {
        if (event) {
          event.stopPropagation();
        }

        this.equipSelectedEntry();
      });

      this.detailsRoot.add(equipButton.root);
    }

    this.root.bringToTop(this.detailsRoot);

    if (this.escText) {
      this.root.bringToTop(this.escText);
    }
  }

  // remove detail thtings in panel
  clearDetails() {
    this.currentt_DetailBnds = null;

    if (this.detailsRoot) {
      this.detailsRoot.removeAll(true);
    }
  }

  async equipSelectedEntry() {
    //  character and item mstu be selceted first
    if (!this.selected_Entry) {
      return;
    }

    if (!this.selected_Char) {
      return;
    }

    if (!this.gameData.inventory.equippedByCharacter) {
      this.gameData.inventory.equippedByCharacter = {};
    }

    // REMOVE this item form everyv character first ebfore updating because itmes are unique
    Object.keys(this.gameData.inventory.equippedByCharacter).forEach(
      (characterId) => {
        const equipped =
          this.gameData.inventory.equippedByCharacter[characterId];

        if (!equipped) {
          return;
        }

        if (this.selected_Entry.type === "weapon") {
          if (Array.isArray(equipped.weapons)) {
            equipped.weapons = equipped.weapons.filter((weaponId) => {
              return weaponId !== this.selected_Entry.id;
            });
          }
        }

        if (this.selected_Entry.type === "armor") {
          if (Array.isArray(equipped.armor)) {
            equipped.armor = equipped.armor.filter((armorId) => {
              return armorId !== this.selected_Entry.id;
            });
          }
        }
      },
    );

    // Emake sure the character has an equip object before equip
    if (!this.gameData.inventory.equippedByCharacter[this.selected_Char]) {
      this.gameData.inventory.equippedByCharacter[this.selected_Char] = {
        // make it if it doesnt exist (but it prob does because of normalzie inventor)
        weapons: [],
        armor: [],
      };
    }

    const equipped =
      this.gameData.inventory.equippedByCharacter[this.selected_Char];

    if (!Array.isArray(equipped.weapons)) {
      equipped.weapons = [];
    }

    if (!Array.isArray(equipped.armor)) {
      equipped.armor = [];
    }

    // equip wepn
    if (this.selected_Entry.type === "weapon") {
      equipped.weapons = [this.selected_Entry.id];
    }

    // replace char armor with the slected armor
    if (this.selected_Entry.type === "armor") {
      equipped.armor = [this.selected_Entry.id];
    }

    normalizeInventoryData(this.gameData);
    await saveGameData(this.gameData);

    this.closeDetailthings();

    this.makeTab();
    this.makeListChars();
    this.makeListCharsModel();
  }

  makeListChars() {
    this.characterRoot.removeAll(true);

    const ids = this.getInventoryCharacterIds();
    // console.log("A")

    ids.forEach((id, index) => {
      const c = characters[id];

      if (!c) {
        return;
      }

      const x = char_list_x;
      const y = char_list_y + index * 88;

      const w = char_list_w;

      const h = char_list_h;

      const selected = id === this.selected_Char;

      let bgColor = 0x1a1a1a;
      let strokeColor = 0x555555;

      if (selected) {
        bgColor = 0x333333;
        strokeColor = 0x33ddff;
      }

      const bg = this.add.rectangle(x, y, w, h, bgColor, 1);

      bg.setOrigin(0, 0);
      bg.setStrokeStyle(2, strokeColor, 1);

      const icon = this.add.image(x + 45, y + 36, c.icon);

      icon.setOrigin(0.5);

      icon.setScale(46 / icon.height);

      const name = this.add.text(x + 92, y + 26, c.name, {
        fontFamily: "DogicaBold",
        fontSize: "15px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      });
      name.setOrigin(0, 0.5);

      const hit = this.add.zone(x + w / 2, y + h / 2, w, h);
      hit.setOrigin(0.5);

      hit.setInteractive({ useHandCursor: false });

      hit.on("pointerover", () => {
        this.input.setDefaultCursor("pointer");
      });

      hit.on("pointerout", () => {
        this.input.setDefaultCursor("default");
      });

      hit.on("pointerdown", (pointer, localX, localY, event) => {
        if (event) {
          event.stopPropagation();
        }

        this.selected_Char = id; // char is selected now
        // redraw models AND LIST
        this.makeListChars();
        this.makeListCharsModel();
      });

      this.characterRoot.add([bg, icon, name, hit]);
    });
  }

  makeListCharsModel() {
    this.modelRoot.removeAll(true);

    const x = modelpan_x;
    const y = modelpan_y;

    const w = modelpan_w;
    const h = modelpan_h;

    const bg = this.add.rectangle(x, y, w, h, 0x0b0b0b, 0.95);
    bg.setOrigin(0, 0);
    bg.setStrokeStyle(3, 0xffffff, 0.85);

    this.modelRoot.add(bg);

    if (!this.selected_Char) {
      return;
    }

    const c = characters[this.selected_Char];

    // might be a bti too defensive though
    let spriteKey = c.sprite || c.icon;

    if (!this.textures.exists(spriteKey)) {
      spriteKey = c.icon;
    }

    const sprite = this.add.image(x + w / 2, y + 280, spriteKey);
    sprite.setOrigin(0.5, 1);

    // scale by hegitih to fit the etnire area the same
    if (this.textures.exists(spriteKey)) {
      sprite.setScale(220 / sprite.height);
    }

    // equiped id -> defineition
    const equipped = this.getEquippedForSelectedCharacter();

    let weapon = null;
    let armor = null;

    let weaponIcon = null;

    let armorIcon = null;
    if (equipped.weaponId) {
      weapon = battleWeapons[equipped.weaponId];
    }

    if (equipped.armorId) {
      armor = battleArmors[equipped.armorId];
    }

    if (weapon) {
      weaponIcon = weapon.icon;
    }

    if (armor) {
      armorIcon = armor.icon;
    }

    // Equipment slots are clickable: clicking them unequips that slot type.
    const weaponSlot = this.makeEquippedSlot(
      x + 82,
      y + 380,
      weaponIcon,
      "WEAPON",
      "weapon",
    );

    const armorSlot = this.makeEquippedSlot(
      x + 213,
      y + 380,
      armorIcon,
      "ARMOR",
      "armor",
    );

    this.modelRoot.add([sprite, weaponSlot.root, armorSlot.root]);
  }

  makeEquippedSlot(x, y, iconKey, label, type) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 82, 82, 0x111111, 1);
    bg.setOrigin(0.5);
    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const objects = [bg];

    // no iocn empty frame
    if (iconKey && this.textures.exists(iconKey)) {
      const icon = this.add.image(0, 0, iconKey);
      icon.setOrigin(0.5);
      icon.setScale(52 / icon.height);
      objects.push(icon);
    }

    const text = this.add.text(0, 58, label, {
      fontFamily: "DogicaBold",
      fontSize: "11px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });
    text.setOrigin(0.5);

    const hit = this.add.zone(0, 0, 82, 82);
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

    hit.on("pointerdown", (pointer, localX, localY, event) => {
      if (event) {
        event.stopPropagation();
      }

      this.unequipSelectedCharacterSlot(type);
    });

    objects.push(text, hit);
    root.add(objects);

    return {
      root,
      bg,
    };
  }

  async unequipSelectedCharacterSlot(type) {
    if (!this.selected_Char) {
      return;
    }

    //nothing to unequip w/out equipmet map
    if (!this.gameData.inventory.equippedByCharacter) {
      return;
    }

    const equipped =
      this.gameData.inventory.equippedByCharacter[this.selected_Char];

    if (!equipped) {
      return;
    }

    // unequip
    if (type === "weapon") {
      equipped.weapons = [];
    }

    if (type === "armor") {
      equipped.armor = [];
    }

    normalizeInventoryData(this.gameData);
    await saveGameData(this.gameData);

    this.makeListCharsModel();
  }

  getEquippedForSelectedCharacter() {
    const empty = {
      weaponId: null,
      armorId: null,
    };

    // if (!this.gameData.inventory.equippedByCharacter) {
    //   return empty;
    // }

    const equipped =
      this.gameData.inventory.equippedByCharacter[this.selected_Char];

    if (!equipped) {
      return empty;
    }

    let weaponId = null;
    let armorId = null;

    // the first one
    if (equipped.weapons) {
      weaponId = equipped.weapons[0];
    }

    if (equipped.armor) {
      armorId = equipped.armor[0];
    }

    return {
      weaponId: weaponId,
      armorId: armorId,
    };
  }

  // which characters should appear based on current chapter
  getInventoryCharacterIds() {
    let ids = [];

    if (this.gameData) {
      const chapterName =
        this.gameData.chapterName ||
        this.gameData.currentChapterName ||
        this.gameData.currentChapter ||
        "post-classroom-hallway";

      if (chapterTeams[chapterName]) {
        ids = chapterTeams[chapterName];
      }
    }

    // show all characters if missing chapterName
    if (ids.length === 0) {
      ids = Object.keys(characters);
    }

    const validIds = [];

    ids.forEach((id) => {
      if (characters[id]) {
        validIds.push(id);
      }
    });

    return validIds;
  }

  renderEmptyText(text) {
    const emptyText = this.add.text(slot_start_x - 15, slot_start_y - 5, text, {
      fontFamily: "DogicaBold",
      fontSize: "20px",
      color: "#777777",
      stroke: "#000000",
      strokeThickness: 5,
    });

    this.contentRoot.add(emptyText);
  }

  getWeaponDescription(weapon) {
    const lines = [];

    if (weapon.skills) {
      weapon.skills.forEach((skill) => {
        lines.push(`${skill.name}: ${skill.description}`);
      });
    }

    if (lines.length === 0) {
      return "Weapon.";
    }

    return lines.join("\n\n");
  }

  makeTextButton(x, y, w, h, label, fontSize = 13) {
    const root = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, w, h, 0x111111, 1);
    bg.setOrigin(0.5);

    bg.setStrokeStyle(3, 0xb5b5b5, 1);

    const text = this.add.text(0, 0, label, {
      fontFamily: "DogicaBold",
      fontSize: `${fontSize}px`,
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

    return {
      root,
      bg,
      text,
      hit,
    };
  }
}
