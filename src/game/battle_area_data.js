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
};

export function getBattleArea(areaId) {
  let area = battleAreas[areaId];

  if (!area) {
    area = battleAreas["school-hallway"];
  }

  return area;
}