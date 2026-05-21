const walker = {
  id: "walker",
  name: "WALKER",
  category: "normal",

  stats: {
    HP: "90",
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
      damage: 15,
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
    STAM: "150",
    SPD: "90",
    DEF: "0",
  },

  skills: [
    {
      id: "runner_lunge",
      name: "LUNGE",
      description: "Lunges into your face and you DIE.",
      staminaCost: 26,
      target: "enemy",
      damage: 10,
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
      damage: 23,
      staminaDamage: 5,
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
      damage: 30,
      staminaDamage: 10,
      effectId: "brute-charge-crack",
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

const dombis = {
  id: "dombis",
  name: "DOMBIS",
  category: "bosses",

  stats: {
    HP: "400",
    STAM: "120",
    SPD: "35",
    DEF: "0",
  },

  skills: [
    {
      id: "throw_up",
      name: "THROW UP",
      weight: 50,
      description: "Throws up on you, ew.",
      staminaCost: 30,
      target: "enemy",
      damage: 40,
      staminaDamage: 20,
      effectId: "dombis-spit",
      attackType: "ranged",
      ranged: true,
    },
    {
      id: "hard_slap",
      name: "HARD SLAP",
      weight: 50,
      description: "Spins around and slaps your cheek so hard you get bruised.",
      staminaCost: 36,
      target: "enemy",
      damage: 35,
      staminaDamage: 5,
      effectId: null,
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-dombis-front",
    right: "knowledge-dombis-right",
    back: "knowledge-dombis-back",
    left: "knowledge-dombis-left",
  },

  icon: "knowledge-dombis-icon",
};

const judson = {
  id: "judson",
  name: "JUDSON",
  category: "bosses",

  stats: {
    HP: "300",
    STAM: "100",
    SPD: "80",
    DEF: "5",
  },

  skills: [
    {
      id: "potion_throw",
      name: "THROW POTION",
      weight: 50,
      description: "His potion blows you up.",
      staminaCost: 20,
      target: "enemy",
      damage: 40,
      staminaDamage: 10,
      effectId: null,
      attackType: "ranged",
      ranged: true,
    },
    {
      id: "right_hook",
      name: "RIGHT HOOK",
      weight: 50,
      description: "Right hook knocks the wind out of you.",
      staminaCost: 30,
      target: "enemy",
      damage: 30,
      staminaDamage: 5,
      effectId: null,
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-judson-front",
    right: "knowledge-judson-right",
    back: "knowledge-judson-back",
    left: "knowledge-judson-left",
  },

  icon: "knowledge-judson-icon",
};

const alpha = {
  id: "alpha",
  name: "ALPHA",
  category: "bosses",

  stats: {
    HP: "250",
    STAM: "150",
    SPD: "50",
    DEF: "0",
  },

  skills: [
    {
      id: "long_slap",
      name: "LONG SLAP",
      weight: 70,
      description: "Extremely long hands reach down to slap you.",
      staminaCost: 30,
      target: "enemy",
      damage: 30,
      staminaDamage: 25,
      effectId: "alpha-long-slap",
      attackType: "ranged",
      ranged: true,
    },
    {
      id: "step_on_you",
      name: "STEP ON YOU",
      weight: 30,
      description: "Steps on you with tremendous force.",
      staminaCost: 40,
      target: "enemy",
      damage: 20,
      staminaDamage: 10,
      effectId: null,
      attackType: "melee",
    },
  ],

  sprites: {
    front: "knowledge-alpha-front",
    right: "knowledge-alpha-right",
    back: "knowledge-alpha-back",
    left: "knowledge-alpha-left",
  },

  icon: "knowledge-alpha-icon",
};

export const mobs = [walker, runner, brute, dombis, alpha, judson];

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
