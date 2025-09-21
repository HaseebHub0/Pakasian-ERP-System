const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

let db;

const initializeDatabase = async () => {
  const dbType = process.env.DB_TYPE || 'sqlite';
  
  if (dbType === 'postgresql') {
    // PostgreSQL connection
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'erp_db',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });

    // Test connection
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL database');
      client.release();
    } catch (err) {
      console.error('PostgreSQL connection error:', err);
      throw err;
    }

    db = pool;
  } else {
    // SQLite connection for local development
    const dbPath = path.join(__dirname, '../../data/erp.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('SQLite connection error:', err);
        throw err;
      }
      console.log('Connected to SQLite database');
    });
  }

  // Create tables if they don't exist
  await createTables();
};

const createTables = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createUsersTableSQLite = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    if (process.env.DB_TYPE === 'postgresql') {
      await db.query(createUsersTable);
    } else {
      await runQuery(createUsersTableSQLite);
    }
    console.log('Users table created/verified');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const getQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const query = async (text, params = []) => {
  if (process.env.DB_TYPE === 'postgresql') {
    return await db.query(text, params);
  } else {
    return await getQuery(text, params);
  }
};

const queryAll = async (text, params = []) => {
  if (process.env.DB_TYPE === 'postgresql') {
    const result = await db.query(text, params);
    return result.rows;
  } else {
    return await allQuery(text, params);
  }
};

module.exports = {
  initializeDatabase,
  query,
  queryAll,
  runQuery,
  getQuery,
  allQuery,
  db
};
