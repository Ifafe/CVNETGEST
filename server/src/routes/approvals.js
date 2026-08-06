import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// GET /api/approvals (List pending adjustments - ADMIN only)
router.get('/', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { status = 'PENDING' } = req.query;

    const adjustments = db.prepare(`
      SELECT a.*, p.name as product_name, p.sku as product_sku, p.unit as product_unit,
             p.cost_price, p.sale_price,
             u.name as requester_name, u.role as requester_role,
             r.name as reviewer_name
      FROM pending_adjustments a
      JOIN products p ON a.product_id = p.id
      JOIN users u ON a.requested_by = u.id
      LEFT JOIN users r ON a.reviewed_by = r.id
      WHERE a.status = ?
      ORDER BY a.created_at DESC
    `).all(status);

    res.json({ adjustments });
  } catch (error) {
    console.error('Erro ao listar ajustes pendentes:', error);
    res.status(500).json({ error: 'Erro ao consultar fila de aprovação.' });
  }
});

// POST /api/approvals/:id/review (Approve or Reject an adjustment - ADMIN only)
router.post('/:id/review', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida. Escolha APPROVE ou REJECT.' });
    }

    const adjustment = db.prepare('SELECT * FROM pending_adjustments WHERE id = ?').get(id);
    if (!adjustment) {
      return res.status(404).json({ error: 'Solicitação de ajuste não encontrada.' });
    }

    if (adjustment.status !== 'PENDING') {
      return res.status(400).json({ error: `Esta solicitação já foi ${adjustment.status.toLowerCase()}.` });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(adjustment.product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto associado não foi encontrado.' });
    }

    if (action === 'APPROVE') {
      const transaction = db.transaction(() => {
        // 1. Update product quantity to proposed quantity
        db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(adjustment.proposed_qty, product.id);

        // 2. Update adjustment status
        db.prepare(`
          UPDATE pending_adjustments
          SET status = 'APPROVED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(req.user.id, id);

        // 3. Insert stock movement record
        const movementId = uuidv4();
        db.prepare(`
          INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost_price, unit_sale_price, total_price, reason, reference_doc, user_id)
          VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, ?, ?)
        `).run(
          movementId,
          product.id,
          Math.abs(adjustment.diff_qty),
          product.cost_price,
          product.sale_price,
          Math.abs(adjustment.diff_qty) * product.sale_price,
          `Ajuste Aprovado (${adjustment.type}): ${adjustment.justification}`,
          `APROVACAO_${id.substring(0, 8)}`,
          req.user.id
        );

        // 4. Audit log
        logAudit(
          req.user.id,
          req.user.name,
          req.user.role,
          'ADJUSTMENT_APPROVED',
          'PENDING_ADJUSTMENT',
          id,
          {
            product_name: product.name,
            old_qty: product.quantity,
            new_qty: adjustment.proposed_qty,
            justification: adjustment.justification
          }
        );
      });

      transaction();
      return res.json({ message: 'Ajuste de estoque aprovado e aplicado com sucesso.' });
    } else {
      // REJECT
      db.prepare(`
        UPDATE pending_adjustments
        SET status = 'REJECTED', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, rejection_reason = ?
        WHERE id = ?
      `).run(req.user.id, rejection_reason || 'Rejeitado pelo Administrador', id);

      logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'ADJUSTMENT_REJECTED',
        'PENDING_ADJUSTMENT',
        id,
        {
          product_name: product.name,
          rejection_reason: rejection_reason || 'Rejeitado pelo Administrador'
        }
      );

      return res.json({ message: 'Solicitação de ajuste rejeitada.' });
    }
  } catch (error) {
    console.error('Erro ao rever ajuste:', error);
    res.status(500).json({ error: 'Erro ao processar aprovação de ajuste.' });
  }
});

export default router;
