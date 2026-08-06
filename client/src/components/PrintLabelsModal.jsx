import React, { useState } from 'react';
import { X, Printer, Barcode, CheckSquare, Square } from 'lucide-react';

export default function PrintLabelsModal({ products, onClose }) {
  const [selectedProductIds, setSelectedProductIds] = useState(
    products.slice(0, 4).map(p => p.id)
  );
  const [copies, setCopies] = useState(4);

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
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Barcode size={20} color="var(--primary)" /> Gerador de Folha de Etiquetas de Estoque
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Printable Area Target with CSS @media print */}
        <div className="print-modal-body">
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Etiquetas por Produto:
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={copies}
                onChange={e => setCopies(parseInt(e.target.value) || 1)}
                className="custom-input"
                style={{ width: '100px' }}
              />
            </div>

            <button onClick={toggleSelectAll} className="btn btn-secondary btn-sm" style={{ marginTop: '1.2rem' }}>
              {selectedProductIds.length === products.length ? <CheckSquare size={16} /> : <Square size={16} />}
              {selectedProductIds.length === products.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>

            <button onClick={handlePrint} className="btn btn-primary" style={{ marginTop: '1.2rem' }}>
              <Printer size={16} /> Imprimir Folha de Etiquetas
            </button>
          </div>

          <div style={{ fontSize: '0.85rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            Selecione os produtos para compor a folha de etiquetas ({selectedProducts.length} selecionados):
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', marginBottom: '1.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
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
                    padding: '0.4rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: isSelected ? '#93c5fd' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {p.name} ({p.sku})
                </button>
              );
            })}
          </div>

          {/* Sheet Preview */}
          <div className="printable-sheet" style={{
            background: '#ffffff',
            color: '#000000',
            padding: '1.5rem',
            borderRadius: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '1rem',
            maxHeight: '380px',
            overflowY: 'auto',
            border: '1px dashed #ccc'
          }}>
            {selectedProducts.flatMap(product =>
              Array.from({ length: copies }).map((_, idx) => (
                <div
                  key={`${product.id}-${idx}`}
                  style={{
                    border: '1.5px solid #000',
                    borderRadius: '4px',
                    padding: '0.6rem',
                    textAlign: 'center',
                    background: '#fff',
                    fontFamily: 'sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    height: '130px'
                  }}
                >
                  <div style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#444' }}>
                    CVNETGEST ANGOLA • ESTOQUE
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#000', margin: '0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#333' }}>
                    SKU: <strong>{product.sku}</strong>
                  </div>

                  {/* SVG Barcode */}
                  <svg width="100%" height="45" viewBox="0 0 200 45">
                    <g fill="#000000">
                      <rect x="10" y="2" width="3" height="30" />
                      <rect x="15" y="2" width="2" height="30" />
                      <rect x="20" y="2" width="4" height="30" />
                      <rect x="27" y="2" width="2" height="30" />
                      <rect x="32" y="2" width="3" height="30" />
                      <rect x="38" y="2" width="5" height="30" />
                      <rect x="46" y="2" width="2" height="30" />
                      <rect x="51" y="2" width="4" height="30" />
                      <rect x="58" y="2" width="2" height="30" />
                      <rect x="63" y="2" width="5" height="30" />
                      <rect x="71" y="2" width="3" height="30" />
                      <rect x="77" y="2" width="2" height="30" />
                      <rect x="82" y="2" width="4" height="30" />
                      <rect x="89" y="2" width="2" height="30" />
                      <rect x="94" y="2" width="5" height="30" />
                      <rect x="102" y="2" width="3" height="30" />
                      <rect x="108" y="2" width="2" height="30" />
                      <rect x="113" y="2" width="4" height="30" />
                      <rect x="120" y="2" width="2" height="30" />
                      <rect x="125" y="2" width="5" height="30" />
                      <rect x="133" y="2" width="3" height="30" />
                      <rect x="139" y="2" width="2" height="30" />
                      <rect x="144" y="2" width="4" height="30" />
                      <rect x="151" y="2" width="2" height="30" />
                      <rect x="156" y="2" width="5" height="30" />
                      <rect x="164" y="2" width="3" height="30" />
                      <rect x="170" y="2" width="2" height="30" />
                      <rect x="175" y="2" width="4" height="30" />
                      <rect x="182" y="2" width="3" height="30" />
                      <rect x="188" y="2" width="2" height="30" />
                    </g>
                    <text x="100" y="42" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill="#000">
                      {product.barcode || '5601234567890'}
                    </text>
                  </svg>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
