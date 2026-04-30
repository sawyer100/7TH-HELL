import { Boot } from "./scenes/Boot";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { AUTO, Game } from "phaser";

const config = {
  type: AUTO,
  pixelArt: true,
  // we're using RESIZE scale mode so, this is jsut the efault width and height, itll auto-change when the game starts dont worry abt this
  width: 1280,
  height: 720,
  parent: "game-container",
  backgroundColor: "#000000",
  scale: {
    //automatically size to the entire screen
    mode: Phaser.Scale.RESIZE,
    //centers hegith and width
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },

  // to make a scene playable, import the scene's .js file and put it in here
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;
