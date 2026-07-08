import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Shield, Network, Search, Database, Fingerprint, Lock, 
  Activity, ArrowRight, Server, FileText, Bot, Clock,
  ChevronRight, CheckCircle2
} from 'lucide-react';
import RippleGrid from '../Backgrounds/RippleGrid';

// Reusable animated section wrapper
const FadeInSection = ({ children, delay = 0, className = '' }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 30 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#050508', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Navbar (Landing specific) ── */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', background: 'rgba(5, 5, 8, 0.7)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #ef4444, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: '#fff'
          }}>N</div>
          <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px', color: '#fff' }}>NETHRA AI</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#architecture" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s' }}>Architecture</a>
          <button 
            onClick={() => navigate('/vault')}
            style={{
              padding: '8px 18px', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.4)',
              background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
          >
            Enter Platform
          </button>
        </div>
      </nav>

      {/* ── 1. Hero Section ── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <RippleGrid opacity={0.6} color="#3b82f6" rippleSize={120} />
        
        {/* Radial gradient overlay to focus the center */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050508 80%)', pointerEvents: 'none', zIndex: 1 }} />
        
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '800px', padding: '0 20px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '20px',
              border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)',
              color: '#60a5fa', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '24px'
            }}
          >
            Digital Forensics Redefined
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: '56px', fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}
          >
            AI-Assisted Digital <br/><span style={{ color: '#3b82f6' }}>Investigation Platform</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}
          >
            Transform digital evidence into actionable intelligence through automated analysis, entity extraction, relationship mapping, and timeline reconstruction.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}
          >
            <button
              onClick={() => navigate('/vault')}
              style={{
                padding: '14px 32px', borderRadius: '4px', border: 'none',
                background: '#3b82f6', color: '#fff', fontSize: '15px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(59,130,246,0.3)', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Launch Investigation <ArrowRight size={18} />
            </button>
            <a href="#features" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '14px 32px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '15px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Explore Features
              </button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── 2. The Problem & Platform Overview ── */}
      <section style={{ padding: '120px 40px', background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <FadeInSection>
            <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>The Challenge</div>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '24px', lineHeight: 1.2 }}>
              The fragmentation of digital evidence creates blind spots.
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>
              Modern investigations involve massive volumes of unstructured data across chat logs, PDFs, images, and network dumps. Manual correlation is slow, prone to human error, and struggles to surface complex multi-hop relationships between entities.
            </p>
          </FadeInSection>
          <FadeInSection delay={0.2}>
            <div style={{ padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>The Nethra Solution</div>
              <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>Unified Intelligence</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  'Automated ingestion & OCR pipeline',
                  'AI-driven Named Entity Recognition (NER)',
                  'Interactive Knowledge Graph mapping',
                  'Cryptographic integrity (SHA-256)'
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#cbd5e1', fontSize: '15px' }}>
                    <CheckCircle2 size={18} color="#22c55e" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 4. Core Features ── */}
      <section id="features" style={{ padding: '120px 40px', background: '#050508' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeInSection className="text-center" style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>Platform Capabilities</h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>Designed for speed, accuracy, and rigorous evidentiary standards.</p>
          </FadeInSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              { icon: Database, title: 'Automated Ingestion', desc: 'Securely parse WhatsApp exports, PDFs, and images with built-in OCR and metadata extraction.' },
              { icon: Network, title: 'Knowledge Graph', desc: 'Visually explore relationships between suspects, locations, and assets with interactive node mapping.' },
              { icon: Bot, title: 'AI Assistant', desc: 'Query the entire evidence vault using natural language to uncover hidden patterns instantly.' },
              { icon: Shield, title: 'Integrity Verification', desc: 'Immutable SHA-256 hashing applied upon ingestion to ensure zero tampering.' },
            ].map((Feature, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div style={{ 
                  padding: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', 
                  borderRadius: '8px', height: '100%', transition: 'background 0.3s' 
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                >
                  <Feature.icon size={32} color="#3b82f6" style={{ marginBottom: '20px' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{Feature.title}</h4>
                  <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '14px' }}>{Feature.desc}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Dashboard Preview (High-fidelity CSS Mock) ── */}
      <section style={{ padding: '80px 40px', background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <FadeInSection>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '40px' }}>Command Center View</h2>
            
            {/* Parallax / Hover wrapper for the dashboard preview */}
            <motion.div 
              whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                position: 'relative', width: '100%', aspectRatio: '16/9',
                background: '#0d0d17', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(59,130,246,0.1)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Mock Topbar */}
              <div style={{ height: '40px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}/>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }}/>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}/>
                <div style={{ marginLeft: '16px', fontSize: '11px', color: '#94a3b8' }}>nethra-ai-vault / investigation-092</div>
              </div>
              
              {/* Mock Content Layout */}
              <div style={{ flex: 1, display: 'flex', padding: '16px', gap: '16px' }}>
                {/* Left Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
                      <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div style={{ width: '80%', height: '24px', background: 'rgba(59,130,246,0.3)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ flex: 1, height: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
                      <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '16px' }}></div>
                      <div style={{ width: '60%', height: '24px', background: 'rgba(239,68,68,0.3)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  {/* Mock Table */}
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', padding: '16px' }}>
                    <div style={{ width: '30%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '24px' }}></div>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <div style={{ width: '20%', height: '12px', background: 'rgba(59,130,246,0.2)', borderRadius: '4px' }}></div>
                        <div style={{ width: '40%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                        <div style={{ width: '20%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Right Panel (Graph Mock) */}
                <div style={{ width: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {/* Abstract graph lines */}
                   <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.3 }}>
                     <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#60a5fa" strokeWidth="2"/>
                     <line x1="50%" y1="50%" x2="80%" y2="30%" stroke="#f87171" strokeWidth="2"/>
                     <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="#22c55e" strokeWidth="2"/>
                   </svg>
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', zIndex: 2 }}></div>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ef4444', position: 'absolute', top: '15%', left: '15%' }}></div>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#22c55e', position: 'absolute', bottom: '15%', left: '25%' }}></div>
                   <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f59e0b', position: 'absolute', top: '25%', right: '15%' }}></div>
                </div>
              </div>
            </motion.div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 6. Architecture ── */}
      <section id="architecture" style={{ padding: '120px 40px', background: '#050508' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <FadeInSection>
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#fff', marginBottom: '60px', textAlign: 'center' }}>System Architecture</h2>
          </FadeInSection>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { icon: Server, title: 'React Frontend', desc: 'High-performance SPA providing the interactive Evidence Vault and Knowledge Graph.' },
              { icon: Activity, title: 'FastAPI Backend', desc: 'Asynchronous Python backend orchestrating ingest, processing, and query pipelines.' },
              { icon: Search, title: 'OCR & Parsing Engine', desc: 'Extracts raw text and metadata from WhatsApp exports, PDFs, and images.' },
              { icon: Fingerprint, title: 'AI Services & NER', desc: 'LLM-powered Named Entity Recognition extracts Persons, Organizations, IPs, and Cryptos.' },
              { icon: Clock, title: 'Timeline Engine', desc: 'Correlates timestamps across disparate evidence sources into a unified chronological view.' },
              { icon: Database, title: 'PostgreSQL Storage', desc: 'ACID-compliant storage for evidence records, metadata, and graph relations.' }
            ].map((node, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ 
                    width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', 
                    border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <node.icon size={28} color="#60a5fa" />
                  </div>
                  <div style={{ flex: 1, padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{node.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{node.desc}</p>
                  </div>
                </div>
                {i < 5 && (
                  <div style={{ height: '30px', width: '2px', background: 'rgba(59,130,246,0.3)', marginLeft: '31px' }} />
                )}
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Security & Tech Stack ── */}
      <section style={{ padding: '120px 40px', background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px' }}>
          
          <FadeInSection>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <Lock color="#3b82f6" size={28} />
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>Security Protocol</h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '10px', borderRadius: '4px', fontWeight: 600 }}>IMPLEMENTED</span>
                <span style={{ color: '#e2e8f0', fontSize: '15px' }}>SHA-256 Evidence Integrity</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 8px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '10px', borderRadius: '4px', fontWeight: 600 }}>IMPLEMENTED</span>
                <span style={{ color: '#e2e8f0', fontSize: '15px' }}>Secure Evidence Storage</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', borderRadius: '4px', fontWeight: 600 }}>PLANNED</span>
                <span style={{ color: '#e2e8f0', fontSize: '15px', opacity: 0.7 }}>Role-Based Access Control (RBAC)</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', borderRadius: '4px', fontWeight: 600 }}>PLANNED</span>
                <span style={{ color: '#e2e8f0', fontSize: '15px', opacity: 0.7 }}>Immutable Audit Logging</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ padding: '4px 8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '10px', borderRadius: '4px', fontWeight: 600 }}>PLANNED</span>
                <span style={{ color: '#e2e8f0', fontSize: '15px', opacity: 0.7 }}>Chain of Custody Ledgers</span>
              </li>
            </ul>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <Server color="#3b82f6" size={28} />
              <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>Tech Stack</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {[
                'React 18', 'Vite', 'React Router', 'Framer Motion', 'Cytoscape.js', 
                'FastAPI', 'Python 3.11', 'PostgreSQL', 'SQLAlchemy', 'Pydantic',
                'OpenAI / LLMs', 'Tesseract OCR'
              ].map(tech => (
                <div key={tech} style={{ 
                  padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '6px', color: '#cbd5e1', fontSize: '14px', fontWeight: 500 
                }}>
                  {tech}
                </div>
              ))}
            </div>
          </FadeInSection>

        </div>
      </section>

      {/* ── 8. Footer CTA ── */}
      <section style={{ padding: '120px 40px', background: '#050508', textAlign: 'center' }}>
        <FadeInSection>
          <h2 style={{ fontSize: '40px', fontWeight: 700, color: '#fff', marginBottom: '24px' }}>Ready to uncover the truth?</h2>
          <p style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '40px' }}>Deploy Nethra AI and transform your digital investigations today.</p>
          <button
            onClick={() => navigate('/vault')}
            style={{
              padding: '16px 40px', borderRadius: '4px', border: 'none',
              background: '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 0 30px rgba(59,130,246,0.2)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Access Platform
          </button>
        </FadeInSection>
        <div style={{ marginTop: '100px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b', fontSize: '13px' }}>
          &copy; 2026 Nethra AI Digital Forensics. All rights reserved.
        </div>
      </section>

    </div>
  );
}
