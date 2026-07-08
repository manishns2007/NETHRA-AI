export const metadata = { title: 'Architecture | NETHRA AI' };

export default function Architecture() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-20">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">System Architecture</h1>
        <p className="text-muted max-w-2xl text-lg">
          A scalable, decoupled architecture built to handle high-throughput evidence processing and AI-driven intelligence generation.
        </p>
      </div>

      <div className="glass-panel p-8 mb-12 flex justify-center bg-[#0a0a0a]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" className="w-full max-w-4xl h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
            </marker>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* User */}
          <rect x="350" y="20" width="100" height="40" rx="8" fill="url(#grad)" stroke="#3b82f6" strokeWidth="2" />
          <text x="400" y="45" fill="#fff" fontSize="14" fontWeight="600" textAnchor="middle">Investigator</text>
          
          <line x1="400" y1="60" x2="400" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Frontend */}
          <rect x="300" y="100" width="200" height="50" rx="8" fill="url(#grad)" stroke="#60a5fa" strokeWidth="2" />
          <text x="400" y="130" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">React / Vite Frontend</text>

          <line x1="400" y1="150" x2="400" y2="190" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Backend */}
          <rect x="300" y="190" width="200" height="50" rx="8" fill="url(#grad)" stroke="#60a5fa" strokeWidth="2" />
          <text x="400" y="220" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">FastAPI Backend</text>

          <line x1="400" y1="240" x2="400" y2="280" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Processing Layer */}
          <rect x="150" y="280" width="500" height="120" rx="12" fill="none" stroke="#334155" strokeWidth="2" strokeDasharray="6,6" />
          <text x="400" y="305" fill="#94a3b8" fontSize="12" fontStyle="italic" textAnchor="middle">Celery Processing Pipeline</text>

          <rect x="180" y="330" width="120" height="40" rx="6" fill="url(#grad)" stroke="#22c55e" strokeWidth="1.5" />
          <text x="240" y="355" fill="#fff" fontSize="12" textAnchor="middle">OCR Pipeline</text>

          <rect x="340" y="330" width="120" height="40" rx="6" fill="url(#grad)" stroke="#22c55e" strokeWidth="1.5" />
          <text x="400" y="355" fill="#fff" fontSize="12" textAnchor="middle">Entity Extraction</text>

          <rect x="500" y="330" width="120" height="40" rx="6" fill="url(#grad)" stroke="#22c55e" strokeWidth="1.5" />
          <text x="560" y="355" fill="#fff" fontSize="12" textAnchor="middle">Graph Generation</text>

          <line x1="400" y1="400" x2="400" y2="440" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />

          {/* Storage & Intelligence */}
          <rect x="250" y="440" width="120" height="50" rx="8" fill="url(#grad)" stroke="#a855f7" strokeWidth="2" />
          <text x="310" y="470" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">PostgreSQL / SQLite</text>

          <line x1="400" y1="465" x2="420" y2="465" stroke="#64748b" strokeWidth="2" />

          <rect x="430" y="440" width="120" height="50" rx="8" fill="url(#grad)" stroke="#eab308" strokeWidth="2" />
          <text x="490" y="470" fill="#fff" fontSize="14" fontWeight="bold" textAnchor="middle">Gemini AI</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">Decoupled Processing</h3>
          <p className="text-muted leading-relaxed text-sm">
            NETHRA AI utilizes an asynchronous task queue (Celery/Redis) to handle heavy operations like Optical Character Recognition (Tesseract) and Natural Language Processing without blocking the main API thread.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-3">Contextual AI Intelligence</h3>
          <p className="text-muted leading-relaxed text-sm">
            The platform passes highly curated, evidence-specific vectors to Google Gemini, guaranteeing that all generated insights are deeply grounded in the facts of the case, preventing hallucinations.
          </p>
        </div>
      </div>
    </div>
  );
}
