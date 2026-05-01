import Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";
import { MainMenu } from "./scenes/MainMenu";

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
    },

    render: {
      pixelArt: true,
      antialias: false,
    },

    scene: [Preloader, MainMenu],
  });
}