const { existsSync, readdirSync, statSync, unlinkSync, openSync, closeSync } = require("fs");
const { join } = require("path");
const { GetModStateFromPath } = require("./modState");

//Reads the mods folder and returns all the currently loaded mods.
exports.LoadModStates = function LoadModStates(modsPath) {
    const mods = [];

    readdirSync(modsPath).forEach(file => {
        const fullFilePath = join(modsPath, file);
        const fileInfo = statSync(fullFilePath);

        if(!fileInfo.isDirectory()){ return; }

        const metadataPath = join(fullFilePath, "metadata.xml");
        if(!existsSync(metadataPath)){ return; }

        const modState = GetModStateFromPath(fullFilePath);
        mods.push(modState);
    });

    return mods;
}

exports.SaveModStates = function SaveModStates(modStates) {
    modStates.forEach(modState => {
        const disablePath = join(modState.path, "disable.it");

        if(modState.active) {
            if(existsSync(disablePath)) {
                unlinkSync(disablePath);
            }
        }else {
            closeSync(openSync(disablePath, 'w'));
        }
    });
}