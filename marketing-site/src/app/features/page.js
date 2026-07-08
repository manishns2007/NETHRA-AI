import { Database, FileText, Share2, Workflow, Clock, Search, Link2, Key, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Features | NETHRA AI' };

export default function Features() {
  const features = [
    { title: 'Evidence Ingestion', desc: 'Securely upload forensic data with automated SHA-256 hashing to preserve chain of custody from the moment of ingestion.', icon: Database },
    { title: 'OCR Processing', desc: 'Extract high-fidelity text from images and scanned documents using integrated Tesseract OCR pipelines.', icon: FileText },
    { title: 'Entity Extraction', desc: 'Automatically identify people, locations, organizations, dates, and threat indicators (IPs, hashes) from raw text.', icon: Search },
    { title: 'Knowledge Graph', desc: 'Visualize relationships between entities across multiple pieces of evidence to map out networks and associations.', icon: Share2 },
    { title: 'Timeline Reconstruction', desc: 'Automatically sequence extracted date and time entities to reconstruct events chronologically.', icon: Clock },
    { title: 'AI Investigation Assistant', desc: 'Query evidence contextually. The AI assistant strictly grounds its responses to your selected evidence to prevent hallucinations.', icon: Workflow },
    { title: 'Investigation Workspace', desc: 'A dedicated, evidence-centric dashboard that updates dynamically based on the artifact currently under review.', icon: CheckCircle },
    { title: 'Chain of Custody', desc: 'Immutable audit logs track every action—from ingestion to extraction—ensuring forensic integrity is never compromised.', icon: Link2 },
    { title: 'Role-Based Access', desc: 'Secure the platform with granular permissions for investigators, analysts, and administrators (Coming Soon).', icon: Key },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Platform Features</h1>
        <p className="text-muted max-w-2xl text-lg">
          NETHRA AI provides a comprehensive suite of tools designed to accelerate digital investigations while maintaining forensic integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <div key={i} className="glass-panel p-6 flex flex-col items-start hover:bg-card-hover transition-colors animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
                <Icon size={18} className="text-accent" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
