const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Database initialization
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'latchai.db');
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables(db);
  
  return db;
}

function createTables(db) {
  // User profile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      location TEXT,
      occupation TEXT,
      bio TEXT,
      dating_goals TEXT,
      personality_data TEXT, -- JSON string
      communication_style TEXT, -- JSON string
      interests TEXT, -- JSON string
      values TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Matches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      location TEXT,
      occupation TEXT,
      bio TEXT,
      profile_data TEXT, -- JSON string with prompts and answers
      photos TEXT, -- JSON array of photo descriptions
      interests TEXT, -- JSON string
      compatibility_score REAL,
      conversation_status TEXT DEFAULT 'active', -- active, stalled, archived
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Conversations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      sender TEXT NOT NULL, -- 'user' or 'match'
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      sentiment TEXT, -- positive, neutral, negative
      engagement_level TEXT, -- high, medium, low
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  // AI suggestions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      suggestion_type TEXT NOT NULL, -- opener, response, rescue, date_invite
      content TEXT NOT NULL,
      context TEXT, -- What conversation state prompted this
      tone TEXT, -- conservative, balanced, confident
      rating INTEGER, -- User feedback 1-5
      used BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  // Library table (saved content)
  db.exec(`
    CREATE TABLE IF NOT EXISTS library (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL, -- openers, questions, humor, transitions, date_ideas
      title TEXT,
      content TEXT NOT NULL,
      tags TEXT, -- JSON array
      effectiveness_rating REAL,
      times_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Conversation analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      metric_type TEXT NOT NULL, -- response_time, message_length, engagement, health
      metric_value TEXT NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables created successfully');
}

module.exports = { initDatabase };
