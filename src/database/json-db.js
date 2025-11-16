const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class JsonDatabase {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'latchai-data.json');
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(rawData);
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
    
    // Return default structure
    return {
      userProfile: null,
      matches: [],
      conversations: {},
      suggestions: [],
      library: [],
      analytics: [],
      settings: {}
    };
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving database:', error);
      return false;
    }
  }

  // User Profile
  createUserProfile(profile) {
    profile.id = 1;
    profile.created_at = new Date().toISOString();
    profile.updated_at = new Date().toISOString();
    this.data.userProfile = profile;
    this.save();
    return profile;
  }

  getUserProfile() {
    return this.data.userProfile;
  }

  updateUserProfile(profile) {
    if (this.data.userProfile) {
      profile.updated_at = new Date().toISOString();
      this.data.userProfile = { ...this.data.userProfile, ...profile };
      this.save();
    }
    return this.data.userProfile;
  }

  // Matches
  addMatch(match) {
    match.id = this.data.matches.length > 0 
      ? Math.max(...this.data.matches.map(m => m.id)) + 1 
      : 1;
    match.created_at = new Date().toISOString();
    match.updated_at = new Date().toISOString();
    match.conversation_status = match.conversation_status || 'active';
    
    this.data.matches.push(match);
    this.data.conversations[match.id] = [];
    this.save();
    return match;
  }

  getMatches() {
    return this.data.matches.filter(m => m.conversation_status !== 'archived');
  }

  getMatch(id) {
    return this.data.matches.find(m => m.id === id);
  }

  updateMatch(id, matchData) {
    const index = this.data.matches.findIndex(m => m.id === id);
    if (index !== -1) {
      matchData.updated_at = new Date().toISOString();
      this.data.matches[index] = { ...this.data.matches[index], ...matchData };
      this.save();
      return this.data.matches[index];
    }
    return null;
  }

  deleteMatch(id) {
    const index = this.data.matches.findIndex(m => m.id === id);
    if (index !== -1) {
      this.data.matches.splice(index, 1);
      delete this.data.conversations[id];
      this.save();
      return true;
    }
    return false;
  }

  // Conversations
  addMessage(message) {
    const matchId = message.match_id;
    if (!this.data.conversations[matchId]) {
      this.data.conversations[matchId] = [];
    }
    
    message.id = this.data.conversations[matchId].length > 0
      ? Math.max(...this.data.conversations[matchId].map(m => m.id)) + 1
      : 1;
    message.timestamp = message.timestamp || new Date().toISOString();
    
    this.data.conversations[matchId].push(message);
    this.save();
    return message;
  }

  getConversation(matchId) {
    return this.data.conversations[matchId] || [];
  }

  updateMessage(matchId, messageId, messageData) {
    if (this.data.conversations[matchId]) {
      const index = this.data.conversations[matchId].findIndex(m => m.id === messageId);
      if (index !== -1) {
        this.data.conversations[matchId][index] = { 
          ...this.data.conversations[matchId][index], 
          ...messageData 
        };
        this.save();
        return this.data.conversations[matchId][index];
      }
    }
    return null;
  }

  // Library
  saveToLibrary(item) {
    item.id = this.data.library.length > 0
      ? Math.max(...this.data.library.map(i => i.id)) + 1
      : 1;
    item.created_at = new Date().toISOString();
    item.times_used = item.times_used || 0;
    
    this.data.library.push(item);
    this.save();
    return item;
  }

  getLibraryItems(category) {
    if (category) {
      return this.data.library.filter(item => item.category === category);
    }
    return this.data.library;
  }

  // Settings
  getSetting(key) {
    return this.data.settings[key];
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
    return value;
  }

  // Get all data
  getData() {
    return this.data;
  }

  // Save data
  saveData(data) {
    this.data = data;
    this.save();
  }
}

let dbInstance = null;

function initDatabase() {
  if (!dbInstance) {
    dbInstance = new JsonDatabase();
  }
  return dbInstance;
}

module.exports = { initDatabase };
