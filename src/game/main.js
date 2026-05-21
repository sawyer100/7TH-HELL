import Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";
import { KnowledgeLogOverlay } from "./scenes/KnowledgeLog";
import { PauseMenuOverlay } from "./scenes/PauseMenu";
import { IntroductionPotion } from "./scenes/IntroductionPotion";
import { SettingsOverlay } from "./scenes/SettingsOverlay";
import { IdCard } from "./scenes/IdCard";
import { InventoryIconOverlay } from "./scenes/InventoryIconOverlay";
import { PostClassroomHallway } from "./scenes/PostClassroomHallway";
import { FightScene } from "./scenes/FightScene";
import { Classroom } from "./scenes/Classroom";
import { BattleScene } from "./scenes/BattleScene";
import { InventoryOverlay } from "./scenes/InventoryOverlay";
import { PostFirstBattle } from "./scenes/PostFirstBattle";
import { NewClassroom } from "./scenes/NewClassroom";
import { PostNewClassroomHallway } from "./scenes/PostNewClassroomHallway";
import { Stairwell } from "./scenes/Stairwell";
import { Floor2StartHallway } from "./scenes/Floor2StartHallway";
import { ReusableLootClassroom } from "./scenes/ReusableLootClassroom";
import { Floor3StartHallway } from "./scenes/Floor3StartHallway";
import {
  Floor4StartHallway,
  Floor4RestockClassroom,
} from "./scenes/Floor4StartHallway";
import { Floor5StartHallway } from "./scenes/Floor5BossHallway";

const GAME_WIDTH = 1600;
const GAME_HEIGHT = 900;

export default function StartGame(parent) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,

    backgroundColor: "#000000",

    scale: {
      parent,
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      expandParent: true,
    },

    render: {
      pixelArt: true,
      antialias: false,
    },

    scene: [
      Preloader,
      MainMenu,
      KnowledgeLogOverlay,
      IntroductionPotion,
      PauseMenuOverlay,
      SettingsOverlay,
      IdCard,
      Classroom,
      InventoryIconOverlay,
      PostClassroomHallway,
      PostFirstBattle,
      FightScene,
      BattleScene,
      InventoryOverlay,
      NewClassroom,
      PostNewClassroomHallway,
      Stairwell,
      Floor2StartHallway,
      ReusableLootClassroom,
      Floor3StartHallway,
      Floor4StartHallway,
      Floor4RestockClassroom,
      Floor5StartHallway,
    ], // every scene must be laoded here to work
  });
}
