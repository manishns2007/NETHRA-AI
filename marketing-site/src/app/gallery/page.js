export const metadata = { title: 'Gallery | NETHRA AI' };

export default function Gallery() {
  const screenshots = [
    {
      title: 'Investigation Workspace',
      desc: 'The central hub for analyzing digital evidence, featuring the Evidence Ledger, Context Panel, and AI Assistant.',
      placeholder: 'Investigation Workspace Layout'
    },
    {
      title: 'Knowledge Graph',
      desc: 'Interactive visualization of extracted entities (People, Locations, Organizations, IP Addresses) and their relationships.',
      placeholder: 'Cytoscape Entity Graph'
    },
    {
      title: 'Contextual AI Assistant',
      desc: 'The intelligence sidebar grounded strictly in the selected evidence artifact, providing verifiable citations.',
      placeholder: 'AI Assistant Chat Interface'
    },
    {
      title: 'Chain of Custody',
      desc: 'Immutable audit logging of every system action and SHA-256 hash verification for forensic integrity.',
      placeholder: 'Chain of Custody Ledger'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Platform Gallery</h1>
        <p className="text-muted max-w-2xl text-lg">
          A look inside the NETHRA AI Enterprise Platform. High-fidelity interfaces built for complex digital investigations.
        </p>
      </div>

      <div className="space-y-20">
        {screenshots.map((shot, i) => (
          <div key={i} className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">{shot.title}</h2>
              <p className="text-muted">{shot.desc}</p>
            </div>
            
            {/* Image Placeholder Frame */}
            <div className="w-full aspect-video glass-panel bg-[#0a0a0a] rounded-xl overflow-hidden flex flex-col items-center justify-center border border-white/10 relative group">
              <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <span className="text-white/20 font-mono text-xs">IMG</span>
              </div>
              <p className="text-white/30 font-mono text-sm tracking-widest uppercase">{shot.placeholder}</p>
              
              {/* Note: In production, these would be actual <img /> or <Image /> components loaded with real screenshots from the public folder. */}
              <div className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded text-[10px] text-white/50 uppercase tracking-widest backdrop-blur-md">
                Placeholder
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
