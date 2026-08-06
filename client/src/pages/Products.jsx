import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LowStockBadge from '../components/LowStockBadge';
import BarcodeModal from '../components/BarcodeModal';
import PrintLabelsModal from '../components/PrintLabelsModal';
import RequestPermissionModal from '../components/RequestPermissionModal';
import { exportToCSV } from '../utils/exportCsv';
import {
  Package,
  Search,
  Plus,
  Barcode,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  ShieldAlert,
  Lock,
  DollarSign,
  Download,
  Printer,
  CheckCircle
} from 'lucide-react';

export default function Products() {
  const { user, apiFetch } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [showPrintLabelsModal, setShowPrintLabelsModal] = useState(false);
  const [requestProduct, setRequestProduct] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [actionFeedback, setActionFeedback] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: '',
    sale_price: '',
    min_stock: '5',
    unit: 'un'
  });
  const [formError, setFormError] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    loadProducts();
    loadCategoriesAndSuppliers();
  }, [search, selectedCategory, lowStockFilter, user]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (selectedCategory) query.append('category_id', selectedCategory);
      if (lowStockFilter) query.append('low_stock', 'true');

      const data = await apiFetch(`/api/products?${query.toString()}`);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesAndSuppliers = async () => {
    try {
      const catData = await apiFetch('/api/categories');
      setCategories(catData.categories || []);

      const supData = await apiFetch('/api/suppliers');
      setSuppliers(supData.suppliers || []);
    } catch (error) {
      console.error('Erro ao carregar categorias e fornecedores:', error);
    }
  };

  const handleOpenModal = (product = null) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        cost_price: product.cost_price !== undefined ? product.cost_price : '',
        sale_price: product.sale_price,
        min_stock: product.min_stock,
        unit: product.unit
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: `560${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        name: '',
        description: '',
        category_id: categories[0]?.id || '',
        supplier_id: suppliers[0]?.id || '',
        cost_price: '',
        sale_price: '',
        min_stock: '5',
        unit: 'un'
      });
    }
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingProduct) {
        await apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      setShowModal(false);
      loadProducts();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await apiFetch(`/api/products/${productId}`, { method: 'DELETE' });
      setDeleteConfirmProduct(null);
      setActionFeedback('Produto eliminado com sucesso do estoque.');
      setTimeout(() => setActionFeedback(''), 4000);
      loadProducts();
    } catch (error) {
      alert(error.message || 'Erro ao eliminar produto.');
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'name', label: 'Nome do Produto' },
      { key: 'sku', label: 'SKU' },
      { key: 'barcode', label: 'Código de Barras' },
      { key: 'category_name', label: 'Categoria' },
      { key: 'supplier_name', label: 'Fornecedor' },
      { key: 'quantity', label: 'Estoque Atual' },
      { key: 'min_stock', label: 'Estoque Mínimo' },
      { key: 'unit', label: 'Unidade' },
      { key: 'sale_price', label: 'Preço Venda (Kz)' }
    ];
    if (isAdmin) {
      columns.push({ key: 'cost_price', label: 'Preço Custo (Kz)' });
    }
    exportToCSV(products, columns, 'catalogo_produtos');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Produtos</h1>
          <p className="page-subtitle">Gestão de estoque, preços em Kwanzas (Kz) e controlo de acessos RBAC</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={() => setShowPrintLabelsModal(true)} className="btn btn-secondary">
            <Printer size={16} /> Etiquetas em Lote
          </button>
          {isAdmin && (
            <button onClick={() => handleOpenModal()} className="btn btn-primary">
              <Plus size={18} /> Registar Novo Produto
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.875rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={18} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Pesquisar por Nome, SKU ou Código de Barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ width: '200px' }}>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`btn ${lowStockFilter ? 'btn-danger' : 'btn-secondary'}`}
        >
          <AlertTriangle size={16} /> Estoque Baixo Apenas
        </button>
      </div>

      {/* Products Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Produto & Identificadores</th>
                <th>Categoria</th>
                {isAdmin && <th>Preço Custo (Kz)</th>}
                <th>Preço Venda (Kz)</th>
                {isAdmin && <th>Margem Lucro</th>}
                <th>Quantidade</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '2px' }}>
                        <span>SKU: {p.sku}</span>
                        {p.barcode && (
                          <span style={{ cursor: 'pointer', color: 'var(--primary-hover)' }} onClick={() => setBarcodeProduct(p)}>
                            <Barcode size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {p.barcode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-info">{p.category_name || 'Geral'}</span>
                    </td>

                    {/* Restricted Cost Price Column */}
                    {isAdmin && (
                      <td style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Kz {p.cost_price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </td>
                    )}

                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      Kz {p.sale_price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Restricted Profit Margin Column */}
                    {isAdmin && (
                      <td>
                        <span className={`badge ${p.profit_margin > 30 ? 'badge-success' : 'badge-warning'}`}>
                          +{p.profit_margin}%
                        </span>
                      </td>
                    )}

                    <td style={{ fontWeight: '700' }}>
                      {p.quantity} {p.unit}
                    </td>

                    <td>
                      <LowStockBadge quantity={p.quantity} minStock={p.min_stock} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setBarcodeProduct(p)}
                          className="btn btn-secondary btn-sm"
                          title="Ver Código de Barras"
                        >
                          <Barcode size={14} />
                        </button>

                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => handleOpenModal(p)}
                              className="btn btn-secondary btn-sm"
                              title="Editar Produto"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmProduct(p)}
                              className="btn btn-danger btn-sm"
                              title="Eliminar Produto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setRequestProduct(p)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-amber)', gap: '0.3rem' }}
                            title="Solicitar Permissão de Alteração ao Administrador"
                          >
                            <ShieldAlert size={14} />
                            <span style={{ fontSize: '0.75rem' }}>Solicitar Alteração</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Visualizer Modal */}
      {barcodeProduct && (
        <BarcodeModal product={barcodeProduct} onClose={() => setBarcodeProduct(null)} />
      )}

      {/* Operator Request Permission Modal */}
      {requestProduct && (
        <RequestPermissionModal
          product={requestProduct}
          onClose={() => setRequestProduct(null)}
          onSuccess={() => {
            setActionFeedback('Solicitação de alteração enviada ao Administrador com sucesso!');
            setTimeout(() => setActionFeedback(''), 4000);
          }}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} /> Eliminar Produto
              </h3>
              <button onClick={() => setDeleteConfirmProduct(null)} className="btn btn-secondary btn-sm">✕</button>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Tem certeza que deseja eliminar permanentemente o produto <strong>{deleteConfirmProduct.name}</strong> (SKU: {deleteConfirmProduct.sku}) do estoque? Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setDeleteConfirmProduct(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={() => handleDeleteProduct(deleteConfirmProduct.id)} className="btn btn-danger">
                <Trash2 size={16} /> Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Product Modal (ADMIN ONLY) */}
      {showModal && isAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Registar Novo Produto'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">✕</button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem', marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Código de Barras</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Produto *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fornecedor</label>
                  <select
                    className="form-select"
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Preço Custo (Kz)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preço Venda (Kz) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estoque Mínimo</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Descrição / Observações</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Salvar Alterações' : 'Registar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrintLabelsModal && (
        <PrintLabelsModal
          products={products}
          onClose={() => setShowPrintLabelsModal(false)}
        />
      )}
    </div>
  );
}
