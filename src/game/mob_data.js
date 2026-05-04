const walker = {
  id: "walker",
  name: "WALKER",
  category: "normal",

  stats: {
    DMG: "10",
    SPD: "70",
    CRIT: "1.1%",
  },

  skills: [
    {
      name: "Bite",
      description:
        "Skill Description Skill Description Skill Description Skill Description",
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
    DMG: "10",
    SPD: "90",
    CRIT: "1.1%",
  },

  skills: [
    {
      name: "Bite",
      description:
        "Skill Description Skill Description Skill Description Skill Description",
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
    DMG: "45",
    SPD: "25",
    CRIT: "0.4%",
  },

  skills: [
    {
      name: "Slam",
      description: "Heavy attack that does high damage but is slow.",
    },
    {
      name: "Charge",
      description: "Runs forward and tries to hit the player directly.",
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
    DMG: "80",
    SPD: "35",
    CRIT: "5%",
  },

  skills: [
    {
      name: "Hellfire",
      description: "Large area attack. Placeholder description for now.",
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