import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// GET /api/users (ADMIN only)
router.get('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, status, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({ users });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao pesquisar utilizadores.' });
  }
});

// POST /api/users (ADMIN only - Create new employee or admin)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nome, e-mail, palavra-passe e cargo são obrigatórios.' });
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ error: 'Cargo inválido. Escolha ADMIN ou EMPLOYEE.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'Este endereço de e-mail já se encontra registado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'ACTIVE')
    `).run(userId, name.trim(), email.toLowerCase().trim(), passwordHash, role);

    logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'USER_CREATE',
      'USER',
      userId,
      { new_user: name, new_email: email, assigned_role: role }
    );

    res.status(201).json({
      message: 'Utilizador criado com sucesso',
      user: { id: userId, name, email, role, status: 'ACTIVE' }
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador.' });
  }
});

// PUT /api/users/:id/role (ADMIN only - Change Role or Status)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    const user = db.prepare('SELECT id, name, role, status FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado.' });
    }

    if (id === req.user.id && status === 'INACTIVE') {
      return res.status(400).json({ error: 'Não pode desativar a sua própria conta de Administrador.' });
    }

    const newRole = role || user.role;
    const newStatus = status || user.status;

    db.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run(newRole, newStatus, id);

    logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'USER_UPDATE',
      'USER',
      id,
      { target_user: user.name, old_role: user.role, new_role: newRole, old_status: user.status, new_status: newStatus }
    );

    res.json({ message: 'Utilizador atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({ error: 'Erro ao atualizar utilizador.' });
  }
});

export default router;
