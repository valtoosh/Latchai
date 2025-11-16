const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // User profile
  createUserProfile: (profile) => ipcRenderer.invoke('create-user-profile', profile),
  getUserProfile: () => ipcRenderer.invoke('get-user-profile'),
  updateUserProfile: (profile) => ipcRenderer.invoke('update-user-profile', profile),
  
  // Matches
  addMatch: (match) => ipcRenderer.invoke('add-match', match),
  getMatches: () => ipcRenderer.invoke('get-matches'),
  getMatch: (id) => ipcRenderer.invoke('get-match', id),
  updateMatch: (id, match) => ipcRenderer.invoke('update-match', id, match),
  deleteMatch: (id) => ipcRenderer.invoke('delete-match', id),
  
  // Conversations
  addMessage: (message) => ipcRenderer.invoke('add-message', message),
  getConversation: (matchId) => ipcRenderer.invoke('get-conversation', matchId),
  updateMessage: (id, message) => ipcRenderer.invoke('update-message', id, message),
  
  // AI Services
  generateSuggestions: (context) => ipcRenderer.invoke('generate-suggestions', context),
  analyzeConversation: (conversation) => ipcRenderer.invoke('analyze-conversation', conversation),
  getCompatibilityScore: (userProfile, matchProfile) => ipcRenderer.invoke('get-compatibility-score', userProfile, matchProfile),
  
  // Library
  saveToLibrary: (item) => ipcRenderer.invoke('save-to-library', item),
  getLibraryItems: (category) => ipcRenderer.invoke('get-library-items', category)
});
