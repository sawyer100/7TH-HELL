export const battleWeapons = {
  baton: {
    id: "baton",
    name: "BATON",
    icon: "item-baton",
    skills: [
      {
        id: "baton_strike",
        name: "STRIKE",
        description: "A direct baton hit break yo bones.",
        staminaCost: 18,
        target: "enemy",
        damage: 18,
        staminaDamage: 4,
        attackType: "melee",
      },
      {
        id: "baton_crack",
        name: "CRACK",
        description: "Lower damage, but heavy stamina damage.",
        staminaCost: 30,
        target: "enemy",
        damage: 12,
        staminaDamage: 24,
        attackType: "melee",
      },
    ],
  },

  gun: {
    id: "gun",
    name: "GUN",
    icon: "item-gun",
    skills: [
      {
        id: "gun_shot",
        name: "SHOT",
        description: "Shoot a zombie.",
        staminaCost: 34,
        target: "enemy",
        damage: 32,
        staminaDamage: 4,
        ranged: true,
        attackType: "ranged",
      },
      {
        id: "gun_aimed_shot",
        name: "AIMED SHOT",
        description: "360 no scope a zombie head shot",
        staminaCost: 48,
        target: "enemy",
        damage: 48,
        staminaDamage: 8,
        ranged: true,
        attackType: "ranged",
      },
    ],
  },

  crow_bar: {
    id: "crow_bar",
    name: "CROWBAR",
    icon: "item-crow-bar",
    skills: [
      {
        id: "crowbar_swing",
        name: "SWING",
        description: "Heavy close-range hit.",
        staminaCost: 26,
        target: "enemy",
        damage: 28,
        staminaDamage: 8,
        attackType: "melee",
      },
      {
        id: "crowbar_sweep",
        name: "SWEEP",
        description: "Hits one zombie and damages its stamina heavily.",
        staminaCost: 40,
        target: "enemy",
        damage: 20,
        staminaDamage: 25,
        attackType: "melee",
      },
    ],
  },

  pocket_knife: {
    id: "pocket_knife",
    name: "POCKET KNIFE",
    icon: "item-pocket-knife",
    skills: [
      {
        id: "knife_jab",
        name: "JAB",
        description: "Low stamina quick stab.",
        staminaCost: 25,
        target: "enemy",
        damage: 15,
        staminaDamage: 5,
        attackType: "melee",
      },
      {
        id: "knife_cut",
        name: "CUT",
        description: "Slash the zombie!",
        staminaCost: 15,
        target: "enemy",
        damage: 10,
        staminaDamage: 5,

        attackType: "melee",
      },
    ],
  },
};

export const battleArmors = {
  bike_helmet: {
    id: "bike_helmet",
    name: "BIKE HELMET",
    icon: "item-bike-helmet",
    description: "Reduces incoming damage by 15%.",
    damageReductionPercent: 0.15,
  },
};

export const battleConsumables = {
  healing_potion: {
    id: "healing_potion",
    name: "HEALING POTION",
    icon: "item-healing-potion",
    description: "Heals one survivor for 30 HP. Uses the turn.",
    target: "ally",
    heal: 30,
    staminaRecover: 0,
    effectId: "heal",
  },

  bandage: {
    id: "bandage",
    name: "BANDAGE",
    icon: "item-bandage",
    description: "Heals one survivor for 20 HP. Uses the turn.",
    target: "ally",
    heal: 20,
    staminaRecover: 0,
    effectId: "heal",
  },

  onigiri: {
    id: "onigiri",
    name: "ONIGIRI",
    icon: "item-onigiri",
    description: "Restores 15 HP and 15 stamina. Uses the turn.",
    target: "ally",
    heal: 15,
    staminaRecover: 15,
    effectId: "heal",
  },

  energy_bar: {
    id: "energy_bar",
    name: "ENERGY BAR",
    icon: "item-energy-bar",
    description: "Restores 40% stamina. Uses the turn.",
    target: "ally",
    heal: 0,
    staminaRecoverPercent: 0.15,
    effectId: "stamina",
  },

  energy_drink: {
    id: "energy_drink",
    name: "ENERGY DRINK",
    icon: "item-energy-drink",
    description:
      "Restores 15% stamina and gives this survivor an extra turn next round.",
    target: "ally",
    heal: 0,
    staminaRecoverPercent: 0.15,
    extraTurnNextRound: true,
    effectId: "stamina",
  },

  adrenaline_shot: {
    id: "adrenaline_shot",
    name: "ADRENALINE SHOT",
    icon: "item-adrenaline-shot",
    description:
      "Next turn, this survivor can use skills by paying HP instead of stamina.",
    target: "ally",
    heal: 0,
    staminaRecover: 0,
    overexertNextTurn: true,
    effectId: "stamina",
  },

  whistle: {
    id: "whistle",
    name: "WHISTLE",
    icon: "item-whistle",
    description: "Forces zombies to target this survivor next round.",
    target: "ally",
    heal: 0,
    staminaRecover: 0,
    baitNextRound: true,
    effectId: null,
  },
};
