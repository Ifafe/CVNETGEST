import React from 'react';
import { X, Barcode, Printer, Download, Tag, Layers } from 'lucide-react';
import BarcodeSVG from './BarcodeSVG';

export default function BarcodeModal({ product, onClose }) {
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  const barcodeValue = product.barcode || product.sku || '560123456789';

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '460px', borderRadius: '16px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Barcode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Etiqueta de Código de Barras</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vetor SVG de alta precisão</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="printable-single-barcode-wrapper" style={{ margin: '1.25rem 0' }}>
          <div className="barcode-sticker-card" style={{
            background: '#ffffff',
            color: '#0f172a',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontFamily: "'Inter', sans-serif"
          }}>
            {/* Header / Brand */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1.5px solid #e2e8f0',
              paddingBottom: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.08em', color: '#64748b' }}>
                CVNETGEST • ANGOLA
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                background: '#f1f5f9',
                color: '#334155',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                {product.category_name || 'PRODUTO'}
              </span>
            </div>

            {/* Product Name & SKU */}
            <div style={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.2rem', lineHeight: '1.2' }}>
              {product.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              SKU: <strong style={{ color: '#0f172a' }}>{product.sku}</strong>
            </div>

            {/* SVG Barcode Vector */}
            <div style={{
              padding: '0.75rem 0.5rem',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #f1f5f9',
              marginBottom: '0.85rem'
            }}>
              <BarcodeSVG value={barcodeValue} height={55} fontSize={12} moduleWidth={2} />
            </div>

            {/* Price Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Preço de Venda:</span>
              <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#059669' }}>
                Kz {product.sale_price?.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Fechar
          </button>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Imprimir Etiqueta
          </button>
        </div>
      </div>
    </div>
  );
}
