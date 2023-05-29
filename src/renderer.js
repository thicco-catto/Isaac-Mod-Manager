// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.
let modList;
let dualListBox;
let shownMod;


function convertSMLtoHTML(smlString) {
    //smlString = smlString.replace("\n", "__ENTER__")
    smlString = smlString
        .replace(/(\[\/?(?:list|table|tr|th)\])\n/gm, '$1')
        .replace(/\n(\[\*\])/gm, '$1');
    
    var htmlString = smlString
        .replace(/\[b\](.*?)\[\/b\]/gs, '<b class="mod-description">$1</b>')
        .replace(/\[i\](.*?)\[\/i\]/gs, '<em>$1</em>')
        .replace(/\[u\](.*?)\[\/u\]/gs, '<u>$1</u>')
        .replace(/\[strike\](.*?)\[\/strike\]/gs, '<strike>$1</strike>')
        .replace(/\[color=(.*?)\](.*?)\[\/color\]/gs, '<span style="color:$1;">$2</span>')
        .replace(/\[h1\](.*?)\[\/h1\]/gs, '<h1 class="mod-description">$1</h1>')
        .replace(/\[h2\](.*?)\[\/h2\]/gs, '<h2 class="mod-description">$1</h2>')
        .replace(/\[h3\](.*?)\[\/h3\]/gs, '<h3 class="mod-description">$1</h3>')
        .replace(/\[url=(.*?)\](.*?)\[\/url\]/gs, '<a href="$1">$2</a>')
        .replace(/\[url\](.*?)\[\/url\]/g, '<a href="$1">$1</a>')
        .replace(/\[img\](.*?)\[\/img\]/g, '<img class="mod-description" src="$1" alt="Image">')
        .replace(/\[list\]/g, '<ul>')
        .replace(/\[\/list\]/g, '</ul>')
        .replace(/\[list\]/g, '<ol>')
        .replace(/\[\/list\]/g, '</ol>')
        .replace(/\[\*\](.*?)(?=\[\*\]|\[list\]|\[\/list\]|$)/gms, '<li>$1</li>')
        .replace(/\[table\]([\s\S]*?)\[\/table\]/g, '<table class="mod-description">$1</table>')
        .replace(/\[tr\]([\s\S]*?)\[\/tr\]/g, '<tr class="mod-description">$1</tr>')
        .replace(/\[td\]([\s\S]*?)\[\/td\]/g, '<td class="mod-description">$1</td>')
        .replace(/\[th\]([\s\S]*?)\[\/th\]/g, '<th class="mod-description">$1</th>')
        .replace(/\[code\]([\s\S]*?)\[\/code\]/g, '<div class="mod-description-code-box"><code class="mod-description">$1</code></div>')
        .replace(/\n/gm, '<br>')
        .replace(/\[spoiler\](.*?)\[\/spoiler\]/g, '<span class="spoiler">$1</span>');
    return htmlString;
  }


function UpdateModInfo(mod) {
    const modNameElement = document.getElementById('mod-name');
    modNameElement.textContent = `${mod.name} [${mod.version}]`;

    const modDescElement = document.getElementById('mod-description');
    const description = convertSMLtoHTML(mod.description)
    modDescElement.innerHTML = description;
}


window.addEventListener("DOMContentLoaded", async () => {
    modList = await window.electronAPI.requestModList()
    modList.sort((a, b) => a.Name > b.Name);

    dualListBox = new DualListbox("#mods-selector", {
        addEvent: function (value) {
            const mod = modList.find(x => x.path === value);
            mod.active = true;
        },
        removeEvent: function (value) {
            const mod = modList.find(x => x.path === value);
            mod.active = false;
        },
        clickEvent: function (value) {
            console.log(value);
            if(value === shownMod) {
                return;   
            }

            shownMod = value;
            const mod = modList.find(x => x.path === value);
            UpdateModInfo(mod);
        },
        availableTitle: "Disabled mods",
        selectedTitle: "Active mods",
        addButtonText: ">",
        removeButtonText: "<",
        addAllButtonText: ">>",
        removeAllButtonText: "<<",
    
        sortable: true,
        sortFunction: function (a, b) {
            return a.text > b.text;
        },
        draggable: false,
    
        options: modList.map(mod => {
            return {
                text: mod.name,
                value: mod.path,
                selected: mod.active
            }   
        }),
    });
});


const applyButton = document.getElementById("apply");
applyButton.addEventListener("click", () => {
    window.electronAPI.saveModList(modList);
});


window.electronAPI.onRequestPageModList((_, purpose) => {
    if(purpose === "apply") {
        window.electronAPI.saveModList(modList);
    }else if(purpose === "export") {
        window.electronAPI.exportModList(modList);
    }else if(purpose === "load") {
        window.electronAPI.loadModList(modList);
    }
});


window.electronAPI.onUpdateModList((_, newModList) => {
    modList = newModList;

    modList.sort((a, b) => a.Name > b.Name);
    const options = modList.map(mod => {
        return {
            text: mod.name,
            value: mod.path,
            selected: mod.active
        }   
    });
    dualListBox.options = options;
    dualListBox.redraw();
});