import React from 'react';
import { AlertTriangle, CheckCircle, PackageX } from 'lucide-react';

export default function LowStockBadge({ quantity, minStock }) {
  if (quantity === 0) {
    return (
      <span className="badge badge-danger">
        <PackageX size={12} /> Sem Estoque
      </span>
    );
  }

  if (quantity <= minStock) {
    return (
      <span className="badge badge-warning" style={{ animation: 'pulse 2s infinite' }}>
        <AlertTriangle size={12} /> Estoque Baixo ({quantity})
      </span>
    );
  }

  return (
    <span className="badge badge-success">
      <CheckCircle size={12} /> Normal ({quantity})
    </span>
  );
}
