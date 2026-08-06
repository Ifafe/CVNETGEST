import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

const router = express.Router();

// Helper to filter sensitive financial fields for non-admins
function sanitizeProduct(product, isAdmin) {
  const p = { ...product };
  if (!isAdmin) {
    delete p.cost_price;
    delete p.profit_margin;
  } else {
    // Calculate profit margin percentage if cost price exists
    if (p.cost_price > 0) {
      p.profit_margin = Math.round(((p.sale_price - p.cost_price) / p.cost_price) * 100);
    } else {
      p.profit_margin = 0;
    }
  }
  return p;
}

// GET /api/products (List products with search, category filter, low stock filter)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, category_id, low_stock } = req.query;
    const isAdmin = req.user.role === 'ADMIN';

    let query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    if (low_stock === 'true') {
      query += ` AND p.quantity <= p.min_stock`;
    }

    query += ` ORDER BY p.name ASC`;

    const rawProducts = db.prepare(query).all(...params);
    const products = rawProducts.map(p => sanitizeProduct(p, isAdmin));

    res.json({ products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao pesquisar produtos.' });
  }
});

// GET /api/products/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN';

    const rawProduct = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ? OR p.barcode = ? OR p.sku = ?
    `).get(id, id, id);

    if (!rawProduct) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json({ product: sanitizeProduct(rawProduct, isAdmin) });
  } catch (error) {
    console.error('Erro ao procurar produto:', error);
    res.status(500).json({ error: 'Erro ao pesquisar produto.' });
  }
});

// POST /api/products (Create Product)
router.post('/', authenticateToken, (req, res) => {
  try {
    const { sku, barcode, name, description, category_id, supplier_id, cost_price, sale_price, min_stock, unit } = req.body;

    if (!sku || !name || sale_price === undefined) {
      return res.status(400).json({ error: 'SKU, Nome e Preço de Venda são obrigatórios.' });
    }

    const existingSKU = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku.trim());
    if (existingSKU) {
      return res.status(400).json({ error: 'Já existe um produto registado com este SKU.' });
    }

    if (barcode) {
      const existingBarcode = db.prepare('SELECT id FROM products WHERE barcode = ?').get(barcode.trim());
      if (existingBarcode) {
        return res.status(400).json({ error: 'Já existe um produto registado com este Código de Barras.' });
      }
    }

    const id = uuidv4();
    const finalCostPrice = req.user.role === 'ADMIN' ? (Number(cost_price) || 0) : 0;
    const finalSalePrice = Number(sale_price) || 0;
    const finalMinStock = Number(min_stock) || 5;

    db.prepare(`
      INSERT INTO products (id, sku, barcode, name, description, category_id, supplier_id, cost_price, sale_price, quantity, min_stock, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      id,
      sku.trim(),
      barcode ? barcode.trim() : null,
      name.trim(),
      description || '',
      category_id || null,
      supplier_id || null,
      finalCostPrice,
      finalSalePrice,
      finalMinStock,
      unit || 'un'
    );

    logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'PRODUCT_CREATE',
      'PRODUCT',
      id,
      { sku, name, sale_price: finalSalePrice }
    );

    res.status(201).json({ message: 'Produto registado com sucesso', id });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao registar produto.' });
  }
});

// PUT /api/products/:id (Update product details - ADMIN only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, supplier_id, cost_price, sale_price, min_stock, unit } = req.body;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const newCostPrice = cost_price !== undefined ? Number(cost_price) : product.cost_price;
    const newSalePrice = sale_price !== undefined ? Number(sale_price) : product.sale_price;

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, category_id = ?, supplier_id = ?, cost_price = ?, sale_price = ?, min_stock = ?, unit = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || product.name,
      description !== undefined ? description : product.description,
      category_id !== undefined ? category_id : product.category_id,
      supplier_id !== undefined ? supplier_id : product.supplier_id,
      newCostPrice,
      newSalePrice,
      min_stock !== undefined ? Number(min_stock) : product.min_stock,
      unit || product.unit,
      id
    );

    logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'PRODUCT_UPDATE',
      'PRODUCT',
      id,
      { product_name: name || product.name, sale_price: newSalePrice }
    );

    res.json({ message: 'Produto atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// DELETE /api/products/:id (Delete product - ADMIN only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const { id } = req.params;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    logAudit(
      req.user.id,
      req.user.name,
      req.user.role,
      'PRODUCT_DELETE',
      'PRODUCT',
      id,
      { product_name: product.name, sku: product.sku }
    );

    res.json({ message: 'Produto eliminado com sucesso.' });
  } catch (error) {
    console.error('Erro ao eliminar produto:', error);
    res.status(500).json({ error: 'Erro ao eliminar produto do estoque.' });
  }
});

export default router;
