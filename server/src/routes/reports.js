import express from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/valuation (Inventory Valuation & Financial Overview - ADMIN only)
router.get('/valuation', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const valuation = db.prepare(`
      SELECT 
        COUNT(id) as total_products,
        SUM(quantity) as total_units,
        SUM(quantity * cost_price) as total_cost_value,
        SUM(quantity * sale_price) as total_sale_value,
        SUM(quantity * (sale_price - cost_price)) as total_projected_profit,
        SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock_count
      FROM products
    `).get();

    // Valuation grouped by Category
    const categoryValuation = db.prepare(`
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.quantity) as total_units,
        SUM(p.quantity * p.cost_price) as total_cost_value,
        SUM(p.quantity * p.sale_price) as total_sale_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY total_sale_value DESC
    `).all();

    // Top 5 products by stock value
    const topValuedProducts = db.prepare(`
      SELECT 
        sku, name, quantity, cost_price, sale_price,
        (quantity * cost_price) as total_cost,
        (quantity * sale_price) as total_sale,
        ((sale_price - cost_price) * quantity) as projected_profit
      FROM products
      ORDER BY total_sale DESC
      LIMIT 5
    `).all();

    // Summary of movements in the last 30 days
    const recentMovementsSummary = db.prepare(`
      SELECT 
        type,
        COUNT(id) as movement_count,
        SUM(quantity) as total_items
      FROM stock_movements
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY type
    `).all();

    res.json({
      summary: {
        total_products: valuation.total_products || 0,
        total_units: valuation.total_units || 0,
        total_cost_value: Number((valuation.total_cost_value || 0).toFixed(2)),
        total_sale_value: Number((valuation.total_sale_value || 0).toFixed(2)),
        total_projected_profit: Number((valuation.total_projected_profit || 0).toFixed(2)),
        low_stock_count: valuation.low_stock_count || 0
      },
      category_valuation: categoryValuation,
      top_valued_products: topValuedProducts,
      recent_movements_summary: recentMovementsSummary
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de valoração:', error);
    res.status(500).json({ error: 'Erro ao compilar relatório financeiro.' });
  }
});

export default router;
