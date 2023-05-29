const { writeFileSync, readFileSync } = require("fs");

exports.WriteModCollectionFile = function (modList, path) {
    const modCollection = modList.filter(mod => mod.active).map(mod => {
        return {
            name: mod.name,
            id: mod.id
        }
    })
    const modCollectionStr = JSON.stringify(modCollection);

    writeFileSync(path, modCollectionStr);
}

exports.SetActiveModsFromCollectionFile = function (modList, path) {
    modList.forEach(mod => mod.active = false);

    const fileContents = readFileSync(path);
    const modCollection = JSON.parse(fileContents);
    const modsFailed = [];

    modCollection.forEach(modToActivate => {
        let activated = false;

        if (modToActivate.id) {
            const mod = modList.find(mod => mod.id === modToActivate.id);
            if (mod) {
                mod.active = true;
                activated = true;
            }
        }

        if (!activated) {
            const mod = modList.find(mod => mod.name === modToActivate.name);
            if (mod) {
                mod.active = true;
                activated = true;
            }
        }

        if (!activated) {
            modsFailed.push(modToActivate);
        }
    });

    return modsFailed;
}