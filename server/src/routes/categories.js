import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// GET /api/categories
router.get('/', authenticateToken, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    res.json({ categories });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao pesquisar categorias.' });
  }
});

// POST /api/categories (ADMIN or EMPLOYEE can create categories)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'Já existe uma categoria com este nome.' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, name.trim(), description || '');

    logAudit(req.user.id, req.user.name, req.user.role, 'CATEGORY_CREATE', 'CATEGORY', id, { category_name: name });

    res.status(201).json({ message: 'Categoria criada com sucesso', category: { id, name, description } });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

export default router;
