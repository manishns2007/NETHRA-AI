import { Shield, Brain, Network, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-8 animate-fade-in">
          <Shield size={14} /> Platform Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Intelligence at the speed of <span className="text-glow text-accent">investigation.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          NETHRA AI transforms raw digital evidence into actionable intelligence using automated OCR, entity extraction, and knowledge graph mapping.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link href="http://localhost:5173" className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 hover:bg-white/10 transition-colors">
            Launch Platform
          </Link>
          <Link href="/docs" className="bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            Read Documentation <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Core Capabilities</h2>
          <p className="text-muted">A fully integrated pipeline from ingest to insight.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="glass-panel p-8 flex flex-col items-start hover:bg-card-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <Zap size={20} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Automated Processing</h3>
            <p className="text-sm text-muted leading-relaxed">
              Upload documents, images, or raw text. The platform automatically queues and processes evidence through OCR and NER pipelines.
            </p>
          </div>

          <div className="glass-panel p-8 flex flex-col items-start hover:bg-card-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <Network size={20} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Knowledge Graphs</h3>
            <p className="text-sm text-muted leading-relaxed">
              Visualize hidden connections between entities across your entire case using interactive Cytoscape graphs.
            </p>
          </div>

          <div className="glass-panel p-8 flex flex-col items-start hover:bg-card-hover transition-colors">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
              <Brain size={20} className="text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Contextual AI</h3>
            <p className="text-sm text-muted leading-relaxed">
              Query your evidence using an intelligent assistant strictly grounded in the selected investigation context.
            </p>
          </div>
          
        </div>
        
        <div className="mt-12 text-center">
          <Link href="/features" className="text-accent text-sm font-medium hover:underline inline-flex items-center gap-1">
            Explore all features <ChevronRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}
