export const characters = {
  kim: {
    id: "kim",
    name: "KIM",
    icon: "classroom-kim-icon",
    sprite: "id-card-kim",

    stats: {
      HP: 80,
      STAM: 100,
      SPD: 70,
      DMG: 10,
      DEF: 1,
    },

    defaultWeaponIds: [],
    defaultArmorIds: [],

    characterSkills: [
      {
        id: "kim_strike",
        name: "PUNCH",
        description: "Kim hits one enemy. Basic damage.",
        staminaCost: 14,
        target: "enemy",
        damage: 13,
        staminaDamage: 10,
      },
      {
        id: "kim_catch_breath",
        name: "CATCH BREATH",
        description: "Kim recovers 8 HP.",
        staminaCost: 10,
        target: "self",
        damage: 0,
        staminaDamage: 0,
        heal: 8,
        staminaRecover: 0,
      },
    ],
  },

  meryl: {
    id: "meryl",
    name: "MERYL",
    icon: "classroom-meryl-icon",
    sprite: "id-card-meryl",

    stats: {
      HP: 100,
      STAM: 80,
      SPD: 58,
      DMG: 8,
      DEF: 2,
    },

    defaultWeaponIds: [],
    defaultArmorIds: [],

    characterSkills: [
      {
        id: "meryl_breath_taker",
        name: "BREATH TAKER",
        description:
          "Meryl strikes a weak point. Does no HP damage, but drains enemy stamina.",
        staminaCost: 20,
        target: "enemy",
        damage: 0,
        staminaDamage: 30,
      },
      {
        id: "meryl_shield",
        name: "SHIELD",
        description: "Choose a survivor. Their next hit takes 70% less damage.",
        staminaCost: 45,
        target: "ally",
        damage: 0,
        staminaDamage: 0,
        heal: 0,
        staminaRecover: 0,
        effectId: "shield",
        shield: {
          damageReduction: 0.7,
          hits: 1,
        },
      },
    ],
  },
};

export const chapterTeams = {
  "introduction-potion": ["kim"],
  "id-card": ["kim", "meryl"],
  classroom: ["kim", "meryl"],
  "post-classroom-hallway": ["kim", "meryl"],
  "test-post-classroom-hallway": ["kim", "meryl"],
};
