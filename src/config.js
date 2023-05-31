const { app } = require("electron");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const CONFIG_FILE = "config.json";

const WIN_REPENTANCE_MODS_PATH = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\The Binding of Isaac Rebirth\\mods";
const WIN_AFTERBIRTH_MODS_PATH = "\\My Games\\Binding of Isaac Afterbirth+ Mods"

function GetDefaultModsPath() {
    if(process.platform === "win32") {
        //Running on Windows

        if(existsSync(WIN_REPENTANCE_MODS_PATH)) {
            //Game is repentance on steam
            return WIN_REPENTANCE_MODS_PATH;
        }

        const documentsPath = app.getPath('documents');
        if(existsSync(join(documentsPath, WIN_AFTERBIRTH_MODS_PATH))) {
            //Game is afterbirth
            return WIN_AFTERBIRTH_MODS_PATH
        }

        //Couldn't find a default path for Windows
        return __dirname;
    }
}


function LoadConfigFromFile() {
    const configContents = readFileSync(CONFIG_FILE);
    const loaded = JSON.parse(configContents);
    const defaults = LoadConfigDefaults();

    //Modify defaults to add the loaded values
    //
    //We do this just in case in a future version the config has more values, so we load the default, instead of nothing.
    for (const key in defaults) {
        if (Object.hasOwnProperty.call(loaded, key)) {
            defaults[key] = loaded[key];
        }
    }

    return defaults;
}


function LoadConfigDefaults() {
    return {
        modsPath: GetDefaultModsPath(),
        lastModCollectionFolder: __dirname,
        recentLoadedModCollections: []
    }
}


exports.LoadConfig = function () {
    if (existsSync(CONFIG_FILE)) {
        return LoadConfigFromFile()
    } else {
        return LoadConfigDefaults()
    }
}

exports.SaveConfig = function (modsPath, lastModCollectionFolder, recentLoadedModCollections) {
    const config = {
        modsPath: modsPath,
        lastModCollectionFolder: lastModCollectionFolder,
        recentLoadedModCollections: recentLoadedModCollections
    }
    const jsonString = JSON.stringify(config);

    writeFileSync("config.json", jsonString);
}