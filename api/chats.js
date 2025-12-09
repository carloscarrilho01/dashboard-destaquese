// API para gerenciar chats
const { getDb } = require('./db');

async function getChats(req, res) {
  const db = getDb();
  const { session_id, limit = 100, offset = 0 } = req.query;

  try {
    let query = 'SELECT * FROM chats';
    let params = [];

    if (session_id) {
      query += ' WHERE session_id = $1';
      params.push(session_id);
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(parseInt(limit), parseInt(offset));
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(parseInt(limit), parseInt(offset));
    }

    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ error: 'Erro ao buscar chats' });
  }
}

async function getChatById(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = await db.execute('SELECT * FROM chats WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar chat:', error);
    res.status(500).json({ error: 'Erro ao buscar chat' });
  }
}

async function getChatsBySession(req, res) {
  const db = getDb();
  const { session_id } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  try {
    const result = await db.execute(
      'SELECT * FROM chats WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [session_id, parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chats da sessão:', error);
    res.status(500).json({ error: 'Erro ao buscar chats da sessão' });
  }
}

async function createChat(req, res) {
  const db = getDb();
  const { session_id, message } = req.body;

  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id e message são obrigatórios' });
  }

  try {
    const result = await db.execute(
      `INSERT INTO chats (session_id, message)
       VALUES ($1, $2)
       RETURNING *`,
      [session_id, JSON.stringify(message)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar chat:', error);
    res.status(500).json({ error: 'Erro ao criar chat' });
  }
}

async function updateChat(req, res) {
  const db = getDb();
  const { id } = req.params;
  const { session_id, message } = req.body;

  try {
    const updates = [];
    const params = [];
    let paramCounter = 1;

    if (session_id !== undefined) {
      updates.push(`session_id = $${paramCounter++}`);
      params.push(session_id);
    }
    if (message !== undefined) {
      updates.push(`message = $${paramCounter++}`);
      params.push(JSON.stringify(message));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);
    const query = `UPDATE chats SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

    const result = await db.execute(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar chat:', error);
    res.status(500).json({ error: 'Erro ao atualizar chat' });
  }
}

async function deleteChat(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = await db.execute('DELETE FROM chats WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    res.json({ success: true, message: 'Chat deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar chat:', error);
    res.status(500).json({ error: 'Erro ao deletar chat' });
  }
}

async function getChatsStats(req, res) {
  const db = getDb();

  try {
    const total = await db.execute('SELECT COUNT(*) as count FROM chats');
    const sessoes = await db.execute('SELECT COUNT(DISTINCT session_id) as count FROM chats');
    const hoje = await db.execute(
      "SELECT COUNT(*) as count FROM chats WHERE DATE(created_at) = CURRENT_DATE"
    );

    res.json({
      total_mensagens: total.rows[0].count,
      total_sessoes: sessoes.rows[0].count,
      mensagens_hoje: hoje.rows[0].count
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de chats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}

async function getSessionsList(req, res) {
  const db = getDb();
  const { limit = 50 } = req.query;

  try {
    const result = await db.execute(
      `SELECT
        session_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message
      FROM chats
      GROUP BY session_id
      ORDER BY last_message DESC
      LIMIT $1`,
      [parseInt(limit)]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar lista de sessões:', error);
    res.status(500).json({ error: 'Erro ao buscar lista de sessões' });
  }
}

module.exports = {
  getChats,
  getChatById,
  getChatsBySession,
  createChat,
  updateChat,
  deleteChat,
  getChatsStats,
  getSessionsList
};
