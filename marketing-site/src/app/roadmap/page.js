import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Roadmap | NETHRA AI' };

export default function Roadmap() {
  const phases = [
    {
      title: 'Phase 1: Core Foundation',
      status: 'completed',
      items: [
        'Evidence Vault Dashboard',
        'Persistent Investigation Drawer',
        'Entity Extraction Pipeline',
        'Knowledge Graph Generation',
        'Context-Aware AI Assistant',
      ]
    },
    {
      title: 'Phase 2: Investigation Workflows',
      status: 'in-progress',
      items: [
        'Timeline Reconstruction Engine',
        'Chain of Custody Audit Trail',
        'Automated Report Generation',
        'Export to PDF/CSV',
      ]
    },
    {
      title: 'Phase 3: Advanced Intelligence',
      status: 'upcoming',
      items: [
        'Vector Search Integration',
        'Semantic Document Search',
        'Cross-Case Analytics',
        'Geospatial Intelligence Mapping',
      ]
    },
    {
      title: 'Phase 4: Enterprise Scale',
      status: 'upcoming',
      items: [
        'Multi-Tenant Case Management',
        'Threat Intelligence Feeds (VirusTotal, AbuseIPDB)',
        'Role-Based Access Control (RBAC)',
        'WebSocket Real-Time Sync',
      ]
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-20">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Development Roadmap</h1>
        <p className="text-muted text-lg">
          Track the evolution of NETHRA AI from a proof-of-concept into a full-scale enterprise forensics platform.
        </p>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {phases.map((phase, i) => (
          <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#050505] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(255,255,255,0.05)] z-10">
              {phase.status === 'completed' ? (
                <CheckCircle2 size={18} className="text-green-500" />
              ) : phase.status === 'in-progress' ? (
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              ) : (
                <Circle size={18} className="text-muted" />
              )}
            </div>

            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg">{phase.title}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                  phase.status === 'completed' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  phase.status === 'in-progress' ? 'bg-accent/10 text-accent border border-accent/20' :
                  'bg-white/5 text-muted border border-white/10'
                }`}>
                  {phase.status.replace('-', ' ')}
                </span>
              </div>
              
              <ul className="space-y-3">
                {phase.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted">
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-white/20" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
