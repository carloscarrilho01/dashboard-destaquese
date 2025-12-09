// API para gerenciar leads
const { getDb } = require('./db');

async function getLeads(req, res) {
  const db = getDb();
  const { limit = 100, offset = 0, trava, nome } = req.query;

  try {
    let query = 'SELECT * FROM leads';
    let params = [];
    let whereClauses = [];

    // Filtro por trava
    if (trava !== undefined) {
      whereClauses.push(`trava = $${params.length + 1}`);
      params.push(trava === 'true');
    }

    // Filtro por nome
    if (nome) {
      whereClauses.push(`nome ILIKE $${params.length + 1}`);
      params.push(`%${nome}%`);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.execute(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
}

async function getLeadById(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = await db.execute('SELECT * FROM leads WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
}

async function createLead(req, res) {
  const db = getDb();
  const { numero, nome, followupsequencia, followupsequenciamsgid, trava } = req.body;

  if (!numero) {
    return res.status(400).json({ error: 'Número é obrigatório' });
  }

  try {
    const result = await db.execute(
      `INSERT INTO leads (numero, nome, followupsequencia, followupsequenciamsgid, trava)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [numero, nome || null, followupsequencia || null, followupsequenciamsgid || null, trava || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
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
      updates.push(`numero = $${paramCounter++}`);
      params.push(numero);
    }
    if (nome !== undefined) {
      updates.push(`nome = $${paramCounter++}`);
      params.push(nome);
    }
    if (followupsequencia !== undefined) {
      updates.push(`followupsequencia = $${paramCounter++}`);
      params.push(followupsequencia);
    }
    if (followupsequenciamsgid !== undefined) {
      updates.push(`followupsequenciamsgid = $${paramCounter++}`);
      params.push(followupsequenciamsgid);
    }
    if (trava !== undefined) {
      updates.push(`trava = $${paramCounter++}`);
      params.push(trava);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(id);
    const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

    const result = await db.execute(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
}

async function deleteLead(req, res) {
  const db = getDb();
  const { id } = req.params;

  try {
    const result = await db.execute('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ success: true, message: 'Lead deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    res.status(500).json({ error: 'Erro ao deletar lead' });
  }
}

async function getLeadsStats(req, res) {
  const db = getDb();

  try {
    const total = await db.execute('SELECT COUNT(*) as count FROM leads');
    const travados = await db.execute('SELECT COUNT(*) as count FROM leads WHERE trava = true');
    const hoje = await db.execute(
      "SELECT COUNT(*) as count FROM leads WHERE DATE(created_at) = CURRENT_DATE"
    );

    res.json({
      total: total.rows[0].count,
      travados: travados.rows[0].count,
      hoje: hoje.rows[0].count
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de leads:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
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
