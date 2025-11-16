const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('../database/json-db');

let mainWindow;
let db;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Initialize database
  db = initDatabase();
  
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// User Profile handlers
ipcMain.handle('create-user-profile', async (event, profile) => {
  return db.createUserProfile(profile);
});

ipcMain.handle('get-user-profile', async () => {
  return db.getUserProfile();
});

ipcMain.handle('update-user-profile', async (event, profile) => {
  return db.updateUserProfile(profile);
});

// Match handlers
ipcMain.handle('add-match', async (event, match) => {
  return db.addMatch(match);
});

ipcMain.handle('get-matches', async () => {
  return db.getMatches();
});

ipcMain.handle('get-match', async (event, id) => {
  return db.getMatch(id);
});

ipcMain.handle('update-match', async (event, id, match) => {
  return db.updateMatch(id, match);
});

ipcMain.handle('delete-match', async (event, id) => {
  db.deleteMatch(id);
  return { success: true };
});

// Conversation handlers
ipcMain.handle('add-message', async (event, message) => {
  return db.addMessage(message);
});

ipcMain.handle('get-conversation', async (event, matchId) => {
  return db.getConversation(matchId);
});

// Placeholder handlers for AI services (to be implemented)
ipcMain.handle('generate-suggestions', async (event, context) => {
  // TODO: Implement OpenAI integration
  return { suggestions: [] };
});

ipcMain.handle('analyze-conversation', async (event, conversation) => {
  // TODO: Implement conversation analysis
  return { analysis: {} };
});

ipcMain.handle('get-compatibility-score', async (event, userProfile, matchProfile) => {
  // TODO: Implement compatibility scoring
  return { score: 0 };
});

// Library handlers
ipcMain.handle('save-to-library', async (event, item) => {
  return db.saveToLibrary(item);
});

ipcMain.handle('get-library-items', async (event, category) => {
  return db.getLibraryItems(category);
});