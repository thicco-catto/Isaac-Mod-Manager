const { app, BrowserWindow, ipcMain, Menu, dialog, MenuItem } = require("electron");
const { join, dirname } = require("path");
const { LoadModStates, SaveModStates } = require("./src/modManager");
const { WriteModCollectionFile, SetActiveModsFromCollectionFile } = require("./src/modCollection");
const { LoadConfig, SaveConfig } = require("./src/config");

let modsPath = "";
let lastModCollectionFolder = "";
let recentLoadedModCollections = [];

let mainWindow
let recentPathsSubmenu

function handleGettingModList() {
	return LoadModStates(modsPath);
}

function onSaveModList(_, modList) {
	SaveModStates(modList);
}


async function onExportModList(_, modList) {
	const path = await dialog.showSaveDialog(null, {
		defaultPath: lastModCollectionFolder,
		filters: [
			{
				name: "Isaac Mod Collection",
				extensions: ["imc"]
			}
		],
		properties: [
			"createDirectory",
			"dontAddToRecent"
		]
	});
	if(path.canceled){ return; }

	lastModCollectionFolder = dirname(path.filePath);
	WriteModCollectionFile(modList, path.filePath);
}


function UpdateRecentPaths(path) {
	if(recentLoadedModCollections.includes(path)){
		const index = recentLoadedModCollections.indexOf(path);
		recentLoadedModCollections.splice(index, 1);
	}

	recentLoadedModCollections.unshift(path);

	recentLoadedModCollections.slice(0, 10);

	recentPathsSubmenu.clear();
	const newSubmenu = GetRecentPathsSubmenu();
	newSubmenu.forEach(x => {
		recentPathsSubmenu.append(new MenuItem(x))
	});
}


function LoadModList(modList, path) {
	UpdateRecentPaths(path);

	SetActiveModsFromCollectionFile(modList, path);
	SaveModStates(modList);
	mainWindow.webContents.send('update-mod-list', modList);
}


async function onLoadModList(_, modList) {
	const path = await dialog.showOpenDialog(null, {
		defaultPath: lastModCollectionFolder,
		filters: [
			{
				name: "Isaac Mod Collection",
				extensions: ["imc"]
			}
		],
		properties: [
			"openFile",
			"dontAddToRecent"
		]
	});
	if(path.canceled) { return; }

	lastModCollectionFolder = dirname(path.filePaths[0]);
	LoadModList(modList, path.filePaths[0]);
}


function onLoadMosListFromPath(_, modList, path) {
	LoadModList(modList, path)
}


function reloadModsFromFolder() {
	const modStates = LoadModStates(modsPath);
	mainWindow.webContents.send('update-mod-list', modStates);
}


async function changeModsPath() {
	const path = await dialog.showOpenDialog(null, {
		defaultPath: modsPath,
		properties: [
			"openDirectory",
			"dontAddToRecent"
		]
	});

	if(path.canceled){ return; }

	modsPath = path.filePaths[0];
	const modStates = LoadModStates(modsPath);
	mainWindow.webContents.send('update-mod-list', modStates);
}


function GetRecentPathsSubmenu() {
	return recentLoadedModCollections.map(path => ({
		label: path,
		click: () => mainWindow.webContents.send('request-page-mod-list', "load-recent", path)
	}))
}


function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		webPreferences: {
			preload: join(__dirname, "src", "preload.js"),
		},
		height: 600,
		width: 800,
	});

	// and load the index.html of the app.
	mainWindow.loadFile(join(__dirname, "index.html"));

	const menuTemplate = [
		{
			label: "File",
			submenu: [
				{ label: "Apply", click: () => mainWindow.webContents.send('request-page-mod-list', "apply") },
				{ label: "Export", click: () => mainWindow.webContents.send('request-page-mod-list', "export") },
				{ label: "Load", click: () => mainWindow.webContents.send('request-page-mod-list', "load") },
				{ label: "Load Recent", submenu: GetRecentPathsSubmenu()},
				{ type: 'separator' },
				{ label: "Reload Mods", click: () => reloadModsFromFolder()},
				{ label: "Change Mods Path", click: async () => await changeModsPath()}
			]
		},
	];
	const menu = Menu.buildFromTemplate(menuTemplate);
	recentPathsSubmenu = menu.items[0].submenu.items[3].submenu
	Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	const config = LoadConfig();
	modsPath = config.modsPath;
	lastModCollectionFolder = config.lastModCollectionFolder;
	recentLoadedModCollections = config.recentLoadedModCollections;

	ipcMain.handle("request-mod-list", handleGettingModList);

	ipcMain.on('save-mod-list', onSaveModList);
	ipcMain.on('export-mod-list', onExportModList);
	ipcMain.on('load-mod-list', onLoadModList);
	ipcMain.on('load-mod-list-from-path', onLoadMosListFromPath)

	createWindow();

	app.on("activate", function () {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	SaveConfig(
		modsPath,
		lastModCollectionFolder,
		recentLoadedModCollections
	);

	if (process.platform !== "darwin") {
		app.quit();
	}
});