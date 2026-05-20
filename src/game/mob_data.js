const walker = {
  id: "walker",
  name: "WALKER",
  category: "normal",

  stats: {
    HP: "100",
    STAM: "80",
    SPD: "70",
    DEF: "0",
  },

  skills: [
    {
      id: "walker_maul",
      name: "MAUL",
      description: "Viciously attacks a survivor",
      staminaCost: 18,
      target: "enemy",
      damage: 18,
      staminaDamage: 8,
      effectId: "zombie-maul",
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-walker-front",
    right: "knowledge-walker-right",
    back: "knowledge-walker-back",
    left: "knowledge-walker-left",
  },

  icon: "knowledge-walker-icon",
};

const runner = {
  id: "runner",
  name: "RUNNER",
  category: "normal",

  stats: {
    HP: "70",
    STAM: "110",
    SPD: "95",
    DEF: "0",
  },

  skills: [
    {
      id: "runner_lunge",
      name: "LUNGE",
      description: "Lunges into your face and you DIE.",
      staminaCost: 26,
      target: "enemy",
      damage: 14,
      staminaDamage: 16,
      effectId: "zombie-maul",
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-runner-front",
    right: "knowledge-runner-right",
    back: "knowledge-runner-back",
    left: "knowledge-runner-left",
  },

  icon: "knowledge-runner-icon",
};

const brute = {
  id: "brute",
  name: "BRUTE",
  category: "normal",

  stats: {
    HP: "135",
    STAM: "70",
    SPD: "25",
    DEF: "3",
  },

  skills: [
    {
      id: "brute_slam",
      name: "SLAM",
      weight: 60,
      description:
        "Slams the ground so hard it feels like 500lbs person drop from 2nd floor.",
      staminaCost: 36,
      target: "enemy",
      damage: 35,
      staminaDamage: 12,
      effectId: null,
      attackType: "melee",
    },
    {
      id: "brute_charge",
      name: "CHARGE",
      weight: 40,
      description: "Runs into you like a bull.",
      staminaCost: 42,
      target: "enemy",
      damage: 50,
      staminaDamage: 18,
      effectId: null,
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-brute-front",
    right: "knowledge-brute-right",
    back: "knowledge-brute-back",
    left: "knowledge-brute-left",
  },

  icon: "knowledge-brute-icon",
};

const boss = {
  id: "boss",
  name: "BOSS",
  category: "bosses",

  stats: {
    HP: "300",
    STAM: "120",
    SPD: "35",
    DEF: "5",
  },

  skills: [
    {
      id: "boss_hellfire",
      name: "HELLFIRE",
      description: "placehodler not ready",
      staminaCost: 50,
      target: "enemy",
      damage: 60,
      staminaDamage: 20,
      effectId: null,
      attackType: "ranged",
      ranged: true,
    },
  ],

  sprites: {
    front: "knowledge-boss-front",
    right: "knowledge-boss-right",
    back: "knowledge-boss-back",
    left: "knowledge-boss-left",
  },

  icon: "knowledge-boss-icon",
};

export const mobs = [walker, runner, brute, boss];

export const categories = [
  {
    id: "normal",
    label: "Normal",
  },
  {
    id: "bosses",
    label: "Bosses",
  },
];
