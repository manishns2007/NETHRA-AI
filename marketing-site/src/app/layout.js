import './globals.css';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'NETHRA AI | Enterprise Digital Forensics Platform',
  description: 'AI-Assisted Digital Investigation Platform. Evidence-centric workspace featuring Knowledge Graph, OCR, and AI insights.',
  openGraph: {
    title: 'NETHRA AI | Enterprise Digital Forensics Platform',
    description: 'AI-Assisted Digital Investigation Platform',
    images: [{ url: '/og-image.png' }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-grid-pattern min-h-screen flex flex-col">
        
        {/* Global Navigation */}
        <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-accent/30 bg-accent/10 flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm tracking-wide">NETHRA AI</span>
              <span className="text-[10px] text-muted tracking-widest uppercase">Digital Forensics Platform</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-muted hover:text-white transition-colors">Features</Link>
            <Link href="/architecture" className="text-sm font-medium text-muted hover:text-white transition-colors">Architecture</Link>
            <Link href="/roadmap" className="text-sm font-medium text-muted hover:text-white transition-colors">Roadmap</Link>
            <Link href="/gallery" className="text-sm font-medium text-muted hover:text-white transition-colors">Gallery</Link>
            <Link href="/docs" className="text-sm font-medium text-muted hover:text-white transition-colors">Docs</Link>
            
            <Link href="http://localhost:5173" className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 hover:bg-white/10 transition-colors">
              <Shield size={14} /> Launch Platform
            </Link>
          </div>
        </nav>

        <main className="flex-1">
          {children}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/5 mt-20 bg-[#050505]">
          <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-white font-semibold text-sm tracking-wide">NETHRA AI</span>
              </div>
              <p className="text-xs text-muted max-w-xs">
                An advanced digital forensics and investigation platform built to accelerate evidence discovery using AI, Graph Analysis, and automated data pipelines.
              </p>
            </div>
            
            <div className="flex gap-12">
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Platform</h4>
                <Link href="/features" className="text-sm text-muted hover:text-white">Features</Link>
                <Link href="/architecture" className="text-sm text-muted hover:text-white">Architecture</Link>
                <Link href="/gallery" className="text-sm text-muted hover:text-white">Gallery</Link>
              </div>
              
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Resources</h4>
                <Link href="/docs" className="text-sm text-muted hover:text-white">Documentation</Link>
                <Link href="/roadmap" className="text-sm text-muted hover:text-white">Roadmap</Link>
                <a href="#" className="text-sm text-muted hover:text-white">GitHub</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/5 py-6 px-6">
            <div className="max-w-6xl mx-auto flex justify-between items-center text-xs text-muted">
              <span>&copy; {new Date().getFullYear()} NETHRA AI. All rights reserved.</span>
              <span>Built for modern investigators.</span>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
