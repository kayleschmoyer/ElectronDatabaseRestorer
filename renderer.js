const { remote, ipcRenderer, Menu } = require('electron');
const sql = require('mssql');
const fs = require('fs');

// Initialize the dropdowns when the document loads
document.addEventListener('DOMContentLoaded', function() {
    const elems = document.querySelectorAll('select');
    M.FormSelect.init(elems);
    createMenu();
});

// Handle "Shop or Office?" dropdown change to populate version dropdown
document.getElementById('databaseType').addEventListener('change', function() {
    const versionSelect = document.getElementById('version');
    versionSelect.innerHTML = "";  // Clear previous options

    if (this.value === "Shop") {
        versionSelect.innerHTML = `
            <option value="9.0">9.0</option>
            <option value="9.2">9.2</option>
        `;
    } else if (this.value === "Office") {
        versionSelect.innerHTML = `
            <option value="6.0">6.0</option>
            <option value="6.2">6.2</option>
        `;
    }
    M.FormSelect.init(versionSelect);  // Re-initialize Materialize select
});

// Handle "Start the Magic!" button click
document.getElementById('restoreButton').addEventListener('click', async () => {
    const bakFileInput = document.getElementById('filePicker');
    const locationNameInput = document.getElementById('locationName');
    const databaseTypeSelect = document.getElementById('databaseType');
    const versionSelect = document.getElementById('version');

    if (!bakFileInput.files.length) {
        alert("Please select a .bak file first");
        return;
    }

    const bakFilePath = bakFileInput.files[0].path;
    let locationName = locationNameInput.value.trim();
    const databaseType = databaseTypeSelect.value;
    const version = versionSelect.value;

    if (!locationName || !databaseType || !version) {
        appendLog("Please fill all fields before starting the magic.", "red");
        return;
    }

    // Validate location name
    locationName = validateLocationName(locationName);

    // Folder paths
    const dataFolderPath = `E:\\SQLData\\${databaseType}\\${locationName}`;
    const logFolderPath = `F:\\${databaseType}\\${locationName}`;

    // Create folders if they do not exist
    createFolderIfNotExists(dataFolderPath, `Data folder created: ${dataFolderPath}`);
    createFolderIfNotExists(logFolderPath, `Log folder created: ${logFolderPath}`);

    // Set up SQL Server connection config
    const config = {
        user: 'vastoffice',
        password: 'snowdrift',
        server: 'USATSVASTSQL02\\VASTOFFICE',
        database: 'master',
        options: {
            encrypt: true,
            trustServerCertificate: true,
        }
    };

    try {
        appendLog("Connecting to SQL Server...", "lightblue");
        await sql.connect(config);

        const databaseName = `VastOffice_${locationName}_${version}`;
        const restoreQuery = `
            RESTORE DATABASE [${databaseName}] 
            FROM DISK = '${bakFilePath}' 
            WITH MOVE 'LogicalName_Data' TO '${dataFolderPath}\\${databaseName}.mdf', 
                 MOVE 'LogicalName_Log' TO '${logFolderPath}\\${databaseName}_log.ldf'`;

        appendLog("Restoring the database...", "lightblue");
        await sql.query(restoreQuery);
        appendLog("Success! Your database was restored like magic! ✨", "green");
    } catch (err) {
        appendLog(`Error: ${err.message}`, "red");
    } finally {
        sql.close();
    }
});

// Minimize and Close button actions
document.getElementById('minimizeButton').addEventListener('click', () => {
    ipcRenderer.send('minimize-window');
});

document.getElementById('closeButton').addEventListener('click', () => {
    ipcRenderer.send('close-window');
});

// Helper functions
function validateLocationName(locationName) {
    const invalidChars = `\\/:*?"<>|'.[](),;!@#$%^&+=\`~{} `;
    locationName = locationName.replace(/ /g, "_");
    for (const char of invalidChars) {
        locationName = locationName.split(char).join("");
    }
    return locationName;
}

function createFolderIfNotExists(folderPath, successMessage) {
    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            appendLog(successMessage, "lightgreen");
        } catch (err) {
            appendLog(`Error creating folder: ${err.message}`, "red");
        }
    } else {
        appendLog(`Folder already exists: ${folderPath}`, "orange");
    }
}

function appendLog(message, color) {
    const logArea = document.getElementById('logArea');
    const logMessage = document.createElement('div');
    logMessage.style.color = color;
    logMessage.textContent = message;
    logArea.appendChild(logMessage);
    logArea.scrollTop = logArea.scrollHeight;
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { label: 'New', click: () => appendLog('New file created', 'lightblue') },
                { label: 'Open', click: () => appendLog('Open file', 'lightblue') },
                { label: 'Save', click: () => appendLog('Save file', 'lightblue') },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Documentation',
                    click: () => {
                        appendLog('Opening documentation...', 'lightblue');
                    }
                },
                {
                    label: 'About',
                    click: () => {
                        appendLog('SQL Backup Restorer - Version 1.0', 'lightblue');
                    }
                }
            ]
        }
    ];
    
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
