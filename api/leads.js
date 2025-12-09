// API para gerenciar leads
const { getDb } = require('./db');

async function getLeads(req, res) {
  const db = getDb();
  const { limit = 100, offset = 0, trava, nome } = req.query;

  try {
    let query = 'SELECT * FROM leads';
    let params = [];
    let whereClauses = [];
    let paramCounter = 1;

    // Filtro por trava
    if (trava !== undefined) {
      whereClauses.push(db.type === 'postgres' ? `trava = $${paramCounter++}` : 'trava = ?');
      params.push(trava === 'true');
    }

    // Filtro por nome
    if (nome) {
      whereClauses.push(db.type === 'postgres' ? `nome ILIKE $${paramCounter++}` : 'nome LIKE ?');
      params.push(`%${nome}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    if (db.type === 'postgres') {
      query += ` ORDER BY created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter}`;
    } else {
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    }
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads', details: error.message });
  }
}

async function getLeadById(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const query = db.type === 'postgres' ? 'SELECT * FROM leads WHERE id = $1' : 'SELECT * FROM leads WHERE id = ?';
    const result = await db.execute(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead', details: error.message });
  }
}

async function createLead(req, res) {
  const db = getDb();
  const { numero, nome, followupsequencia, followupsequenciamsgid, trava } = req.body;

  if (!numero) {
    return res.status(400).json({ error: 'Número é obrigatório' });
  }

  try {
    if (db.type === 'postgres') {
      const result = await db.execute(
        `INSERT INTO leads (numero, nome, followupsequencia, followupsequenciamsgid, trava)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [numero, nome || null, followupsequencia || null, followupsequenciamsgid || null, trava || false]
      );
      res.status(201).json(result.rows[0]);
    } else {
      const result = await db.execute(
        `INSERT INTO leads (numero, nome, followupsequencia, followupsequenciamsgid, trava)
         VALUES (?, ?, ?, ?, ?)`,
        [numero, nome || null, followupsequencia || null, followupsequenciamsgid || null, trava || false]
      );
      const newLead = await db.execute('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
      res.status(201).json(newLead.rows[0]);
    }
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead', details: error.message });
  }
}

async function updateLead(req, res) {
  const db = getDb();
  const { id } = req.params;
  const { numero, nome, followupsequencia, followupsequenciamsgid, trava } = req.body;

  try {
    const updates = [];
    const params = [];
    let paramCounter = 1;

    if (numero !== undefined) {
      updates.push(db.type === 'postgres' ? `numero = $${paramCounter++}` : 'numero = ?');
      params.push(numero);
    }
    if (nome !== undefined) {
      updates.push(db.type === 'postgres' ? `nome = $${paramCounter++}` : 'nome = ?');
      params.push(nome);
    }
    if (followupsequencia !== undefined) {
      updates.push(db.type === 'postgres' ? `followupsequencia = $${paramCounter++}` : 'followupsequencia = ?');
      params.push(followupsequencia);
    }
    if (followupsequenciamsgid !== undefined) {
      updates.push(db.type === 'postgres' ? `followupsequenciamsgid = $${paramCounter++}` : 'followupsequenciamsgid = ?');
      params.push(followupsequenciamsgid);
    }
    if (trava !== undefined) {
      updates.push(db.type === 'postgres' ? `trava = $${paramCounter++}` : 'trava = ?');
      params.push(trava);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);
    const query = db.type === 'postgres'
      ? `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`
      : `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;

    const result = await db.execute(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead', details: error.message });
  }
}

async function deleteLead(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const query = db.type === 'postgres'
      ? 'DELETE FROM leads WHERE id = $1 RETURNING *'
      : 'DELETE FROM leads WHERE id = ?';
    const result = await db.execute(query, [id]);

    if (result.rows.length === 0 && result.rowCount === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ success: true, message: 'Lead deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    res.status(500).json({ error: 'Erro ao deletar lead', details: error.message });
  }
}

async function getLeadsStats(req, res) {
  const db = getDb();

  try {
    const total = await db.execute('SELECT COUNT(*) as count FROM leads');
    const travados = await db.execute(
      db.type === 'postgres'
        ? 'SELECT COUNT(*) as count FROM leads WHERE trava = true'
        : 'SELECT COUNT(*) as count FROM leads WHERE trava = 1'
    );
    const hoje = await db.execute(
      db.type === 'postgres'
        ? "SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = CURRENT_DATE"
        : 'SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = DATE("now")'
    );

    res.json({
      total: total.rows[0].count,
      travados: travados.rows[0].count,
      hoje: hoje.rows[0].count
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de leads:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas', details: error.message });
  }
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadsStats
};
