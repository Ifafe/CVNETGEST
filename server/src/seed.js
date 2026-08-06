import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { initDatabase } from './db.js';

async function seed() {
  console.log('🌱 A semear dados de teste no CVNETGEST (Versão Angola - Kwanza Kz)...');
  initDatabase();

  // Clean existing tables
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM pending_adjustments;
    DELETE FROM stock_movements;
    DELETE FROM products;
    DELETE FROM suppliers;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // 1. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const operatorPassword = await bcrypt.hash('operador123', 10);

  const adminId = uuidv4();
  const operatorId = uuidv4();

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `).run(adminId, 'Carlos Silva (Dono / Administrador)', 'dono@cvnetgest.co.ao', adminPassword, 'ADMIN');

  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `).run(operatorId, 'Ana Mateus (Operador de Armazém)', 'operador@cvnetgest.co.ao', operatorPassword, 'EMPLOYEE');

  console.log('✅ Utilizadores criados: Administrador (dono@cvnetgest.co.ao) e Operador (operador@cvnetgest.co.ao)');

  // 2. Create Categories
  const categories = [
    { id: uuidv4(), name: 'Tecnologia & Informática', description: 'Equipamentos, computadores e periféricos de escritório' },
    { id: uuidv4(), name: 'Bebidas & Cafetaria Nacional', description: 'Cervejas, refrigerantes, águas minerais e café de Angola' },
    { id: uuidv4(), name: 'Material de Escritório & Papelaria', description: 'Papel A4, esferográficas e consumíveis de escritório' },
    { id: uuidv4(), name: 'Alimentação & Cesta Básica', description: 'Arroz, óleo, fuba e bens de primeira necessidade' },
    { id: uuidv4(), name: 'Higiene & Limpeza Industrial', description: 'Detergentes, desinfetantes e artigos de limpeza' }
  ];

  for (const cat of categories) {
    db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(cat.id, cat.name, cat.description);
  }
  console.log('✅ 5 Categorias criadas.');

  // 3. Create Suppliers (Angola)
  const suppliers = [
    { id: uuidv4(), name: 'NCR Angola Lda', contact_name: 'António Kiala', email: 'vendas@ncrangola.co.ao', phone: '+244 923 100 200', address: 'Talatona, Luanda (NIF: 5417088219)' },
    { id: uuidv4(), name: 'Refriango S.A.', contact_name: 'Isabel Dos Santos', email: 'comercial@refriango.co.ao', phone: '+244 912 300 400', address: 'Polo Industrial de Kikuxi, Viana, Luanda (NIF: 5403011922)' },
    { id: uuidv4(), name: 'AngoAlissar Lda', contact_name: 'Mateus Domingos', email: 'contacto@angoalissar.com', phone: '+244 931 555 777', address: 'Zona Industrial de Cacuaco, Luanda (NIF: 5401099231)' }
  ];

  for (const sup of suppliers) {
    db.prepare(`
      INSERT INTO suppliers (id, name, contact_name, email, phone, address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sup.id, sup.name, sup.contact_name, sup.email, sup.phone, sup.address);
  }
  console.log('✅ 3 Fornecedores Nacionais criados em Luanda, Angola.');

  // 4. Create Products (Prices in Kwanzas - Kz)
  const products = [
    {
      id: uuidv4(),
      sku: 'ELE-LOG-001',
      barcode: '5601234567891',
      name: 'Rato Sem Fios Logitech MX Master 3S',
      description: 'Rato ergonómico de alta precisão com sensor de 8000 DPI',
      category_id: categories[0].id,
      supplier_id: suppliers[0].id,
      cost_price: 65000.00,
      sale_price: 115000.00,
      quantity: 18,
      min_stock: 5,
      unit: 'un'
    },
    {
      id: uuidv4(),
      sku: 'ELE-DEL-002',
      barcode: '5601234567892',
      name: 'Monitor Dell UltraSharp 27" 4K USB-C',
      description: 'Monitor profissional IPS com cobertura 99% sRGB',
      category_id: categories[0].id,
      supplier_id: suppliers[0].id,
      cost_price: 290000.00,
      sale_price: 460000.00,
      quantity: 3, // Low stock alert!
      min_stock: 5,
      unit: 'un'
    },
    {
      id: uuidv4(),
      sku: 'BEB-GABELA-001',
      barcode: '5601234567893',
      name: 'Café de Angola Gabela 1Kg (Grão)',
      description: 'Café 100% arábica produzido no Cuanza Sul',
      category_id: categories[1].id,
      supplier_id: suppliers[1].id,
      cost_price: 7500.00,
      sale_price: 14000.00,
      quantity: 45,
      min_stock: 10,
      unit: 'kg'
    },
    {
      id: uuidv4(),
      sku: 'BEB-CHELA-002',
      barcode: '5601234567894',
      name: 'Água Mineral Chela 1.5L (Fardo x6)',
      description: 'Pack de 6 garrafas de água pura das serras da Chela',
      category_id: categories[1].id,
      supplier_id: suppliers[1].id,
      cost_price: 1800.00,
      sale_price: 3200.00,
      quantity: 2, // Low stock alert!
      min_stock: 8,
      unit: 'cx'
    },
    {
      id: uuidv4(),
      sku: 'BEB-CUCA-003',
      barcode: '5601234567898',
      name: 'Cerveja Cuca Preta 33cl (Caixa x24)',
      description: 'Caixa de 24 garrafas de cerveja nacional Cuca',
      category_id: categories[1].id,
      supplier_id: suppliers[1].id,
      cost_price: 9500.00,
      sale_price: 16500.00,
      quantity: 35,
      min_stock: 12,
      unit: 'cx'
    },
    {
      id: uuidv4(),
      sku: 'ESC-NAV-001',
      barcode: '5601234567895',
      name: 'Papel A4 Navigator 80g (Caixa 5 Reimas)',
      description: 'Caixa de papel para impressão de faturas AGT e documentos',
      category_id: categories[2].id,
      supplier_id: suppliers[2].id,
      cost_price: 14500.00,
      sale_price: 25000.00,
      quantity: 32,
      min_stock: 10,
      unit: 'cx'
    },
    {
      id: uuidv4(),
      sku: 'HIG-DET-001',
      barcode: '5601234567897',
      name: 'Detergente Multiusos Bio 5L',
      description: 'Detergente concentrado biodegradável para superfícies',
      category_id: categories[4].id,
      supplier_id: suppliers[2].id,
      cost_price: 6500.00,
      sale_price: 12500.00,
      quantity: 1, // Critical low stock alert!
      min_stock: 6,
      unit: 'un'
    }
  ];

  for (const p of products) {
    db.prepare(`
      INSERT INTO products (id, sku, barcode, name, description, category_id, supplier_id, cost_price, sale_price, quantity, min_stock, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.supplier_id, p.cost_price, p.sale_price, p.quantity, p.min_stock, p.unit);

    // Add initial stock movement
    db.prepare(`
      INSERT INTO stock_movements (id, product_id, type, quantity, unit_cost_price, unit_sale_price, total_price, reason, reference_doc, user_id)
      VALUES (?, ?, 'ENTRY', ?, ?, ?, ?, 'Estoque Inicial de Sistema', 'GT AGT-2026/001', ?)
    `).run(uuidv4(), p.id, p.quantity, p.cost_price, p.sale_price, p.quantity * p.sale_price, adminId);
  }
  console.log('✅ 7 Produtos de teste inseridos com preços em Kwanzas (Kz).');

  // 5. Create Pending Adjustment for Admin Approval Demo
  const pendingAdjId = uuidv4();
  db.prepare(`
    INSERT INTO pending_adjustments (id, product_id, requested_by, current_qty, proposed_qty, diff_qty, type, justification, status)
    VALUES (?, ?, ?, ?, ?, ?, 'DAMAGE', ?, 'PENDING')
  `).run(
    pendingAdjId,
    products[0].id,
    operatorId,
    18,
    15,
    -3,
    '3 unidades de Rato MX Master sofreram danos no transporte durante a descarga no Armazém Central de Viana (Luanda).'
  );
  console.log('✅ 1 Solicitação de Ajuste de Estoque pendente no Armazém de Viana para validação do Administrador.');

  // 6. Create Initial Audit Logs
  const auditLogs = [
    { user_id: adminId, user_name: 'Carlos Silva (Dono)', role: 'ADMIN', action: 'SYSTEM_INIT', entity: 'SYSTEM', details: 'Inicialização da base de dados CVNETGEST Angola v1.0 (Kwanza Kz)' },
    { user_id: adminId, user_name: 'Carlos Silva (Dono)', role: 'ADMIN', action: 'USER_CREATE', entity: 'USER', details: 'Criação do operador de armazém Ana Mateus (Luanda)' },
    { user_id: operatorId, user_name: 'Ana Mateus (Operador)', role: 'EMPLOYEE', action: 'ADJUSTMENT_REQUEST', entity: 'PENDING_ADJUSTMENT', details: 'Solicitação de quebra de 3x Rato Logitech no Armazém de Viana' }
  ];

  for (const log of auditLogs) {
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), log.user_id, log.user_name, log.role, log.action, log.entity, log.details);
  }

  console.log('🎉 Dados de teste de Angola (Kz / AGT / Viana) alimentados com sucesso no CVNETGEST!');
}

seed().catch(err => {
  console.error('Erro ao semear dados:', err);
  process.exit(1);
});
