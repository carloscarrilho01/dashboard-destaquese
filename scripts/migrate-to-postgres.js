// Script de migração para PostgreSQL
// Execute este script se você já tiver um banco SQLite e quiser migrar para PostgreSQL

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

async function migrate() {
  // Conectar ao SQLite
  const sqliteDb = new sqlite3.Database('./conversations.db');

  // Conectar ao PostgreSQL
  const pgPool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('Iniciando migração...');

    // Migrar tabela conversations
    const conversations = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM conversations', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`Migrando ${conversations.length} conversas...`);
    for (const conv of conversations) {
      await pgPool.query(
        `INSERT INTO conversations (phone_number, contact_name, message, message_type, timestamp, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          conv.phone_number,
          conv.contact_name,
          conv.message,
          conv.message_type,
          conv.timestamp,
          conv.status,
          conv.metadata
        ]
      );
    }

    // Migrar tabela contacts
    const contacts = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM contacts', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`Migrando ${contacts.length} contatos...`);
    for (const contact of contacts) {
      await pgPool.query(
        `INSERT INTO contacts (phone_number, name, last_interaction, total_messages, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (phone_number) DO NOTHING`,
        [
          contact.phone_number,
          contact.name,
          contact.last_interaction,
          contact.total_messages,
          contact.status
        ]
      );
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

migrate();
