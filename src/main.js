import StartGame from "./game/main";

// data base start
import { s } from "./game/db";

// before continuing make sure fonts are loaded before starting the game
// also if fonts dont load then show waraning saying fonts arent loaded so players arent confused
async function loadFonts() {
  await document.fonts.load('16px "Dogica"');
  await document.fonts.load('16px "DogicaBold"');
  await document.fonts.ready;
}
// async function loadFonts() {
//   throw new Error("test");
// }

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // start db
    const loaded = await s();
    console.log("PLAYER DATA:");
    console.log(loaded);
  } catch (error) {
    // error handled in db.js already
  }

  try {
    await loadFonts();
  } catch (error) {
    const w = document.getElementById("fonts-warning");
    if (w) {
      w.hidden = false;
    }
    //dont stop / use error so the startgame() still happens
  }

  StartGame("game-container");
});
