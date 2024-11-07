const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');

    // Create Help Menu
    const helpMenu = Menu.buildFromTemplate([
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Learn More',
                    click: () => {
                        require('electron').shell.openExternal('https://example.com/learn-more');
                    }
                },
                {
                    label: 'Documentation',
                    click: () => {
                        require('electron').shell.openExternal('https://example.com/documentation');
                    }
                },
                {
                    label: 'Community Discussions',
                    click: () => {
                        require('electron').shell.openExternal('https://example.com/community');
                    }
                },
                {
                    label: 'Search Issues',
                    click: () => {
                        require('electron').shell.openExternal('https://example.com/search-issues');
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(helpMenu);
}

app.on('ready', () => {
    createWindow();
    autoUpdater.checkForUpdatesAndNotify();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
