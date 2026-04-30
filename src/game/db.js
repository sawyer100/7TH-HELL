// WITH CLIENT INDEXED.DB, READS IT AND LOADS IT AND SAVES DATA

// playable characters you can save to playableTeam if i remember to use this
// DONT CHANGE PLS
const playable_characters = {
  kim: {
    displayName: "Kim",
    defaultHealth: 80,
  },
  maryl: {
    displayName: "Maryl",
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

//merging data, for example if we have new stats, merge the save w/ the new defaults
function mergeGame(data = {}) {
  if (!data) {
    data = {};
  }
  if (typeof data !== "object") {
    data = {};
  }

  // const r = {
  //   ...default_game_data,
  //   ...data,
  //   currentStoryState: {
  //     ...default_game_data.currentStoryState,
  //     ...(data.currentStoryState || {}),
  //   },
  //   inventory: {
  //     ...default_game_data.inventory,
  //     ...(data.inventory || {}),
  //   },
  // };

  return {
    ...default_game_data,
    ...data,
    currentStoryState: {
      ...default_game_data.currentStoryState,
      ...(data.currentStoryState || {}),
    },
    inventory: {
      ...default_game_data.inventory,
      ...(data.inventory || {}),
    },
  };
}

function mergeSetts(data = {}) {
  if (!data) {
    data = {};
  }
  if (typeof data !== "object") {
    data = {};
  }

  const r = {
    ...default_game_settings,
    ...data,
  };

  return r;
}

const getErrorTesting = false;

// OPEN DATAABSE
export function openDB() {
  return new Promise((res, rej) => {
    // get the "7th-hell" db from client brwoser
    const req = window.indexedDB.open("7th-hell", db_version);
    if (getErrorTesting) {
      dbWarn();
      rej(new Error("test failure for warning msg"));
      return;
    }

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

      // these 2 are differentt from no saved data or missing save data, this is if the store itself actually doesnt exist
    };

    req.onsuccess = () => {
      const db = req.result;
      // console.log(db)
      res(db);
    };

    req.onerror = () => {
      dbWarn();
      rej(new Error("error opening"));
    };
  });
}

// SAVE SETTINGS DATA
export async function saveSettings(data) {
  //get db
  const db = await openDB();
  // in case new defaults
  const settings_final = mergeSetts(data);

  return new Promise((res, rej) => {
    const tran = db.transaction(settings_store, "readwrite");
    const store = tran.objectStore(settings_store);
    const req = store.put(settings_final, "main");

    req.onsuccess = () => {
      res(settings_final);
    };

    req.onerror = () => {
      dbWarn();
      rej(new Error("error saving"));
    };
  });
}

// LOAD SETTINGS DATABSE
export async function loadSettings() {
  //gte db
  const db = await openDB();

  return new Promise((res, rej) => {
    const tran = db.transaction(settings_store, "readonly"); // dont need to write for loading
    const store = tran.objectStore(settings_store);
    const req = store.get("main");

    req.onsuccess = async () => {
      const settings_saved = req.result;
      // console.log("wekjhkjwerhw")

      // USE DEFAULT IF NO SAVED SETTINGS
      if (!settings_saved) {
        // console.log("wereirk")

        const def = mergeSetts();
        //save
        await saveSettings(def);
        res(def);
        return;
      }

      const settings_final = mergeSetts(settings_saved);
      res(settings_final);
    };

    req.onerror = () => {
      dbWarn();
      rej(new Error("error loading"));
    };
  });
}

// LOAD GAME DATA
export async function loadGameData() {
  const db = await openDB();

  return new Promise((res, rej) => {
    const tran = db.transaction(game_data_store, "readonly"); //dont need to write for loading
    const store = tran.objectStore(game_data_store);
    const req = store.get("main");

    req.onsuccess = async () => {
      const game_save = req.result;

      // USE DEFAULTS IF NO SAVED SETINGS
      if (!game_save) {
        const defaults = mergeGame();
        await saveGameData(defaults);
        res(defaults);
        return;
      }

      const game_save_final = mergeGame(game_save);
      res(game_save_final);
    };

    req.onerror = () => {
      dbWarn();
      rej(new Error("error loading"));
    };
  });
}

// SAVE GAME DATA
export async function saveGameData(data) {
  const db = await openDB();

  const game_save_final = mergeGame(data);

  return new Promise((res, rej) => {
    const tran = db.transaction(game_data_store, "readwrite");
    const store = tran.objectStore(game_data_store);
    const req = store.put(game_save_final, "main");

    req.onsuccess = () => {
      res(game_save_final);
    };

    req.onerror = () => {
      dbWarn();
      rej(new Error("error loading"));
    };
  });
}

// error
// if you cant openDB() + error, show this warning
function dbWarn() {
  const w = document.getElementById("db-warning");
  if (!w) return;

  w.hidden = false;
  // dont hide again after showing
}

// STARTUP
export async function s() {
  const settings = await loadSettings();
  const gameData = await loadGameData();
  // console.log(settings);
  // console.log(gameData);
  return {
    settings,
    gameData,
  };
}
