import jwt from 'jsonwebtoken';
import db from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'cvnetgest_super_secret_jwt_key_2026';

// Middleware to authenticate JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token ausente.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }

    // Verify user exists and is active in DB
    const user = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Conta de utilizador inativa.' });
    }

    req.user = user;
    next();
  });
}

// Middleware for Role-Based Access Control (RBAC)
export function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilizador não autenticado.' });
    }

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Acesso negado. Esta funcionalidade requer privilégios de ' + rolesArray.join(' ou ') + '.' 
      });
    }

    next();
  };
}
