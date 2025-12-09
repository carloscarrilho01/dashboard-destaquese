// Configuração do banco de dados
// Suporta: SQLite local, Turso (SQLite na nuvem) e PostgreSQL

require('dotenv').config();

const { createClient } = require('@libsql/client');
const { Pool } = require('pg');

let db;
let dbType;

function getDb() {
  if (db) return db;

  // Determinar tipo de banco de dados
  if (process.env.DATABASE_TYPE === 'postgres' || process.env.POSTGRES_HOST) {
    dbType = 'postgres';
    return getPostgresDb();
  } else if (process.env.TURSO_DATABASE_URL) {
    dbType = 'turso';
    return getTursoDb();
  } else {
    dbType = 'sqlite';
    return getSqliteDb();
  }
}

function getPostgresDb() {
  // Usar variáveis NEXT_PUBLIC se disponíveis, senão usar POSTGRES_*
  const poolConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE || process.env.NEXT_PUBLIC_TABLE_NAME || 'postgres',
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  const pool = new Pool(poolConfig);

  // Wrapper para compatibilidade
  db = {
    execute: async (sql, params = []) => {
      try {
        const result = await pool.query(sql, params);
        return { rows: result.rows, rowCount: result.rowCount };
      } catch (error) {
        console.error('Erro PostgreSQL:', error);
        throw error;
      }
    },
    query: async (sql, params = []) => {
      const result = await pool.query(sql, params);
      return result.rows;
    },
    close: () => pool.end(),
    type: 'postgres'
  };

  return db;
}

function getTursoDb() {
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  db.type = 'turso';
  return db;
}

function getSqliteDb() {
  const sqlite3 = require('sqlite3').verbose();
  const dbInstance = new sqlite3.Database('./conversations.db');

  // Wrapper para compatibilidade
  db = {
    execute: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          dbInstance.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else {
          dbInstance.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ rows: [], lastInsertRowid: this.lastID });
          });
        }
      });
    },
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        dbInstance.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    close: () => {
      return new Promise((resolve) => {
        dbInstance.close(resolve);
      });
    },
    type: 'sqlite'
  };

  return db;
}

async function initializeDatabase() {
  const db = getDb();

  console.log(`Inicializando banco de dados: ${db.type || dbType}`);

  if (db.type === 'postgres') {
    // PostgreSQL - criar tabelas se não existirem
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone_number TEXT NOT NULL,
        contact_name TEXT,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'received',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        metadata JSONB
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        last_interaction TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active'
      )
    `);

    // Criar tabelas leads e chats se não existirem
    await db.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero VARCHAR(255),
        nome VARCHAR(255),
        followupsequencia VARCHAR(255),
        followupsequenciamsgid VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        trava BOOLEAN DEFAULT FALSE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        message JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_leads_numero ON leads(numero)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_chats_session ON chats(session_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations(phone_number)`);

  } else {
    // SQLite/Turso
    await db.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        contact_name TEXT,
        message TEXT NOT NULL,
        message_type TEXT DEFAULT 'received',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        metadata TEXT
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        name TEXT,
        last_interaction DATETIME,
        total_messages INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active'
      )
    `);
  }

  console.log('Banco de dados inicializado com sucesso!');
}

module.exports = { getDb, initializeDatabase, getDbType: () => dbType };
