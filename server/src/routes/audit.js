import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (List audit logs with search, user, entity filter - ADMIN only)
router.get('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { action, user_id, limit = 100 } = req.query;

    let query = `
      SELECT *
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      query += ` AND action = ?`;
      params.push(action);
    }

    if (user_id) {
      query += ` AND user_id = ?`;
      params.push(user_id);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const logs = db.prepare(query).all(...params);

    res.json({ logs });
  } catch (error) {
    console.error('Erro ao pesquisar logs de auditoria:', error);
    res.status(500).json({ error: 'Erro ao pesquisar registos de auditoria.' });
  }
});

export default router;
