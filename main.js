const { app, BrowserWindow, ipcMain, Menu, dialog } = require("electron");
const { join } = require("path");
const { LoadModStates, SaveModStates } = require("./src/modManager");
const { WriteModCollectionFile, SetActiveModsFromCollectionFile } = require("./src/modCollection");

const DEFAULT_MODS_PATH = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\The Binding of Isaac Rebirth\\mods";
let modsPath = "";
let mainWindow

function handleGettingModList() {
	return LoadModStates(modsPath);
}

function onSaveModList(_, modList) {
	SaveModStates(modList);
}


async function onExportModList(_, modList) {
	const path = await dialog.showSaveDialog(null, {
		defaultPath: __dirname,
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

	WriteModCollectionFile(modList, path.filePath);
}


async function onLoadModList(_, modList) {
	const path = await dialog.showOpenDialog(null, {
		defaultPath: __dirname,
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

	SetActiveModsFromCollectionFile(modList, path.filePaths[0]);
	SaveModStates(modList);
	mainWindow.webContents.send('update-mod-list', modList);
}


function reloadModsFromFolder() {
	const modStates = LoadModStates(modsPath);
	mainWindow.webContents.send('update-mod-list', modStates);
}


async function changeModsPath() {
	const path = await dialog.showOpenDialog(null, {
		defaultPath: __dirname,
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
				{ type: 'separator' },
				{ label: "Reload Mods", click: () => reloadModsFromFolder()},
				{ label: "Change Mods Path", click: async () => await changeModsPath()}
			]
		},
	];
	let menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);

	mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	modsPath = DEFAULT_MODS_PATH;

	ipcMain.handle("request-mod-list", handleGettingModList);

	ipcMain.on('save-mod-list', onSaveModList);
	ipcMain.on('export-mod-list', onExportModList);
	ipcMain.on('load-mod-list', onLoadModList);

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
	if (process.platform !== "darwin") {
		app.quit();
	}
});