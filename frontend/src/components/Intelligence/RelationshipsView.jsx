import React, { useState, useEffect } from 'react';
import { Network, Link2, ExternalLink } from 'lucide-react';
import { getEntitySubgraph } from '../../services/api';

export const RelationshipsView = ({ selectedNode }) => {
  const [subgraph, setSubgraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedNode || !selectedNode.id) return;
    
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEntitySubgraph(selectedNode.id);
        if (!cancelled) setSubgraph(res.data);
      } catch (err) {
        if (!cancelled) setError("Failed to load relationships.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
        <Network size={24} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
        <p style={{ fontSize: '13px' }}>Select a node in the Knowledge Graph to view its relationships.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%' }} />
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#ef4444', fontSize: '13px', textAlign: 'center' }}>{error}</div>;
  }

  if (!subgraph || !subgraph.edges || subgraph.edges.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)' }}>
        <p style={{ fontSize: '13px' }}>No connections found for {selectedNode.label}.</p>
      </div>
    );
  }

  // Group connections by edge type
  const connections = {};
  subgraph.edges.forEach(edge => {
    const isSource = edge.source === selectedNode.id;
    const targetNodeId = isSource ? edge.target : edge.source;
    const targetNode = subgraph.nodes.find(n => n.id === targetNodeId);
    
    if (!targetNode) return;
    
    const relType = edge.relationship_type;
    if (!connections[relType]) connections[relType] = [];
    connections[relType].push({
      direction: isSource ? 'outgoing' : 'incoming',
      node: targetNode,
      edge: edge
    });
  });

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'rgba(59,130,246,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Selected Entity</div>
        <div style={{ fontSize: '16px', color: '#fff', fontWeight: 600 }}>{selectedNode.label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{selectedNode.entity_type}</div>
      </div>

      <div>
        <h4 style={{ fontSize: '12px', color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
          Direct Connections ({subgraph.edges.length})
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(connections).map(([relType, items]) => (
            <div key={relType}>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Link2 size={12} /> {relType}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {items.map((item, idx) => (
                  <div key={idx} style={{ 
                    background: 'rgba(255,255,255,0.02)', padding: '10px 12px', 
                    borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                  }}>
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '4px', 
                      background: 'rgba(255,255,255,0.05)', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' 
                    }}>
                      <ExternalLink size={12} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>{item.node.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                        {item.direction === 'outgoing' ? 'Target' : 'Source'} • {item.node.entity_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
