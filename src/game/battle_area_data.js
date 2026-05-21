export const battleAreas = {
  "school-hallway": {
    id: "school-hallway",
    openingBackground: "fight-opening-background",

    battleBackgroundLeft: "background-left",
    battleBackgroundCenter: "background-center",
    battleBackgroundRight: "background-right",

    backgroundColor: 0x050505,
    alarm: false,
  },

  "post-classroom-hallway": {
    id: "post-classroom-hallway",
    openingBackground: "fight-opening-background",

    battleBackgroundLeft: "background-left",
    battleBackgroundCenter: "background-center",
    battleBackgroundRight: "background-right",

    backgroundColor: 0x050505,
    alarm: true,
  },

  floor3: {
    id: "floor3",
    openingBackground: "floor-3-background",

    battleBackgroundLeft: "floor-3-background",
    battleBackgroundCenter: "floor-3-background",
    battleBackgroundRight: "floor-3-background",

    backgroundColor: 0x050505,
    alarm: false,
  },
  floor5: {
    id: "floor5",
    openingBackground: "floor-5-background",

    battleBackgroundLeft: "floor-5-background",
    battleBackgroundCenter: "floor-5-background",
    battleBackgroundRight: "floor-5-background",

    backgroundColor: 0x050505,
    alarm: false,
  },
};

export function getBattleArea(areaId) {
  let area = battleAreas[areaId];

  if (!area) {
    area = battleAreas["school-hallway"];
  }

  return area;
}
