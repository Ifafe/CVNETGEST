import React from 'react';
import { X, Barcode, Printer } from 'lucide-react';

export default function BarcodeModal({ product, onClose }) {
  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Barcode size={20} color="var(--primary)" /> Código de Barras
          </h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.5rem 0' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{product.name}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            SKU: <strong>{product.sku}</strong>
          </p>

          {/* SVG Barcode Visualizer */}
          <div style={{
            background: '#ffffff',
            padding: '1.5rem',
            borderRadius: 'var(--radius-sm)',
            display: 'inline-block',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <svg width="240" height="80" viewBox="0 0 240 80">
              {/* Simulated barcode lines pattern based on product barcode or SKU */}
              <g fill="#000000">
                <rect x="10" y="5" width="3" height="55" />
                <rect x="16" y="5" width="2" height="55" />
                <rect x="22" y="5" width="5" height="55" />
                <rect x="30" y="5" width="2" height="55" />
                <rect x="35" y="5" width="4" height="55" />
                <rect x="42" y="5" width="2" height="55" />
                <rect x="48" y="5" width="6" height="55" />
                <rect x="58" y="5" width="2" height="55" />
                <rect x="64" y="5" width="4" height="55" />
                <rect x="72" y="5" width="3" height="55" />
                <rect x="78" y="5" width="5" height="55" />
                <rect x="86" y="5" width="2" height="55" />
                <rect x="92" y="5" width="4" height="55" />
                <rect x="100" y="5" width="2" height="55" />
                <rect x="106" y="5" width="6" height="55" />
                <rect x="116" y="5" width="3" height="55" />
                <rect x="122" y="5" width="2" height="55" />
                <rect x="128" y="5" width="5" height="55" />
                <rect x="136" y="5" width="2" height="55" />
                <rect x="142" y="5" width="4" height="55" />
                <rect x="150" y="5" width="2" height="55" />
                <rect x="156" y="5" width="6" height="55" />
                <rect x="166" y="5" width="3" height="55" />
                <rect x="172" y="5" width="2" height="55" />
                <rect x="178" y="5" width="5" height="55" />
                <rect x="186" y="5" width="2" height="55" />
                <rect x="192" y="5" width="4" height="55" />
                <rect x="200" y="5" width="3" height="55" />
                <rect x="206" y="5" width="5" height="55" />
                <rect x="214" y="5" width="2" height="55" />
                <rect x="220" y="5" width="4" height="55" />
                <rect x="228" y="5" width="2" height="55" />
              </g>
              <text x="120" y="74" textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="bold" fill="#000">
                {product.barcode || '5601234567890'}
              </text>
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} /> Imprimir Etiqueta
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
