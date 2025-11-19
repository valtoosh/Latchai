const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('../database/json-db');
const AIService = require('../services/ai-service');

let mainWindow;
let db;
let aiService;

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
  
  // Initialize AI service
  aiService = new AIService();
  
  // Load saved AI settings
  const savedSettings = db.getData().settings || {};
  if (savedSettings.aiProvider) {
    aiService.setProvider(savedSettings.aiProvider);
  }
  if (savedSettings.geminiApiKey) {
    aiService.setGeminiApiKey(savedSettings.geminiApiKey);
  }
  if (savedSettings.ollamaUrl && savedSettings.ollamaModel) {
    aiService.setOllamaConfig(savedSettings.ollamaUrl, savedSettings.ollamaModel);
  }
  
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

// AI Chat handlers
ipcMain.handle('ai-chat', async (event, { messages, matchId }) => {
  try {
    let matchContext = {
      userProfile: db.getUserProfile(),
      personalityAssessment: db.getPersonalityAssessment()
    };
    
    // If matchId is provided, try to get match context
    if (matchId) {
      const match = db.getMatch(matchId);
      if (match) {
        const conversation = db.getConversation(matchId);
        const lastUserMessage = messages.length > 0 ? messages[messages.length - 1].content : '';
        matchContext.match = match;
        matchContext.conversation = conversation;
        matchContext.lastMessage = lastUserMessage;
      }
    }
    
    const response = await aiService.chat(messages, matchContext);
    return { success: true, message: response };
  } catch (error) {
    console.error('AI chat error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-suggestions', async (event, matchId) => {
  try {
    const match = db.getMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }
    
    const conversation = db.getConversation(matchId);
    const userProfile = db.getUserProfile();
    const personalityAssessment = db.getPersonalityAssessment();
    
    const matchContext = { 
      match, 
      conversation,
      userProfile,
      personalityAssessment
    };
    
    const suggestions = await aiService.getSuggestions(matchContext);
    return { success: true, suggestions };
  } catch (error) {
    console.error('Generate suggestions error:', error);
    return { success: false, error: error.message };
  }
});

// AI Settings handlers
ipcMain.handle('get-ai-settings', async () => {
  if (!db) {
    return {
      provider: 'gemini',
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2:3b'
    };
  }
  
  const settings = db.getData().settings || {};
  return {
    provider: settings.aiProvider || 'gemini',
    geminiApiKey: settings.geminiApiKey || process.env.GEMINI_API_KEY || '',
    ollamaUrl: settings.ollamaUrl || 'http://localhost:11434',
    ollamaModel: settings.ollamaModel || 'llama3.2:3b'
  };
});

ipcMain.handle('save-ai-settings', async (event, settings) => {
  if (!db) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const data = db.getData();
    data.settings = data.settings || {};
    data.settings.aiProvider = settings.provider;
    data.settings.geminiApiKey = settings.geminiApiKey || '';
    data.settings.ollamaUrl = settings.ollamaUrl || 'http://localhost:11434';
    data.settings.ollamaModel = settings.ollamaModel || 'llama3.2:3b';
    db.saveData(data);
    
    // Update AI service
    aiService.setProvider(settings.provider);
    if (settings.geminiApiKey) {
      aiService.setGeminiApiKey(settings.geminiApiKey);
    }
    if (settings.ollamaUrl && settings.ollamaModel) {
      aiService.setOllamaConfig(settings.ollamaUrl, settings.ollamaModel);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Save AI settings error:', error);
    return { success: false, error: error.message };
  }
});

// Library handlers
ipcMain.handle('save-to-library', async (event, item) => {
  return db.saveToLibrary(item);
});

ipcMain.handle('get-library-items', async (event, category) => {
  return db.getLibraryItems(category);
});

ipcMain.handle('save-personality-assessment', async (event, assessment) => {
  return db.savePersonalityAssessment(assessment);
});

ipcMain.handle('get-personality-assessment', async () => {
  return db.getPersonalityAssessment();
});