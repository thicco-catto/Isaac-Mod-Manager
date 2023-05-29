const { XMLParser } = require("fast-xml-parser");
const { existsSync, readFileSync } = require("fs");
const { join } = require("path");


class ModState {
    path;
    id;
    name;
    active;
    description;
    version;

    constructor(path, id, name, active, description, version){
        this.path = path;
        this.id = id;
        this.name = name;
        this.active = active;
        this.description = description ?? "";
        this.version = version ?? "1.0"
    }
}
exports.ModState = ModState


exports.GetModStateFromPath = function GetModStateFromPath(modPath) {
    const isDisabled = existsSync(join(modPath, "disable.it"));

    const metadataPath = join(modPath, "metadata.xml");
    const metadataContents = readFileSync(metadataPath, 'utf-8');

    const xmlParser = new XMLParser();
    const metadata = xmlParser.parse(metadataContents).metadata;

    return new ModState(modPath, metadata.id, metadata.name, !isDisabled, metadata.description)
}