// OPENS INDEXED.DB, READS IT AND LOADS IT BACK INTO THE GAME ON STARTUP
// ALSO SAVES DATA TO THE DB

// playable characters you can save to playableTeam if i remember to use this
// DONT CHANGE PLS
const playable_characters = {
  kim: {
    displayName: "Kim",
    defaultHealth: 80,
  },
  meryl: {
    displayName: "Meryl",
    defaultHealth: 80,
  },
};

const db_version = 1;
const settings_store = "settings";
const game_data_store = "game";

//default settings for new player to be saved
export const default_game_settings = {
  saveVer: 1,
  musicVol: 100,
  sfxVol: 100,
  dialogueVol: 100,
  brightness: 50,
  contrast: 50,
  resolution: "auto",
};

// default game data for new players
export const default_game_data = {
  saveVer: 1,

  currentStoryState: {
    chapterName: "introduction-potion",
    chapterObjective: null,
    checkPoint: null,
  },

  //more than 1 character on team, so support multiple characters and their stats
  // there are set characters
  // this is the default data so kim should be here
  playableTeam: [{ ...playable_characters.kim }],
  encounteredEnemies: [],
  inventory: {
    consumables: [],
    weapons: [],
  },
};


// LOADING AND SAVING

//open and return db details
export function open() {
  return new Promise((res, rej) => {
    // get the "7th-hell" db from client brwoser
    const req = window.indexedDB.open("7th-hell", db_version);

    req.onupgradeneeded = () => {
      const db = req.result;

      // make settings db if doesnt exist
      if (!db.objectStoreNames.contains(settings_store)) {
        // console.log(db.objectStoreNames)
        // console.log(db.objectStoreNames.contains(settings_store))
        db.createObjectStore(settings_store);
      }

      // make game data if doesnt exist
      if (!db.objectStoreNames.contains(game_data_store)) {
        db.createObjectStore(game_data_store);
      }
    };

    req.onsuccess = () => {
      const db = req.result;
      // console.log(db)
      res(db);
    };

    req.onerror = () => {
      console.error(req.error);
      rej(req.error);
    };
  });
}
