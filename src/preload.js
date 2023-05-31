// All of the Node.js APIs are available in the preload process.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	//Main to renderer
	onUpdateModList: (modList) => ipcRenderer.on('update-mod-list', modList),
	onRequestPageModList: (purpose, path) => ipcRenderer.on('request-page-mod-list', purpose, path),

	//Renderer to main
	saveModList: (modList) => ipcRenderer.send('save-mod-list', modList),
	exportModList: (modList => ipcRenderer.send('export-mod-list', modList)),
	loadModList: (modList => ipcRenderer.send('load-mod-list', modList)),
	loadModListFromPath: ((modList, path) => ipcRenderer.send('load-mod-list-from-path', modList, path)),

	//Renderer asking from main
	requestModList: () => ipcRenderer.invoke('request-mod-list'),
});