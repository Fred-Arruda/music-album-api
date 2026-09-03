import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./banco.db', (error) => {
  if (error) {
    console.error('Database connection failed:', error.message);
    return;
  }

  console.log('Connected to SQLite database');
});

export function initializeDatabase() {
  const query = `
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 10),
      comment TEXT
    )
  `;

  return new Promise((resolve, reject) => {
    db.run(query, (error) => {
      if (error) {
        reject(error);
        return;
      }

      console.log('Database initialized');
      resolve();
    });
  });
}

export default db;