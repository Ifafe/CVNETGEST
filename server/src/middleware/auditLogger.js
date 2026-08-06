import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

export function logAudit(userId, userName, userRole, action, entityType, entityId = null, details = null, ipAddress = '127.0.0.1') {
  try {
    const id = uuidv4();
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, userName, userRole, action, entityType, entityId, detailsStr, ipAddress);
  } catch (error) {
    console.error('Erro ao gravar log de auditoria:', error);
  }
}
