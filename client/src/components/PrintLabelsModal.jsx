import React, { useState } from 'react';
import { X, Printer, Barcode, CheckSquare, Square, Layers, Sparkles } from 'lucide-react';
import BarcodeSVG from './BarcodeSVG';

export default function PrintLabelsModal({ products, onClose }) {
  const [selectedProductIds, setSelectedProductIds] = useState(
    products.slice(0, 6).map(p => p.id)
  );
  const [copies, setCopies] = useState(3);

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const toggleProduct = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(i => i !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '880px', width: '92%', borderRadius: '16px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Barcode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Gerador de Folhas de Etiquetas & SVG</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formatação profissional para impressoras térmicas e A4</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          margin: '1.25rem 0 1rem'
        }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
              Cópias por Produto:
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={copies}
              onChange={e => setCopies(parseInt(e.target.value) || 1)}
              className="form-input"
              style={{ width: '100px', textAlign: 'center', padding: '0.4rem' }}
            />
          </div>

          <button onClick={toggleSelectAll} className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', height: '38px' }}>
            {selectedProductIds.length === products.length ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{selectedProductIds.length === products.length ? 'Desmarcar Todos' : 'Selecionar Todos'}</span>
          </button>

          <div style={{ marginLeft: 'auto', marginTop: 'auto' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ height: '38px', gap: '0.5rem' }}>
              <Printer size={18} />
              <span>Imprimir / Gerar PDF de Etiquetas</span>
            </button>
          </div>
        </div>

        {/* Product Selector Chips */}
        <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
          Produtos Selecionados ({selectedProducts.length} de {products.length}):
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem',
          maxHeight: '120px',
          overflowY: 'auto',
          marginBottom: '1.25rem',
          padding: '0.6rem',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          {products.map(p => {
            const isSelected = selectedProductIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isSelected ? '#a5b4fc' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                <span>{p.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>({p.sku})</span>
              </button>
            );
          })}
        </div>

        {/* High Quality Printable Sticker Sheet Preview */}
        <div className="printable-labels-sheet-wrapper" style={{ maxHeight: '380px', overflowY: 'auto', borderRadius: '12px' }}>
          <div className="printable-labels-grid" style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '1rem',
            border: '2px dashed #cbd5e1',
            borderRadius: '12px'
          }}>
            {selectedProducts.flatMap(product =>
              Array.from({ length: copies }).map((_, idx) => {
                const barcodeVal = product.barcode || product.sku || '560123456789';
                return (
                  <div
                    key={`${product.id}-${idx}`}
                    className="label-sticker-item"
                    style={{
                      border: '1.5px solid #1e293b',
                      borderRadius: '8px',
                      padding: '0.65rem',
                      textAlign: 'center',
                      background: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '145px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.6rem',
                      fontWeight: '800',
                      color: '#475569',
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: '0.25rem'
                    }}>
                      <span>CVNETGEST ANGOLA</span>
                      <span>{product.category_name || 'GERAL'}</span>
                    </div>

                    {/* Product Name */}
                    <div style={{
                      fontWeight: '800',
                      fontSize: '0.825rem',
                      color: '#0f172a',
                      margin: '0.25rem 0 0.1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {product.name}
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#64748b', marginBottom: '0.2rem' }}>
                      SKU: <strong style={{ color: '#0f172a' }}>{product.sku}</strong>
                    </div>

                    {/* SVG Vector Barcode */}
                    <div style={{ margin: '0.2rem 0' }}>
                      <BarcodeSVG value={barcodeVal} height={38} fontSize={10} moduleWidth={1.6} showText={true} />
                    </div>

                    {/* Footer Price */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#059669',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: '600' }}>Preço:</span>
                      <span>Kz {product.sale_price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
