import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// GET /api/suppliers
router.get('/', authenticateToken, (req, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT s.*, COUNT(p.id) as product_count
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `).all();

    res.json({ suppliers });
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao pesquisar fornecedores.' });
  }
});

// POST /api/suppliers
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, contact_name, email, phone, address } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nome do fornecedor é obrigatório.' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_name, email, phone, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), contact_name || '', email || '', phone || '', address || '');

    logAudit(req.user.id, req.user.name, req.user.role, 'SUPPLIER_CREATE', 'SUPPLIER', id, { supplier_name: name });

    res.status(201).json({ message: 'Fornecedor criado com sucesso', supplier: { id, name, contact_name, email, phone, address } });
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor.' });
  }
});

export default router;
