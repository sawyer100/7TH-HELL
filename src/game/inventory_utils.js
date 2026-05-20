import { loadGameData, saveGameData } from "./db";

// save data always inventory shape
// example if no armor being saveGameData, add empty armor
export function normalizeInventoryData(data) {
  if (!data.inventory) {
    data.inventory = {};
  }

  const inventory = data.inventory;

  if (!Array.isArray(inventory.weapons)) {
    inventory.weapons = [];
  }

  if (!Array.isArray(inventory.armor)) {
    inventory.armor = [];
  }
  if (!Array.isArray(inventory.consumables)) {
    inventory.consumables = [];
  }

  if (!inventory.equippedByCharacter) {
    inventory.equippedByCharacter = {};
  }

  const wpsCleaned = [];

  inventory.weapons.forEach((weaponId) => {
    if (!weaponId) {
      return;
    }

    if (wpsCleaned.includes(weaponId)) {
      return;
    }

    wpsCleaned.push(weaponId);
  });

  inventory.weapons = wpsCleaned;

  const cleanArms = [];

  inventory.armor.forEach((armorId) => {
    if (!armorId) {
      return;
    }

    if (cleanArms.includes(armorId)) {
      return;
    }

    cleanArms.push(armorId);
  });

  inventory.armor = cleanArms;

  Object.keys(inventory.equippedByCharacter).forEach((characterId) => {
    const equipped = inventory.equippedByCharacter[characterId];

    if (!equipped) {
      return;
    }

    const cleanedEquippedWeapons = [];

    if (Array.isArray(equipped.weapons)) {
      equipped.weapons.forEach((weaponId) => {
        if (!weaponId) {
          return;
        }

        if (cleanedEquippedWeapons.length >= 1) {
          return;
        }

        cleanedEquippedWeapons.push(weaponId);
      });
    }

    equipped.weapons = cleanedEquippedWeapons;

    const cleanedEquippedArmor = [];

    if (Array.isArray(equipped.armor)) {
      equipped.armor.forEach((armorId) => {
        if (!armorId) {
          return;
        }

        if (cleanedEquippedArmor.length >= 1) {
          return;
        }

        cleanedEquippedArmor.push(armorId);
      });
    }

    equipped.armor = cleanedEquippedArmor;
  });

  return data;
}

export function ownsWeapon(data, weaponId) {
  // make safe to read
  normalizeInventoryData(data);

  return data.inventory.weapons.includes(weaponId);
}

export function ownsArmor(data, armorId) {
  normalizeInventoryData(data);

  return data.inventory.armor.includes(armorId);
}

export function canAddWeapon(data, weaponId) {
  return !ownsWeapon(data, weaponId);
}

export function canAddArmor(data, armorId) {
  return !ownsArmor(data, armorId);
}

export async function addUniqueWeaponToInventory(weaponId) {
  const data = await loadGameData();

  normalizeInventoryData(data);

  if (data.inventory.weapons.includes(weaponId)) {
    return {
      added: false,
      reason: "already-owned",
      data,
    };
  }

  data.inventory.weapons.push(weaponId);

  await saveGameData(data);

  return {
    added: true,
    data,
  };
}

export async function addUniqueArmorToInventory(armorId) {
  const data = await loadGameData();

  normalizeInventoryData(data);

  if (data.inventory.armor.includes(armorId)) {
    return {
      added: false,
      reason: "already-owned",
      data,
    };
  }

  data.inventory.armor.push(armorId);

  await saveGameData(data);

  return {
    added: true,
    data,
  };
}

export async function addConsumableToInventory(itemId, qty) {
  const data = await loadGameData();

  normalizeInventoryData(data);

  let amountToAdd = Number(qty);

  if (Number.isNaN(amountToAdd)) {
    amountToAdd = 1;
  }

  if (amountToAdd <= 0) {
    amountToAdd = 1;
  }

  let found = null;

  data.inventory.consumables.forEach((entry) => {
    if (entry) {
      if (entry.id === itemId) {
        found = entry;
      }
    }
  });

  if (found) {
    found.qty = Number(found.qty || 0) + amountToAdd;
  } else {
    data.inventory.consumables.push({
      id: itemId,
      qty: amountToAdd,
    });
  }

  await saveGameData(data);

  return data;
}
