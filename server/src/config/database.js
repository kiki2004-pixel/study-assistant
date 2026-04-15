const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'study.db'));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1',
      priority INTEGER DEFAULT 1,
      exam_date TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      material_type TEXT NOT NULL,
      subject TEXT,
      extracted_text TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      material_id TEXT NOT NULL,
      summary_text TEXT NOT NULL,
      style TEXT NOT NULL,
      model_used TEXT,
      tokens_used INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_timetables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      school_timetable_id TEXT,
      subjects_json TEXT,
      schedule_json TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL
    );
  `);
  console.log('Database initialized');
}

module.exports = { db, initDatabase };
