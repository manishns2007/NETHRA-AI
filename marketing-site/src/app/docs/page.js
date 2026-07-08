import { Book, Code, Server, Shield, Terminal, Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Documentation | NETHRA AI' };

export default function Docs() {
  const sections = [
    {
      title: 'Getting Started',
      icon: Terminal,
      links: ['Overview', 'Installation', 'Project Structure']
    },
    {
      title: 'Core Architecture',
      icon: Server,
      links: ['Architecture Details', 'Technology Stack', 'Database Schema']
    },
    {
      title: 'Investigation Pipeline',
      icon: Book,
      links: ['Investigation Workflow', 'Evidence Vault', 'OCR Pipeline']
    },
    {
      title: 'Intelligence Modules',
      icon: Shield,
      links: ['Knowledge Graph', 'AI Assistant', 'Entity Extraction']
    },
    {
      title: 'API Reference',
      icon: Code,
      links: ['Authentication', 'Intelligence API', 'Audit Logs']
    },
    {
      title: 'Administration',
      icon: Settings,
      links: ['Configuration', 'Role-Based Access', 'Deployment']
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-12">
      
      {/* Sidebar Placeholder */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-24">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Documentation</h3>
          <div className="space-y-6">
            {sections.map((section, i) => (
              <div key={i}>
                <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-muted hover:text-accent transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            v1.0-beta Documentation
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">NETHRA AI Documentation</h1>
          <p className="text-muted text-lg leading-relaxed">
            Learn how to deploy, configure, and investigate using the NETHRA AI Enterprise Platform. 
            Choose a topic from the sidebar to get started, or read the overview below.
          </p>
        </div>

        <div className="prose prose-invert max-w-none prose-p:text-muted prose-headings:text-white prose-a:text-accent">
          <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
          <p className="mb-6">
            NETHRA AI is a modern digital forensics platform designed to automate the extraction of actionable intelligence from raw evidence. It moves away from traditional, manual evidence review towards an automated, graph-based intelligence pipeline.
          </p>

          <h2 className="text-2xl font-semibold mb-4 mt-10">System Requirements</h2>
          <div className="glass-panel p-6 mb-6">
            <ul className="space-y-2 text-sm text-muted list-disc list-inside">
              <li>Python 3.10+ (FastAPI Backend)</li>
              <li>Node.js 18+ (React/Vite Frontend)</li>
              <li>Tesseract OCR Engine</li>
              <li>PostgreSQL (Production) or SQLite (Local Dev)</li>
              <li>Redis (For Celery Task Queue)</li>
              <li>Valid Google Gemini API Key</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mb-4 mt-10">Quick Start</h2>
          <p className="mb-4">To run the platform locally in development mode:</p>
          <div className="glass-panel p-4 mb-6 relative group">
            <pre className="text-sm font-mono text-secondary overflow-x-auto">
              <code>
{`# 1. Start the Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# 2. Start the Frontend
cd frontend
npm run dev`}
              </code>
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
}
