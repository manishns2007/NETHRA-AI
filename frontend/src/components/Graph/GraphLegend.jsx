/**
 * GraphLegend.jsx
 *
 * Compact legend showing the entity type → color mapping.
 * Only shows types that are present in the current graph.
 */
import React from 'react';
import { NODE_COLORS, ENTITY_LABELS } from './graphConfig';

export default function GraphLegend({ presentTypes = [] }) {
  // Always show EVIDENCE first, then the rest in the order found
  const order = ['EVIDENCE', ...Object.keys(NODE_COLORS).filter(t => t !== 'EVIDENCE' && t !== 'DEFAULT')];
  const types = order.filter(t => presentTypes.includes(t));

  if (types.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 max-w-xs">
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Legend</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {types.map(type => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: NODE_COLORS[type] }}
            />
            <span className="text-xs text-slate-300">
              {ENTITY_LABELS[type] ?? type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
