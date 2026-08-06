import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// GET /api/movements (List stock movements)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { product_id, type, limit = 50 } = req.query;
    const isAdmin = req.user.role === 'ADMIN';

    let query = `
      SELECT m.*, p.name as product_name, p.sku as product_sku, u.name as user_name, u.role as user_role
      FROM stock_movements m
      JOIN products p ON m.product_id = p.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ` AND m.product_id = ?`;
      params.push(product_id);
    }

    if (type) {
      query += ` AND m.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY m.created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const movements = db.prepare(query).all(...params);

    // Sanitize cost price for Non-Admins
    const sanitizedMovements = movements.map(m => {
      const item = { ...m };
      if (!isAdmin) {
        delete item.unit_cost_price;
      }
      return item;
    });

    res.json({ movements: sanitizedMovements });
  } catch (error) {
    console.error('Erro ao listar movimentações:', error);
    res.status(500).json({ error: 'Erro ao consultar movimentações.' });
  }
});

// POST /api/movements/entry (Registrar Entrada / Compra)
router.post('/entry', authenticateToken, (req, res) => {
  try {
    const { product_id, quantity, unit_cost_price, reason, reference_doc } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Produto e quantidade positiva são obrigatórios.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const qty = Number(quantity);
    const costPrice = Number(unit_cost_price) || product.cost_price;

    // Calculate Weighted Average Cost Price (Preço Médio de Custo)
    let newAverageCost = product.cost_price;
    const currentTotalVal = product.quantity * product.cost_price;
    const newTotalVal = currentTotalVal + (qty * costPrice);
    const newTotalQty = product.quantity + qty;

    if (newTotalQty > 0) {
      newAverageCost = Number((newTotalVal / newTotalQty).toFixed(2));
    }

    // Begin Database Transaction
    const transaction = db.transaction(() => {
      // 1. Update product quantity & average cost price
      db.prepare(`
        UPDATE products
        SET quantity = quantity + ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(qty, newAverageCost, product_id);

      // 2. Record stock movement
      const movementId = uuidv4();
      const totalPrice = qty * product.sale_price;

      db.prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost_price, unit_sale_price, total_price, reason, reference_doc, user_id)
        VALUES (?, ?, 'ENTRY', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementId,
        product_id,
        qty,
        costPrice,
        product.sale_price,
        totalPrice,
        reason || 'Recepção de Fornecedor / Compra',
        reference_doc || '',
        req.user.id
      );

      // 3. Record Audit Log
      logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'STOCK_ENTRY',
        'STOCK',
        product_id,
        {
          product_name: product.name,
          quantity_added: qty,
          new_quantity: newTotalQty,
          new_average_cost: newAverageCost,
          reference_doc
        }
      );
    });

    transaction();

    res.status(201).json({
      message: 'Entrada de estoque registada com sucesso.',
      new_quantity: product.quantity + qty,
      new_average_cost: newAverageCost
    });
  } catch (error) {
    console.error('Erro ao registar entrada de estoque:', error);
    res.status(500).json({ error: 'Erro ao registar entrada no estoque.' });
  }
});

// POST /api/movements/exit (Registrar Saída / Venda / Consumo)
router.post('/exit', authenticateToken, (req, res) => {
  try {
    const { product_id, quantity, reason, reference_doc } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Produto e quantidade positiva são obrigatórios.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const qty = Number(quantity);
    if (product.quantity < qty) {
      return res.status(400).json({
        error: `Estoque insuficiente! Disponível: ${product.quantity} ${product.unit}, Solicitado: ${qty} ${product.unit}.`
      });
    }

    const transaction = db.transaction(() => {
      // 1. Update product quantity
      db.prepare(`
        UPDATE products
        SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(qty, product_id);

      // 2. Record movement
      const movementId = uuidv4();
      const totalPrice = qty * product.sale_price;

      db.prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost_price, unit_sale_price, total_price, reason, reference_doc, user_id)
        VALUES (?, ?, 'EXIT', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        movementId,
        product_id,
        qty,
        product.cost_price,
        product.sale_price,
        totalPrice,
        reason || 'Venda / Consumo Interno',
        reference_doc || '',
        req.user.id
      );

      // 3. Audit Log
      logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'STOCK_EXIT',
        'STOCK',
        product_id,
        {
          product_name: product.name,
          quantity_removed: qty,
          remaining_quantity: product.quantity - qty,
          reason
        }
      );
    });

    transaction();

    res.status(201).json({
      message: 'Saída de estoque registada com sucesso.',
      remaining_quantity: product.quantity - qty
    });
  } catch (error) {
    console.error('Erro ao registar saída de estoque:', error);
    res.status(500).json({ error: 'Erro ao registar saída no estoque.' });
  }
});

// POST /api/movements/adjust (Solicitar ou Realizar Ajuste de Estoque)
router.post('/adjust', authenticateToken, (req, res) => {
  try {
    const { product_id, proposed_qty, type, justification } = req.body;

    if (!product_id || proposed_qty === undefined || !type || !justification) {
      return res.status(400).json({ error: 'Produto, nova quantidade, tipo e justificativa são obrigatórios.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const targetQty = Number(proposed_qty);
    const diffQty = targetQty - product.quantity;

    if (diffQty === 0) {
      return res.status(400).json({ error: 'A quantidade proposta é idêntica à quantidade atual em estoque.' });
    }

    const isAdmin = req.user.role === 'ADMIN';

    // If request comes from EMPLOYEE or involves loss/theft/damage, require ADMIN approval!
    if (!isAdmin || ['LOSS', 'THEFT', 'DAMAGE'].includes(type)) {
      const adjustmentId = uuidv4();

      db.prepare(`
        INSERT INTO pending_adjustments (id, product_id, requested_by, current_qty, proposed_qty, diff_qty, type, justification, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      `).run(adjustmentId, product_id, req.user.id, product.quantity, targetQty, diffQty, type, justification.trim());

      logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'ADJUSTMENT_REQUEST',
        'PENDING_ADJUSTMENT',
        adjustmentId,
        {
          product_name: product.name,
          current_qty: product.quantity,
          proposed_qty: targetQty,
          type,
          justification
        }
      );

      return res.status(202).json({
        message: 'Ajuste de estoque submetido para aprovação do Administrador/Dono.',
        pending_approval: true,
        adjustment_id: adjustmentId
      });
    }

    // Direct ADMIN adjustment approval logic
    const transaction = db.transaction(() => {
      db.prepare('UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(targetQty, product_id);

      const movementId = uuidv4();
      db.prepare(`
        INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost_price, unit_sale_price, total_price, reason, reference_doc, user_id)
        VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?, 'DIRETO_ADMIN', ?)
      `).run(
        movementId,
        product_id,
        Math.abs(diffQty),
        product.cost_price,
        product.sale_price,
        Math.abs(diffQty) * product.sale_price,
        `Ajuste Manual Direto (${type}): ${justification}`,
        'ADMIN',
        req.user.id
      );

      logAudit(
        req.user.id,
        req.user.name,
        req.user.role,
        'DIRECT_STOCK_ADJUSTMENT',
        'STOCK',
        product_id,
        { product_name: product.name, old_qty: product.quantity, new_qty: targetQty, type, justification }
      );
    });

    transaction();

    res.json({ message: 'Estoque ajustado com sucesso.', new_quantity: targetQty });
  } catch (error) {
    console.error('Erro ao processar ajuste de estoque:', error);
    res.status(500).json({ error: 'Erro ao processar ajuste de estoque.' });
  }
});

export default router;
