require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { getDb, initializeDatabase } = require('./api/db');

// Importar módulos de API
const leadsApi = require('./api/leads');
const chatsApi = require('./api/chats');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Inicializar banco de dados
initializeDatabase().catch(err => {
  console.error('Erro ao inicializar banco de dados:', err);
});

const db = getDb();

// Rota inicial
app.get('/', (req, res) => {
  res.json({
    message: 'API WhatsApp Panel - Dashboard Destaque-se',
    status: 'online',
    version: '1.0.0',
    database: {
      type: db.type,
      connected: !!db
    },
    endpoints: {
      debug: 'GET /api/debug',
      leads: {
        getAll: 'GET /api/leads',
        getById: 'GET /api/leads/:id',
        create: 'POST /api/leads',
        update: 'PUT /api/leads/:id',
        delete: 'DELETE /api/leads/:id',
        stats: 'GET /api/leads/stats'
      },
      chats: {
        getAll: 'GET /api/chats',
        getById: 'GET /api/chats/:id',
        getBySession: 'GET /api/chats/session/:session_id',
        sessions: 'GET /api/chats/sessions',
        create: 'POST /api/chats',
        update: 'PUT /api/chats/:id',
        delete: 'DELETE /api/chats/:id',
        stats: 'GET /api/chats/stats'
      },
      conversations: {
        getAll: 'GET /api/conversations',
        webhook: 'POST /api/webhook/message'
      }
    }
  });
});

