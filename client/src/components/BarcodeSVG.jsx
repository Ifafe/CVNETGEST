import React from 'react';
import { generateBarcodeSVGData } from '../utils/barcodeSvg';

export default function BarcodeSVG({ value, height = 50, showText = true, fontSize = 12, moduleWidth = 2, className = '' }) {
  if (!value) return null;

  const data = generateBarcodeSVGData(String(value), {
    height,
    showText,
    fontSize,
    moduleWidth,
    quietZone: 12
  });

  return (
    <svg
      viewBox={data.viewBox}
      className={className}
      style={{
        display: 'block',
        margin: '0 auto',
        maxWidth: '100%',
        height: 'auto',
        maxHeight: `${data.height}px`
      }}
    >
      <g fill="#000000">
        {data.rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} rx={0.5} />
        ))}
      </g>
      {showText && (
        <text
          x={data.textX}
          y={data.textY}
          textAnchor="middle"
          fontSize={fontSize}
          fontFamily="'Courier New', monospace, sans-serif"
          fontWeight="bold"
          letterSpacing="1"
          fill="#000000"
        >
          {data.text}
        </text>
      )}
    </svg>
  );
}
