import StartGame from "./game/main";

// data base start
import { s } from "./game/db";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // start db
    const loaded = await s();
    console.log("PLAYER DATA:");
    console.log(loaded)
  } catch (error) {
    // error handled in db.js already
  }

  StartGame("game-container");
});
