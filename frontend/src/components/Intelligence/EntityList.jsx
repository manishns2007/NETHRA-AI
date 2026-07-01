import React, { useMemo } from 'react';

export default function EntityList({ entities }) {
  if (!entities || entities.length === 0) {
    return <div className="text-slate-400 text-sm">No entities extracted.</div>;
  }

  // Group entities by type
  const groupedEntities = useMemo(() => {
    return entities.reduce((acc, entity) => {
      if (!acc[entity.entity_type]) {
        acc[entity.entity_type] = [];
      }
      acc[entity.entity_type].push(entity);
      return acc;
    }, {});
  }, [entities]);

  return (
    <div className="space-y-6">
      {Object.entries(groupedEntities).map(([type, items]) => (
        <div key={type}>
          <h4 className="text-sm font-semibold text-indigo-400 mb-3 pb-1 border-b border-slate-700">
            {type} ({items.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((entity) => (
              <div key={entity.id} className="bg-slate-900 border border-slate-700 rounded p-3 text-sm flex flex-col justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block mb-1">{entity.entity_value}</span>
                  {entity.normalized_value && entity.normalized_value !== entity.entity_value.toLowerCase() && (
                    <span className="text-xs text-slate-500 block mb-2">Norm: {entity.normalized_value}</span>
                  )}
                  {entity.context_snippet && (
                    <p className="text-xs text-slate-400 italic mt-2 line-clamp-2" title={entity.context_snippet}>
                      "{entity.context_snippet}"
                    </p>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[10px] uppercase text-slate-500">{entity.extraction_method}</span>
                  {entity.confidence && (
                    <span className="text-[10px] text-green-400 bg-green-400/10 px-1 rounded">
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