// Endpoint de debug
app.get('/api/debug', async (req, res) => {
  try {
    const dbInfo = {
      type: db.type,
      env: {
        DATABASE_TYPE: process.env.DATABASE_TYPE,
        POSTGRES_HOST: process.env.POSTGRES_HOST || 'NOT SET',
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_USER: process.env.POSTGRES_USER || 'NOT SET',
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '***SET (length: ' + process.env.POSTGRES_PASSWORD.length + ')***' : 'NOT SET',
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || 'NOT SET',
        POSTGRES_SSL: process.env.POSTGRES_SSL
      }
    };

    // Testar conexão
    const testQuery = await db.execute('SELECT 1 as test');
    dbInfo.connection = 'OK';
    dbInfo.testResult = testQuery.rows;

    // Listar tabelas
    if (db.type === 'postgres') {
      const tables = await db.execute(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      dbInfo.tables = tables.rows.map(r => r.table_name);
    }

    res.json(dbInfo);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
      dbType: db.type,
      config: {
        host: process.env.POSTGRES_HOST || 'NOT SET',
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER || 'NOT SET',
        database: process.env.POSTGRES_DATABASE || 'NOT SET',
        ssl: process.env.POSTGRES_SSL
      }
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Painel disponível em: http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Novo cliente conectado ao WebSocket');

  ws.on('close', () => {
    console.log('Cliente desconectado do WebSocket');
  });
});

function broadcastUpdate(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

app.post('/api/webhook/message', async (req, res) => {
  const { phone_number, contact_name, message, message_type, metadata } = req.body;

  if (!phone_number || !message) {
    return res.status(400).json({ error: 'phone_number e message são obrigatórios' });
  }

  try {
    const metadataStr = db.type === 'postgres'
      ? JSON.stringify(metadata || {})
      : JSON.stringify(metadata || {});

    const result = await db.execute(
      db.type === 'postgres'
        ? `INSERT INTO conversations (phone_number, contact_name, message, message_type, metadata)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`
        : `INSERT INTO conversations (phone_number, contact_name, message, message_type, metadata)
           VALUES (?, ?, ?, ?, ?)`,
      [phone_number, contact_name || 'Desconhecido', message, message_type || 'received', metadataStr]
    );

    const messageId = db.type === 'postgres' ? result.rows[0].id : result.lastInsertRowid;

    // Atualizar ou criar contato
    if (db.type === 'postgres') {
      await db.execute(
        `INSERT INTO contacts (phone_number, name, last_interaction, total_messages)
         VALUES ($1, $2, CURRENT_TIMESTAMP, 1)
         ON CONFLICT(phone_number) DO UPDATE SET
         name = EXCLUDED.name,
         last_interaction = CURRENT_TIMESTAMP,
         total_messages = contacts.total_messages + 1`,
        [phone_number, contact_name || 'Desconhecido']
      );
    } else {
      await db.execute(
        `INSERT INTO contacts (phone_number, name, last_interaction, total_messages)
         VALUES (?, ?, CURRENT_TIMESTAMP, 1)
         ON CONFLICT(phone_number) DO UPDATE SET
         name = excluded.name,
         last_interaction = CURRENT_TIMESTAMP,
         total_messages = total_messages + 1`,
        [phone_number, contact_name || 'Desconhecido']
      );
    }

    const newMessage = {
      id: messageId,
      phone_number,
      contact_name: contact_name || 'Desconhecido',
      message,
      message_type: message_type || 'received',
      timestamp: new Date().toISOString(),
      metadata
    };

    broadcastUpdate({ type: 'new_message', data: newMessage });

    res.json({ success: true, message_id: messageId });
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err);
    return res.status(500).json({ error: 'Erro ao salvar mensagem' });
  }
});

app.get('/api/conversations', async (req, res) => {
  const { phone_number, limit = 100, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM conversations';
    let params = [];

    if (phone_number) {
      if (db.type === 'postgres') {
        query += ' WHERE phone_number = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3';
        params.push(phone_number, parseInt(limit), parseInt(offset));
      } else {
        query += ' WHERE phone_number = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(phone_number, parseInt(limit), parseInt(offset));
      }
    } else {
      if (db.type === 'postgres') {
        query += ' ORDER BY timestamp DESC LIMIT $1 OFFSET $2';
        params.push(parseInt(limit), parseInt(offset));
      } else {
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
      }
    }

    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar conversas:', err);
    return res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

app.get('/api/contacts', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM contacts ORDER BY last_interaction DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar contatos:', err);
    return res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};

    const totalMessages = await db.execute('SELECT COUNT(*) as count FROM conversations');
    stats.total_messages = totalMessages.rows[0].count;

    const totalContacts = await db.execute('SELECT COUNT(*) as count FROM contacts');
    stats.total_contacts = totalContacts.rows[0].count;

    const todayQuery = db.type === 'postgres'
      ? 'SELECT COUNT(*) as count FROM conversations WHERE DATE(timestamp) = CURRENT_DATE'
      : 'SELECT COUNT(*) as count FROM conversations WHERE DATE(timestamp) = DATE("now")';
    const messagesT = await db.execute(todayQuery);
    stats.messages_today = messagesT.rows[0].count;

    const pendingQuery = db.type === 'postgres'
      ? "SELECT COUNT(*) as count FROM conversations WHERE message_type = 'received' AND status = 'pending'"
      : 'SELECT COUNT(*) as count FROM conversations WHERE message_type = "received" AND status = "pending"';
    const pending = await db.execute(pendingQuery);
    stats.pending_messages = pending.rows[0].count;

    res.json(stats);
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.put('/api/conversations/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const query = db.type === 'postgres'
      ? 'UPDATE conversations SET status = $1 WHERE id = $2'
      : 'UPDATE conversations SET status = ? WHERE id = ?';

    await db.execute(query, [status, id]);
    broadcastUpdate({ type: 'status_update', data: { id, status } });
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao atualizar status:', err);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = db.type === 'postgres'
      ? 'DELETE FROM conversations WHERE id = $1'
      : 'DELETE FROM conversations WHERE id = ?';

    await db.execute(query, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar conversa:', err);
    return res.status(500).json({ error: 'Erro ao deletar conversa' });
  }
});

// ==================== ROTAS PARA LEADS ====================
app.get('/api/leads', leadsApi.getLeads);
app.get('/api/leads/stats', leadsApi.getLeadsStats);
app.get('/api/leads/:id', leadsApi.getLeadById);
app.post('/api/leads', leadsApi.createLead);
app.put('/api/leads/:id', leadsApi.updateLead);
app.delete('/api/leads/:id', leadsApi.deleteLead);

// ==================== ROTAS PARA CHATS ====================
app.get('/api/chats', chatsApi.getChats);
app.get('/api/chats/stats', chatsApi.getChatsStats);
app.get('/api/chats/sessions', chatsApi.getSessionsList);
app.get('/api/chats/session/:session_id', chatsApi.getChatsBySession);
app.get('/api/chats/:id', chatsApi.getChatById);
app.post('/api/chats', chatsApi.createChat);
app.put('/api/chats/:id', chatsApi.updateChat);
app.delete('/api/chats/:id', chatsApi.deleteChat);

process.on('SIGINT', async () => {
  try {
    if (db && db.close) {
      await db.close();
    }
    console.log('Conexão com banco de dados fechada');
    process.exit(0);
  } catch (err) {
    console.error('Erro ao fechar conexão:', err.message);
    process.exit(1);
  }
});

// Export para Vercel
module.exports = app;
